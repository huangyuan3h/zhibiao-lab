import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import NationalTeamPanel from "@/components/NationalTeamPanel";

export const metadata: Metadata = {
  title: "资金流全景（国家队 / 两融 / 北向）",
  description:
    "老黄测指标 · 资金流全景：国家队宽基 ETF 份额、两融余额、北向资金，与 Karios 同源静态每日同步。非持股名单，不构成投资建议。",
  alternates: {
    canonical: `${SITE_URL}/national-team/`,
    languages: {
      "zh-CN": `${SITE_URL}/national-team/`,
      zh: `${SITE_URL}/global/national-team/`,
      "x-default": `${SITE_URL}/national-team/`,
    },
  },
};

export default function NationalTeamPage() {
  return <NationalTeamPanel edition="china" />;
}
