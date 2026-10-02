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
  const description = `${i.title ?? i.name}｜老黄测指标 · 系列「什么指标不赚钱」第${i.ep}集（国内版）：每笔${fmtPct(i.perTrade)}，胜率${i.winRate !== null ? i.winRate.toFixed(2) + "%" : "—"}，组合年化${fmtPct(i.portfolio)}。B站视频+文章。历史回测，不构成投资建议。`;
  const path = `/i/${id}/`;
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: { "zh-CN": `${SITE_URL}${path}`, zh: `${SITE_URL}/global${path}`, "x-default": `${SITE_URL}${path}` },
    },
    openGraph: { title, description, type: "article", url: `${SITE_URL}${path}` },
  };
}

export default async function IndicatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const i = getIndicator(id);
  if (!i || i.ep === null) notFound();
  return <IndicatorDetail id={id} edition="china" />;
}
