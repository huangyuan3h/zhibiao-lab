import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import RequestForm from "@/components/RequestForm";

export const metadata: Metadata = {
  title: "你想测哪个指标？",
  description: "老黄测指标 · 告诉我们你想测的技术指标：名称必填，用法/市场/联系邮箱选填。提交后会进入回测选题池。",
  alternates: {
    canonical: `${SITE_URL}/request/`,
    languages: { "zh-CN": `${SITE_URL}/request/`, zh: `${SITE_URL}/global/request/`, "x-default": `${SITE_URL}/request/` },
  },
};

export default function RequestPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm text-neutral-400">
        <a href="/" className="hover:underline">← 返回首页</a>
        <span className="mx-2">·</span>
        <a href="/global/request/" className="hover:underline">海外版 →</a>
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">你想测哪个指标？</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
        填一个你最想看回测的指标（名称必填）。我们会按顺序挑选题做成节目：次日开盘买、拿 5 天后开盘卖，每笔扣往返
        0.30% 费用，并和随机买入对照。
      </p>
      <div className="mt-5">
        <RequestForm />
      </div>
      <p className="mt-4 text-xs leading-relaxed text-neutral-400">
        投资者教育，不构成投资建议。提交的内容仅用于选题，联系邮箱不会公开。
      </p>
    </div>
  );
}
