// POST /api/request — 「你想测哪个指标」提交接口（Cloudflare Pages Function）
// 流程：校验 + 蜜罐 + 限流(D1) + Turnstile + 写 D1(requests) + 经 mailer Worker 发邮件(失败也不回滚 DB)
// 邮件：首选 zhibiao-mailer Worker（send_email 绑定，Service 绑定调用，公网 URL+secret 为兜底），
//   Resend 仅为可选 fallback（仅当 RESEND_API_KEY 已设置时才尝试）。
//   为何不用 send_email 直连：Pages Functions 的 wrangler 配置不支持 send_email 绑定（校验拒绝），
//   Email Routing 本身已就绪（it-t.xyz 已启用、MX 正常、目的地已验证），发信绑定仅 Workers 可用。
// 站点绝不出现站长邮箱；from 默认 zhibiao@it-t.xyz。

const MARKETS = ["A股", "港股", "美股", "其他"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const OWNER_EMAIL = "huangyuan3h@gmail.com";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    (request.headers.get("X-Forwarded-For") || "").split(",")[0].trim() ||
    "unknown"
  );
}

function shanghai(iso) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

async function verifyTurnstile(secret, token, ip) {
  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== "unknown") body.set("remoteip", ip);
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  if (!r.ok) return false;
  const j = await r.json().catch(() => null);
  return !!(j && j.success);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    let input;
    try {
      input = await request.json();
    } catch {
      return json({ ok: false, error: "请求格式不对" }, 400);
    }

    // 蜜罐：bot 填了 website，直接假装成功，不入库
    if (((input.website ?? "") + "").trim().length > 0) {
      return json({ ok: true });
    }

    const indicator = ((input.indicator ?? "") + "").trim().replace(/\s+/g, " ");
    const usage = ((input.usage ?? "") + "").trim();
    const marketRaw = ((input.market ?? "其他") + "").trim();
    const contact = ((input.contact ?? "") + "").trim();
    const token = ((input.turnstile ?? "") + "").trim();

    if (!indicator) return json({ ok: false, error: "请填写指标名称" }, 400);
    if (indicator.length > 50) return json({ ok: false, error: "指标名称最多 50 字" }, 400);
    if (usage.length > 500) return json({ ok: false, error: "用法/参数最多 500 字" }, 400);
    const market = MARKETS.includes(marketRaw) ? marketRaw : "其他";
    if (contact) {
      if (contact.length > 100) return json({ ok: false, error: "联系邮箱过长" }, 400);
      if (!EMAIL_RE.test(contact)) return json({ ok: false, error: "联系邮箱格式不对（可留空）" }, 400);
    }

    const ip = clientIp(request);
    const ua = (request.headers.get("user-agent") || "").slice(0, 300);
    const nowIso = new Date().toISOString();

    if (!env.DB) return json({ ok: false, error: "服务端未绑定数据库，稍后再试" }, 500);

    // 限流：同一 IP 1 小时 ≤5，24 小时 ≤20（D1，无需 KV）
    try {
      const hourAgo = new Date(Date.now() - 3600_000).toISOString();
      const dayAgo = new Date(Date.now() - 86400_000).toISOString();
      const h = await env.DB.prepare(
        "SELECT COUNT(*) AS c FROM requests WHERE ip = ? AND created_at > ?"
      ).bind(ip, hourAgo).first();
      if ((h?.c ?? 0) >= 5) return json({ ok: false, error: "提交太频繁，1 小时后再试" }, 429);
      const d = await env.DB.prepare(
        "SELECT COUNT(*) AS c FROM requests WHERE ip = ? AND created_at > ?"
      ).bind(ip, dayAgo).first();
      if ((d?.c ?? 0) >= 20) return json({ ok: false, error: "今天提交已达上限，明天再试" }, 429);
    } catch (e) {
      console.log("ratelimit check failed (allow):", String(e).slice(0, 200));
    }

    // Turnstile：生产强制；带有效 ADMIN_TOKEN 的请求（如站长自测）可跳过
    const adminBypass =
      env.ADMIN_TOKEN &&
      (request.headers.get("X-Admin-Token") === env.ADMIN_TOKEN ||
        request.headers.get("Authorization") === `Bearer ${env.ADMIN_TOKEN}`);
    let turnstileOk = 0;
    if (env.TURNSTILE_SECRET) {
      if (!token) {
        if (!adminBypass) return json({ ok: false, error: "请完成人机验证后重试" }, 400);
      } else {
        const ok = await verifyTurnstile(env.TURNSTILE_SECRET, token, ip).catch(() => false);
        if (!ok) return json({ ok: false, error: "人机验证未通过，请重试" }, 400);
        turnstileOk = 1;
      }
    } else if (token) {
      turnstileOk = 0;
    }

    // 写库（必须成功；邮件失败也不回滚）
    let rowId = null;
    try {
      const r = await env.DB.prepare(
        "INSERT INTO requests (indicator, usage_text, market, contact, ip, user_agent, turnstile_ok, email_status, email_error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'sending', '', ?)"
      ).bind(indicator, usage, market, contact, ip, ua, turnstileOk, nowIso).run();
      rowId = r?.meta?.last_row_id ?? null;
    } catch (e) {
      console.log("d1 insert failed:", String(e).slice(0, 500));
      return json({ ok: false, error: "保存失败，请稍后重试" }, 500);
    }

    // 邮件：主题「[指标请求] RSI（A股）」，正文全部字段 + 上海时间
    const subject = `[指标请求] ${indicator.slice(0, 30)}（${market}）`;
    const timeSh = shanghai(nowIso);
    const text =
      `${subject}\n` +
      `时间（北京时间）：${timeSh}\n` +
      `指标：${indicator}\n` +
      `市场：${market}\n` +
      `用法/参数：${usage || "（未填）"}\n` +
      `联系邮箱：${contact || "（未留）"}\n` +
      `IP：${ip}\n` +
      `UA：${ua || "（未知）"}\n` +
      `Turnstile：${turnstileOk ? "通过" : "未验证/跳过"}\n` +
      `DB id：${rowId ?? "?"}\n`;
    const fromAddr = (env.NOTIFY_FROM || "zhibiao@it-t.xyz") + "";
    let emailStatus = "sent";
    let emailError = "";

    // 1) 首选：zhibiao-mailer Worker（Cloudflare Email Service，无需 Resend，不动 MX）
    //    a) Service 绑定 env.MAILER（preferred，不走公网）；b) 公网 URL + 共享 secret 兜底
    let sent = false;
    async function sendViaMailer() {
      const payload = JSON.stringify({
        from: fromAddr.includes("it-t.xyz") ? fromAddr : "zhibiao@it-t.xyz",
        to: OWNER_EMAIL,
        subject,
        text,
      });
      const secret = (env.MAILER_SECRET || "") + "";
      if (!secret) return { ok: false, error: "MAILER_SECRET missing" };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      };
      // a) Service binding（Pages → Worker，同账号内网直调）
      if (env.MAILER && typeof env.MAILER.fetch === "function") {
        try {
          const r = await env.MAILER.fetch(
            new Request("https://mailer/send", {
              method: "POST",
              headers,
              body: payload,
            })
          );
          const j = await r.json().catch(() => null);
          if (r.ok && j && j.ok) return { ok: true, via: "service" };
          const detail = (j && (j.error || j.code)) || `http ${r.status}`;
          return { ok: false, error: `mailer service: ${String(detail).slice(0, 200)}` };
        } catch (e) {
          return { ok: false, error: `mailer service: ${String(e?.message || e).slice(0, 200)}` };
        }
      }
      // b) 公网 URL 兜底（需 MAILER_URL + MAILER_SECRET；Worker 侧同样验 secret）
      const base = ((env.MAILER_URL || "") + "").trim().replace(/\/+$/, "");
      if (base) {
        try {
          const r = await fetch(base + "/", {
            method: "POST",
            headers,
            body: payload,
          });
          const j = await r.json().catch(() => null);
          if (r.ok && j && j.ok) return { ok: true, via: "https" };
          const detail = (j && (j.error || j.code)) || `http ${r.status}`;
          return { ok: false, error: `mailer https: ${String(detail).slice(0, 200)}` };
        } catch (e) {
          return { ok: false, error: `mailer https: ${String(e?.message || e).slice(0, 200)}` };
        }
      }
      return { ok: false, error: "mailer binding/URL missing" };
    }

    try {
      const m = await sendViaMailer();
      if (m.ok) {
        sent = true;
        emailError = "";
      } else {
        emailError = m.error || "mailer failed";
      }
    } catch (e) {
      emailError = `mailer: ${String(e?.message || e).slice(0, 200)}`;
    }

    // 2) 可选 fallback：Resend（仅当 RESEND_API_KEY 已设置；免费 100 封/天）
    if (!sent && env.RESEND_API_KEY) {
      try {
        const from = fromAddr.includes("it-t.xyz")
          ? `指标实验室 <${fromAddr}>`
          : "指标实验室 <onboarding@resend.dev>";
        const rr = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ from, to: [OWNER_EMAIL], subject, text }),
        });
        if (rr.ok) {
          sent = true;
          emailError = "";
        } else {
          const t = await rr.text().catch(() => "");
          emailError = `${emailError}; resend ${rr.status}: ${t.slice(0, 150)}`.slice(0, 500);
        }
      } catch (e) {
        emailError = `${emailError}; resend: ${String(e?.message || e).slice(0, 150)}`.slice(0, 500);
      }
    } else if (!sent && !emailError) {
      emailError = "mailer failed; RESEND_API_KEY missing";
    }

    if (!sent) {
      emailStatus = "failed";
      if (!emailError) emailError = "all senders failed";
    }

    // 回写邮件状态（失败也不影响已返回的成功；尽力）
    try {
      if (rowId !== null) {
        await env.DB.prepare("UPDATE requests SET email_status = ?, email_error = ? WHERE id = ?")
          .bind(emailStatus, emailError.slice(0, 500), rowId)
          .run();
      }
    } catch (e) {
      console.log("email status update failed:", String(e).slice(0, 200));
    }

    return json({ ok: true, id: rowId });
  } catch (e) {
    console.log("api/request fatal:", String(e).slice(0, 500));
    return json({ ok: false, error: "服务开小差，请稍后重试" }, 500);
  }
}

export async function onRequestGet() {
  return json({ ok: false, error: "请用 POST 提交" }, 405);
}
