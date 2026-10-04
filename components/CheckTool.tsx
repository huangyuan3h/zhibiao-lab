"use client";

import * as React from "react";
import Link from "next/link";
import { fmtNum, fmtPct, verdictTone, gainLossClass, CHECK_SUMMARY, type CheckRule } from "@/lib/check";
import { PLAYLIST_URL } from "@/lib/data";
import type { Edition } from "@/lib/site";

// 方法口径：写死大白话，保证静态 HTML 首屏就有（不依赖 fetch）
const METHOD_TEXT =
  "算法很直白：2010年到2026年8月，全市场5000多只股票（含已退市）。看到信号后，第二天开盘买，拿满几天后开盘卖，每笔扣掉0.30%费用，一字涨跌停买不进卖不出就顺延。每个规则都和“同一天随便乱买、拿同样天数”对比1000次，看是真本事还是运气。表格中“—”表示原来就没有这个数字，绝不编造。";

// 本规则 vs 随机：用真实数字画的位置图（p5 / 随机平均 / 中位 / p95 / 本规则）
function VsRandomStrip(props: {
  meanNet: number | null;
  randomMean: number | null;
  randomMedian: number | null;
  randomP5: number | null;
  randomP95: number | null;
  toneColor: string;
}) {
  const { meanNet, randomMean, randomMedian, randomP5, randomP95, toneColor } = props;
  const vals = [meanNet, randomMean, randomMedian, randomP5, randomP95].filter(
    (x): x is number => typeof x === "number" && Number.isFinite(x)
  );
  if (vals.length < 2 || meanNet === null || meanNet === undefined) return null;
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  if (hi - lo < 1e-9) {
    lo -= 0.001;
    hi += 0.001;
  }
  const pad = (hi - lo) * 0.12;
  lo -= pad;
  hi += pad;
  const pos = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const dot = (v: number | null, label: string, cls: string, title: string) => {
    if (v === null || v === undefined || !Number.isFinite(v)) return null;
    return (
      <div key={label} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${pos(v)}%` }} title={title}>
        <div className={cls} />
      </div>
    );
  };
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">本规则 vs 随便乱买</span>
        <span className="tabular-nums">
          随机 p5 {fmtPct(randomP5)} · 随机平均 {fmtPct(randomMean)} · p95 {fmtPct(randomP95)}
        </span>
      </div>
      <div className="relative mt-2 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-900">
        <div className="absolute left-2 right-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        {dot(randomP5, "p5", "h-2.5 w-2.5 rounded-full bg-neutral-400", `随机p5 ${fmtPct(randomP5)}`)}
        {dot(randomP95, "p95", "h-2.5 w-2.5 rounded-full bg-neutral-400", `随机p95 ${fmtPct(randomP95)}`)}
        {dot(randomMedian, "med", "h-3 w-3 rounded-full bg-neutral-500", `随机中位 ${fmtPct(randomMedian)}`)}
        {dot(randomMean, "mean", "h-3 w-3 rounded-full bg-neutral-600 ring-2 ring-white", `随机平均 ${fmtPct(randomMean)}`)}
        {dot(meanNet, "rule", `h-4 w-4 rounded-full ${toneColor} ring-2 ring-white shadow`, `本规则 ${fmtPct(meanNet)}`)}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600 dark:text-neutral-400">
        <span className="inline-flex items-center gap-1.5">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${toneColor}`} />
          本规则每笔 {fmtPct(meanNet)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-neutral-500" />
          随机平均 {fmtPct(randomMean)}
        </span>
        <span className="text-neutral-400 dark:text-neutral-500">点越靠右越赚，灰点是1000次乱买的分布</span>
      </div>
    </div>
  );
}

export default function CheckTool({ edition }: { edition: Edition }) {
  const summary = CHECK_SUMMARY;
  const [ruleId, setRuleId] = React.useState(summary.rules[0]?.id ?? "ma5_20_golden_cross");
  const [variantId, setVariantId] = React.useState(summary.rules[0]?.variants[0]?.variant_id ?? "hold5");
  const [result, setResult] = React.useState<{ rule: CheckRule; v: NonNullable<CheckRule["variants"][number]> } | null>(null);

  const rule: CheckRule | undefined = summary?.rules.find((r) => r.id === ruleId);

  React.useEffect(() => {
    if (rule && !rule.variants.some((v) => v.variant_id === variantId)) {
      setVariantId(rule.variants[0].variant_id);
    }
  }, [rule, variantId]);

  function run() {
    if (!summary || !rule) return;
    const v = rule.variants.find((x) => x.variant_id === variantId) || rule.variants[0];
    setResult({ rule, v });
  }

  const tone = result ? verdictTone(result.v.mean_net, result.v.quantile) : null;
  const isGlobal = edition === "global";
  const requestHref = isGlobal ? "/global/request/" : "/request/";

  // Edition-aware episode links: CN uses Bilibili + /i/, global uses YouTube + /global/i/.
  function episodeLinks(r: CheckRule) {
    const videoUrl = isGlobal ? r.youtube_url : r.bili_url;
    const videoLabel = isGlobal
      ? (r.ep ? `▶ 看第${r.ep}集视频（YouTube）` : null)
      : (r.ep && r.bili_url ? `▶ 看第${r.ep}集视频（B站）` : null);
    const articleUrl = isGlobal ? r.article_global : r.article_cn;
    return { videoUrl, videoLabel, articleUrl };
  }

  return (
    <div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="min-w-0">
            <label htmlFor="rule" className="mb-1 block text-sm font-medium">
              指标规则（{summary.meta.n_rules} 个历史回测）
            </label>
            <select
              id="rule"
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[15px] dark:border-neutral-700 dark:bg-neutral-950"
              value={ruleId}
              onChange={(e) => setRuleId(e.target.value)}
            >
              {summary?.rules.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}（{r.variants.length}种拿法{r.ep ? ` · 第${r.ep}集` : ""}）
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="variant" className="mb-1 block text-sm font-medium">
              拿法 / 参数
            </label>
            <select
              id="variant"
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[15px] dark:border-neutral-700 dark:bg-neutral-950"
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
            >
              {rule?.variants.map((v) => (
                <option key={v.variant_id} value={v.variant_id}>
                  {v.label}（{fmtNum(v.n_trades)}笔）
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={run}
              className="w-full rounded-xl bg-[#1E3A5F] px-4 py-2.5 text-[15px] font-bold text-white hover:bg-[#2F5D8A] active:bg-[#152A45]"
            >
              一键打假
            </button>
          </div>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[13px] text-neutral-500 dark:text-neutral-400">
          <span className="rounded-full bg-[#E8EEF4] px-2.5 py-0.5 font-medium text-[#1E3A5F] dark:bg-neutral-800 dark:text-neutral-200">
            永久免费 · 不限次数
          </span>
          <span>口径：第二天开盘买 · 每笔扣0.30% · 一字板顺延</span>
        </div>
        {rule && (
          <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            规则：{rule.variants.find((v) => v.variant_id === variantId)?.rule_zh || rule.variants[0].rule_zh}
          </p>
        )}
      </div>

      {result && tone && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950" aria-live="polite">
          <div className={`px-4 pb-4 pt-4 sm:px-6 sm:pt-5 ${tone.color}`}>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-xl bg-white/95 px-3.5 py-1.5 text-base font-extrabold text-neutral-900 shadow-sm">
                {tone.label}
              </span>
              <h2 className="text-balance text-lg font-bold leading-snug text-white sm:text-xl">
                {result.rule.name} · {result.v.label}
              </h2>
            </div>
            <p className="mt-2 text-balance text-[15px] font-medium leading-relaxed text-white/95 sm:text-base">
              {result.v.plain}
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
              <div className="rounded-xl bg-[#FAF7F2] p-3.5 ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">每笔均值（扣费后）</div>
                <div className={`mt-1 text-xl font-extrabold tabular-nums text-[#B45309] ${gainLossClass(result.v.mean_net)}`}>
                  {fmtPct(result.v.mean_net)}
                </div>
                <div className="mt-1 text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                  中位数 {fmtPct(result.v.median_net)} · 毛 {fmtPct(result.v.mean_gross)}
                </div>
              </div>
              <div className="rounded-xl bg-[#FAF7F2] p-3.5 ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">胜率</div>
                <div className="mt-1 text-xl font-extrabold tabular-nums text-[#B45309]">
                  {result.v.win_rate !== null ? `${(result.v.win_rate * 100).toFixed(1)}%` : "—"}
                </div>
                <div className="mt-1 text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                  盈亏比 {result.v.payoff_ratio?.toFixed(2) ?? "—"}
                </div>
              </div>
              <div className="rounded-xl bg-[#FAF7F2] p-3.5 ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">样本与区间</div>
                <div className="mt-1 text-xl font-extrabold tabular-nums text-[#B45309]">{fmtNum(result.v.n_trades)}笔</div>
                <div className="mt-1 text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                  {result.v.signal_start} 至 {result.v.signal_end}
                </div>
              </div>
              <div className="rounded-xl bg-[#FAF7F2] p-3.5 ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">比多少乱买强</div>
                <div className="mt-1 text-xl font-extrabold tabular-nums text-[#B45309]">
                  {result.v.percentile !== null ? `${result.v.percentile.toFixed(1)}%` : "—"}
                </div>
                <div className="mt-1 text-xs tabular-nums text-neutral-500 dark:text-neutral-400">随机平均 {fmtPct(result.v.random_mean)}</div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50/60 p-3.5 dark:border-neutral-800 dark:bg-neutral-900/60">
              <VsRandomStrip
                meanNet={result.v.mean_net}
                randomMean={result.v.random_mean}
                randomMedian={result.v.random_median}
                randomP5={result.v.random_p5}
                randomP95={result.v.random_p95}
                toneColor={tone.color}
              />
            </div>

            <dl className="mt-3 grid gap-2 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400 sm:grid-cols-2">
              <div className="rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
                <dt className="font-medium text-neutral-900 dark:text-white">组合（10份等额轮买）</dt>
                <dd className="tabular-nums">
                  年化 <span className={gainLossClass(result.v.portfolio_annualized)}>{fmtPct(result.v.portfolio_annualized)}</span> · 沪深300{" "}
                  {fmtPct(result.v.csi300_annualized)} · 中证500 {fmtPct(result.v.csi500_annualized)}
                </dd>
              </div>
              <div className="rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
                <dt className="font-medium text-neutral-900 dark:text-white">样本规模</dt>
                <dd className="tabular-nums">
                  全市场5000多只（含已退市） · 信号 {fmtNum(result.v.n_signals)} · 实际成交 {fmtNum(result.v.n_trades)}
                </dd>
              </div>
            </dl>

            {(() => {
              const { videoUrl, videoLabel, articleUrl } = episodeLinks(result.rule);
              if (!videoUrl && !articleUrl) return null;
              return (
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  {videoUrl && videoLabel && (
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-[#1E3A5F] px-3 py-1.5 font-medium text-white hover:bg-[#2F5D8A]"
                    >
                      {videoLabel}
                    </a>
                  )}
                  {articleUrl && (
                    <Link
                      href={articleUrl}
                      className="rounded-lg border border-neutral-300 px-3 py-1.5 font-medium text-neutral-700 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-300"
                    >
                      第{result.rule.ep}集文章版 →
                    </Link>
                  )}
                </div>
              );
            })()}
            {!episodeLinks(result.rule).videoUrl && !episodeLinks(result.rule).articleUrl && (
              <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                该规则暂无对应节目（未播出或筛选中）。想测它？
                <Link href={requestHref} className="ml-1 font-medium text-[#1E3A5F] hover:underline dark:text-blue-300">
                  告诉我们你想测哪个 →
                </Link>
              </p>
            )}
            <p className="mt-3 text-xs leading-relaxed text-neutral-400 dark:text-neutral-500">
              样本 {fmtNum(result.v.n_trades)} 笔 · {result.v.signal_start} 至 {result.v.signal_end} ·
              与节目同一口径 · 来源 {result.v.source_file} · {summary?.meta.disclaimer}。
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="font-bold">觉得有用？三件事可以做</h2>
        <ul className="mt-2 space-y-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          <li>
            1）看完整验证：
            {(() => {
              const r = rule;
              if (!r) return null;
              const { videoUrl, videoLabel, articleUrl } = episodeLinks(r);
              if (videoUrl) return (
                <a href={videoUrl} target="_blank" rel="noreferrer" className="ml-1 font-medium text-[#1E3A5F] hover:underline dark:text-blue-300">
                  {videoLabel} ↗
                </a>
              );
              if (articleUrl) return (
                <Link href={articleUrl} className="ml-1 font-medium text-[#1E3A5F] hover:underline dark:text-blue-300">
                  第{r.ep}集文章版 →
                </Link>
              );
              return <span className="ml-1">该规则暂无节目，先看看已播全集。</span>;
            })()}
          </li>
          <li>
            2）关注更新：
            {isGlobal ? (
              <a href={PLAYLIST_URL} target="_blank" rel="noreferrer" className="ml-1 font-medium text-[#1E3A5F] hover:underline dark:text-blue-300">
                YouTube 播放列表 ↗
              </a>
            ) : (
              <a href="https://www.bilibili.com/video/BV13MaG6MEbE" target="_blank" rel="noreferrer" className="ml-1 font-medium text-[#1E3A5F] hover:underline dark:text-blue-300">
                B站合集（第1集起） ↗
              </a>
            )}
          </li>
          <li>
            3）想测别的指标：
            <Link href={requestHref} className="ml-1 font-medium text-[#1E3A5F] hover:underline dark:text-blue-300">
              去选题池留一个 →
            </Link>
          </li>
        </ul>
        <h3 className="mt-4 font-bold">方法口径</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">{METHOD_TEXT}</p>
      </div>
    </div>
  );
}
