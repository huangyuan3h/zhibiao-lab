"use client";

import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { ChartSkeleton } from "./ChartCard";

const L = (fn: () => Promise<any>, label: string): any =>
  dynamic(fn as any, { ssr: false, loading: () => <div className="h-[240px] sm:h-[260px]"><ChartSkeleton label={label} /></div> }) as any;

const EquityCurve = L(() => import("./EquityCurve"), "净值");
const ReturnDist = L(() => import("./ReturnDist"), "分布");
const EraBars = L(() => import("./EraBars"), "时代");
const HoldingCompare = L(() => import("./HoldingCompare"), "拿法");
const VsRandom = L(() => import("./VsRandom"), "随机对照");
const CostSensitivity = L(() => import("./CostSensitivity"), "费用");
const SignalCandle = L(() => import("./SignalCandle"), "K线");

const RandomStocksGrid: any = dynamic(() => import("./RandomStocksGrid"), {
  ssr: false,
  loading: () => <div className="h-[300px]"><ChartSkeleton label="12只" /></div>,
});
const HolidayBars: any = dynamic(() => import("./HolidayBars"), {
  ssr: false,
  loading: () => <div className="h-[240px]"><ChartSkeleton label="国庆" /></div>,
});

// 组件展示：每个可复用图表 + 一句话说明 + 数据口径，全部用 MACD 金叉（ep1）演示。
const DOCS: Array<{ name: string; from: string; use: string }> = [
  { name: "EquityCurve 净值曲线", from: "Karios desktop FundFlowPanel（recharts LineChart）+ kseries 03 图", use: "组合净值 vs 沪深300/中证500，起点=1" },
  { name: "ReturnDist 收益分布", from: "kseries 05 图（trades.csv 直方图）", use: "每笔扣费后净收益，红均值线 + 紫中位数线" },
  { name: "EraBars 分时代", from: "kseries 04 图（by_era）", use: "4 时代每笔均值，牛熊是否都亏" },
  { name: "HoldingCompare 拿法对比", from: "kseries 10 图（variants 表）", use: "hold1/3/5/10/20 每笔均值，换拿法能否救" },
  { name: "VsRandom 随机对照", from: "kseries 08 图（mc 1000/200 次）", use: "事件层 + 组合层：真实 vs 随机 p5/中位数/p95" },
  { name: "CostSensitivity 费用敏感性", from: "kseries 12 图（cost_sensitivity）", use: "0.15%/0.30%/0.50% 三档，根子是否在费用" },
  { name: "RandomStocksGrid 12只网格", from: "kseries 07 图（random_stocks small-multiples）", use: "三组各 12 只：x/12 跑赢持有，纯 CSS 无新库" },
  { name: "SignalCandle 信号 K 线", from: "Karios desktop StockChart（lightweight-charts 5 candles）", use: "演示数据形态示意，A股红涨绿跌，信号买/5天卖标记" },
  { name: "HolidayBars 国庆柱", from: "kseries holiday guoqing yearly", use: "ep3 专用：21 年节前1天 vs 节后1天" },
];

export default function Showcase({ demoId }: { demoId: string }) {
  return (
    <div>
      <Card className="mb-6 p-5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        <p className="font-medium text-neutral-900 dark:text-white">
          演示数据：第 1 集 MACD 金叉（260,436 笔），除 K 线为演示数据外全部由回测 JSON 驱动。
        </p>
        <p className="mt-1">
          库：recharts（与 Karios desktop / kairos-fe 同系，SVG + 触摸 tooltip）+ lightweight-charts 5（与 Karios desktop StockChart 同库，K
          线专用）。全部 npm 本地打包、无外部 CDN，国内版可直连；懒加载、客户端渲染，首屏 HTML 不增重。
        </p>
      </Card>
      <div className="grid gap-4">
        <ReturnDist id={demoId} />
        <EquityCurve id={demoId} />
        <div className="grid gap-4 md:grid-cols-2">
          <EraBars id={demoId} />
          <HoldingCompare id={demoId} />
        </div>
        <VsRandom id={demoId} />
        <div className="grid gap-4 md:grid-cols-2">
          <CostSensitivity id={demoId} />
          <SignalCandle seed={1} />
        </div>
        <RandomStocksGrid id={demoId} />
        <HolidayBars id="holiday_effect" />
      </div>
      <h2 className="mb-2 mt-8 text-lg font-bold">组件清单（9 个）</h2>
      <div className="grid gap-3">
        {DOCS.map((d) => (
          <Card key={d.name} className="p-4 text-sm">
            <p className="font-medium">{d.name}</p>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">来源：{d.from}</p>
            <p className="mt-0.5 text-neutral-500 dark:text-neutral-500">用法：{d.use}</p>
          </Card>
        ))}
      </div>
      <p className="mt-6 rounded-xl bg-neutral-100 p-4 text-xs leading-relaxed text-neutral-500 dark:bg-neutral-900">
        复用方式：新一集跑完 <code>npm run update-data</code>（自动重建 public/charts/*.json）后，
        在文章页直接 <code>&lt;ArticleCharts id="new_id" /&gt;</code> 即可，无需手写图表。
        未用任何 Crimson 代码或数据；Karios 为站长自有项目，已获权复用逻辑并重写样式。
      </p>
    </div>
  );
}
