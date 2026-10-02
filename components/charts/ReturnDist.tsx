"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard, { ChartEmpty, ChartSkeleton } from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import { C, SRC } from "./chart-theme";
import { useChartData, pct } from "./useChartData";

// 移植 kseries 05_trade_distribution：每笔扣费后净收益直方图 + 均值/中位数线。
export default function ReturnDist({ id }: { id: string }) {
  const { data, error } = useChartData(id);
  const mean = data?.event?.mean_net ?? null;
  const median = data?.event?.median_net ?? null;
  return (
    <ChartCard
      title="每笔收益分布（扣费后）"
      subtitle={`高峰在 0 左边、均值被少数大涨拉走，是“平均赚、中位数亏”的典型。${mean != null ? `均值 ${pct(mean)}，` : ""}${median != null ? `中位数 ${pct(median)}。` : ""}区间外交易未画入柱内。`}
      source={SRC}
    >
      {!data && !error && <ChartSkeleton label="分布" />}
      {(error || (data && !data.dist)) && <ChartEmpty />}
      {!!data?.dist && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.dist.bins} margin={{ top: 8, right: 12, bottom: 0, left: -16 }} barCategoryGap="10%">
            <CartesianGrid stroke={C.grid} strokeOpacity={0.5} vertical={false} />
            <XAxis
              dataKey="mid"
              tick={{ fontSize: 10, fill: C.tick }}
              tickLine={false}
              axisLine={{ stroke: C.grid }}
              minTickGap={40}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis tick={{ fontSize: 10, fill: C.tick }} tickLine={false} axisLine={false} width={44} />
            <Tooltip
              cursor={{ fill: "#00000008" }}
              content={({ active, payload }: any) => {
                const b = payload?.[0]?.payload;
                if (!b) return null;
                return (
                  <ChartTooltip
                    active={active}
                    label={`${b.x0 * 100}% ~ ${b.x1 * 100}%`}
                    rows={[{ name: "笔数", value: String(b.count), color: C.accent }]}
                  />
                );
              }}
            />
            {mean != null && <ReferenceLine x={+(mean * 100).toFixed(2)} stroke={C.gain} strokeWidth={1.5} label={{ value: "均值", fontSize: 10, fill: C.gain, position: "top" }} />}
            {median != null && <ReferenceLine x={+(median * 100).toFixed(2)} stroke={C.random} strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "中位数", fontSize: 10, fill: C.random, position: "top" }} />}
            <Bar dataKey="count" name="笔数" isAnimationActive={false} radius={[2, 2, 0, 0]}>
              {data.dist.bins.map((b) => (
                <Cell key={b.mid} fill={b.mid < 0 ? C.loss : C.gain} fillOpacity={0.75} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
