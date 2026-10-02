"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard, { ChartEmpty, ChartSkeleton } from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import { C, SRC } from "./chart-theme";
import { useChartData } from "./useChartData";

// 移植 kseries 04_era_bars：4 个时代每笔超额/均值，牛市熊市是否都亏一目了然。
const ERA_LABEL: Record<string, string> = {
  "2010-2013": "10–13",
  "2014-2017": "14–17",
  "2018-2021": "18–21",
  "2022-2026": "22–26",
};

export default function EraBars({ id }: { id: string }) {
  const { data, error } = useChartData(id);
  const rows = data?.era
    ? Object.entries(data.era).map(([era, v]) => ({
        era: ERA_LABEL[era] ?? era,
        full: era,
        mean: v.mean_net == null ? null : +(v.mean_net * 100).toFixed(3),
        n: v.n,
      }))
    : [];
  return (
    <ChartCard
      title="分时代：每笔收益"
      subtitle="4 个时代（牛熊都含）各自的每笔扣费后均值。都为负，说明不是行情问题。"
      source={SRC}
    >
      {!data && !error && <ChartSkeleton label="时代" />}
      {(error || (data && !rows.length)) && <ChartEmpty />}
      {!!rows.length && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -8 }} barCategoryGap="28%">
            <CartesianGrid stroke={C.grid} strokeOpacity={0.5} vertical={false} />
            <XAxis dataKey="era" tick={{ fontSize: 11, fill: C.tick }} tickLine={false} axisLine={{ stroke: C.grid }} />
            <YAxis tick={{ fontSize: 10, fill: C.tick }} tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip
              cursor={{ fill: "#00000008" }}
              content={({ active, payload }: any) => {
                const r = payload?.[0]?.payload;
                if (!r) return null;
                return (
                  <ChartTooltip
                    active={active}
                    label={`${r.full}（${r.n?.toLocaleString("zh-CN")} 笔）`}
                    rows={[{ name: "每笔均值", value: r.mean == null ? "—" : `${r.mean > 0 ? "+" : ""}${r.mean}%`, color: (r.mean ?? 0) >= 0 ? C.gain : C.loss }]}
                  />
                );
              }}
            />
            <Bar dataKey="mean" name="每笔均值 %" isAnimationActive={false} radius={[4, 4, 0, 0]}>
              {rows.map((r) => (
                <Cell key={r.era} fill={(r.mean ?? 0) >= 0 ? C.gain : C.loss} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
