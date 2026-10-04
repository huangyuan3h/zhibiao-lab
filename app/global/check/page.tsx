import type { Metadata } from "next";
import { CHECK_SUMMARY } from "@/lib/check";
import { SITE_URL } from "@/lib/site";
import CheckTool from "@/components/CheckTool";

export const metadata: Metadata = {
  title: "Indicator Check · 海外版",
  description:
    "Lao Huang Tests Indicators · 指标打假（海外版）：pick an indicator + holding period, see net mean, win rate, sample size, random-control percentile, portfolio vs CSI300/CSI500. 24 rules 86 combos, A-share 2010–2026, free forever. YouTube + articles.",
  alternates: {
    canonical: `${SITE_URL}/global/check/`,
    languages: { "zh-CN": `${SITE_URL}/check/`, zh: `${SITE_URL}/global/check/`, "x-default": `${SITE_URL}/global/check/` },
  },
  openGraph: {
    title: "Indicator Check · Lao Huang Tests Indicators",
    description: "Pick a rule, see in 10s if it beats random buying. Free forever.",
    url: `${SITE_URL}/global/check/`,
    type: "website",
    locale: "zh_CN",
  },
};

export default function GlobalCheckPage() {
  const nRules = CHECK_SUMMARY.meta.n_rules;
  const nCombos = CHECK_SUMMARY.meta.n_combos;
  return (
    <div>
      <section className="mb-5 sm:mb-6">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-[#1E3A5F] px-2.5 py-1 font-medium text-white">
            {nRules} rules · {nCombos} combos · 2010–2026
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-neutral-600 ring-1 ring-neutral-200 dark:bg-neutral-950 dark:text-neutral-400 dark:ring-neutral-800">
            Net of fees · Random control · Free forever
          </span>
        </div>
        <h1 className="mt-3 max-w-2xl text-balance text-3xl font-bold leading-snug tracking-tight sm:text-4xl">
          指标打假 Indicator Check：10 秒看是否跑赢瞎买
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] font-medium leading-relaxed text-neutral-700 dark:text-neutral-300">
          老黄测指标 · 海外版：选一个散户常用指标 + 拿法，立刻看到扣费后每笔、胜率、样本、随机对照、组合年化。
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          全市场历史回测（2010-01-01 至 2026-08-31，5000多只含已退市），与系列「什么指标不赚钱」同一口径；
          有对应集数的直接给YouTube视频 + 文章链接（隐私增强，点击才加载）。作者：躺平的老黄。
        </p>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          Count note: 26 is aired episodes, 24 here is checkable rules (incl. unaired new rules, 86 combos); calendar specials like the holiday effect have no holding variant — see its episode, other specials follow their articles.
        </p>
      </section>
      <CheckTool edition="global" />
      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 text-sm leading-relaxed text-neutral-600 sm:p-6 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
        <h2 className="font-bold text-neutral-900 dark:text-white">Why trust it?</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Full universe: main board + ChiNext + STAR, incl. delisted, ex-ST, 250-day listing + turnover filter, 5000+ names.</li>
          <li>Honest execution: buy next open after signal, sell after H days, 0.30% round-trip, limit-up/down deferred.</li>
          <li>Random control: each rule vs same-day random buys (1000x) — skill vs luck at a glance.</li>
          <li>Matches episodes: aired numbers equal video numbers, every verdict shows sample size + period.</li>
        </ul>
      </section>
    </div>
  );
}
