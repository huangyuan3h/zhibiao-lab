"use client";

import * as React from "react";

export interface ChartJson {
  id: string;
  variant: string | null;
  updated?: string;
  nodata?: boolean;
  holiday?: boolean;
  event?: {
    n: number | null;
    mean_net: number | null;
    median_net: number | null;
    win_rate: number | null;
    payoff: number | null;
    mean_gross: number | null;
    cost_drag: number | null;
  } | null;
  era?: Record<string, { n: number | null; mean_net: number | null; win_rate: number | null }>;
  portfolioEra?: Record<string, { portfolio: number | null; csi300: number | null; csi500: number | null; uncond_ew: number | null }> | null;
  benchmarks?: Record<string, number | null> | null;
  portfolio?: { annualized: number | null; max_dd: number | null } | null;
  cost?: Record<string, { mean_net: number | null }> | null;
  costPortfolio?: Record<string, number | null> | null;
  mc?: {
    seed: number | null;
    n: number | null;
    event?: { real: number; percentile: number; random_mean: number; random_median: number; random_p5: number; random_p95: number } | null;
    portfolio?: { real: number; percentile: number; random_mean: number; random_median: number; random_p5: number; random_p95: number } | null;
  } | null;
  seeds?: Record<string, { k_beat: number | null; n: number; rows: Array<{ code: string; name: string; beat: boolean; strat: number | null; bh: number | null }> }>;
  equity?: Array<{ d: string; nav: number; b300: number; b500: number }>;
  dist?: { bins: Array<{ x0: number; x1: number; mid: number; count: number }>; under: number; over: number; n: number; mean: number | null } | null;
  variants?: Array<{ variant: string; n: number | null; mean_net: number | null; median_net: number | null; win_rate: number | null; annualized: number | null }>;
  guoqing?: { yearly: Array<{ year: number; pre1: number | null; post1: number | null; post10: number | null }>; n: number } | null;
  note?: string;
}

export function useChartData(id: string): { data: ChartJson | null; error: boolean } {
  const [data, setData] = React.useState<ChartJson | null>(null);
  const [error, setError] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    fetch(`/charts/${id}.json`, { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((j) => {
        if (alive) setData(j);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [id]);
  return { data, error };
}

export function pct(v: number | null | undefined, digits = 2): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${v > 0 ? "+" : ""}${(v * 100).toFixed(digits)}%`;
}
