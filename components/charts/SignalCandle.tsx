"use client";

import * as React from "react";
import ChartCard, { ChartSkeleton } from "./ChartCard";

// 移植 Karios desktop StockChart/SimCandleChart（lightweight-charts 5  candles + volume）。
// zhibiao-lab 没有个股实时 K 线，故用确定性演示数据说明“信号位置 vs 买卖点”，
// 明确标注为形态示意，不代表任何个股，不构成推荐。按需动态 import，首屏不占体积。
function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function SignalCandle({ seed = 7 }: { seed?: number }) {
  const priceRef = React.useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    let priceChart: any = null;
    (async () => {
      const mod = await import("lightweight-charts");
      if (cancelled || !priceRef.current) return;
      const rnd = mulberry(seed * 1000 + 42);
      // 确定性演示 K 线：40 根，先涨后跌，信号出现在高点附近（演示“追高”形态）
      const bars: Array<{ time: string; open: number; high: number; low: number; close: number }> = [];
      let px = 10;
      for (let i = 0; i < 40; i++) {
        const drift = i < 22 ? 0.35 : -0.5;
        const open = px;
        const close = open + drift + (rnd() - 0.5) * 0.9;
        const high = Math.max(open, close) + rnd() * 0.4;
        const low = Math.min(open, close) - rnd() * 0.4;
        const day = `2024-${String(1 + Math.floor(i / 28)).padStart(2, "0")}-${String(1 + (i % 28)).padStart(2, "0")}`;
        bars.push({ time: day, open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2) });
        px = close;
      }
      const dark = document.documentElement.classList.contains("dark");
      const bg = dark ? "#09090b" : "#ffffff";
      const text = dark ? "#e4e4e7" : "#525252";
      const border = dark ? "#27272a" : "#e5e5e5";
      priceChart = mod.createChart(priceRef.current, {
        layout: { background: { type: (mod as any).ColorType.Solid, color: bg }, textColor: text },
      } as any);
      // 兼容写法：按 Karios desktop 的 createChart 选项
      priceChart.applyOptions({
        layout: { background: { type: (mod as any).ColorType.Solid, color: bg }, textColor: text },
        rightPriceScale: { borderColor: border },
        timeScale: { borderColor: border, timeVisible: false },
        grid: { horzLines: { color: border }, vertLines: { color: border } },
        crosshair: { mode: 1 },
      });
      const candle = priceChart.addSeries((mod as any).CandlestickSeries, {
        upColor: "#dc2626", // A股习惯：涨红
        downColor: "#16a34a", // 跌绿
        borderUpColor: "#dc2626",
        borderDownColor: "#16a34a",
        wickUpColor: "#dc2626",
        wickDownColor: "#16a34a",
      });
      candle.setData(bars.map((b) => ({ ...b, time: b.time as any })));
      candle.setMarkers([
        { time: bars[22].time as any, position: "belowBar", color: "#1a73e8", shape: "arrowUp", text: "信号买" },
        { time: bars[27].time as any, position: "aboveBar", color: "#737373", shape: "arrowDown", text: "5天后卖" },
      ] as any);
      priceChart.timeScale().fitContent();
      setReady(true);
    })();
    return () => {
      cancelled = true;
      try { priceChart?.remove(); } catch {}
    };
  }, [seed]);

  return (
    <ChartCard
      title="信号示意 K 线（演示数据）"
      subtitle="演示：信号确认时涨幅已吃掉一段，追进去多半站岗。非真实个股，仅说明形态，不构成推荐。"
      source="演示数据（确定性生成），交易逻辑同 Karios desktop StockChart（lightweight-charts）"
    >
      <div className="relative h-full w-full">
        {!ready && <ChartSkeleton label="K线" />}
        <div ref={priceRef} className="h-full w-full" />
      </div>
    </ChartCard>
  );
}
