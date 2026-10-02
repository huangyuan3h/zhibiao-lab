"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard, { ChartEmpty, ChartSkeleton } from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import { C, SRC } from "./chart-theme";
import { useChartData } from "./useChartData";

// 移植 kseries 12_cost_sensitivity：费用 0.15%/0.30%/0.50% 三档下的每笔均值。
// 费用减半依然亏，说明根子不在费用。
export default function CostSensitivity({ id }: { id: string }) {
  const { data, error } = useChartData(id);
  const rows = data?.cost
    ? Object.entries(data.cost).map(([k, v]) => ({
        cost: `${(Number(k) * 100).toFixed(2)}%`,
        order: Number(k),
        mean: v.mean_net == null ? null : +(v.mean_net * 100).toFixed(3),
      })).sort((a, b) => a.order - b.order)
    : [];
  return (
    <ChartCard
      title="费用敏感性：降费能救吗"
      subtitle="往返 0.15%/0.30%/0.50% 三档。降到 0.15% 依然亏，根子不在费用。"
      source={SRC}
    >
      {!data && !error && <ChartSkeleton label="费用" />}
      {(error || (data && !rows.length)) && <ChartEmpty />}
      {!!rows.length && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={C.grid} strokeOpacity={0.5} vertical={false} />
            <XAxis dataKey="cost" tick={{ fontSize: 11, fill: C.tick }} tickLine={false} axisLine={{ stroke: C.grid }} />
            <YAxis tick={{ fontSize: 10, fill: C.tick }} tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip
              content={({ active, payload, label }: any) => (
                <ChartTooltip
                  active={active}
                  label={`费用 ${label}`}
                  rows={(payload ?? []).map((p: any) => ({
                    name: p.name,
                    value: `${Number(p.value) > 0 ? "+" : ""}${Number(p.value)}%`,
                    color: p.stroke,
                  }))}
                />
              )}
            />
            <Line type="monotone" dataKey="mean" name="每笔均值 %" stroke={C.strategy} strokeWidth={2} dot={{ r: 3, fill: C.strategy }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
