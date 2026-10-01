import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AIRED, fmtNum, fmtPct, getIndicator, youtubeEmbed, youtubeWatch } from "@/lib/data";
import VerdictBadge from "@/components/VerdictBadge";

export function generateStaticParams() {
  return AIRED.map((i) => ({ id: i.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const i = getIndicator(id);
  if (!i) return { title: "未找到" };
  const title = `${i.name}为什么不赚钱？${fmtPct(i.perTrade)}每笔回测`;
  const description = `${i.title ?? i.name}｜什么指标不赚钱第${i.ep}集：每笔${fmtPct(i.perTrade)}，胜率${i.winRate !== null ? i.winRate.toFixed(2) + "%" : "—"}，组合年化${fmtPct(i.portfolio)}。历史回测，不构成投资建议。`;
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
  };
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

export default async function IndicatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const i = getIndicator(id);
  if (!i || i.ep === null) notFound();

  const embed = youtubeEmbed(i.youtube);
  const watch = youtubeWatch(i.youtube);

  return (
    <article>
      <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
        ← 返回全部指标
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">
          第{i.ep}集 · {i.name}
        </h1>
        <VerdictBadge verdict={i.verdict} />
      </div>
      {i.title && <p className="mt-1 text-gray-500">{i.title}｜什么指标不赚钱 第{i.ep}集</p>}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="每笔收益（扣费后）" value={fmtPct(i.perTrade)} sub={i.trades ? `共 ${fmtNum(i.trades)} 笔` : undefined} />
        <Stat label="每笔中位数" value={fmtPct(i.median)} />
        <Stat label="胜率" value={i.winRate !== null ? `${i.winRate.toFixed(2)}%` : "—"} />
        <Stat label="组合年化" value={fmtPct(i.portfolio)} sub="10份等额轮动，空闲0收益" />
        <Stat label="事件分位（vs随机）" value={i.eventPct !== null ? `${i.eventPct.toFixed(1)}%` : "—"} sub="越低越差于随机" />
        <Stat label="组合分位（vs随机）" value={i.portfolioPct !== null ? `${i.portfolioPct.toFixed(1)}%` : "—"} sub="越低越差于随机" />
      </div>

      {i.note && (
        <p className="mt-4 rounded-xl bg-gray-100 p-4 text-sm leading-relaxed text-gray-700">{i.note}</p>
      )}

      {i.example && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-bold">节目中的例子</h2>
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed">
            <p className="font-medium">{i.example.stock}</p>
            <p className="mt-1 text-gray-600">{i.example.detail}</p>
            <p className="mt-2 text-xs text-gray-400">单个例子只为演示流程，全市场结论看上面整表数字。</p>
          </div>
        </section>
      )}

      {embed && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-bold">本集视频</h2>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-black">
            <iframe
              className="aspect-video w-full"
              src={embed}
              title={i.title ?? i.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}

      <section className="mt-6 flex flex-wrap gap-3 text-sm">
        {watch && (
          <a href={watch} target="_blank" rel="noreferrer" className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700">
            ▶ 在 YouTube 观看
          </a>
        )}
        {i.zhihu && (
          <a href={i.zhihu} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:border-gray-400">
            知乎文章
          </a>
        )}
        {i.bili && (
          <a href={i.bili} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:border-gray-400">
            B站视频
          </a>
        )}
      </section>

      <p className="mt-6 text-xs text-gray-400">
        口径：信号次日开盘买、持有 5 个交易日后开盘卖，往返扣 0.30%。“—”表示来源中无该数字。
      </p>
    </article>
  );
}
