// zhibiao-mailer — 极简发信 Worker（Cloudflare Email Service send_email）
// 供 Pages Function /api/request 经 Service 绑定调用；公网直调同样需要 MAILER_SECRET。
// 环境：SEND_EMAIL（send_email 绑定，destination huangyuan3h@gmail.com），MAILER_SECRET（wrangler secret）
// 请求：POST JSON { from?, to?, subject, text, html?, replyTo? }
// 返回：{ ok:true, messageId } / { ok:false, error }

const DEFAULT_FROM = "zhibiao@it-t.xyz";
const DEFAULT_TO = "huangyuan3h@gmail.com";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function authorized(request, env) {
  if (!env.MAILER_SECRET) return false;
  const auth = request.headers.get("Authorization") || "";
  if (auth === `Bearer ${env.MAILER_SECRET}`) return true;
  if (request.headers.get("X-Mailer-Secret") === env.MAILER_SECRET) return true;
  return false;
}

export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      // 健康检查（不鉴权，便于 service 绑定/部署探活；不泄露任何信息）
      return json({ ok: true, service: "zhibiao-mailer" });
    }
    if (request.method !== "POST") {
      return json({ ok: false, error: "method not allowed" }, 405);
    }
    if (!authorized(request, env)) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }
    if (!env.SEND_EMAIL) {
      console.log("zhibiao-mailer: SEND_EMAIL binding missing");
      return json({ ok: false, error: "SEND_EMAIL binding missing" }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "bad json" }, 400);
    }

    const subject = ((body.subject ?? "") + "").trim().slice(0, 200);
    const text = ((body.text ?? "") + "").slice(0, 20000);
    const html = body.html ? (body.html + "").slice(0, 50000) : undefined;
    const from = (((body.from ?? DEFAULT_FROM) + "").trim() || DEFAULT_FROM).slice(0, 200);
    const to = (((body.to ?? DEFAULT_TO) + "").trim() || DEFAULT_TO).slice(0, 200);
    const replyTo = body.replyTo ? (body.replyTo + "").trim().slice(0, 200) : undefined;

    if (!subject) return json({ ok: false, error: "subject required" }, 400);
    if (!text && !html) return json({ ok: false, error: "text or html required" }, 400);

    // 仅允许 it-t.xyz 发件 + 仅发往已验证目的地（纵深防御；绑定层已有 destination_address 限制）
    if (!from.endsWith("@it-t.xyz")) {
      return json({ ok: false, error: "from must be @it-t.xyz" }, 400);
    }
    if (to !== DEFAULT_TO) {
      return json({ ok: false, error: `to must be ${DEFAULT_TO}` }, 400);
    }

    try {
      const payload = { from, to, subject, text: text || undefined, html };
      if (replyTo) payload.replyTo = replyTo;
      // structured send()：运行时内部组装 MIME，无需 mimetext 依赖
      const res = await env.SEND_EMAIL.send(payload);
      console.log(`zhibiao-mailer: sent messageId=${res?.messageId || "?"} subject=${subject.slice(0, 60)}`);
      return json({ ok: true, messageId: res?.messageId || "" });
    } catch (e) {
      const code = e?.code || "SEND_FAILED";
      const msg = (e?.message || String(e)).slice(0, 500);
      console.log(`zhibiao-mailer: send failed ${code}: ${msg.slice(0, 200)}`);
      return json({ ok: false, error: msg, code }, 502);
    }
  },
};
