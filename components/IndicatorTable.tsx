"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Indicator } from "@/lib/data";
import { fmtPct, youtubeWatch } from "@/lib/data";
import VerdictBadge from "./VerdictBadge";

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

export default function IndicatorTable({ items }: { items: Indicator[] }) {
  const [query, setQuery] = useState("");
  const [verdict, setVerdict] = useState<"全部" | "不赚钱" | "有苗头" | "只研究">("全部");
  const [sortKey, setSortKey] = useState<SortKey>("ep");
  const [asc, setAsc] = useState(true);

  const rows = useMemo(() => {
    const q = query.trim();
    let list = items.filter(
      (i) =>
        (verdict === "全部" || i.verdict === verdict) &&
        (q === "" || i.name.includes(q) || (i.title ?? "").includes(q))
    );
    list = [...list].sort((a, b) => {
      const d = sortVal(a, sortKey) - sortVal(b, sortKey);
      return asc ? d : -d;
    });
    return list;
  }, [items, query, verdict, sortKey, asc]);

  function toggleSort(k: SortKey) {
    if (k === sortKey) setAsc(!asc);
    else {
      setSortKey(k);
      setAsc(k === "ep");
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索指标名…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none sm:max-w-xs"
        />
        <div className="flex gap-2 text-sm">
          {(["全部", "不赚钱", "有苗头", "只研究"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVerdict(v)}
              className={`rounded-full border px-3 py-1 ${
                verdict === v
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 bg-white text-gray-600"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* 桌面表格 */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 md:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              {(
                [
                  ["ep", "集数"],
                  ["name", "指标"],
                  ["perTrade", "每笔收益"],
                  ["winRate", "胜率"],
                  ["portfolio", "组合年化"],
                  ["verdict", "结论"],
                  ["link", "视频"],
                ] as const
              ).map(([k, label]) => (
                <th key={k} className="whitespace-nowrap px-4 py-3 font-medium">
                  {k === "ep" || k === "perTrade" || k === "winRate" || k === "portfolio" ? (
                    <button
                      onClick={() => toggleSort(k as SortKey)}
                      className="hover:text-gray-900"
                      title={`按${label}排序`}
                    >
                      {label}
                      {sortKey === k ? (asc ? " ↑" : " ↓") : " ↕"}
                    </button>
                  ) : (
                    label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((i) => (
              <tr key={i.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                  {i.ep !== null ? `第${i.ep}集` : "—"}
                </td>
                <td className="px-4 py-3 font-medium">
                  <Link href={`/i/${i.id}/`} className="text-gray-900 hover:underline">
                    {i.name}
                  </Link>
                </td>
                <td className={`px-4 py-3 tabular-nums ${i.perTrade !== null && i.perTrade > 0 ? "text-amber-700" : "text-gray-900"}`}>
                  {fmtPct(i.perTrade)}
                </td>
                <td className="px-4 py-3 tabular-nums">{i.winRate !== null ? `${i.winRate.toFixed(2)}%` : "—"}</td>
                <td className="px-4 py-3 tabular-nums">{fmtPct(i.portfolio)}</td>
                <td className="px-4 py-3">
                  <VerdictBadge verdict={i.verdict} />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {i.youtube ? (
                    <a
                      href={youtubeWatch(i.youtube) ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      观看
                    </a>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 移动端卡片 */}
      <div className="grid gap-3 md:hidden">
        <div className="flex gap-2 text-xs text-gray-500">
          排序：
          {(Object.keys(sortLabels) as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => toggleSort(k)}
              className={`rounded-full border px-2.5 py-1 ${
                sortKey === k ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300"
              }`}
            >
              {sortLabels[k]}
              {sortKey === k ? (asc ? "↑" : "↓") : ""}
            </button>
          ))}
        </div>
        {rows.map((i) => (
          <Link
            key={i.id}
            href={`/i/${i.id}/`}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="font-medium text-gray-900">
                {i.ep !== null ? `第${i.ep}集 · ` : ""}
                {i.name}
              </span>
              <VerdictBadge verdict={i.verdict} />
            </div>
            <div className="flex gap-4 text-sm tabular-nums text-gray-600">
              <span>
                每笔 <b className="text-gray-900">{fmtPct(i.perTrade)}</b>
              </span>
              <span>
                胜率 <b className="text-gray-900">{i.winRate !== null ? `${i.winRate.toFixed(2)}%` : "—"}</b>
              </span>
              <span>
                组合 <b className="text-gray-900">{fmtPct(i.portfolio)}</b>
              </span>
            </div>
          </Link>
        ))}
        {rows.length === 0 && <p className="py-8 text-center text-gray-400">没有符合条件的指标</p>}
      </div>

      {rows.length === 0 && (
        <p className="hidden py-8 text-center text-gray-400 md:block">没有符合条件的指标</p>
      )}
    </div>
  );
}
