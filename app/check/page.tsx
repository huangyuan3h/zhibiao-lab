import type { Metadata } from "next";
import { CHECK_SUMMARY } from "@/lib/check";
import { SITE_URL } from "@/lib/site";
import CheckTool from "@/components/CheckTool";

export const metadata: Metadata = {
  title: "指标打假",
  description:
    "老黄测指标 · 指标打假（国内版）：选一个散户常用指标 + 拿法，10秒看扣费后每笔赚多少、胜率、样本数、比随机买入强多少。24规则86组合，全市场2010–2026历史回测，永久免费。B站视频 + 文章版。",
  alternates: {
    canonical: `${SITE_URL}/check/`,
    languages: { "zh-CN": `${SITE_URL}/check/`, zh: `${SITE_URL}/global/check/`, "x-default": `${SITE_URL}/check/` },
  },
  openGraph: {
    title: "指标打假 · 老黄测指标（国内版）",
    description: "拿规则，10秒看是否跑赢瞎买：扣费后每笔、胜率、样本、随机对照、组合年化。永久免费。",
    url: `${SITE_URL}/check/`,
    type: "website",
    locale: "zh_CN",
  },
};

export default function CheckPage() {
  const nRules = CHECK_SUMMARY.meta.n_rules;
  const nCombos = CHECK_SUMMARY.meta.n_combos;
  return (
    <div>
      <section className="mb-5 sm:mb-6">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-[#1E3A5F] px-2.5 py-1 font-medium text-white">
            {nRules} 规则 · {nCombos} 组合 · 全市场 2010–2026
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-neutral-600 ring-1 ring-neutral-200 dark:bg-neutral-950 dark:text-neutral-400 dark:ring-neutral-800">
            每笔扣费 · 有随机买入对照 · 永久免费
          </span>
        </div>
        <h1 className="mt-3 max-w-2xl text-balance text-3xl font-bold leading-snug tracking-tight sm:text-4xl">
          指标打假：拿规则，10 秒看是否跑赢瞎买
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] font-medium leading-relaxed text-neutral-700 dark:text-neutral-300">
          选一个散户常用指标 + 拿法，立刻看到：扣费后每笔赚多少、胜率、多少笔样本、比随机买入强多少。
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          全部数字来自 A股全市场历史回测（2010-01-01 至 2026-08-31，5000多只含已退市，第二天开盘成交，一字板顺延），
          与系列「什么指标不赚钱」同一口径；有对应集数的直接给B站视频 + 文章链接。作者：躺平的老黄。
        </p>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          数字口径：首页 43 是已播集数，这里 24 是可一键回测的规则数（含部分未播新规则，共 86 种拿法）；国庆节效应等日历类没有可选拿法，不在此工具，见第 3 集，其余特殊口径以对应集文章为准。
        </p>
      </section>
      <CheckTool edition="china" />
      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 text-sm leading-relaxed text-neutral-600 sm:p-6 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
        <h2 className="font-bold text-neutral-900 dark:text-white">为什么可信？</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>算得全：沪深主板加创业板加科创板，含已退市，剔除ST，上市满250天、日均成交额达标的才算，共5000多只。</li>
          <li>口径实在：看到信号后第二天开盘买，拿几天后开盘卖，每笔扣掉0.30%费用，一字板买不进卖不出就顺延。</li>
          <li>有对照：每个规则都和“同一天随便买、拿同样久”对比1000次，是真本事还是运气，一看分位就知道。</li>
          <li>对得上节目：已播集数的数字和视频里一致，每个结果都带样本笔数和年份，从不只给一句话。</li>
        </ul>
      </section>
    </div>
  );
}
