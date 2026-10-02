import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: "%s · 什么指标不赚钱",
  },
  description: "用 A 股历史数据回测散户常用指标：大多数不赚钱。每一集都有真实回测数字，视频+文章双版本。",
  authors: [{ name: "躺平的老黄" }],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  appleWebApp: { capable: true, title: "指标实验室", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: "用 A 股历史数据回测散户常用指标：大多数不赚钱。",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "用 A 股历史数据回测散户常用指标：大多数不赚钱。",
    images: ["/og.png"],
  },
};

function ThemeScript() {
  // 无闪烁深色模式：读 localStorage，否则跟随系统
  const code = `(function(){try{var t=localStorage.getItem('zhibiao-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">{children}</main>
        <footer className="border-t border-neutral-200 bg-white pb-safe dark:border-neutral-800 dark:bg-neutral-950">
          <div className="mx-auto max-w-5xl px-4 py-8 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link href="/" className="hover:text-neutral-900 dark:hover:text-white">
                国内版（B站）
              </Link>
              <Link href="/global/" className="hover:text-neutral-900 dark:hover:text-white">
                海外版（YouTube）
              </Link>
              <Link href="/leads/" className="hover:text-neutral-900 dark:hover:text-white">
                有苗头
              </Link>
              <Link href="/about/" className="hover:text-neutral-900 dark:hover:text-white">
                回测方法
              </Link>
            </div>
            <p className="mt-4">作者：躺平的老黄 · 系列「什么指标不赚钱」</p>
            <p className="mt-1 font-medium text-neutral-700 dark:text-neutral-300">
              投资者教育，不构成投资建议。以上均为历史回测，过往业绩不代表未来表现，投资有风险，入市需谨慎。
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
