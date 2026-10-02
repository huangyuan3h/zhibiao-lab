// 为 zhibiao-lab 生成每集轻量图表 JSON（public/charts/<id>.json）。
// 只读 ledger：~/Projects/karios-series-output/<id>/<variant>/summary.json + nav_daily.csv + trades.csv
// 输出小文件：equity 降采样 ~180 点、收益分布直方图 30 bins、era/cost/variants/mc/random_stocks 摘要。
// holiday_effect 特殊处理：guoqing yearly CSV。
// 用法：node scripts/build-charts.mjs [--id xxx]
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT_DIR = join(ROOT, "public", "charts");
const K_BASE = "/Users/huangyuan/Projects/karios-series-output";
const IND_PATH = join(ROOT, "data", "indicators.json");

function loadJson(p) {
  return JSON.parse(readFileSync(p, "utf-8"));
}

function readLines(p, maxLines = Infinity) {
  const raw = readFileSync(p, "utf-8");
  const lines = raw.split("\n");
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  return maxLines === Infinity ? lines : lines.slice(0, maxLines);
}

// 主变体：trades 数能对上 indicators.json 的优先，否则 hold5/default 兜底
function pickVariant(iid, trades) {
  const d = join(K_BASE, iid);
  if (!existsSync(d)) return null;
  const subs = readdirSync(d).filter((s) => existsSync(join(d, s, "summary.json")));
  if (!subs.length) return null;
  if (trades != null) {
    for (const s of subs) {
      try {
        const j = loadJson(join(d, s, "summary.json"));
        if (j?.event?.["metrics_0.0030"]?.n === trades) return s;
      } catch {}
    }
  }
  const pref = ["hold5", "default", "j_below_0", "lower_uptrend", "main_10cm", "hold1"];
  for (const p of pref) if (subs.includes(p)) return p;
  // n 最大的
  let best = subs[0], bestN = -1;
  for (const s of subs) {
    try {
      const j = loadJson(join(d, s, "summary.json"));
      const n = j?.event?.["metrics_0.0030"]?.n ?? -1;
      if (n > bestN) { bestN = n; best = s; }
    } catch {}
  }
  return best;
}

function downsampleNav(p, maxPts = 180) {
  if (!existsSync(p)) return [];
  const lines = readLines(p);
  if (lines.length < 2) return [];
  const header = lines[0].split(",");
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const rows = lines.slice(1).map((l) => {
    const c = l.split(",");
    return {
      d: c[idx.date]?.slice(0, 10),
      nav: Number(c[idx.nav]),
      b300: Number(c[idx.csi300_norm]),
      b500: Number(c[idx.csi500_norm]),
    };
  }).filter((r) => r.d && Number.isFinite(r.nav));
  if (rows.length <= maxPts) return rows;
  const step = (rows.length - 1) / (maxPts - 1);
  const out = [];
  for (let i = 0; i < maxPts; i++) {
    const r = rows[Math.round(i * step)];
    out.push(r);
  }
  // 去重保首尾
  const seen = new Set(); const ded = [];
  for (const r of out) { if (!seen.has(r.d)) { seen.add(r.d); ded.push(r); } }
  return ded;
}

// trades.csv 直方图：net_ret_0030，固定区间 [-20%,+20%] 30 bins + 溢出
function histTrades(p, bins = 30, lo = -0.2, hi = 0.2) {
  if (!existsSync(p)) return null;
  const lines = readLines(p);
  if (lines.length < 2) return null;
  const header = lines[0].split(",");
  const ci = header.indexOf("net_ret_0030");
  if (ci < 0) return null;
  const counts = new Array(bins).fill(0);
  let under = 0, over = 0, n = 0, sum = 0;
  const vals = []; // 存采样最多 4000 个用于中位数近似？不存，用 summary 的中位数
  for (let i = 1; i < lines.length; i++) {
    const l = lines[i];
    if (!l) continue;
    const c = l.split(",");
    const v = Number(c[ci]);
    if (!Number.isFinite(v)) continue;
    n++; sum += v;
    if (v < lo) under++;
    else if (v >= hi) over++;
    else {
      let b = Math.floor(((v - lo) / (hi - lo)) * bins);
      if (b < 0) b = 0; if (b >= bins) b = bins - 1;
      counts[b]++;
    }
  }
  const width = (hi - lo) / bins;
  const out = counts.map((ct, i) => ({
    x0: +(lo + i * width).toFixed(4),
    x1: +(lo + (i + 1) * width).toFixed(4),
    mid: +((lo + (i + 0.5) * width) * 100).toFixed(2),
    count: ct,
  }));
  return { bins: out, under, over, n, mean: n ? sum / n : null };
}

function variantsSummary(iid) {
  const d = join(K_BASE, iid);
  const out = [];
  if (!existsSync(d)) return out;
  for (const s of readdirSync(d)) {
    const p = join(d, s, "summary.json");
    if (!existsSync(p)) continue;
    try {
      const j = loadJson(p);
      const m = j?.event?.["metrics_0.0030"];
      const port = j?.portfolio?.metrics_by_cost?.["0.0030"];
      if (!m) continue;
      out.push({
        variant: s,
        n: m.n ?? null,
        mean_net: m.mean_net ?? null,
        median_net: m.median_net ?? null,
        win_rate: m.win_rate ?? null,
        annualized: port?.annualized ?? null,
      });
    } catch {}
  }
  // hold 排序优先
  const order = (v) => {
    const m = v.match(/hold(\d+)/); if (m) return 100 + Number(m[1]);
    if (v === "default" || v === "j_below_0" || v === "lower_uptrend" || v === "main_10cm" || v === "hold1") return 0;
    return 1000;
  };
  return out.sort((a, b) => order(a.variant) - order(b.variant)).slice(0, 8);
}

function buildOne(ind) {
  const iid = ind.id;
  if (iid === "holiday_effect") return buildHoliday(ind);
  const variant = pickVariant(iid, ind.trades);
  if (!variant) return { id: iid, variant: null, nodata: true, updated: new Date().toISOString().slice(0, 10) };
  const dir = join(K_BASE, iid, variant);
  const sj = loadJson(join(dir, "summary.json"));
  const ev = sj.event?.["metrics_0.0030"] ?? null;
  const byEra = sj.event?.by_era ?? {};
  const costSens = sj.event?.cost_sensitivity ?? {};
  const port = sj.portfolio ?? {};
  const mc = sj.mc ?? null;
  const rs = sj.random_stocks?.seeds ?? null;
  const equity = downsampleNav(join(dir, "nav_daily.csv"));
  const dist = histTrades(join(dir, "trades.csv"));
  const variants = variantsSummary(iid);
  // random_stocks 精简：只留 code/name/beat + strat/bh（4位小数）
  const seeds = {};
  if (rs) {
    for (const [seed, s] of Object.entries(rs)) {
      seeds[String(seed)] = {
        k_beat: s.k_beat ?? null,
        n: s.n ?? 12,
        rows: (s.rows ?? []).map((r) => ({
          code: r.ts_code, name: r.name, beat: !!r.beat_bh,
          strat: r.strategy_total_ret == null ? null : +Number(r.strategy_total_ret).toFixed(4),
          bh: r.bh_total_ret == null ? null : +Number(r.bh_total_ret).toFixed(4),
        })),
      };
    }
  }
  return {
    id: iid, variant,
    updated: new Date().toISOString().slice(0, 10),
    event: ev ? {
      n: ev.n, mean_net: ev.mean_net, median_net: ev.median_net,
      win_rate: ev.win_rate, payoff: ev.payoff_ratio, mean_gross: ev.mean_gross,
      cost_drag: ev.cost_drag,
    } : null,
    era: Object.fromEntries(Object.entries(byEra).map(([k, v]) => [k, {
      n: v.n ?? null, mean_net: v.mean_net ?? null, win_rate: v.win_rate ?? null,
    }])),
    portfolioEra: port.by_era ?? null,
    benchmarks: port.benchmarks ? Object.fromEntries(Object.entries(port.benchmarks).map(([k, v]) => [k, v.annualized ?? null])) : null,
    portfolio: port.metrics_by_cost?.["0.0030"] ? {
      annualized: port.metrics_by_cost["0.0030"].annualized,
      max_dd: port.metrics_by_cost["0.0030"].max_dd,
    } : null,
    cost: Object.fromEntries(Object.entries(costSens).map(([k, v]) => [k, {
      mean_net: v.mean_net ?? null, annualized: null,
    }])),
    costPortfolio: port.metrics_by_cost ? Object.fromEntries(Object.entries(port.metrics_by_cost).map(([k, v]) => [k, v.annualized ?? null])) : null,
    mc: mc ? {
      seed: mc.seed ?? null, n: mc.n ?? null,
      event: mc.event ?? null, portfolio: mc.portfolio ?? null,
    } : null,
    seeds,
    equity,
    dist,
    variants,
  };
}

function buildHoliday(ind) {
  // 国庆 yearly：guoqing_yearly_000001_SH.csv（date, ...）取每年节前/节后收益
  const f = join(K_BASE, "holiday_effect", "guoqing_yearly_000001_SH.csv");
  let yearly = [];
  try {
    const lines = readLines(f);
    const h = lines[0].split(",");
    const rows = lines.slice(1);
    // 列名探测
    const pick = (...names) => { for (const n of names) { const i = h.indexOf(n); if (i >= 0) return i; } return -1; };
    const yi = pick("year", "d0", "date");
    yearly = rows.slice(0, 30).map((l) => {
      const c = l.split(",");
      return { raw: c.slice(0, Math.min(8, c.length)).join("|") };
    });
  } catch {}
  // 直接用 summary.json 的 guoqing 段（只留上证 yearly 精简字段，控制体积）
  let gq = null;
  try {
    const sj = loadJson(join(K_BASE, "holiday_effect", "summary.json"));
    const y = sj.guoqing?.["000001.SH"]?.yearly ?? [];
    const yearly = y.map((r) => ({
      year: r.year,
      pre1: r.pre1 == null ? null : +Number(r.pre1).toFixed(4),
      post1: r.post1 == null ? null : +Number(r.post1).toFixed(4),
      post10: r.post10 == null ? null : +Number(r.post10).toFixed(4),
    }));
    gq = { yearly, n: yearly.length };
  } catch {}
  return {
    id: "holiday_effect", variant: "guoqing",
    updated: new Date().toISOString().slice(0, 10),
    holiday: true,
    guoqing: gq,
    note: "国庆 21 次：持股过节平均 +1.9%（去 2024 后约 +1.1%），节前专门买去 2024 后 +0.8%，详见文章。",
  };
}

const only = process.argv.includes("--id") ? process.argv[process.argv.indexOf("--id") + 1] : null;
const db = loadJson(IND_PATH);
const aired = db.indicators.filter((i) => i.ep !== null);
mkdirSync(OUT_DIR, { recursive: true });
let done = 0, bytes = 0;
for (const ind of aired) {
  if (only && ind.id !== only) continue;
  const j = buildOne(ind);
  const p = join(OUT_DIR, `${ind.id}.json`);
  writeFileSync(p, JSON.stringify(j) + "\n");
  const sz = Buffer.byteLength(JSON.stringify(j));
  bytes += sz;
  done++;
  console.log(`${ind.id}: variant=${j.variant} equity=${j.equity?.length ?? "-"} distN=${j.dist?.n ?? "-"} variants=${j.variants?.length ?? "-"} ${(sz / 1024).toFixed(1)}KB`);
}
console.log(`OK charts: ${done} files, ${(bytes / 1024).toFixed(0)}KB total -> ${OUT_DIR}`);
