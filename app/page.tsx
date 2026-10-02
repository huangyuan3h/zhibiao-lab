import type { Metadata } from "next";
import { AIRED, INDICATORS } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import IndicatorTable from "@/components/IndicatorTable";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "什么指标不赚钱 · 指标实验室",
  description: "用 A 股历史数据回测散户常用指标：大多数不赚钱。国内版（B站视频+文章），24 集已测指标全表。",
  alternates: {
    canonical: `${SITE_URL}/`,
    languages: { "zh-CN": `${SITE_URL}/`, zh: `${SITE_URL}/global/`, "x-default": `${SITE_URL}/` },
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "什么指标不赚钱 · 指标实验室（国内版）",
    description: "用 A 股历史数据回测散户常用指标：大多数不赚钱。B站视频 + 文章版。",
    url: `${SITE_URL}/`,
    type: "website",
    locale: "zh_CN",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "什么指标不赚钱 · 指标实验室" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "什么指标不赚钱 · 指标实验室（国内版）",
    description: "用 A 股历史数据回测散户常用指标：大多数不赚钱。",
    images: ["/og.png"],
  },
};

export default function Home() {
  const airedCount = AIRED.length;
  const withBili = AIRED.filter((i) => !!i.bili).length;
  // 国内版：去掉 YouTube ID，避免 RSC payload 泄露到中国版 HTML（中国版只用 B站）
  const chinaItems = INDICATORS.filter((i) => i.ep !== null).map((i) => ({ ...i, youtube: null }));
  return (
    <div>
      <section className="mb-10">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">国内版 · B站</Badge>
          <a href="/global/" className="text-xs text-neutral-400 hover:text-neutral-700 hover:underline">
            切换到海外版（YouTube）→
          </a>
        </div>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-snug tracking-tight sm:text-4xl">
          用 A 股历史数据回测散户常用指标：大多数不赚钱
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          《什么指标不赚钱》把散户常用的技术指标，用 2010–2026 年 A
          股历史数据逐个回测：次日开盘买、拿 5 天后开盘卖，每笔扣往返 0.30%
          费用，并和同一天随机买入对照。目前已测 <b className="text-neutral-900 dark:text-white">{airedCount}</b> 个指标
          （第 13 集因 4 个候选都不满足“明确不赚钱”而停更），
          <b className="text-neutral-900 dark:text-white">全部不赚钱</b>。作者：躺平的老黄。
        </p>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">
          国内版视频来自 B站（{withBili} 集），无 B站视频的指标只显示文章版。每个指标页都有「视频 / 文章」两种版本。
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <a
            href="https://www.bilibili.com/video/BV13MaG6MEbE"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
          >
            ▶ B站合集（第1集起）
          </a>
          <a
            href="/request/"
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 font-medium text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300"
          >
            我想测的指标
          </a>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          全部已测指标（{INDICATORS.filter((i) => i.ep !== null).length}）
        </h2>
        <IndicatorTable items={chinaItems} edition="china" />
      </section>

      <Card className="mt-8 p-5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        <p className="font-medium text-neutral-900 dark:text-white">投资者教育，不构成投资建议。</p>
        <p className="mt-1">
          以上均为历史回测，过往业绩不代表未来表现，投资有风险，入市需谨慎。表格中“—”表示来源中无该数字，绝不编造。
        </p>
      </Card>
    </div>
  );
}
