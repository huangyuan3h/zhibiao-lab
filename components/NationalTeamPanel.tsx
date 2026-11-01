import { Card } from "@/components/ui/card";
import NationalTeamCharts from "@/components/NationalTeamCharts";
import {
  NT_ASOF,
  NT_GENERATED,
  NT_SERIES,
  NT_SOURCE,
  NT_SUMMARY,
  fmtNum,
  fmtSigned,
} from "@/lib/national-team";

export default function NationalTeamPanel({ edition }: { edition: "china" | "global" }) {
  const s = NT_SUMMARY;
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">资金流全景</h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
        {edition === "global" ? "Lao Huang Tests Indicators · " : ""}
        与 Karios 桌面同源的公开代理数据：国家队宽基 ETF 份额、两融余额、北向资金。截至{" "}
        <b className="text-neutral-800 dark:text-neutral-200">{NT_ASOF}</b>
        ，生成于 {NT_GENERATED}。
      </p>

      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        {NT_SOURCE.note}
      </p>

      <Card className="mt-6 flex flex-wrap gap-x-5 gap-y-2 p-4 text-sm text-neutral-600 dark:text-neutral-300">
        <span>
          国家队{" "}
          <b className="tabular-nums text-[#0ea5e9]">
            {s.etfShareYi != null ? `${fmtNum(s.etfShareYi, 1)} 亿份` : "—"}
          </b>
          {s.etfShareD20Pct != null ? (
            <span className="ml-1 text-neutral-500">· Δ20 {fmtSigned(s.etfShareD20Pct, 1, "%")}</span>
          ) : null}
        </span>
        <span>
          两融{" "}
          <b className="tabular-nums text-purple-600 dark:text-purple-300">
            {s.marginTrillion != null ? `${fmtNum(s.marginTrillion, 3)} 万亿` : "—"}
          </b>
          {s.marginD20Pct != null ? (
            <span className="ml-1 text-neutral-500">· Δ20 {fmtSigned(s.marginD20Pct, 1, "%")}</span>
          ) : null}
        </span>
        <span>
          北向20日{" "}
          <b className="tabular-nums text-teal-600 dark:text-teal-300">
            {fmtSigned(s.northD20Yi, 0, " 亿")}
          </b>
        </span>
        <span className="w-full text-xs text-neutral-400">
          近 {s.n_days} 个交易日（{s.range.from} → {s.range.to}）· 代码{" "}
          {NT_SOURCE.codes.join(" / ")}
        </span>
      </Card>

      <NationalTeamCharts series={NT_SERIES} />

      <p className="mt-6 text-xs leading-relaxed text-neutral-400">
        表：{NT_SOURCE.tables.join("、")}；北向口径断点 {NT_SOURCE.hsgtBreakDate}。投资者教育，不构成投资建议。
      </p>
    </div>
  );
}
