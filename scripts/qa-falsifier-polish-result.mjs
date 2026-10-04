// Result-state screenshots for falsifier polish (never open .jpg with read tool).
// Usage: QA_BASE=http://localhost:3101 node scripts/qa-falsifier-polish-result.mjs
// Requires `serve ./out` running on QA_BASE. Headless only.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../_review/falsifier_merge");
mkdirSync(OUT, { recursive: true });

const BASE = process.env.QA_BASE || "http://localhost:3101";
const targets = [
  { tag: "result-cn", url: `${BASE}/check/` },
  { tag: "result-global", url: `${BASE}/global/check/` },
];
const viewports = [
  { suffix: "desktop-1440x900", width: 1440, height: 900, mobile: false },
  { suffix: "mobile-390x844", width: 390, height: 844, mobile: true },
];

const browser = await chromium.launch({ headless: true });
let failures = 0;
try {
  for (const t of targets) {
    for (const vp of viewports) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.mobile ? 2 : 1,
        isMobile: vp.mobile,
      });
      const pg = await ctx.newPage();
      const errs = [];
      pg.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
      pg.on("pageerror", (e) => errs.push(String(e)));
      await pg.goto(t.url, { waitUntil: "networkidle", timeout: 30000 });
      await pg.waitForTimeout(600);
      // Click 一键打假 (only button with that text)
      await pg.getByRole("button", { name: "一键打假" }).click();
      await pg.waitForSelector('div[aria-live="polite"]', { timeout: 10000 });
      await pg.waitForTimeout(600);
      // Scroll result header into view so conclusion + numbers + random + links share the viewport
      await pg.evaluate((isMobile) => {
        const el = document.querySelector('div[aria-live="polite"]');
        if (el) el.scrollIntoView({ block: "start" });
        // Mobile result (~900-940px) is taller than 844px viewport: nudge down
        // so bottom article link fully enters viewport while conclusion stays visible.
        if (isMobile) window.scrollBy(0, 20);
      }, vp.mobile);
      await pg.waitForTimeout(500);
      const outPath = `${OUT}/${t.tag}_${vp.suffix}.jpg`;
      await pg.screenshot({ path: outPath, type: "jpeg", quality: 80, fullPage: false });
      const info = await pg.evaluate(() => {
        const de = document.documentElement;
        const overflow = de.scrollWidth > de.clientWidth + 1;
        const result = document.querySelector('div[aria-live="polite"]');
        const r = result ? result.getBoundingClientRect() : null;
        const vw = window.innerWidth, vh = window.innerHeight;
        const inView = (elm) => {
          if (!elm) return null;
          const b = elm.getBoundingClientRect();
          return b.top >= 0 && b.bottom <= vh + 200 && b.left >= 0 && b.right <= vw + 1;
        };
        // key elements inside result
        const links = result ? Array.from(result.querySelectorAll("a")).map((a) => a.textContent?.slice(0, 20)) : [];
        const html = document.documentElement.outerHTML;
        const hasDeepBlue = html.includes("#1E3A5F") || html.includes("bg-[#1E3A5F]");
        const hasAmber = html.includes("#B45309");
        const hasGainRed = html.includes("#B91C1C");
        const hasLossGreen = html.includes("#15803D");
        // computed check: find a gain/loss number element
        const colored = result ? Array.from(result.querySelectorAll('[class*="text-[#B91C1C]"],[class*="text-[#15803D]"]')).length : 0;
        return {
          sw: de.scrollWidth, cw: de.clientWidth, overflow,
          resultTop: r ? Math.round(r.top) : null,
          resultBottom: r ? Math.round(r.bottom) : null,
          vh, vw, links: links.slice(0, 6),
          hasDeepBlue, hasAmber, hasGainRed, hasLossGreen, coloredCount: colored,
          resultVisible: r ? (r.top < vh && r.bottom > 0) : false,
        };
      });
      const okOverflow = !info.overflow;
      const okErr = errs.length === 0;
      const okColors = info.hasDeepBlue && info.hasAmber && (info.hasGainRed || info.hasLossGreen);
      const okVisible = info.resultVisible;
      console.log(`${t.tag} ${vp.suffix}: overflow=${info.overflow ? "YES" : "no"} consoleErrors=${errs.length} visible=${okVisible} top=${info.resultTop} bottom=${info.resultBottom} vh=${info.vh} colors deepBlue=${info.hasDeepBlue} amber=${info.hasAmber} gainRed=${info.hasGainRed} lossGreen=${info.hasLossGreen} coloredN=${info.coloredCount} links=${JSON.stringify(info.links)}`);
      if (errs.length) console.log("  errors:", errs.slice(0, 3));
      if (!okOverflow || !okErr || !okColors || !okVisible) {
        console.error(`  CHECK FAIL ${t.tag} ${vp.suffix}`);
        failures++;
      }
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}
if (failures > 0) { console.error(`FAIL ${failures} checks`); process.exit(1); }
console.log(`OK result screenshots -> ${OUT}`);
