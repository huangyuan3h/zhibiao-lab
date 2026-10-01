import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "什么指标不赚钱 · 指标实验室",
    template: "%s · 什么指标不赚钱",
  },
  description: "用 A 股历史数据回测散户常用指标：大多数不赚钱。每一集都有真实回测数字。",
  authors: [{ name: "躺平的老黄" }],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "什么指标不赚钱 · 指标实验室",
    title: "什么指标不赚钱 · 指标实验室",
    description: "用 A 股历史数据回测散户常用指标：大多数不赚钱。",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <header className="border-b border-gray-200 bg-white">
          <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-bold">
              什么指标不赚钱
            </Link>
            <div className="flex gap-4 text-sm text-gray-600">
              <Link href="/" className="hover:text-gray-900">
                首页
              </Link>
              <Link href="/leads/" className="hover:text-gray-900">
                有苗头
              </Link>
              <Link href="/about/" className="hover:text-gray-900">
                方法
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
        <footer className="border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-6 text-xs leading-relaxed text-gray-500">
            <p>作者：躺平的老黄 · 系列「什么指标不赚钱」</p>
            <p className="mt-1 font-medium text-gray-700">
              以上均为历史回测，不构成投资建议。过往业绩不代表未来表现，投资有风险，入市需谨慎。
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
