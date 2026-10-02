import type { Metadata } from "next";
import AdminPanel from "@/components/AdminPanel";

export const metadata: Metadata = {
  title: "管理后台",
  description: "指标请求管理（私有）",
  robots: { index: false, follow: false },
};

export default function GlobalAdminPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-bold">请求管理（私有）</h1>
      <p className="mt-1 text-xs text-neutral-400">本页 noindex、不在站内链接，凭 Token 访问 /api/admin。</p>
      <div className="mt-4">
        <AdminPanel />
      </div>
    </div>
  );
}
