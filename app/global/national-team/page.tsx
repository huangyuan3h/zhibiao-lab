import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import NationalTeamPanel from "@/components/NationalTeamPanel";

export const metadata: Metadata = {
  title: "Fund Flow Panorama · 资金流全景（海外版）",
  description:
    "Lao Huang Tests Indicators · National-team ETF shares, margin balance, northbound flow. Static daily sync from Karios. Educational only.",
  alternates: {
    canonical: `${SITE_URL}/global/national-team/`,
    languages: {
      "zh-CN": `${SITE_URL}/national-team/`,
      zh: `${SITE_URL}/global/national-team/`,
      "x-default": `${SITE_URL}/global/national-team/`,
    },
  },
};

export default function GlobalNationalTeamPage() {
  return <NationalTeamPanel edition="global" />;
}
