// npm run requests:summary — 最近 24h + 热门指标（只读 D1，经 wrangler d1 execute）
// 用法：npm run requests:summary
import { execSync } from "node:child_process";

function run(sql) {
  const cmd = `npx --yes wrangler d1 execute zhibiao-requests --remote --json --command ${JSON.stringify(sql)}`;
  const out = execSync(cmd, { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
  const j = JSON.parse(out);
  const first = Array.isArray(j) ? j[0] : j;
  return first?.results ?? first?.result ?? [];
}

try {
  const last24 = run(
    "SELECT id, indicator, market, contact, email_status, created_at FROM requests WHERE created_at > datetime('now','-1 day') ORDER BY id DESC LIMIT 20;"
  );
  const top = run(
    "SELECT indicator, COUNT(*) AS c FROM requests GROUP BY indicator ORDER BY c DESC LIMIT 10;"
  );
  const total = run("SELECT COUNT(*) AS c FROM requests;");
  const totalN = total?.[0]?.c ?? "?";

  console.log(`指标请求汇总（UTC ${new Date().toISOString().slice(0, 16)}Z，共 ${totalN} 条）`);
  console.log(`\n最近 24h（${last24.length} 条）：`);
  if (last24.length === 0) console.log("  （无）");
  for (const r of last24) {
    console.log(`  #${r.id} ${r.indicator}（${r.market}） ${r.created_at} 邮件:${r.email_status}`);
  }
  console.log(`\n热门指标 Top：`);
  if (top.length === 0) console.log("  （无）");
  for (const t of top) {
    console.log(`  ${t.indicator} ×${t.c}`);
  }
} catch (e) {
  console.error("requests:summary 失败（需 wrangler 已登录）：", String(e.message || e).slice(0, 300));
  process.exit(1);
}
