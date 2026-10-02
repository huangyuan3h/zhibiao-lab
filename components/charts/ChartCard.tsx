import * as React from "react";
import { Card } from "@/components/ui/card";

// shadcn 极简卡片：中性边框 + 大留白，深浅色都可读。图表区高度移动端 220，桌面 260。
export default function ChartCard({
  title,
  subtitle,
  source,
  children,
  tall,
}: {
  title: string;
  subtitle?: string;
  source?: string;
  children: React.ReactNode;
  tall?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-neutral-100 px-4 pt-4 pb-3 dark:border-neutral-900">
        <h3 className="text-sm font-bold">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            {subtitle}
          </p>
        )}
      </div>
      <div className={`px-2 pt-2 pb-1 ${tall ? "h-[300px]" : "h-[240px] sm:h-[260px]"}`}>
        {children}
      </div>
      {source && (
        <p className="px-4 pb-3 text-[11px] text-neutral-400">数据来源：{source}</p>
      )}
    </Card>
  );
}

export function ChartSkeleton({ label }: { label?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <p className="animate-pulse text-xs text-neutral-400">图表加载中{label ? ` · ${label}` : ""}…</p>
    </div>
  );
}

export function ChartEmpty({ label }: { label?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center px-6 text-center">
      <p className="text-xs leading-relaxed text-neutral-400">
        {label ?? "本集暂无该图表数据，以文章数字为准。"}
      </p>
    </div>
  );
}
