"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "./ChartCard";

const EquityCurve = dynamic(() => import("./EquityCurve"), {
  ssr: false,
  loading: () => <div className="h-[240px] sm:h-[260px]"><ChartSkeleton label="净值" /></div>,
});
const ReturnDist = dynamic(() => import("./ReturnDist"), {
  ssr: false,
  loading: () => <div className="h-[240px] sm:h-[260px]"><ChartSkeleton label="分布" /></div>,
});
const EraBars = dynamic(() => import("./EraBars"), {
  ssr: false,
  loading: () => <div className="h-[240px] sm:h-[260px]"><ChartSkeleton label="时代" /></div>,
});
const HoldingCompare = dynamic(() => import("./HoldingCompare"), {
  ssr: false,
  loading: () => <div className="h-[240px] sm:h-[260px]"><ChartSkeleton label="拿法" /></div>,
});
const VsRandom = dynamic(() => import("./VsRandom"), {
  ssr: false,
  loading: () => <div className="h-[240px] sm:h-[260px]"><ChartSkeleton label="随机对照" /></div>,
});
const CostSensitivity = dynamic(() => import("./CostSensitivity"), {
  ssr: false,
  loading: () => <div className="h-[240px] sm:h-[260px]"><ChartSkeleton label="费用" /></div>,
});
const RandomStocksGrid = dynamic(() => import("./RandomStocksGrid"), {
  ssr: false,
  loading: () => <div className="h-[300px]"><ChartSkeleton label="12只" /></div>,
});
const SignalCandle = dynamic(() => import("./SignalCandle"), {
  ssr: false,
  loading: () => <div className="h-[240px] sm:h-[260px]"><ChartSkeleton label="K线" /></div>,
});
const HolidayBars = dynamic(() => import("./HolidayBars"), {
  ssr: false,
  loading: () => <div className="h-[240px] sm:h-[260px]"><ChartSkeleton label="国庆" /></div>,
});

// 文章页：文字 + 交互图表。全部懒加载、客户端渲染，首屏 HTML 不增重、无外部资源。
// 顺序与文章“图注”对应：分布 → 组合 → 时代/拿法 → 对照 → 费用 → 12只 → K线示意。
export default function ArticleCharts({ id, seed }: { id: string; seed?: number }) {
  if (id === "holiday_effect") {
    return (
      <div className="grid gap-4">
        <HolidayBars id={id} />
        <SignalCandle seed={seed ?? 3} />
      </div>
    );
  }
  return (
    <div className="grid gap-4">
      <ReturnDist id={id} />
      <EquityCurve id={id} />
      <div className="grid gap-4 md:grid-cols-2">
        <EraBars id={id} />
        <HoldingCompare id={id} />
      </div>
      <VsRandom id={id} />
      <div className="grid gap-4 md:grid-cols-2">
        <CostSensitivity id={id} />
        <SignalCandle seed={seed ?? 7} />
      </div>
      <RandomStocksGrid id={id} />
    </div>
  );
}
