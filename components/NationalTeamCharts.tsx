"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FlowRow } from "@/lib/national-team";

const C = {
  etf: "#0ea5e9",
  margin: "#a855f7",
  north: "#5eead4",
  northCum: "#14b8a6",
  grid: "#94a3b8",
  axis: "#71717a",
} as const;

function ticks(rows: FlowRow[], max = 6): string[] {
  const n = rows.length;
  if (n <= 1) return rows.map((r) => r.date);
  const step = Math.max(1, Math.ceil(n / max));
  return rows.filter((_, i) => i % step === 0).map((r) => r.date);
}

function Tip({
  active,
  payload,
  label,
  fields,
}: {
  active?: boolean;
  payload?: Array<{ payload?: FlowRow }>;
  label?: string | number;
  fields: Array<{ key: keyof FlowRow; label: string; color: string; digits: number; unit: string }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[11px] shadow-sm dark:border-neutral-700 dark:bg-neutral-950">
      <div className="mb-1 font-medium">{label}</div>
      <div className="space-y-1">
        {fields.map((f) => {
          const raw = d[f.key];
          const text =
            raw === null || raw === undefined || typeof raw === "boolean"
              ? "—"
              : `${Number(raw) > 0 && f.unit !== "" ? "+" : ""}${Number(raw).toFixed(f.digits)}${f.unit}`;
          return (
            <div key={String(f.key)} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-neutral-500">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: f.color }} />
                {f.label}
              </span>
              <span className="font-mono tabular-nums">{text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function NationalTeamCharts({ series }: { series: FlowRow[] }) {
  const tk = ticks(series);
  return (
    <div className="mt-6 space-y-6">
      <section>
        <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <span className="font-medium text-neutral-800 dark:text-neutral-200">国家队 · 宽基 ETF 份额（亿份，4 码）</span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-3" style={{ background: C.etf }} />
            份额合计
          </span>
        </div>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={C.grid} strokeOpacity={0.25} vertical={false} />
              <XAxis dataKey="date" ticks={tk} tick={{ fontSize: 10, fill: C.axis }} tickLine={false} axisLine={{ stroke: C.grid, strokeOpacity: 0.4 }} />
              <YAxis domain={["auto", "auto"]} width={40} tick={{ fontSize: 10, fill: C.axis }} tickLine={false} axisLine={false} />
              <Tooltip
                content={
                  <Tip
                    fields={[
                      { key: "etfShareYi", label: "份额", color: C.etf, digits: 1, unit: " 亿份" },
                      { key: "etfShareD20Pct", label: "20日Δ", color: C.etf, digits: 1, unit: "%" },
                    ]}
                  />
                }
              />
              <Line type="linear" dataKey="etfShareYi" stroke={C.etf} strokeWidth={1.75} dot={false} isAnimationActive={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <span className="font-medium text-neutral-800 dark:text-neutral-200">两融余额（万亿元，全市场）</span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-3" style={{ background: C.margin }} />
            余额
          </span>
        </div>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={C.grid} strokeOpacity={0.25} vertical={false} />
              <XAxis dataKey="date" ticks={tk} tick={{ fontSize: 10, fill: C.axis }} tickLine={false} axisLine={{ stroke: C.grid, strokeOpacity: 0.4 }} />
              <YAxis domain={["auto", "auto"]} width={40} tick={{ fontSize: 10, fill: C.axis }} tickLine={false} axisLine={false} />
              <Tooltip
                content={
                  <Tip
                    fields={[
                      { key: "marginTrillion", label: "两融", color: C.margin, digits: 3, unit: " 万亿" },
                      { key: "marginD20Pct", label: "20日Δ", color: C.margin, digits: 1, unit: "%" },
                    ]}
                  />
                }
              />
              <Line type="linear" dataKey="marginTrillion" stroke={C.margin} strokeWidth={1.75} dot={false} isAnimationActive={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <span className="font-medium text-neutral-800 dark:text-neutral-200">北向资金（亿元 · 2024-08-19 后为成交额口径）</span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: C.north }} />
            日线
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-3" style={{ background: C.northCum }} />
            20日累计
          </span>
        </div>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={C.grid} strokeOpacity={0.25} vertical={false} />
              <XAxis dataKey="date" ticks={tk} tick={{ fontSize: 10, fill: C.axis }} tickLine={false} axisLine={{ stroke: C.grid, strokeOpacity: 0.4 }} />
              <YAxis domain={["auto", "auto"]} width={40} tick={{ fontSize: 10, fill: C.axis }} tickLine={false} axisLine={false} />
              <Tooltip
                content={
                  <Tip
                    fields={[
                      { key: "northDailyYi", label: "日线", color: C.north, digits: 1, unit: " 亿" },
                      { key: "northD20Yi", label: "20日累计", color: C.northCum, digits: 0, unit: " 亿" },
                    ]}
                  />
                }
              />
              <Bar dataKey="northDailyYi" fill={C.north} fillOpacity={0.45} isAnimationActive={false} />
              <Line type="linear" dataKey="northD20Yi" stroke={C.northCum} strokeWidth={1.75} dot={false} isAnimationActive={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
