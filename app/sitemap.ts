import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
import { AIRED } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const china: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/leads/`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about/`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/request/`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...AIRED.map((i) => ({
      url: `${SITE_URL}/i/${i.id}/` as string,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
  const global: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/global/`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/global/leads/`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/global/about/`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/global/request/`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    ...AIRED.map((i) => ({
      url: `${SITE_URL}/global/i/${i.id}/` as string,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
  return [...china, ...global];
}
