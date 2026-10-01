// 用法（每出一集后更新数据，只需一条命令）：
//
//   1. 把新一集写成 JSON（参考 new-episode.example.json），然后运行：
//      npm run update-data -- path/to/ep26.json
//   2. 提交并重新部署：git add data && git commit -m "..." && npx wrangler pages deploy ./out --project-name zhibiao-lab
//
// 脚本只做 upsert + 校验，不碰任何只读源，不发明数字：缺失字段必须填 null。
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DATA_PATH = resolve(new URL(".", import.meta.url).pathname, "../data/indicators.json");

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

const arg = process.argv[2];
if (!arg) fail("缺少参数：新一集 JSON 文件路径（参考 scripts/new-episode.example.json）");

const incoming = JSON.parse(readFileSync(resolve(arg), "utf-8"));
const eps = Array.isArray(incoming) ? incoming : [incoming];

const db = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
const map = new Map(db.indicators.map((i) => [i.id, i]));

for (const e of eps) {
  for (const k of REQUIRED) {
    if (!(k in e)) fail(`${e.id ?? "?"} 缺少字段 ${k}（没有就填 null，不许省略）`);
  }
  if (!VERDICTS.has(e.verdict)) fail(`${e.id} verdict 非法：${e.verdict}`);
  if (map.has(e.id)) {
    console.log(`更新 ${e.id}`);
    map.set(e.id, e);
  } else {
    console.log(`新增 ${e.id}`);
    map.set(e.id, e);
  }
}

db.indicators = [...map.values()].sort((a, b) => {
  const ea = a.ep ?? 9999, eb = b.ep ?? 9999;
  if (ea !== eb) return ea - eb;
  return a.id.localeCompare(b.id);
});
db.generated = new Date().toISOString().slice(0, 10);
writeFileSync(DATA_PATH, JSON.stringify(db, null, 2) + "\n", "utf-8");
const counts = {};
for (const i of db.indicators) counts[i.verdict] = (counts[i.verdict] ?? 0) + 1;
console.log(`OK：共 ${db.indicators.length} 条，${JSON.stringify(counts)}`);
