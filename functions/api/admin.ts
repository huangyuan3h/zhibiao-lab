// GET /api/admin — 私有管理接口（Token 鉴权，不在站点任何地方链接）
// 用法：Authorization: Bearer <ADMIN_TOKEN> 或 ?token=<ADMIN_TOKEN>
//   /api/admin?token=xxx → JSON { rows, counts }
//   /api/admin?token=xxx&format=csv → CSV 下载
// Token 存 wrangler secret ADMIN_TOKEN，绝不进仓库

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function authorized(request, env) {
  if (!env.ADMIN_TOKEN) return false;
  const h = request.headers.get("Authorization") || "";
  if (h === `Bearer ${env.ADMIN_TOKEN}`) return true;
  if (request.headers.get("X-Admin-Token") === env.ADMIN_TOKEN) return true;
  try {
    const u = new URL(request.url);
    if (u.searchParams.get("token") === env.ADMIN_TOKEN) return true;
  } catch {}
  return false;
}

function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.DB) return json({ ok: false, error: "no db" }, 500);
  if (!authorized(request, env)) return json({ ok: false, error: "unauthorized" }, 401);
  try {
    const u = new URL(request.url);
    const format = u.searchParams.get("format") || "json";
    const limit = Math.min(parseInt(u.searchParams.get("limit") || "500", 10) || 500, 2000);

    const rows = await env.DB.prepare(
      "SELECT id, indicator, usage_text, market, contact, ip, user_agent, turnstile_ok, email_status, email_error, created_at FROM requests ORDER BY id DESC LIMIT ?"
    ).bind(limit).all();
    const list = rows?.results ?? [];

    const counts = await env.DB.prepare(
      "SELECT indicator, COUNT(*) AS c FROM requests GROUP BY indicator ORDER BY c DESC LIMIT 50"
    ).all();

    if (format === "csv") {
      const header = ["id", "indicator", "usage", "market", "contact", "ip", "turnstile_ok", "email_status", "created_at"];
      const lines = [header.join(",")];
      for (const r of list) {
        lines.push(
          [r.id, r.indicator, r.usage_text, r.market, r.contact, r.ip, r.turnstile_ok, r.email_status, r.created_at]
            .map(csvEscape)
            .join(",")
        );
      }
      return new Response("\uFEFF" + lines.join("\n"), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "cache-control": "no-store",
          "content-disposition": "attachment; filename=zhibiao-requests.csv",
        },
      });
    }

    return json({ ok: true, rows: list, counts: counts?.results ?? [], total: list.length });
  } catch (e) {
    return json({ ok: false, error: String(e).slice(0, 300) }, 500);
  }
}
