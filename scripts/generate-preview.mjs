import sharp from "sharp";
import path from "node:path";

const root = "/Users/huangyuan/Projects/zhibiao-lab";
const outPath = "/Users/huangyuan/Projects/video-factory/.opencode-runs/zhibiao_icon_preview.png";

const concepts = [
  { id: "A flatline-down (chosen)", file: path.join(root, "design/icon-concepts/icon-flatline.svg"), chosen: true },
  { id: "B crossed-indicator (alt)", file: path.join(root, "design/icon-concepts/icon-crossed.svg"), chosen: false },
  { id: "C flask-chart (alt)", file: path.join(root, "design/icon-concepts/icon-flask.svg"), chosen: false },
];

// true 1:1 sizes
const W = 2100;
const titleH = 190;
const rowH = 640;
const H = titleH + rowH * 3 + 30;
const pageBg = { r: 228, g: 228, b: 231, alpha: 1 };

const rendered = {};
for (const c of concepts) {
  rendered[c.id] = {};
  for (const s of [512, 64, 32, 16]) {
    const buf = await sharp(c.file, { density: 512 }).resize(s, s).png().toBuffer();
    rendered[c.id][s] = buf;
  }
}

const baseSvgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="100%" height="100%" fill="#E4E4E7"/>
  <rect x="0" y="0" width="${W}" height="${titleH}" fill="#FAFAF9"/>
  <rect x="0" y="0" width="8" height="${H}" fill="#1A73E8"/>
  <text x="36" y="72" font-family="sans-serif" font-size="44" font-weight="800" fill="#18181B">zhibiao-lab icon preview (3 concepts, 1:1)</text>
  <text x="36" y="122" font-family="sans-serif" font-size="24" fill="#71717A">left = light card / right = dark card; all icons true pixels 512 / 64 / 32 / 16; STAR = chosen</text>
  <text x="36" y="160" font-family="sans-serif" font-size="22" fill="#1A73E8">chosen A: blue bg + white line up-flat-down; readable at 16px; works on light and dark</text>
  ${concepts.map((c, i) => {
    const y = titleH + i * rowH;
    const border = c.chosen ? `<rect x="8" y="${y + 8}" width="${W - 16}" height="${rowH - 16}" rx="20" fill="none" stroke="#1A73E8" stroke-width="6"/>` : `<rect x="8" y="${y + 8}" width="${W - 16}" height="${rowH - 16}" rx="20" fill="#FFFFFF" stroke="#D4D4D8" stroke-width="2"/>`;
    return `
    <rect x="16" y="${y + 16}" width="${W - 32}" height="${rowH - 32}" rx="14" fill="#FFFFFF"/>
    <text x="36" y="${y + 60}" font-family="sans-serif" font-size="28" font-weight="800" fill="${c.chosen ? "#1A73E8" : "#18181B"}">${c.chosen ? "STAR " : ""}${c.id}</text>
    <text x="36" y="${y + 92}" font-family="sans-serif" font-size="18" fill="#71717A">light (white card)</text>
    <text x="1100" y="${y + 92}" font-family="sans-serif" font-size="18" fill="#71717A">dark (black card)</text>
    ${border}`;
  }).join("")}
</svg>`;

const ops = [{ input: Buffer.from(baseSvgStr), left: 0, top: 0 }];
for (let i = 0; i < concepts.length; i++) {
  const c = concepts[i];
  const y0 = titleH + i * rowH;
  const bottom = y0 + 110 + 512; // icons top-aligned at y0+110, 512 tall
  const top512 = y0 + 110;
  // dark block behind right side icons
  const darkBlockSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="530"><rect width="100%" height="100%" rx="12" fill="#09090B"/></svg>`);
  ops.push({ input: darkBlockSvg, left: 1090, top: y0 + 100 });
  // light icons: 512 at x=36, 64/32/16 to the right, bottom-aligned
  const lightX = [36, 580, 680, 750];
  const sizes = [512, 64, 32, 16];
  for (let k = 0; k < 4; k++) {
    const s = sizes[k];
    const top = bottom - s;
    ops.push({ input: rendered[c.id][s], left: lightX[k], top });
  }
  // dark icons
  const darkX = [1100, 1644, 1744, 1814];
  for (let k = 0; k < 4; k++) {
    const s = sizes[k];
    const top = bottom - s;
    ops.push({ input: rendered[c.id][s], left: darkX[k], top });
  }
  // size labels under icons (small svg text already in base? add per-row labels via extra svg)
  const labelSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="2100" height="30">
    <text x="36" y="20" font-family="sans-serif" font-size="18" fill="#71717A">512</text>
    <text x="580" y="20" font-family="sans-serif" font-size="18" fill="#71717A">64</text>
    <text x="680" y="20" font-family="sans-serif" font-size="18" fill="#71717A">32</text>
    <text x="750" y="20" font-family="sans-serif" font-size="18" fill="#71717A">16</text>
    <text x="1100" y="20" font-family="sans-serif" font-size="18" fill="#71717A">512</text>
    <text x="1644" y="20" font-family="sans-serif" font-size="18" fill="#71717A">64</text>
    <text x="1744" y="20" font-family="sans-serif" font-size="18" fill="#71717A">32</text>
    <text x="1814" y="20" font-family="sans-serif" font-size="18" fill="#71717A">16</text>
  </svg>`;
  ops.push({ input: Buffer.from(labelSvg), left: 0, top: bottom + 6 });
}

await sharp({ create: { width: W, height: H, channels: 4, background: pageBg } })
  .composite(ops)
  .png()
  .toFile(outPath);
console.log("wrote", outPath, `${W}x${H}`);
