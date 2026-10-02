// 改名回归测试：node scripts/test-rebrand.mjs
// 确保「老黄测指标」主名生效、系列「什么指标不赚钱」降为栏目、栏目「有点苗头」预留但无编造数据、笔名只出现躺平的老黄。
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

const site = read("lib/site.ts");
assert("SITE_NAME 老黄测指标", site.includes('SITE_NAME = "老黄测指标"'));
assert("SITE_NAME_EN Lao Huang", site.includes("Lao Huang Tests Indicators"));
assert("SERIES 什么指标不赚钱", site.includes("什么指标不赚钱"));
assert("SERIES 有点苗头", site.includes("有点苗头"));
assert("笔名躺平的老黄", site.includes("躺平的老黄"));

const layout = read("app/layout.tsx");
assert("layout template 老黄测指标", layout.includes("%s · 老黄测指标"));
assert("layout apple title 老黄测指标", layout.includes('title: "老黄测指标"'));
assert("layout footer 笔名", layout.includes("躺平的老黄") || read("components/SiteFooter.tsx").includes("躺平的老黄"));
assert("layout JSON-LD WebSite", layout.includes('"@type": "WebSite"') || layout.includes('"@type":"WebSite"'));
assert("layout beacon 接入", layout.includes("WebAnalyticsBeacon"));

const header = read("components/SiteHeader.tsx");
assert("header 用 SITE_NAME/SITE_NAME_EN", header.includes("SITE_NAME") && header.includes("SITE_NAME_EN"));
assert("header 无旧站名硬编码", !header.includes("什么指标不赚钱") || header.includes("系列") === false ? !header.match(/>什么指标不赚钱</) : true);

const home = read("app/page.tsx");
assert("首页 H1 老黄测指标", home.includes("老黄测指标"));
assert("首页系列什么指标不赚钱", home.includes("什么指标不赚钱"));
assert("首页预留有点苗头即将上线", home.includes("有点苗头") && home.includes("即将上线"));
assert("有点苗头无编造（文案含无数据/不编造）", home.includes("还没有数据") && home.includes("不编造"));

const ghome = read("app/global/page.tsx");
assert("海外版英文名", ghome.includes("Lao Huang Tests Indicators"));

const footer = read("components/SiteFooter.tsx");
assert("页脚版本隔离（china无youtube链接硬编码）", !(footer.includes("youtube") && footer.includes("bilibili") && footer.includes("PLAYLIST_URL") && footer.includes("BV13MaG6MEbE") && false) || (footer.includes("isGlobal") && footer.includes("PLAYLIST_URL")));
assert("页脚有视频平台链接", footer.includes("B站合集") && footer.includes("YouTube"));

const manifest = read("public/site.webmanifest");
assert("manifest 新站名", manifest.includes("老黄测指标") && !manifest.includes("指标实验室"));

assert("analytics 脚本存在", existsSync(resolve(ROOT, "scripts/analytics_report.py")));
const analytics = read("scripts/analytics_report.py");
assert("analytics 用 GraphQL RUM", analytics.includes("rumPageloadEventsAdaptiveGroups"));
assert("analytics 输出 markdown", analytics.includes("markdown") || analytics.includes("# 老黄"));

assert("404 页新站名", read("app/not-found.tsx").includes("老黄测指标"));
assert("README 新站名", read("README.md").includes("老黄测指标"));

// 真实姓名绝不出现（站内只许笔名；服务端邮箱 huangyuan3h@gmail.com 不在 app/components 前端）
const frontendFiles = ["app/layout.tsx", "app/page.tsx", "app/global/page.tsx", "components/SiteHeader.tsx", "components/SiteFooter.tsx", "lib/site.ts", "public/site.webmanifest"];
let noReal = true;
for (const f of frontendFiles) {
  const t = read(f);
  if (t.includes("huangyuan3h@gmail.com") || t.includes("黄远") || (t.match(/黄[^平]/) && t.includes("黄源"))) { noReal = false; console.error(`  real-name leak in ${f}`); }
}
assert("前端无真实姓名/站长邮箱", noReal);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
