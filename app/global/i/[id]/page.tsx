import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AIRED, fmtPct, getIndicator } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import IndicatorDetail from "@/components/IndicatorDetail";

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
  const description = `${i.title ?? i.name}｜什么指标不赚钱第${i.ep}集（海外版）：每笔${fmtPct(i.perTrade)}，胜率${i.winRate !== null ? i.winRate.toFixed(2) + "%" : "—"}，组合年化${fmtPct(i.portfolio)}。YouTube视频+文章。历史回测，不构成投资建议。`;
  const chinaPath = `/i/${id}/`;
  const path = `/global/i/${id}/`;
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: { "zh-CN": `${SITE_URL}${chinaPath}`, zh: `${SITE_URL}${path}`, "x-default": `${SITE_URL}${path}` },
    },
    openGraph: { title, description, type: "article", url: `${SITE_URL}${path}` },
  };
}

export default async function GlobalIndicatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const i = getIndicator(id);
  if (!i || i.ep === null) notFound();
  return <IndicatorDetail id={id} edition="global" />;
}
