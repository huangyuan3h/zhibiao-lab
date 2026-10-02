"use client";

import ChartCard, { ChartEmpty, ChartSkeleton } from "./ChartCard";
import { C, SRC } from "./chart-theme";
import { useChartData } from "./useChartData";

// 移植 kseries 07_random_stocks_grid：2012 年随机抽 12 只、只做该信号再和持有比。
// 「第一组：x/12 跑赢」——小多组网格（small-multiples），纯 CSS，不引新库。
const SEED_LABEL: Record<string, string> = { "20260925": "第一组", "1": "第二组", "2": "第三组" };

export default function RandomStocksGrid({ id }: { id: string }) {
  const { data, error } = useChartData(id);
  const seeds = data?.seeds ? Object.entries(data.seeds) : [];
  return (
    <ChartCard
      title="随机 12 只：拿着不动赢了吗"
      subtitle="从 2012 年初股票池随机抽 12 只，只做该信号 vs 一直持有。跑赢只数越少，越说明不如拿着不动。"
      source={SRC}
      tall
    >
      {!data && !error && <ChartSkeleton label="12只" />}
      {(error || (data && !seeds.length)) && <ChartEmpty />}
      {!!seeds.length && (
        <div className="h-full overflow-y-auto px-3 pb-2">
          {seeds.map(([seed, s]) => (
            <div key={seed} className="mt-1 first:mt-0">
              <p className="py-1 text-xs font-bold">
                {SEED_LABEL[seed] ?? `种子 ${seed}`}：
                <span style={{ color: (s.k_beat ?? 99) <= 4 ? C.loss : C.gain }}>
                  {s.k_beat ?? "—"}/{s.n} 跑赢持有
                </span>
              </p>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                {s.rows.map((r) => (
                  <div
                    key={r.code}
                    className="rounded-lg border border-neutral-200 px-2 py-1.5 dark:border-neutral-800"
                    style={{ borderLeft: `3px solid ${r.beat ? C.gain : C.loss}` }}
                    title={`${r.name} ${r.code}：信号 ${r.strat == null ? "—" : `${(r.strat * 100).toFixed(1)}%`} vs 持有 ${r.bh == null ? "—" : `${(r.bh * 100).toFixed(1)}%`}`}
                  >
                    <p className="truncate text-[11px] font-medium">{r.name}</p>
                    <p className="font-mono text-[10px] tabular-nums text-neutral-500">
                      {r.beat ? "跑赢" : "跑输"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}
