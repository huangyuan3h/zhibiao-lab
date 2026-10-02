import { Card } from "./ui/card";
import { fmtNum, fmtPct } from "@/lib/data";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-neutral-400">{sub}</div>}
    </Card>
  );
}

export default function StatsGrid({ i }: { i: any }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Stat label="每笔收益（扣费后）" value={fmtPct(i.perTrade)} sub={i.trades ? `共 ${fmtNum(i.trades)} 笔` : undefined} />
      <Stat label="每笔中位数" value={fmtPct(i.median)} />
      <Stat label="胜率" value={i.winRate !== null ? `${i.winRate.toFixed(2)}%` : "—"} />
      <Stat label="组合年化" value={fmtPct(i.portfolio)} sub="10份等额轮动，空闲0收益" />
      <Stat label="事件分位（vs随机）" value={i.eventPct !== null ? `${i.eventPct.toFixed(1)}%` : "—"} sub="越低越差于随机" />
      <Stat label="组合分位（vs随机）" value={i.portfolioPct !== null ? `${i.portfolioPct.toFixed(1)}%` : "—"} sub="越低越差于随机" />
    </div>
  );
}
