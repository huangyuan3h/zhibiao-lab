import type { Metadata } from "next";
import Link from "next/link";
import { LEADS, fmtPct } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import VerdictBadge from "@/components/VerdictBadge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "有苗头的指标",
  description: "老黄测指标 · 回测中发现的赚钱苗头：每笔扣费后为正、或事件/组合分位明显优于随机。未经样本外验证，仅供研究，不构成投资建议。",
  alternates: {
    canonical: `${SITE_URL}/leads/`,
    languages: { "zh-CN": `${SITE_URL}/leads/`, zh: `${SITE_URL}/global/leads/`, "x-default": `${SITE_URL}/leads/` },
  },
};

export default function LeadsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">有苗头的指标</h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
        老黄测指标 · 零散苗头合集（注意：与即将上线的栏目「有点苗头」不是同一个东西，后者是约 50 集表现较好指标的系列，现在还没有数据）。
      </p>
      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        以下指标在回测中出现赚钱苗头（每笔扣费后为正，或分位明显优于随机），但
        <b>未经样本外验证</b>，组合层面大多仍亏，需要继续验证仓位、止损与滑点。请勿据此交易。
      </p>
      <div className="mt-6 grid gap-3">
        {LEADS.map((i) => (
          <Card key={i.id} className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{i.name}</span>
              <VerdictBadge verdict={i.verdict} />
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm tabular-nums text-neutral-600 dark:text-neutral-400">
              <span>
                每笔 <b className="text-neutral-900 dark:text-white">{fmtPct(i.perTrade)}</b>
              </span>
              <span>
                组合 <b className="text-neutral-900 dark:text-white">{fmtPct(i.portfolio)}</b>
              </span>
              <span>
                事件分位 <b className="text-neutral-900 dark:text-white">{i.eventPct !== null ? `${i.eventPct.toFixed(1)}%` : "—"}</b>
              </span>
            </div>
            {i.note && <p className="mt-2 text-sm text-neutral-500">{i.note}</p>}
          </Card>
        ))}
      </div>
      <p className="mt-6 text-sm text-neutral-500">
        共性：超跌/抄底类每笔有优势，追涨类普遍输给随机；但组合层面仍亏，需解决仓位与择时。
        <Link href="/about/" className="text-blue-600 hover:underline">
          查看回测方法
        </Link>
      </p>
      <p className="mt-4 rounded-xl bg-neutral-100 p-4 text-xs font-medium text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
        投资者教育，不构成投资建议。以上均为历史回测，过往业绩不代表未来表现，投资有风险，入市需谨慎。
      </p>
    </div>
  );
}
