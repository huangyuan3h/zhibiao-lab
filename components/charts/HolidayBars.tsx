"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard, { ChartEmpty, ChartSkeleton } from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import { C } from "./chart-theme";
import { useChartData } from "./useChartData";

// 国庆 21 年：节前 1 天 vs 节后 1 天（上证），2024 那根是理解平均数的关键。
export default function HolidayBars({ id }: { id: string }) {
  const { data, error } = useChartData(id);
  const rows = (data?.guoqing?.yearly ?? []).map((r) => ({
    year: String(r.year),
    pre1: r.pre1 == null ? null : +(r.pre1 * 100).toFixed(2),
    post1: r.post1 == null ? null : +(r.post1 * 100).toFixed(2),
  }));
  return (
    <ChartCard
      title="国庆 21 年：节前最后 1 天 vs 节后第 1 天"
      subtitle="平均数好看很大程度是因为 2024 年。看每年柱子，比看平均数重要。"
      source="上证指数 2005–2025 国庆，价格指数不含分红"
    >
      {!data && !error && <ChartSkeleton label="国庆" />}
      {(error || (data && !rows.length)) && <ChartEmpty />}
      {!!rows.length && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -8 }} barCategoryGap="20%">
            <CartesianGrid stroke={C.grid} strokeOpacity={0.5} vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 9, fill: C.tick }} tickLine={false} axisLine={{ stroke: C.grid }} interval={2} />
            <YAxis tick={{ fontSize: 10, fill: C.tick }} tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip
              cursor={{ fill: "#00000008" }}
              content={({ active, payload, label }: any) => {
                const r = payload?.[0]?.payload;
                if (!r) return null;
                return (
                  <ChartTooltip
                    active={active}
                    label={`${label} 年国庆`}
                    rows={[
                      { name: "节前最后1天", value: r.pre1 == null ? "—" : `${r.pre1}%`, color: C.accent },
                      { name: "节后第1天", value: r.post1 == null ? "—" : `${r.post1}%`, color: C.random },
                    ]}
                  />
                );
              }}
            />
            <Bar dataKey="pre1" name="节前最后1天" isAnimationActive={false} radius={[2, 2, 0, 0]}>
              {rows.map((r) => (
                <Cell key={r.year} fill={C.accent} fillOpacity={0.8} />
              ))}
            </Bar>
            <Bar dataKey="post1" name="节后第1天" isAnimationActive={false} radius={[2, 2, 0, 0]}>
              {rows.map((r) => (
                <Cell key={r.year} fill={C.random} fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
