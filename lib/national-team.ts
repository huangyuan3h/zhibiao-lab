import raw from "@/data/national-team.json";

export interface FlowRow {
  date: string;
  etfShareYi: number | null;
  etfShareD20Pct: number | null;
  marginTrillion: number | null;
  marginD20Pct: number | null;
  northDailyYi: number | null;
  northD20Yi: number | null;
  northIsTurnover: boolean | null;
}

export interface FlowSummary {
  asof: string;
  etfShareYi: number | null;
  etfShareD20Pct: number | null;
  marginTrillion: number | null;
  marginD20Pct: number | null;
  northD20Yi: number | null;
  northIsTurnover: boolean | null;
  n_days: number;
  range: { from: string; to: string };
}

interface FlowFile {
  generated: string;
  asof: string;
  source: {
    builder: string;
    tables: string[];
    codes: string[];
    hsgtBreakDate: string;
    note: string;
  };
  summary: FlowSummary;
  series: FlowRow[];
}

const data = raw as FlowFile;

export const NT_GENERATED = data.generated;
export const NT_ASOF = data.asof;
export const NT_SOURCE = data.source;
export const NT_SUMMARY = data.summary;
export const NT_SERIES = data.series;

export function fmtSigned(v: number | null | undefined, digits = 1, unit = ""): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(digits)}${unit}`;
}

export function fmtNum(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("zh-CN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}
