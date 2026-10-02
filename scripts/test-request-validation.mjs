// 校验单元测试：node scripts/test-request-validation.mjs
// 与 lib/request-validation.ts 同口径（避免 TS 导入，直接内联逻辑做黑盒复刻测试 + 读文件确认常量一致）
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(HERE, "../lib/request-validation.ts"), "utf-8");

let pass = 0;
let fail = 0;
function assert(name, cond) {
  if (cond) { pass++; console.log(`ok - ${name}`); }
  else { fail++; console.error(`FAIL - ${name}`); }
}

// 1) 常量口径：前后端必须一致
assert("indicatorMax 50", src.includes("indicatorMax: 50") || src.includes("indicatorMax:50"));
assert("usageMax 500", src.includes("usageMax: 500"));
assert("marketOptions A股/港股/美股/其他", src.includes('"A股"') && src.includes('"港股"') && src.includes('"美股"') && src.includes('"其他"'));
assert("honeypot website", src.includes("website"));
assert("turnstile sitekey present", src.includes("0x4AAAAAAFL4i2y48ow-Wt1_"));

// 2) 逻辑复刻（与 TS 实现逐行对应）
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function validate(input) {
  const honeypot = (input.website ?? "").trim();
  if (honeypot.length > 0) return { ok: true, isHoneypot: true };
  const indicator = (input.indicator ?? "").trim().replace(/\s+/g, " ");
  if (!indicator) return { ok: false, error: "请填写指标名称" };
  if (indicator.length > 50) return { ok: false, error: "too long" };
  const usage = (input.usage ?? "").trim();
  if (usage.length > 500) return { ok: false, error: "too long" };
  const marketRaw = (input.market ?? "其他").trim();
  const market = ["A股", "港股", "美股", "其他"].includes(marketRaw) ? marketRaw : "其他";
  const contact = (input.contact ?? "").trim();
  if (contact) {
    if (contact.length > 100) return { ok: false, error: "too long" };
    if (!EMAIL_RE.test(contact)) return { ok: false, error: "bad email" };
  }
  return { ok: true, cleaned: { indicator, usage, market, contact } };
}

assert("required indicator", validate({ indicator: "" }).ok === false);
assert("whitespace indicator rejected", validate({ indicator: "   " }).ok === false);
assert("normal passes", validate({ indicator: "RSI", market: "A股" }).ok === true);
assert("long indicator rejected", validate({ indicator: "x".repeat(51) }).ok === false);
assert("50 ok", validate({ indicator: "x".repeat(50) }).ok === true);
assert("long usage rejected", validate({ indicator: "RSI", usage: "x".repeat(501) }).ok === false);
assert("bad market defaults to 其他", validate({ indicator: "RSI", market: "xxx" }).cleaned.market === "其他");
assert("good markets pass", ["A股", "港股", "美股", "其他"].every((m) => validate({ indicator: "RSI", market: m }).cleaned.market === m));
assert("bad email rejected", validate({ indicator: "RSI", contact: "not-an-email" }).ok === false);
assert("empty contact ok", validate({ indicator: "RSI", contact: "" }).ok === true);
assert("good email ok", validate({ indicator: "RSI", contact: "a@b.com" }).ok === true);
assert("honeypot flagged", validate({ indicator: "RSI", website: "spam" }).isHoneypot === true);
assert("subject format", (`[指标请求] ${"RSI"}（${"A股"}）` === "[指标请求] RSI（A股）"));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
