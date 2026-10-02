"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Indicator } from "@/lib/data";
import { fmtPct, hasVideo } from "@/lib/data";
import VerdictBadge from "./VerdictBadge";
import { Card } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import type { Edition } from "@/lib/site";

type SortKey = "ep" | "perTrade" | "winRate" | "portfolio";

const sortLabels: Record<SortKey, string> = {
  ep: "集数",
  perTrade: "每笔收益",
  winRate: "胜率",
  portfolio: "组合年化",
};

function sortVal(i: Indicator, k: SortKey): number {
  const v = i[k];
  if (v === null || v === undefined) return k === "ep" ? 9999 : -Infinity;
  return v;
}

export default function IndicatorTable({ items, edition }: { items: Indicator[]; edition: Edition }) {
  const [query, setQuery] = useState("");
  const [verdict, setVerdict] = useState<"全部" | "不赚钱" | "有苗头" | "只研究">("全部");
  const [videoOnly, setVideoOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("ep");
  const [asc, setAsc] = useState(true);
  const prefix = edition === "global" ? "/global" : "";

  const rows = useMemo(() => {
    const q = query.trim();
    let list = items.filter(
      (i) =>
        (verdict === "全部" || i.verdict === verdict) &&
        (!videoOnly || hasVideo(i, edition)) &&
        (q === "" || i.name.includes(q) || (i.title ?? "").includes(q))
    );
    list = [...list].sort((a, b) => {
      const d = sortVal(a, sortKey) - sortVal(b, sortKey);
      return asc ? d : -d;
    });
    return list;
  }, [items, query, verdict, videoOnly, sortKey, asc, edition]);

  function toggleSort(k: SortKey) {
    if (k === sortKey) setAsc(!asc);
    else {
      setSortKey(k);
      setAsc(k === "ep");
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索指标名…"
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none sm:max-w-xs dark:border-neutral-700 dark:bg-neutral-950"
        />
        <div className="flex flex-wrap gap-2 text-sm">
          {(["全部", "不赚钱", "有苗头", "只研究"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVerdict(v)}
              className={`rounded-full border px-3 py-1 ${
                verdict === v
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                  : "border-neutral-300 bg-white text-neutral-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-400"
              }`}
            >
              {v}
            </button>
          ))}
          <button
            onClick={() => setVideoOnly(!videoOnly)}
            className={`rounded-full border px-3 py-1 ${
              videoOnly
                ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                : "border-neutral-300 bg-white text-neutral-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-400"
            }`}
            title={edition === "china" ? "只看有B站视频的" : "只看有YouTube视频的"}
          >
            {edition === "china" ? "有B站视频" : "有YouTube视频"}
          </button>
        </div>
      </div>

      {/* 桌面表格 */}
      <Card className="hidden overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {(
                [
                  ["ep", "集数"],
                  ["name", "指标"],
                  ["perTrade", "每笔收益"],
                  ["winRate", "胜率"],
                  ["portfolio", "组合年化"],
                  ["verdict", "结论"],
                  ["video", edition === "china" ? "B站" : "视频"],
                ] as const
              ).map(([k, label]) => (
                <TableHead key={k}>
                  {k === "ep" || k === "perTrade" || k === "winRate" || k === "portfolio" ? (
                    <button
                      onClick={() => toggleSort(k as SortKey)}
                      className="hover:text-neutral-900 dark:hover:text-white"
                      title={`按${label}排序`}
                    >
                      {label}
                      {sortKey === k ? (asc ? " ↑" : " ↓") : " ↕"}
                    </button>
                  ) : (
                    label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="whitespace-nowrap text-neutral-500">
                  {i.ep !== null ? `第${i.ep}集` : "—"}
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`${prefix}/i/${i.id}/`} className="hover:underline">
                    {i.name}
                  </Link>
                </TableCell>
                <TableCell className="tabular-nums">{fmtPct(i.perTrade)}</TableCell>
                <TableCell className="tabular-nums">{i.winRate !== null ? `${i.winRate.toFixed(2)}%` : "—"}</TableCell>
                <TableCell className="tabular-nums">{fmtPct(i.portfolio)}</TableCell>
                <TableCell>
                  <VerdictBadge verdict={i.verdict} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {hasVideo(i, edition) ? (
                    <Link href={`${prefix}/i/${i.id}/`} className="text-blue-600 hover:underline">
                      {edition === "china" ? "B站观看" : "观看"}
                    </Link>
                  ) : (
                    <span className="text-neutral-300 dark:text-neutral-700">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* 移动端卡片 */}
      <div className="grid gap-3 md:hidden">
        <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
          排序：
          {(Object.keys(sortLabels) as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => toggleSort(k)}
              className={`rounded-full border px-2.5 py-1 ${
                sortKey === k
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                  : "border-neutral-300 dark:border-neutral-700"
              }`}
            >
              {sortLabels[k]}
              {sortKey === k ? (asc ? "↑" : "↓") : ""}
            </button>
          ))}
        </div>
        {rows.map((i) => (
          <Link key={i.id} href={`${prefix}/i/${i.id}/`}>
            <Card className="p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-medium">
                  {i.ep !== null ? `第${i.ep}集 · ` : ""}
                  {i.name}
                </span>
                <VerdictBadge verdict={i.verdict} />
              </div>
              <div className="flex flex-wrap gap-4 text-sm tabular-nums text-neutral-600 dark:text-neutral-400">
                <span>
                  每笔 <b className="text-neutral-900 dark:text-white">{fmtPct(i.perTrade)}</b>
                </span>
                <span>
                  胜率 <b className="text-neutral-900 dark:text-white">{i.winRate !== null ? `${i.winRate.toFixed(2)}%` : "—"}</b>
                </span>
                <span>
                  组合 <b className="text-neutral-900 dark:text-white">{fmtPct(i.portfolio)}</b>
                </span>
              </div>
              <div className="mt-2 text-xs text-neutral-400">
                {hasVideo(i, edition)
                  ? edition === "china"
                    ? "▶ 有B站视频 · 点击看文章+视频"
                    : "▶ 有视频 · 点击看文章+视频"
                  : "📄 文章版 · 点击查看"}
              </div>
            </Card>
          </Link>
        ))}
        {rows.length === 0 && <p className="py-8 text-center text-neutral-400">没有符合条件的指标</p>}
      </div>

      {rows.length === 0 && (
        <p className="hidden py-8 text-center text-neutral-400 md:block">没有符合条件的指标</p>
      )}
      <p className="mt-3 text-xs text-neutral-400">
        表格可搜索、可按结论筛选{edition === "china" ? "、可按有无B站视频筛选" : "、可按有无视频筛选"}，点击列头可排序。“—”表示该数字在来源中不存在，绝不编造。
      </p>
    </div>
  );
}
