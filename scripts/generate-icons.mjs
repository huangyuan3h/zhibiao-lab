import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";
import pngToIco from "png-to-ico";

const root = new URL("../", import.meta.url).pathname.replace(/\/$/, "");
const pub = path.join(root, "public");
const iconsDir = path.join(pub, "icons");
await fs.mkdir(iconsDir, { recursive: true });

const chosenSvg = path.join(pub, "icon.svg");

// helper: render svg file to png size
async function render(svgPath, size, outPath, background = null) {
  let pipeline = sharp(svgPath, { density: 512 }).resize(size, size, { fit: "contain", background: background ?? { r: 0, g: 0, b: 0, alpha: 0 } });
  // ensure solid background for app icons (no transparency) except favicon keeps bg from svg itself
  await pipeline.png().toFile(outPath);
  console.log(`wrote ${outPath} (${size}x${size})`);
}

console.log("chosen:", chosenSvg);
// favicon pngs (svg already has solid blue bg, so transparent padding not needed)
await render(chosenSvg, 16, path.join(pub, "favicon-16.png"));
await render(chosenSvg, 32, path.join(pub, "favicon-32.png"));
await render(chosenSvg, 48, path.join(pub, "favicon-48.png"));
// apple touch 180 (solid bg already)
await render(chosenSvg, 180, path.join(pub, "apple-touch-icon.png"));
// PWA icons
await render(chosenSvg, 192, path.join(iconsDir, "icon-192.png"));
await render(chosenSvg, 512, path.join(iconsDir, "icon-512.png"));

// maskable: add 10% safe padding with solid blue bg (#1A73E8) so no clipping
async function renderMaskable(size, outPath) {
  const svgRaw = await fs.readFile(chosenSvg, "utf8");
  // svg already solid; for maskable add padding by compositing resized icon onto blue canvas
  const inner = Math.round(size * 0.8);
  const iconBuf = await sharp(chosenSvg, { density: 512 }).resize(inner, inner).png().toBuffer();
  const canvas = sharp({ create: { width: size, height: size, channels: 4, background: { r: 26, g: 115, b: 232, alpha: 1 } } });
  await canvas.composite([{ input: iconBuf, left: Math.round((size - inner) / 2), top: Math.round((size - inner) / 2) }]).png().toFile(outPath);
  console.log(`wrote ${outPath} (${size}x${size} maskable)`);
}
await renderMaskable(192, path.join(iconsDir, "maskable-192.png"));
await renderMaskable(512, path.join(iconsDir, "maskable-512.png"));

// favicon.ico from 16/32/48
const icoBuf = await pngToIco([
  path.join(pub, "favicon-16.png"),
  path.join(pub, "favicon-32.png"),
  path.join(pub, "favicon-48.png"),
]);
await fs.writeFile(path.join(pub, "favicon.ico"), icoBuf);
console.log("wrote public/favicon.ico");

// site.webmanifest
const manifest = {
  name: "什么指标不赚钱 · 指标实验室",
  short_name: "指标实验室",
  description: "用 A 股历史数据回测散户常用指标：大多数不赚钱。",
  id: "/",
  start_url: "/",
  scope: "/",
  display: "standalone",
  lang: "zh-CN",
  dir: "ltr",
  background_color: "#ffffff",
  theme_color: "#1a73e8",
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
    { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png", purpose: "any" }
  ]
};
await fs.writeFile(path.join(pub, "site.webmanifest"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log("wrote public/site.webmanifest");

// OG image 1200x630: light neutral bg + blue icon + site name + subtitle
const W = 1200, H = 630;
const iconForOg = await sharp(chosenSvg, { density: 512 }).resize(240, 240).png().toBuffer();
const ogSvgText = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="100%" height="100%" fill="#FAFAF9"/>
  <rect x="0" y="0" width="8" height="630" fill="#1A73E8"/>
  <text x="380" y="270" font-family="-apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', sans-serif" font-size="64" font-weight="800" fill="#18181B">什么指标不赚钱</text>
  <text x="382" y="340" font-family="-apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', sans-serif" font-size="40" font-weight="600" fill="#1A73E8">指标实验室 · A股回测</text>
  <text x="382" y="400" font-family="-apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', sans-serif" font-size="26" fill="#71717A">大多数不赚钱 · 每一集都有真实回测数字</text>
</svg>`;
const ogTextBuf = Buffer.from(ogSvgText, "utf8");
await sharp({ create: { width: W, height: H, channels: 4, background: { r: 250, g: 250, b: 249, alpha: 1 } } })
  .composite([
    { input: iconForOg, left: 90, top: Math.round((H - 240) / 2) },
    { input: ogTextBuf, left: 0, top: 0 }
  ])
  .png()
  .toFile(path.join(pub, "og.png"));
console.log("wrote public/og.png 1200x630");
