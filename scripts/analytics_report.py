#!/usr/bin/env python3
"""老黄测指标 · 访问统计拉数脚本（Cloudflare GraphQL Analytics API，RUM / Web Analytics）

拉最近 N 天（默认 7 天）的：
- 访问量（pageviews = rumPageloadEventsAdaptiveGroups.count）
- 访客（Dashboard 的 Visits；GraphQL 同一节点 count 为主， visits 如 API 返回则一并展示，否则以 Dashboard 为准）
- 国家/地区（countryName）、热门页面（requestPath）、来源（refererHost/refererPath）、设备（deviceType + userAgentBrowser/OS）

用法：
  CF_ACCOUNT_ID=3b6e5b7b321340e093ee2a23fd6126ca \\
  CF_RUM_SITE_TAG=xxx \\
  CLOUDFLARE_API_TOKEN=xxx \\
  python3 scripts/analytics_report.py --days 7 [--output /tmp/analytics.md]

Token 说明（不要绕过）：
- GraphQL 查询需要：Account → Account Analytics → Read（API Token），或 wrangler OAuth（含 analytics 读权限）。
  本脚本优先读 $CLOUDFLARE_API_TOKEN，缺省时尝试读取本机 wrangler OAuth（仅本地方便，CI 请用 API Token）。
- 列出 Web Analytics sites（找 siteTag）需要：Account Settings Read：
  GET /accounts/{account_id}/rum/site_info/list
  当前 wrangler OAuth Token 无此权限时会 403 Authentication error（预期内），请按下面手动步骤操作。
- 如果报 403 / Authentication error，不要想办法绕过，按「需要用户做的事」去 Dashboard 加权限。

Dashboard 手动步骤（首选 Pages 一键启用，两版都会统计到，大陆可加载）：
  1. Workers & Pages → zhibiao-lab → Metrics → Web Analytics → Enable（下次部署自动注入）。
  2. 查看：Web Analytics（左侧导航）→ 选中 zhibiao-lab 关联的 analytics。
  3. 如需独立 site（不用 Pages 一键时）：Web Analytics → Add site → host 填 zhibiao.it-t.xyz →
     把返回的 token 填到 NEXT_PUBLIC_CF_BEACON_TOKEN 后重新部署（components/WebAnalyticsBeacon.tsx 会自动注入）。
  4. 加权限：Manage Account → API Tokens → Create Custom Token →
     Permissions 选 Account / Account Analytics / Read（拉数用）；
     如需列出 sites，再加 Account / Account Settings / Read。Zone Resources 选 All zones 或 it-t.xyz。

输出：markdown（stdout + 可选 --output 文件）。无数据时（刚启用 beacon）会如实输出 0 / 空表，不编造。
"""

import argparse
import datetime
import json
import os
import sys
import urllib.request
import urllib.error

GQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql"
DEFAULT_ACCOUNT_ID = "3b6e5b7b321340e093ee2a23fd6126ca"

DIM_QUERIES = [
    ("countryName", "国家/地区 TOP", 10),
    ("requestPath", "热门页面 TOP", 15),
    ("refererHost", "来源 Host TOP", 10),
    ("deviceType", "设备类型", 10),
    ("userAgentBrowser", "浏览器 TOP", 10),
]


def load_token():
    tok = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
    src = "env CLOUDFLARE_API_TOKEN"
    if tok:
        return tok, src
    # fallback：本机 wrangler OAuth（仅方便本地，缺权限时如实报错）
    try:
        import tomllib

        cfg_path = os.path.expanduser("~/.config/wrangler/config/default.toml")
        # 兼容旧路径 ~/Library/Preferences/.wrangler/...
        candidates = [
            cfg_path,
            os.path.expanduser("~/.wrangler/config/default.toml"),
            os.path.expanduser("~/Library/Preferences/.wrangler/config/default.toml"),
        ]
        for p in candidates:
            if os.path.exists(p):
                with open(p, "rb") as f:
                    d = tomllib.load(f)
                t = (d.get("oauth_token") or "").strip()
                if t:
                    return t, f"wrangler oauth ({p})"
    except Exception:
        pass
    return "", "none"


def gql_post(token, query, variables):
    payload = json.dumps({"query": query, "variables": variables}).encode()
    req = urllib.request.Request(
        GQL_ENDPOINT,
        data=payload,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode()
        except Exception:
            body = str(e)
        return e.code, {"http_error": body[:2000]}
    except Exception as e:
        return -1, {"transport_error": str(e)[:1000]}


def fetch_groups(token, account_id, site_tag, since_iso, until_iso, dimension=None, limit=10, order_asc=False):
    filt_lines = f'            datetime_geq: "{since_iso}",\n            datetime_lt: "{until_iso}"'
    if site_tag:
        filt_lines = f'            siteTag: "{site_tag}",\n' + filt_lines
    order = "date_ASC" if order_asc else "count_DESC"
    dim = dimension or "date"
    q = (
        "query Q($a: String!) {\n"
        "  viewer {\n"
        "    accounts(filter: { accountTag: $a }) {\n"
        "      rumPageloadEventsAdaptiveGroups(\n"
        f"        limit: {limit},\n"
        "        filter: {\n"
        f"{filt_lines}\n"
        "        },\n"
        f"        orderBy: [{order}]\n"
        "      ) {\n"
        "        count\n"
        f"        dimensions {{ {dim} }}\n"
        "      }\n"
        "    }\n"
        "  }\n"
        "}\n"
    )
    status, res = gql_post(token, q, {"a": account_id})
    return status, res


def extract_groups(res):
    try:
        accs = res["data"]["viewer"]["accounts"]
        if not accs:
            return [], None
        return accs[0].get("rumPageloadEventsAdaptiveGroups") or [], None
    except Exception as e:
        return None, f"解析返回失败：{str(e)[:300]}；原始：{json.dumps(res)[:800]}"


def list_rum_sites(token, account_id):
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/rum/site_info/list?per_page=20"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode()
        except Exception:
            body = str(e)
        return e.code, {"http_error": body[:2000]}
    except Exception as e:
        return -1, {"transport_error": str(e)[:500]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=7)
    ap.add_argument("--account", default=os.environ.get("CF_ACCOUNT_ID", DEFAULT_ACCOUNT_ID))
    ap.add_argument("--site-tag", default=os.environ.get("CF_RUM_SITE_TAG", "").strip())
    ap.add_argument("--output", default="")
    args = ap.parse_args()

    days = max(1, min(args.days, 90))
    account_id = args.account.strip()
    site_tag = args.site_tag.strip()
    token, token_src = load_token()

    now = datetime.datetime.now(datetime.timezone.utc)
    until = now
    since = now - datetime.timedelta(days=days)
    since_iso = since.strftime("%Y-%m-%dT%H:%M:%SZ")
    until_iso = until.strftime("%Y-%m-%dT%H:%M:%SZ")

    lines = []
    lines.append(f"# 老黄测指标 · 访问统计（最近 {days} 天）")
    lines.append("")
    lines.append(f"- 时间窗：`{since_iso}` → `{until_iso}`（UTC）")
    lines.append(f"- 账号：`{account_id}`")
    lines.append(f"- siteTag：`{site_tag or '(未指定，按账号级查询；单站点账号可用，多站点建议指定 CF_RUM_SITE_TAG)'}`")
    lines.append(f"- Token 来源：`{token_src}`")
    lines.append(f"- 数据源：Cloudflare GraphQL `rumPageloadEventsAdaptiveGroups`（Web Analytics / RUM beacon）")
    lines.append("")

    if not token:
        lines.append("## ❌ 缺 Token，无法查询")
        lines.append("")
        lines.append("未找到 `CLOUDFLARE_API_TOKEN`，本机也没有 wrangler OAuth。请：")
        lines.append("1. Dashboard → Manage Account → API Tokens → Create Custom Token → Account / Account Analytics / Read；")
        lines.append("2. `export CLOUDFLARE_API_TOKEN=xxx` 后重跑本脚本。")
        out = "\n".join(lines) + "\n"
        print(out)
        if args.output:
            open(args.output, "w").write(out)
        return 2

    # 1) 尝试列出 sites（找 siteTag；403 是预期内的权限缺失，不要绕过）
    lines.append("## Web Analytics sites（找 siteTag）")
    lines.append("")
    st, sr = list_rum_sites(token, account_id)
    if st == 200 and sr.get("success"):
        results = sr.get("result") or []
        if not results:
            lines.append("- 账号下暂无 Web Analytics site（可能还没启用 Pages 一键或手动建站）。请按头部 Dashboard 步骤启用。")
        else:
            lines.append(f"- 共 {len(results)} 个 site：")
            for s in results:
                rules = s.get("rules") or []
                host = rules[0].get("host") if rules else "(pages 自动)"
                lines.append(f"  - site_tag=`{s.get('site_tag')}` host=`{host}` created=`{s.get('created')}`")
                snip = (s.get("snippet") or "")[:160].replace("\n", " ")
                if snip:
                    lines.append(f"    snippet: `{snip}…`")
    elif st == 403 or st == 401:
        lines.append(f"- 列出 sites 失败（HTTP {st}，预期内的权限缺失，不要绕过）：")
        lines.append(f"  `{json.dumps(sr)[:600]}`")
        lines.append("- 缺的权限：**Account Settings Read**（`GET /accounts/{id}/rum/site_info/list` 需要至少此权限）。")
        lines.append("- 用户在 Dashboard 里加（一步步）：Manage Account → API Tokens → Create Custom Token →")
        lines.append("  Permissions 选 `Account / Account Settings / Read`（拉数另需 `Account / Account Analytics / Read`）→")
        lines.append("  Zone Resources 选 All zones（或仅 it-t.xyz）→ Continue → Create Token → 重跑时 `export CLOUDFLARE_API_TOKEN=新token`。")
        lines.append("- 不用 API 也行：直接去 Dashboard → Web Analytics 页面肉眼看数，或用 Pages 一键启用后再跑本脚本。")
    else:
        lines.append(f"- 列出 sites 异常（HTTP {st}）：`{json.dumps(sr)[:800]}`")
    lines.append("")

    # 2) 按天趋势（访问量）
    lines.append("## 访问量趋势（按天，pageviews）")
    lines.append("")
    st, res = fetch_groups(token, account_id, site_tag, since_iso, until_iso, dimension="date", limit=100, order_asc=True)
    if st != 200:
        lines.append(f"- 查询失败（HTTP {st}）：`{json.dumps(res)[:800]}`")
        if st in (401, 403):
            lines.append("- 很可能是缺 **Account Analytics Read**。Dashboard 加权限：API Tokens → Create Custom Token → Account / Account Analytics / Read。")
    else:
        if res.get("errors"):
            lines.append(f"- GraphQL errors：`{json.dumps(res['errors'])[:800]}`")
        groups, err = extract_groups(res)
        if err:
            lines.append(f"- {err}")
        elif not groups:
            lines.append("- 本窗口无数据（0）。可能刚启用 beacon（24h 内），或 siteTag 不对，或该账号此窗口确实无访问。Dashboard → Web Analytics 确认是否有曲线。")
        else:
            total = sum(g.get("count", 0) for g in groups)
            lines.append(f"- 合计 pageviews：**{total}**（{len(groups)} 天有数）")
            lines.append("")
            lines.append("| 日期 | pageviews |")
            lines.append("| --- | ---: |")
            for g in groups:
                d = (g.get("dimensions") or {}).get("date", "?")
                lines.append(f"| {d} | {g.get('count', 0)} |")
    lines.append("")
    lines.append("> 访客（Visits）：Dashboard Web Analytics 直接看 Visits；GraphQL 本节点以 `count`（pageviews）为主。如需访客数口径，请以 Dashboard 为准，本脚本不编造 visits。")
    lines.append("")

    # 3) 各维度 TOP
    for dim, title, lim in DIM_QUERIES:
        lines.append(f"## {title}（`{dim}`）")
        lines.append("")
        st, res = fetch_groups(token, account_id, site_tag, since_iso, until_iso, dimension=dim, limit=lim)
        if st != 200:
            lines.append(f"- 查询失败（HTTP {st}）：`{json.dumps(res)[:600]}`")
        elif res.get("errors"):
            lines.append(f"- GraphQL errors：`{json.dumps(res['errors'])[:600]}`")
        else:
            groups, err = extract_groups(res)
            if err:
                lines.append(f"- {err}")
            elif not groups:
                lines.append("- 暂无数据。")
            else:
                lines.append(f"| {dim} | views |")
                lines.append("| --- | ---: |")
                for g in groups:
                    v = (g.get("dimensions") or {}).get(dim, "(空)")
                    if v is None or v == "":
                        v = "(空/直接访问)"
                    lines.append(f"| {v} | {g.get('count', 0)} |")
        lines.append("")

    lines.append("## 备注")
    lines.append("")
    lines.append("- 两版（`/` 与 `/global/`）共用同一 layout，Pages 一键启用或同一 beacon token 下都会被统计到；热门页面用 `requestPath` 区分（含 `/global/` 前缀）。")
    lines.append("- beacon 走 `static.cloudflareinsights.com`，大陆可加载；未启用前 GraphQL 为空是正常的。")
    lines.append("- 本脚本只读，不写任何数据；Token 绝不提交到仓库。")

    out = "\n".join(lines) + "\n"
    print(out)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(out)
        print(f"[wrote {args.output}]", file=sys.stderr)
    # 非 0 仅在缺 token 时；无数据不算失败（方便 CI）
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
