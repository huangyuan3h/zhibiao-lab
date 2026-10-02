// 用法：
//   1. 自动同步（推荐，每出一集后直接跑）：
//      npm run update-data
//      → 只读 ledger：bili_ready.json、.opencode-runs/ep/yt/*.json（仅 privacy=public）、
//        karios zhihu published.json + article.md、*/summary_zh.md
//      → 更新 data/indicators.json 的 youtube/bili/zhihu 字段 + 生成 data/articles.json
//   2. 手动 upsert 新一集：
//      npm run update-data -- path/to/ep26.json
//      （先 upsert，再自动同步一次）
//   3. 提交并重新部署：git add data && git commit -m "..." && npx wrangler pages deploy ./out --project-name zhibiao-lab
//
// 只读源绝不写入，不发明数字：缺失填 null；YouTube 仅保留 ledger 明确 public 的，
// ledger 明确 unlisted 的一律清空（避免试片/未公开）。
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(HERE, "../data/indicators.json");
const ARTICLES_PATH = resolve(HERE, "../data/articles.json");

// 只读 ledger 位置（不存在就跳过，绝不创建/写入）
const BILI_READY = "/Users/huangyuan/Projects/karios-series-output/bili_ready.json";
const YT_DIR = "/Users/huangyuan/Projects/video-factory/.opencode-runs/ep/yt";
const ZHIHU_BASE = "/Users/huangyuan/Projects/karios-series-output/zhihu";
const ZHIHU_PUBLISHED = join(ZHIHU_BASE, "published.json");
const KARIOS_BASE = "/Users/huangyuan/Projects/karios-series-output";

const REQUIRED = [
  "id", "name", "ep", "title", "verdict", "perTrade", "median", "winRate",
  "portfolio", "eventPct", "portfolioPct", "trades", "example",
  "youtube", "zhihu", "bili", "note",
];
const VERDICTS = new Set(["不赚钱", "有苗头", "只研究"]);

function fail(msg) {
  console.error(`update-data: ${msg}`);
  process.exit(1);
}

function loadJson(p, fallback = null) {
  try {
    if (!existsSync(p)) return fallback;
    return JSON.parse(readFileSync(p, "utf-8"));
  } catch (e) {
    console.error(`update-data: 读取失败 ${p}: ${e.message}`);
    return fallback;
  }
}

// ep number -> indicator id（从现有 data 反推，如 1 -> macd_golden_cross）
function epToIdMap(indicators) {
  const m = new Map();
  for (const i of indicators) if (i.ep !== null) m.set(i.ep, i.id);
  return m;
}

function syncFromLedgers(db) {
  const byId = new Map(db.indicators.map((i) => [i.id, i]));
  const epMap = epToIdMap(db.indicators);

  // 1) YouTube：仅 public（ep/yt/*.json privacy=public），unlisted 明确清空
  const ytPublic = new Map(); // epNum -> videoId
  const ytUnlisted = new Set(); // epNum
  if (existsSync(YT_DIR)) {
    for (const f of readdirSync(YT_DIR)) {
      if (!f.endsWith(".json")) continue;
      const m = f.match(/^ep(\d+)\.json$/);
      if (!m) continue;
      const ep = Number(m[1]);
      const j = loadJson(join(YT_DIR, f), null);
      if (!j) continue;
      if (j.privacy === "public" && j.videoId) ytPublic.set(ep, j.videoId);
      else if (j.privacy === "unlisted" || j.privacy === "private") ytUnlisted.add(ep);
    }
  }
  let ytFixed = 0;
  for (const [ep, vid] of ytPublic) {
    const id = epMap.get(ep);
    if (!id || !byId.has(id)) continue;
    const cur = byId.get(id);
    if (cur.youtube !== vid) {
      console.log(`同步 YouTube ep${ep} ${id}: ${cur.youtube} -> ${vid}`);
      cur.youtube = vid;
      ytFixed++;
    }
  }
  for (const ep of ytUnlisted) {
    const id = epMap.get(ep);
    if (!id || !byId.has(id)) continue;
    const cur = byId.get(id);
    if (cur.youtube !== null) {
      console.log(`清空未公开 YouTube ep${ep} ${id}（ledger=${"unlisted"}）：${cur.youtube} -> null`);
      cur.youtube = null;
      ytFixed++;
    }
  }

  // 2) Bilibili：bili_ready.json（有 bvid 才填）
  const bili = loadJson(BILI_READY, null);
  let biliFixed = 0;
  if (bili) {
    for (const [epKey, v] of Object.entries(bili)) {
      const m = String(epKey).match(/^ep(\d+)$/);
      if (!m || !v?.bvid) continue;
      const ep = Number(m[1]);
      const id = epMap.get(ep);
      if (!id || !byId.has(id)) continue;
      const url = `https://www.bilibili.com/video/${v.bvid}`;
      const cur = byId.get(id);
      if (cur.bili !== url) {
        console.log(`同步 B站 ep${ep} ${id}: ${cur.bili} -> ${url}`);
        cur.bili = url;
        biliFixed++;
      }
    }
  }

  // 3) 知乎 published URL
  const pub = loadJson(ZHIHU_PUBLISHED, null);
  let zhihuFixed = 0;
  if (pub?.episodes) {
    for (const [epKey, v] of Object.entries(pub.episodes)) {
      const m = String(epKey).match(/^ep(\d+)$/);
      if (!m || !v?.url) continue;
      const ep = Number(m[1]);
      const id = epMap.get(ep);
      if (!id || !byId.has(id)) continue;
      const cur = byId.get(id);
      if (cur.zhihu !== v.url) {
        console.log(`同步知乎 ep${ep} ${id}: ${cur.zhihu} -> ${v.url}`);
        cur.zhihu = v.url;
        zhihuFixed++;
      }
    }
  }

  // 4) 文章：zhihu article.md 优先，否则 summary_zh.md，否则最小占位
  const articles = {};
  for (const ind of db.indicators) {
    const iid = ind.id;
    let md = null;
    let source = "none";
    // zhihu：找以 iid 结尾的目录
    if (existsSync(ZHIHU_BASE)) {
      for (const d of readdirSync(ZHIHU_BASE)) {
        const art = join(ZHIHU_BASE, d, "article.md");
        if (d.endsWith(iid) && existsSync(art)) {
          const raw = readFileSync(art, "utf-8");
          md = raw.split("\n").filter((l) => !l.trim().startsWith("![")).join("\n");
          source = "zhihu";
          break;
        }
      }
    }
    if (!md) {
      const summ = join(KARIOS_BASE, iid, "summary_zh.md");
      if (existsSync(summ)) {
        const s = readFileSync(summ, "utf-8");
        const head = ind.ep !== null ? `# ${ind.name}为什么不赚钱？\n\n> 第${ind.ep}集` : `# ${ind.name}\n`;
        const mid = `\n\n${ind.title ? ind.title + "｜什么指标不赚钱\n\n" : ""}## 一句话结论\n\n${ind.note || "历史回测显示不赚钱，详见下方数字。"}\n\n## 关键数字\n\n- 每笔收益（扣费后）：${ind.perTrade}%\n- 中位数：${ind.median}%\n- 胜率：${ind.winRate}%\n- 组合年化：${ind.portfolio}%\n- 成交笔数：${ind.trades}\n\n## 回测口径\n\n${db.method || ""}\n\n## 详细数据\n\n`;
        md = head + mid + s + "\n\n---\n\n本文为投资者教育，不构成投资建议。过往业绩不代表未来表现，投资有风险，入市需谨慎。\n";
        source = "summary";
      }
    }
    if (!md) {
      md = `# ${ind.name}\n\n${ind.note || ""}\n\n历史回测，不构成投资建议。\n`;
      source = "none";
    }
    articles[iid] = { source, markdown: md };
  }
  writeFileSync(ARTICLES_PATH, JSON.stringify(articles, null, 2) + "\n", "utf-8");
  const zhihuCount = Object.values(articles).filter((a) => a.source === "zhihu").length;
  console.log(`文章：共 ${Object.keys(articles).length} 篇，其中知乎长文 ${zhihuCount} 篇`);
  console.log(`同步完成：YouTube ${ytFixed} 处，B站 ${biliFixed} 处，知乎 ${zhihuFixed} 处`);
}

// ---- 主流程 ----
const arg = process.argv[2];
const db = loadJson(DATA_PATH, null);
if (!db) fail(`读不到 ${DATA_PATH}`);

if (arg) {
  const incoming = JSON.parse(readFileSync(resolve(arg), "utf-8"));
  const eps = Array.isArray(incoming) ? incoming : [incoming];
  const map = new Map(db.indicators.map((i) => [i.id, i]));
  for (const e of eps) {
    for (const k of REQUIRED) {
      if (!(k in e)) fail(`${e.id ?? "?"} 缺少字段 ${k}（没有就填 null，不许省略）`);
    }
    if (!VERDICTS.has(e.verdict)) fail(`${e.id} verdict 非法：${e.verdict}`);
    console.log(`${map.has(e.id) ? "更新" : "新增"} ${e.id}`);
    map.set(e.id, e);
  }
  db.indicators = [...map.values()].sort((a, b) => {
    const ea = a.ep ?? 9999, eb = b.ep ?? 9999;
    if (ea !== eb) return ea - eb;
    return a.id.localeCompare(b.id);
  });
}

syncFromLedgers(db);
db.generated = new Date().toISOString().slice(0, 10);
writeFileSync(DATA_PATH, JSON.stringify(db, null, 2) + "\n", "utf-8");
const counts = {};
for (const i of db.indicators) counts[i.verdict] = (counts[i.verdict] ?? 0) + 1;
const aired = db.indicators.filter((i) => i.ep !== null).length;
const withYt = db.indicators.filter((i) => i.ep !== null && !!i.youtube).length;
const withBili = db.indicators.filter((i) => i.ep !== null && !!i.bili).length;
console.log(`OK：共 ${db.indicators.length} 条（已播 ${aired}，YouTube ${withYt}，B站 ${withBili}），${JSON.stringify(counts)}`);

// 图表 JSON：新一集只需跑 npm run update-data，public/charts/*.json 自动重建，文章页 <ArticleCharts id> 直接复用
try {
  execSync("node scripts/build-charts.mjs", { cwd: resolve(HERE, ".."), stdio: "inherit" });
} catch (e) {
  console.error(`update-data: build-charts 失败（不致命，先用旧图表）：${e.message}`);
}
