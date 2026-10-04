import raw from "@/data/check-summary.json";

export interface CheckVariant {
  variant_id: string;
  label: string;
  hold: number | null;
  rule_zh: string;
  n_trades: number;
  mean_net: number;
  median_net: number | null;
  win_rate: number;
  payoff_ratio: number | null;
  mean_gross: number | null;
  random_mean: number | null;
  random_median: number | null;
  random_p5: number | null;
  random_p95: number | null;
  percentile: number | null;
  quantile: number | null;
  portfolio_annualized: number | null;
  portfolio_max_dd: number | null;
  csi300_annualized: number | null;
  csi500_annualized: number | null;
  verdict_label: string | null;
  signal_start: string | null;
  signal_end: string | null;
  distinct_codes: number | null;
  fill_rate: number | null;
  n_signals: number | null;
  plain: string;
  source_file: string;
}

export interface CheckRule {
  id: string;
  name: string;
  category: string;
  ep: number | null;
  bili_url: string | null;
  youtube_id: string | null;
  youtube_url: string | null;
  article_cn: string | null;
  article_global: string | null;
  title: string | null;
  variants: CheckVariant[];
}

export interface CheckSummary {
  meta: {
    label: string;
    universe: string;
    signal_start: string;
    signal_end: string;
    fee_rate: number;
    fee_note: string;
    entry: string;
    random_note: string;
    disclaimer: string;
    source: string;
    n_rules: number;
    n_combos: number;
    generated_at: string;
  };
  rules: CheckRule[];
}

const typed = raw as unknown as CheckSummary;

export const CHECK_SUMMARY: CheckSummary = typed;
export const CHECK_RULES: CheckRule[] = typed.rules;

export function fmtPct(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined) return "—";
  return `${v > 0 ? "+" : ""}${(v * 100).toFixed(digits)}%`;
}

export function fmtNum(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString("zh-CN");
}

// Verdict header: deep-sea blue / slate / amber only — never red/green as theme.
// Red/green are reserved for actual gains/losses (A-share: red=up/gain, green=down/loss).
export function verdictTone(meanNet: number | null, quantile: number | null): {
  label: string;
  color: string;
} {
  const q = quantile ?? 0;
  if ((meanNet ?? 0) <= 0 && q < 0.5) return { label: "大概率不赚钱", color: "bg-[#1E3A5F]" };
  if ((meanNet ?? 0) <= 0) return { label: "扣费后为负", color: "bg-[#2F5D8A]" };
  if (q < 0.5) return { label: "赚但跑不赢瞎买", color: "bg-[#5B6B7A]" };
  if (q < 0.9) return { label: "略超随机，优势微弱", color: "bg-[#B45309]" };
  return { label: "明显强于随机（仍看组合）", color: "bg-[#92400E]" };
}

// A-share convention for actual numbers: red = gain/up, green = loss/down.
// Darker shades for WCAG contrast on light background.
export function gainLossClass(v: number | null | undefined): string {
  if (v === null || v === undefined) return "";
  if (v > 0) return "text-[#B91C1C]";
  if (v < 0) return "text-[#15803D]";
  return "";
}
