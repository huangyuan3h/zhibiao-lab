// WCAG AA contrast check (Lighthouse equivalent for color-contrast).
// Usage: node scripts/check-contrast.mjs
function lum(hex) {
  const c = hex.replace("#", "");
  const rgb = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255).map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
function ratio(a, b) {
  const l1 = lum(a), l2 = lum(b);
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}
const pairs = [
  ["white on primary #1E3A5F (buttons/headers)", "#FFFFFF", "#1E3A5F", 4.5],
  ["primary #1E3A5F on warm #FAF7F2 (brand links)", "#1E3A5F", "#FAF7F2", 4.5],
  ["body #171717 on warm #FAF7F2", "#171717", "#FAF7F2", 4.5],
  ["amber #B45309 on warm #FAF7F2 (key numbers, need 4.5:1)", "#B45309", "#FAF7F2", 4.5],
  ["amber-dark #92400E on white (verdict header badge text is white on amber-dark)", "#FFFFFF", "#92400E", 4.5],
  ["gain red #B91C1C on warm #FAF7F2", "#B91C1C", "#FAF7F2", 4.5],
  ["loss green #15803D on warm #FAF7F2", "#15803D", "#FAF7F2", 4.5],
];
let fail = 0;
for (const [name, fg, bg, need] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= need;
  console.log(`${ok ? "ok" : "FAIL"} - ${name}: ${r.toFixed(2)}:1 (need ${need}:1)`);
  if (!ok) fail++;
}
if (fail > 0) process.exit(1);
console.log(`\nAll ${pairs.length} contrast pairs pass WCAG AA`);
