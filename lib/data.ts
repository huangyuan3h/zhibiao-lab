import raw from "@/data/indicators.json";
import articlesRaw from "@/data/articles.json";

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

// privacy-enhanced, click-to-load 用的 nocookie 域名（仅 global 版使用）
export function youtubeNocookieEmbed(id: string | null): string | null {
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
}

export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function biliBvid(biliUrl: string | null): string | null {
  if (!biliUrl) return null;
  const m = biliUrl.match(/(BV[a-zA-Z0-9]+)/);
  return m ? m[1] : null;
}

export function biliEmbed(biliUrl: string | null): string | null {
  const bvid = biliBvid(biliUrl);
  return bvid
    ? `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&danmaku=0`
    : null;
}

// ---- 双版本：china 只有 B站，global 只有 YouTube（公开） ----
export function hasChinaVideo(i: Indicator): boolean {
  return !!biliBvid(i.bili);
}

export function hasGlobalVideo(i: Indicator): boolean {
  return !!i.youtube;
}

export function hasVideo(i: Indicator, edition: "china" | "global"): boolean {
  return edition === "china" ? hasChinaVideo(i) : hasGlobalVideo(i);
}

// ---- 文章 ----
export interface ArticleEntry {
  source: "zhihu" | "summary" | "none";
  markdown: string;
}

const articles = articlesRaw as Record<string, ArticleEntry>;

export function getArticle(id: string): ArticleEntry {
  return articles[id] ?? { source: "none", markdown: "" };
}

export function hasArticle(id: string): boolean {
  const a = getArticle(id);
  return !!a.markdown;
}

export function fmtPct(v: number | null, digits = 2): string {
  if (v === null || v === undefined) return "—";
  return `${v > 0 ? "+" : ""}${v.toFixed(digits)}%`;
}

export function fmtNum(v: number | null): string {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString("zh-CN");
}
