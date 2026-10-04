// Screenshots for falsifier merge review (never open .jpg with read tool).
// Usage: node scripts/qa-falsifier-merge.mjs (requires `npx serve ./out -l 3100` running)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../_review/falsifier_merge");
mkdirSync(OUT, { recursive: true });

const BASE = process.env.QA_BASE || "http://localhost:3100";
const pages = [
  ["home-cn", `${BASE}/`],
  ["home-global", `${BASE}/global/`],
  ["check-cn", `${BASE}/check/`],
  ["check-global", `${BASE}/global/check/`],
];

const browser = await chromium.launch({ headless: true });
try {
  for (const [name, url] of pages) {
    // desktop 1440x900
    const dctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const dp = await dctx.newPage();
    const derrs = [];
    dp.on("console", (m) => { if (m.type() === "error") derrs.push(m.text()); });
    dp.on("pageerror", (e) => derrs.push(String(e)));
    await dp.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await dp.waitForTimeout(800);
    const dpath = `${OUT}/${name}_desktop-1440x900.jpg`;
    await dp.screenshot({ path: dpath, type: "jpeg", quality: 80, fullPage: false });
    const dw = await dp.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    console.log(`${name} desktop: ${dpath} overflow=${dw.sw > dw.cw ? "YES" : "no"} consoleErrors=${derrs.length}`);
    if (derrs.length) console.log("  errors:", derrs.slice(0, 3));
    await dctx.close();

    // mobile 390x844
    const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
    const mp = await mctx.newPage();
    const merrs = [];
    mp.on("console", (m) => { if (m.type() === "error") merrs.push(m.text()); });
    mp.on("pageerror", (e) => merrs.push(String(e)));
    await mp.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await mp.waitForTimeout(800);
    const mpath = `${OUT}/${name}_mobile-390x844.jpg`;
    await mp.screenshot({ path: mpath, type: "jpeg", quality: 80, fullPage: false });
    const mw = await mp.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    console.log(`${name} mobile: ${mpath} overflow=${mw.sw > mw.cw ? "YES" : "no"} consoleErrors=${merrs.length}`);
    if (merrs.length) console.log("  errors:", merrs.slice(0, 3));
    await mctx.close();
  }
} finally {
  await browser.close();
}
console.log(`OK screenshots -> ${OUT}`);
