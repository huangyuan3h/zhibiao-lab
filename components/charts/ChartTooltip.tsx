"use client";

// 移植自 Karios desktop FundFlowPanel 的 MiniTooltip 思路：
// 小卡片、色点 + 数值右对齐、等宽数字，深浅色都可读，触屏点按即出。
export default function ChartTooltip({
  active,
  label,
  rows,
}: {
  active?: boolean;
  label?: string | number;
  rows: Array<{ name: string; value: string; color?: string }>;
}) {
  if (!active) return null;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[11px] shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      {label != null && label !== "" && (
        <div className="mb-1 font-medium text-neutral-900 dark:text-white">{label}</div>
      )}
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
              {r.color && (
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: r.color }} />
              )}
              {r.name}
            </span>
            <span className="font-mono tabular-nums text-neutral-900 dark:text-white">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
