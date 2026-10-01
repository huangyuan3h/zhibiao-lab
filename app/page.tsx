import type { Metadata } from "next";
import { AIRED, INDICATORS, PLAYLIST_URL } from "@/lib/data";
import IndicatorTable from "@/components/IndicatorTable";

export const metadata: Metadata = {
  title: "什么指标不赚钱 · 指标实验室",
  description: "用 A 股历史数据回测散户常用指标：大多数不赚钱。24 集已测指标全表，附每笔收益、胜率、组合年化与随机买入对照。",
};

export default function Home() {
  const airedCount = AIRED.length;
  return (
    <div>
      <section className="mb-8">
        <h1 className="text-2xl font-bold leading-snug sm:text-3xl">
          用 A 股历史数据回测散户常用指标：大多数不赚钱
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          《什么指标不赚钱》把散户常用的技术指标，用 2010–2026 年 A
          股历史数据逐个回测：次日开盘买、拿 5 天后开盘卖，每笔扣往返 0.30%
          费用，并和同一天随机买入对照。目前已测 <b>{airedCount}</b> 个指标（第 13
          集因 4 个候选都不满足“明确不赚钱”而停更），
          <b>全部不赚钱</b>。作者：躺平的老黄。
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <a
            href={PLAYLIST_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
          >
            ▶ YouTube 播放列表
          </a>
          <a
            href="mailto:hi@zhibiao.lab?subject=我想测的指标："
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:border-gray-400"
          >
            我想测的指标
          </a>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">全部已测指标（{INDICATORS.filter((i) => i.ep !== null).length}）</h2>
        <IndicatorTable items={INDICATORS.filter((i) => i.ep !== null)} />
        <p className="mt-3 text-xs text-gray-400">
          表格可搜索、可按结论筛选，点击列头可排序。“—”表示该数字在来源中不存在，绝不编造。
        </p>
      </section>
    </div>
  );
}
