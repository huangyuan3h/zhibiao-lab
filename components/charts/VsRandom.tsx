"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard, { ChartEmpty, ChartSkeleton } from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import { C, SRC } from "./chart-theme";
import { useChartData } from "./useChartData";

// 移植 kseries 08_vs_random：事件层 1000 次 + 组合层 200 次随机对照。
// 真实值落在随机分布的哪个分位，是判定“不赚钱”最硬的部分。
export default function VsRandom({ id }: { id: string }) {
  const { data, error } = useChartData(id);
  const ev = data?.mc?.event ?? null;
  const pf = data?.mc?.portfolio ?? null;
  const rows = [
    ev && {
      layer: "事件层",
      real: +(ev.real * 100).toFixed(3),
      p5: +(ev.random_p5 * 100).toFixed(3),
      med: +(ev.random_median * 100).toFixed(3),
      p95: +(ev.random_p95 * 100).toFixed(3),
      pct: ev.percentile,
    },
    pf && {
      layer: "组合层",
      real: +(pf.real * 100).toFixed(2),
      p5: +(pf.random_p5 * 100).toFixed(2),
      med: +(pf.random_median * 100).toFixed(2),
      p95: +(pf.random_p95 * 100).toFixed(2),
      pct: pf.percentile,
    },
  ].filter(Boolean) as Array<{ layer: string; real: number; p5: number; med: number; p95: number; pct: number }>;
  return (
    <ChartCard
      title="随机对照：比瞎买强吗"
      subtitle={`同样日子随机换股票、同样拿法做 ${data?.mc?.n ?? "1000"} 次。红点是真实信号，分位越低越差于随机。`}
      source={`${SRC}；随机 ${data?.mc?.n ?? 1000} 次事件层 / 200 次组合层`}
    >
      {!data && !error && <ChartSkeleton label="随机对照" />}
      {(error || (data && !rows.length)) && <ChartEmpty label="本集暂无随机对照数据。" />}
      {!!rows.length && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 8 }} barCategoryGap="32%">
            <CartesianGrid stroke={C.grid} strokeOpacity={0.5} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: C.tick }} tickLine={false} axisLine={{ stroke: C.grid }} tickFormatter={(v: number) => `${v}%`} />
            <YAxis type="category" dataKey="layer" tick={{ fontSize: 11, fill: C.tick }} tickLine={false} axisLine={false} width={52} />
            <Tooltip
              cursor={{ fill: "#00000008" }}
              content={({ active, payload }: any) => {
                const r = payload?.[0]?.payload;
                if (!r) return null;
                return (
                  <ChartTooltip
                    active={active}
                    label={`${r.layer} · 分位 ${r.pct}%`}
                    rows={[
                      { name: "真实信号", value: `${r.real > 0 ? "+" : ""}${r.real}%`, color: C.gain },
                      { name: "随机中位数", value: `${r.med > 0 ? "+" : ""}${r.med}%`, color: C.random },
                      { name: "随机 p5–p95", value: `${r.p5}% ~ ${r.p95}%`, color: C.tick },
                    ]}
                  />
                );
              }}
            />
            {/* 随机中位数区间条 */}
            <Bar dataKey="med" name="随机中位数" isAnimationActive={false} barSize={14} radius={[7, 7, 7, 7]}>
              {rows.map((r) => (
                <Cell key={r.layer} fill={C.random} fillOpacity={0.35} />
              ))}
            </Bar>
            <Bar dataKey="real" name="真实信号" isAnimationActive={false} barSize={6} radius={[3, 3, 3, 3]}>
              {rows.map((r) => (
                <Cell key={r.layer} fill={r.real >= r.med ? C.gain : C.loss} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
