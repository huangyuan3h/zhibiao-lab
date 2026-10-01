import type { Metadata } from "next";
import Link from "next/link";
import { LEADS, fmtPct } from "@/lib/data";
import VerdictBadge from "@/components/VerdictBadge";

export const metadata: Metadata = {
  title: "有苗头的指标",
  description: "回测中发现的赚钱苗头：每笔扣费后为正、或事件/组合分位明显优于随机。未经样本外验证，仅供研究，不构成投资建议。",
};

export default function LeadsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">有苗头的指标</h1>
      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
        以下指标在回测中出现赚钱苗头（每笔扣费后为正，或分位明显优于随机），但
        <b>未经样本外验证</b>，组合层面大多仍亏，需要继续验证仓位、止损与滑点。请勿据此交易。
      </p>
      <div className="mt-6 grid gap-3">
        {LEADS.map((i) => (
          <div key={i.id} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{i.name}</span>
              <VerdictBadge verdict={i.verdict} />
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm tabular-nums text-gray-600">
              <span>
                每笔 <b className="text-gray-900">{fmtPct(i.perTrade)}</b>
              </span>
              <span>
                组合 <b className="text-gray-900">{fmtPct(i.portfolio)}</b>
              </span>
              <span>
                事件分位 <b className="text-gray-900">{i.eventPct !== null ? `${i.eventPct.toFixed(1)}%` : "—"}</b>
              </span>
            </div>
            {i.note && <p className="mt-2 text-sm text-gray-500">{i.note}</p>}
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-gray-500">
        共性：超跌/抄底类每笔有优势，追涨类普遍输给随机；但组合层面仍亏，需解决仓位与择时。
        <Link href="/about/" className="text-blue-600 hover:underline">
          查看回测方法
        </Link>
      </p>
    </div>
  );
}
