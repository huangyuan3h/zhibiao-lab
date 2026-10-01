import raw from "@/data/indicators.json";

export type Verdict = "不赚钱" | "有苗头" | "只研究";

export interface Example {
  stock: string;
  detail: string;
}

export interface Indicator {
  id: string;
  name: string;
  ep: number | null;
  title: string | null;
  verdict: Verdict;
  perTrade: number | null;
  median: number | null;
  winRate: number | null;
  portfolio: number | null;
  eventPct: number | null;
  portfolioPct: number | null;
  trades: number | null;
  example: Example | null;
  youtube: string | null;
  zhihu: string | null;
  bili: string | null;
  note: string | null;
}

interface DataFile {
  playlist: string;
  method: string;
  indicators: Indicator[];
}

const data = raw as DataFile;

export const PLAYLIST_URL = data.playlist;
export const METHOD = data.method;
export const INDICATORS: Indicator[] = data.indicators;

export const AIRED: Indicator[] = INDICATORS.filter((i) => i.ep !== null).sort(
  (a, b) => (a.ep ?? 0) - (b.ep ?? 0)
);

export const LEADS: Indicator[] = INDICATORS.filter((i) => i.verdict === "有苗头");

export function getIndicator(id: string): Indicator | undefined {
  return INDICATORS.find((i) => i.id === id);
}

export function youtubeWatch(id: string | null): string | null {
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

export function youtubeEmbed(id: string | null): string | null {
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function fmtPct(v: number | null, digits = 2): string {
  if (v === null || v === undefined) return "—";
  return `${v > 0 ? "+" : ""}${v.toFixed(digits)}%`;
}

export function fmtNum(v: number | null): string {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString("zh-CN");
}
