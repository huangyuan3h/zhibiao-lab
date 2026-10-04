// 指标打假回归测试：node scripts/test-check.mjs
// 确保 /check/ 数据真实、无付费墙、链接仅已发布、口径与节目一致。
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const read = (p) => readFileSync(resolve(ROOT, p), "utf-8");

let pass = 0;
let fail = 0;
function assert(name, cond) {
  if (cond) { pass++; console.log(`ok - ${name}`); }
  else { fail++; console.error(`FAIL - ${name}`); }
}

// 1) 数据文件存在且真实
assert("data/check-summary.json 存在", existsSync(resolve(ROOT, "data/check-summary.json")));
assert("public/data/check-summary.json 存在", existsSync(resolve(ROOT, "public/data/check-summary.json")));
const j = JSON.parse(read("data/check-summary.json"));
assert("24规则", j.meta && j.meta.n_rules === 24 && j.rules.length === 24);
assert("86组合", j.meta.n_combos === 86);
assert("费用0.003", j.meta.fee_rate === 0.003);
assert("区间2010-2026.08", j.meta.signal_start === "2010-01-01" && j.meta.signal_end === "2026-08-31");
assert("永久免费注记", (j.meta.free_note || "").includes("免费"));

const raw = read("data/check-summary.json").toLowerCase();
assert("无合成词", !raw.includes("synthetic") && !raw.includes("lorem") && !raw.includes("placeholder"));

// 2) 抽查与节目一致（与 falsifier 同口径）
const ma = j.rules.find((r) => r.id === "ma5_20_golden_cross");
const ma5 = ma.variants.find((v) => v.variant_id === "hold5");
assert("MA hold5 196640笔", ma5.n_trades === 196640);
assert("MA hold5 均值-0.18%", Math.abs(ma5.mean_net - -0.0017827350331048638) < 1e-9);
assert("MA hold5 分位15.8", Math.abs(ma5.percentile - 15.8) < 1e-9);

// 3) 无付费墙
const tool = read("components/CheckTool.tsx");
assert("CheckTool 无¥9.9", !tool.includes("¥9.9") && !tool.includes("¥49") && !tool.includes("$49"));
assert("CheckTool 无free次数限制", !tool.includes("falsifier_free_count") && !tool.includes("MAX_FREE"));
assert("CheckTool 无waitlist", !tool.includes("/api/waitlist") && !tool.includes("候补"));
assert("CheckTool 有软CTA request", tool.includes("/request/") && (tool.includes("想测") || tool.includes("选题池")));
assert("CheckTool 有样本+区间+随机+组合", tool.includes("n_trades") && tool.includes("signal_start") && tool.includes("percentile") && tool.includes("csi300"));
assert("CheckTool 有plain结论", tool.includes("plain"));
assert("CheckTool 版本隔离 bili/youtube", tool.includes("bili_url") && tool.includes("youtube_url"));

// 4) 版本链接：CN用bili，global用youtube；未发布无链接
const hasBili = j.rules.filter((r) => !!r.bili_url).length;
const hasYt = j.rules.filter((r) => !!r.youtube_url).length;
assert("有B站链接(已发布)", hasBili >= 3);
assert("有YouTube链接(已发布)", hasYt >= 15);
const unpublished = j.rules.filter((r) => r.ep === null);
assert("未播出无article链接", unpublished.every((r) => !r.article_cn && !r.article_global));

// 5) 页面/导航/站点
assert("app/check 存在", existsSync(resolve(ROOT, "app/check/page.tsx")));
assert("app/global/check 存在", existsSync(resolve(ROOT, "app/global/check/page.tsx")));
const header = read("components/SiteHeader.tsx");
assert("导航有指标打假", header.includes("指标打假") && header.includes("/check/"));
const home = read("app/page.tsx");
assert("首页有打假入口", home.includes("指标打假") && home.includes("/check/"));
const ghome = read("app/global/page.tsx");
assert("海外首页有打假入口", ghome.includes("/global/check/"));
const sitemap = read("app/sitemap.ts");
assert("sitemap有check", sitemap.includes("/check/") && sitemap.includes("/global/check/"));

// 6) 新配色：深海蓝 + 琥珀 + 暖底，无大黑块，无红绿主题
const css = read("app/globals.css");
assert("accent深海蓝", css.includes("#1E3A5F"));
const layout = read("app/layout.tsx");
assert("暖底#FAF7F2", layout.includes("#FAF7F2"));
const btn = read("components/ui/button.tsx");
assert("按钮深海蓝无黑", btn.includes("#1E3A5F") && !btn.includes("bg-neutral-900"));
const badge = read("components/ui/badge.tsx");
assert("badge默认深海蓝", badge.includes("#1E3A5F"));
assert("CheckTool关键数字琥珀", tool.includes("#B45309"));
assert("CheckTool按钮深海蓝", tool.includes("bg-[#1E3A5F]"));
// 主题红绿仅用于涨跌（chart-theme允许，Badge红已改为 slate）
assert("Badge红已去红", !badge.includes("bg-red-100") && !badge.includes("bg-red-200"));

// 7) update-data 已接打假构建
const upd = read("scripts/update-data.mjs");
assert("update-data调build-check-summary", upd.includes("build-check-summary.py"));
assert("build-check-summary跳过_目录", read("scripts/build-check-summary.py").includes('startswith("_")'));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
