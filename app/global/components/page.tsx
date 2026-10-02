import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import Showcase from "@/components/charts/Showcase";

export const metadata: Metadata = {
  title: "图表组件展示 · 海外版",
  description: "zhibiao-lab 可复用交互图表组件展示（内部页，不收录）。",
  alternates: { canonical: `${SITE_URL}/global/components/` },
  robots: { index: false, follow: false },
};

export default function GlobalComponentsPage() {
  return (
    <div>
      <Link href="/global/" className="text-sm text-neutral-400 hover:text-neutral-600">
        ← 返回首页
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">图表组件展示</h1>
      <p className="mt-1 text-sm text-neutral-500">
        海外版 · 内部页（noindex，不进 sitemap）。{" "}
        <Link href="/components/" className="hover:underline">
          国内版展示 →
        </Link>
      </p>
      <div className="mt-6">
        <Showcase demoId="macd_golden_cross" />
      </div>
    </div>
  );
}
