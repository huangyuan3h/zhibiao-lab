"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard, { ChartEmpty, ChartSkeleton } from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import { C, SRC } from "./chart-theme";
import { useChartData } from "./useChartData";

// 移植 kseries 10_variants_table：拿几天卖（hold1/3/5/10/20）的每笔均值对比。
// 换拿法也救不回来，是“根子不在拿法”的直接证据。
export default function HoldingCompare({ id }: { id: string }) {
  const { data, error } = useChartData(id);
  const rows = (data?.variants ?? []).map((v) => ({
    variant: v.variant,
    mean: v.mean_net == null ? null : +(v.mean_net * 100).toFixed(3),
    n: v.n,
  }));
  return (
    <ChartCard
      title="拿法对比：拿几天卖？"
      subtitle="同一信号拿 1/3/5/10/20 天的每笔扣费后均值。都亏，说明换拿法救不回来。"
      source={SRC}
    >
      {!data && !error && <ChartSkeleton label="拿法" />}
      {(error || (data && !rows.length)) && <ChartEmpty />}
      {!!rows.length && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -8 }} barCategoryGap="28%">
            <CartesianGrid stroke={C.grid} strokeOpacity={0.5} vertical={false} />
            <XAxis dataKey="variant" tick={{ fontSize: 10, fill: C.tick }} tickLine={false} axisLine={{ stroke: C.grid }} interval={0} />
            <YAxis tick={{ fontSize: 10, fill: C.tick }} tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip
              cursor={{ fill: "#00000008" }}
              content={({ active, payload }: any) => {
                const r = payload?.[0]?.payload;
                if (!r) return null;
                return (
                  <ChartTooltip
                    active={active}
                    label={`${r.variant}（${r.n?.toLocaleString("zh-CN")} 笔）`}
                    rows={[{ name: "每笔均值", value: r.mean == null ? "—" : `${r.mean > 0 ? "+" : ""}${r.mean}%`, color: (r.mean ?? 0) >= 0 ? C.gain : C.loss }]}
                  />
                );
              }}
            />
            <Bar dataKey="mean" name="每笔均值 %" isAnimationActive={false} radius={[4, 4, 0, 0]}>
              {rows.map((r) => (
                <Cell key={r.variant} fill={(r.mean ?? 0) >= 0 ? C.gain : C.loss} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
