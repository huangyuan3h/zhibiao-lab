"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard, { ChartEmpty, ChartSkeleton } from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import { C, SRC } from "./chart-theme";
import { useChartData } from "./useChartData";

// 移植 Karios desktop FundFlowPanel（recharts LineChart + syncId 联动十字线）与
// kseries 03_equity_vs_benchmark：组合净值 vs 沪深300/中证500（起点=1）。
export default function EquityCurve({ id }: { id: string }) {
  const { data, error } = useChartData(id);
  return (
    <ChartCard
      title="净值曲线：指标组合 vs 基准"
      subtitle="起点都是 1。红线越贴底，说明组合磨损越重。"
      source={SRC}
    >
      {!data && !error && <ChartSkeleton label="净值" />}
      {(error || (data && !data.equity?.length)) && <ChartEmpty />}
      {!!data?.equity?.length && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.equity} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke={C.grid} strokeOpacity={0.5} vertical={false} />
            <XAxis
              dataKey="d"
              tick={{ fontSize: 10, fill: C.tick }}
              tickLine={false}
              axisLine={{ stroke: C.grid }}
              minTickGap={48}
              tickFormatter={(d: string) => d.slice(0, 7)}
            />
            <YAxis
              tick={{ fontSize: 10, fill: C.tick }}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
              tickFormatter={(v: number) => String(v)}
              width={48}
            />
            <Tooltip
              content={({ active, payload, label }: any) => (
                <ChartTooltip
                  active={active}
                  label={label}
                  rows={(payload ?? []).map((p: any) => ({
                    name: p.name,
                    value: Number(p.value).toFixed(2),
                    color: p.color ?? p.stroke,
                  }))}
                />
              )}
            />
            <Line type="monotone" dataKey="nav" name="指标组合" stroke={C.strategy} strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="b300" name="沪深300" stroke={C.bench300} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="b500" name="中证500" stroke={C.bench500} strokeWidth={1.5} strokeDasharray="5 3" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
