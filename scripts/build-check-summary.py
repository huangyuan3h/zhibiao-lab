#!/usr/bin/env python3
"""Build 指标打假 check-summary for zhibiao-lab (free column).

Read-only from ~/Projects/karios-series-output/*/summary.json (real backtests).
- Skips _reader_requests and any other "_" prefixed folders (never reads them).
- Only published episodes get links:
  - CN bili links come from zhibiao-lab data/indicators.json (which itself only
    keeps bili_ready.json published bvid via update-data).
  - Global youtube links come from data/indicators.json (which only keeps
    ledger privacy=public via update-data, unlisted cleared).
  - Rules with ep=None or no published video get null links (show article/request CTA).
- Output: data/check-summary.json + public/data/check-summary.json (same content).

Usage: python3 scripts/build-check-summary.py
Called automatically by `npm run update-data`.
"""
import json
import sys
from pathlib import Path
from datetime import datetime, timezone

KARIOS_BASE = Path("/Users/huangyuan/Projects/karios-series-output")
ROOT = Path(__file__).resolve().parent.parent
ZHIBIAO_DATA = ROOT / "data" / "indicators.json"
OUT_DATA = ROOT / "data" / "check-summary.json"
OUT_PUBLIC = ROOT / "public" / "data" / "check-summary.json"

# Same 24 rules as tools-indicator-falsifier (free forever, merged as /check/).
# (rule_id, name, category, ep, [(karios_subdir, label, hold_or_None)])
RULES = [
    ("ma5_20_golden_cross", "MA金叉（5上穿20）", "均线", 9,
     [("hold5", "拿5天", 5), ("hold10", "拿10天", 10), ("hold20", "拿20天", 20)]),
    ("macd_golden_cross", "MACD金叉", "MACD", 1,
     [("default", "默认：金叉买死叉卖", None), ("above_zero", "零轴上金叉", None)]),
    ("macd_second_golden", "MACD零轴上二次金叉", "MACD", 17,
     [("hold3", "拿3天", 3), ("hold5", "拿5天", 5), ("hold10", "拿10天", 10), ("hold20", "拿20天", 20)]),
    ("kdj_oversold", "KDJ超卖", "KDJ", 2,
     [("j_below_0", "J<0抄底", None), ("low_golden_cross", "低位金叉(K<20,D<20)", None)]),
    ("kdj_overbought_chase", "KDJ超买追涨（冲上100追）", "KDJ", 32,
     [("hold3", "拿3天", 3), ("hold5", "拿5天", 5), ("hold10", "拿10天", 10), ("hold20", "拿20天", 20)]),
    ("rsi_oversold", "RSI超卖（跌破30）", "RSI", None,
     [("hold3", "拿3天", 3), ("hold5", "拿5天", 5), ("hold10", "拿10天", 10), ("hold20", "拿20天", 20)]),
    ("rsi_overbought_chase", "RSI超买追涨（冲上80追）", "RSI", 30,
     [("hold3", "拿3天", 3), ("hold5", "拿5天", 5), ("hold10", "拿10天", 10), ("hold20", "拿20天", 20)]),
    ("bollinger_lower", "布林带下轨", "BOLL", 6,
     [("lower_uptrend", "上升趋势碰下轨", None), ("lower_all", "不看趋势碰下轨", None), ("lower_uptrend_hold10", "上升趋势碰下轨拿10天", 10)]),
    ("boll_upper_chase", "布林线上轨追涨", "BOLL", 29,
     [("hold3", "拿3天", 3), ("hold5", "拿5天", 5), ("hold10", "拿10天", 10), ("hold20", "拿20天", 20)]),
    ("boll_kdj_combo", "BOLL下轨+KDJ低位金叉", "BOLL", 35,
     [("hold3", "拿3天", 3), ("hold5", "拿5天", 5), ("hold10", "拿10天", 10), ("hold20", "拿20天", 20)]),
    ("sar_bullish", "SAR翻红", "SAR", 28,
     [("hold3", "拿3天", 3), ("hold5", "拿5天", 5), ("hold10", "拿10天", 10), ("hold20", "拿20天", 20)]),
    ("volume_breakout_20d", "放量突破20日新高", "成交量", 10,
     [("hold3", "拿3天", 3), ("hold5", "拿5天", 5), ("hold10", "拿10天", 10), ("hold20", "拿20天", 20)]),
    ("volume_drought", "地量见底", "成交量", 20,
     [("hold3", "拿3天", 3), ("hold5", "拿5天", 5), ("hold10", "拿10天", 10), ("hold20", "拿20天", 20)]),
    ("second_board_chase", "二连板追涨", "涨停", 31,
     [("hold3", "拿3天", 3), ("hold5", "拿5天", 5), ("hold10", "拿10天", 10), ("hold20", "拿20天", 20)]),
    ("limitdown_pry_dip", "跌停撬板", "涨跌停", 33,
     [("hold3", "拿3天", 3), ("hold5", "拿5天", 5), ("hold10", "拿10天", 10), ("hold20", "拿20天", 20)]),
    ("gap_up_chase", "跳空高开追涨", "缺口", 26,
     [("hold3", "拿3天", 3), ("hold5", "拿5天", 5), ("hold10", "拿10天", 10), ("hold20", "拿20天", 20)]),
    ("breakout_60d_high", "突破60日新高追涨", "突破", 16,
     [("hold3", "拿3天", 3), ("hold5", "拿5天", 5), ("hold10", "拿10天", 10), ("hold20", "拿20天", 20)]),
    ("red_three_soldiers", "红三兵三连阳", "K线", 11,
     [("hold3", "拿3天", 3), ("hold5", "拿5天", 5), ("hold10", "拿10天", 10), ("hold20", "拿20天", 20)]),
    ("morning_star", "早晨之星", "K线", None,
     [("hold5", "拿5天", 5), ("hold10", "拿10天", 10), ("hold20", "拿20天", 20)]),
    ("bullish_engulfing", "看涨吞没", "K线", None,
     [("hold5", "拿5天", 5), ("hold10", "拿10天", 10), ("hold20", "拿20天", 20)]),
    ("pin_bar_hammer", "锤头线", "K线", 4,
     [("hold5", "拿5天", 5), ("hold10", "拿10天", 10)]),
    ("double_bottom_breakout", "W底突破追涨", "形态", 19,
     [("hold3", "拿3天", 3), ("hold5", "拿5天", 5), ("hold10", "拿10天", 10), ("hold20", "拿20天", 20)]),
    ("triple_bottom_breakout", "三重底突破", "形态", 22,
     [("hold3", "拿3天", 3), ("hold5", "拿5天", 5), ("hold10", "拿10天", 10), ("hold20", "拿20天", 20)]),
    ("head_shoulders_bottom", "头肩底突破", "形态", 21,
     [("hold3", "拿3天", 3), ("hold5", "拿5天", 5), ("hold10", "拿10天", 10), ("hold20", "拿20天", 20)]),
]


def load_zhibiao():
    try:
        d = json.loads(ZHIBIAO_DATA.read_text(encoding="utf-8"))
        m = {x["id"]: x for x in d["indicators"]}
        return m, d.get("method", "")
    except Exception as e:
        print(f"warn zhibiao load fail: {e}", file=sys.stderr)
        return {}, ""


def plain_verdict(mean_net, pct, win_rate, portfolio_ann, csi300):
    q = pct / 100.0 if pct is not None and pct > 1 else (pct or 0)
    parts = []
    if mean_net is not None and mean_net <= 0:
        parts.append(f"扣费后每笔平均 {mean_net*100:.2f}% 为负")
    else:
        parts.append(f"扣费后每笔平均 {mean_net*100:.2f}% 为正" if mean_net is not None else "每笔均值缺失")
    if q < 0.5:
        parts.append("跑不赢随机买入")
    elif q < 0.9:
        parts.append("略超随机但优势微弱")
    else:
        parts.append("明显强于随机")
    if portfolio_ann is not None and csi300 is not None and portfolio_ann < csi300:
        parts.append("组合跑输沪深300")
    return "，".join(parts) + "。"


def is_skipped_path(p: Path) -> bool:
    # Skip _reader_requests and any other "_" prefixed folders (read-only guard).
    for part in p.parts:
        if part.startswith("_"):
            return True
    return False


def main():
    zmap, method = load_zhibiao()
    rules_out = []
    total_combos = 0
    for rid, name, cat, ep, variants in RULES:
        if rid.startswith("_"):
            print(f"SKIP _ folder rule {rid}", file=sys.stderr)
            continue
        z = zmap.get(rid, {})
        # Published-only links: reuse zhibiao-lab indicators.json which already
        # enforces bili_ready published + yt privacy=public via update-data.
        bili_url = z.get("bili")
        ytid = z.get("youtube")
        youtube_url = f"https://youtu.be/{ytid}" if ytid else None
        # Article links: only if this indicator has a published episode (ep != None in zhibiao).
        has_article = z.get("ep") is not None
        article_cn = f"/i/{rid}/" if has_article else None
        article_global = f"/global/i/{rid}/" if has_article else None
        rule_entry = {
            "id": rid, "name": name, "category": cat, "ep": ep,
            "bili_url": bili_url,
            "youtube_id": ytid, "youtube_url": youtube_url,
            "article_cn": article_cn, "article_global": article_global,
            "title": z.get("title"),
            "variants": []
        }
        for sub, label, hold in variants:
            if sub.startswith("_"):
                print(f"SKIP _ variant {rid}/{sub}", file=sys.stderr)
                continue
            fp = KARIOS_BASE / rid / sub / "summary.json"
            if is_skipped_path(fp):
                print(f"SKIP _ path {fp}", file=sys.stderr)
                continue
            if not fp.exists():
                print(f"WARN missing {rid}/{sub}", file=sys.stderr)
                continue
            j = json.loads(fp.read_text(encoding="utf-8"))
            ev = j["event"]["metrics_0.0030"]
            mc = j.get("mc", {}).get("event", {})
            pf = j.get("portfolio", {}).get("metrics_by_cost", {}).get("0.0030", {})
            bench = j.get("portfolio", {}).get("benchmarks", {})
            data = j.get("data", {})
            verdict_info = j.get("verdict", {})
            date_range = j.get("event", {}).get("date_range", {})
            signal_stats = j.get("event", {}).get("signal_stats", {})
            mean_net = ev.get("mean_net")
            pct = mc.get("percentile")
            quantile = (pct / 100.0) if pct is not None else None
            csi300_ann = bench.get("csi300", {}).get("annualized") if isinstance(bench.get("csi300"), dict) else verdict_info.get("csi300_annualized")
            csi500_ann = bench.get("csi500", {}).get("annualized") if isinstance(bench.get("csi500"), dict) else verdict_info.get("csi500_annualized")
            v = {
                "variant_id": sub,
                "label": label,
                "hold": hold,
                "rule_zh": j.get("variant_rule_zh", ""),
                "n_trades": ev.get("n"),
                "mean_net": mean_net,
                "median_net": ev.get("median_net"),
                "win_rate": ev.get("win_rate"),
                "payoff_ratio": ev.get("payoff_ratio"),
                "mean_gross": ev.get("mean_gross"),
                "random_mean": mc.get("random_mean"),
                "random_median": mc.get("random_median"),
                "random_p5": mc.get("random_p5"),
                "random_p95": mc.get("random_p95"),
                "percentile": pct,
                "quantile": quantile,
                "portfolio_annualized": pf.get("annualized"),
                "portfolio_max_dd": pf.get("max_dd"),
                "csi300_annualized": csi300_ann,
                "csi500_annualized": csi500_ann,
                "verdict_label": verdict_info.get("label"),
                "signal_start": data.get("signal_start"),
                "signal_end": data.get("signal_end"),
                "distinct_codes": data.get("distinct_codes"),
                "fill_rate": signal_stats.get("fill_rate"),
                "n_signals": signal_stats.get("n_signals"),
                "first_signal": date_range.get("first_signal"),
                "last_exit": date_range.get("last_exit"),
                "plain": plain_verdict(mean_net, pct, ev.get("win_rate"), pf.get("annualized"), csi300_ann),
                "source_file": f"{rid}/{sub}/summary.json",
            }
            rule_entry["variants"].append(v)
            total_combos += 1
        if not rule_entry["variants"]:
            print(f"ERROR no variants for {rid}", file=sys.stderr)
            sys.exit(1)
        rules_out.append(rule_entry)

    meta = {
        "label": "A股全市场 2010-01-01 至 2026-08-31",
        "universe": "沪深主板+创业板+科创板，含已退市；剔除ST/*ST、退市整理、北交所；上市满250交易日；前20日均额≥7000千元；共5499只，其中279只已退市",
        "signal_start": "2010-01-01",
        "signal_end": "2026-08-31",
        "fee_rate": 0.003,
        "fee_note": "每笔扣往返0.30%",
        "entry": "看到信号后，第二天开盘买入；一字涨跌停买不进卖不出就顺延",
        "random_note": "每个规则都和同一天随机买入、拿同样天数做对比（各重复1000次），看是真本事还是运气",
        "disclaimer": "历史数据与工具演示，不构成投资建议",
        "source": "全市场历史回测，与系列节目同一口径",
        "method": method,
        "n_rules": len(rules_out),
        "n_combos": total_combos,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "free_note": "本栏目永久免费，无次数限制",
    }
    out_data = {"meta": meta, "rules": rules_out}
    OUT_DATA.write_text(json.dumps(out_data, ensure_ascii=False, indent=2), encoding="utf-8")
    OUT_PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    OUT_PUBLIC.write_text(json.dumps(out_data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK: {len(rules_out)} rules, {total_combos} combos -> {OUT_DATA} + {OUT_PUBLIC}")
    for r in rules_out:
        for v in r["variants"]:
            assert v["n_trades"] and v["n_trades"] > 100, f"small n {r['id']} {v['variant_id']}"
            assert v["signal_start"] == "2010-01-01", f"period mismatch {r['id']}"


if __name__ == "__main__":
    main()
