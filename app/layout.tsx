import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WebAnalyticsBeacon from "@/components/WebAnalyticsBeacon";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: "%s · 老黄测指标",
  },
  description: "老黄测指标：用 A 股历史数据回测散户常用指标，系列「什么指标不赚钱」每一集都有真实回测数字，视频+文章双版本。",
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
  appleWebApp: { capable: true, title: "老黄测指标", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: "老黄测指标：用 A 股历史数据回测散户常用指标，系列「什么指标不赚钱」大多数不赚钱。",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "老黄测指标：用 A 股历史数据回测散户常用指标，系列「什么指标不赚钱」大多数不赚钱。",
    images: ["/og.png"],
  },
};

function ThemeScript() {
  // 无闪烁深色模式：读 localStorage，否则跟随系统
  const code = `(function(){try{var t=localStorage.getItem('zhibiao-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: "老黄测指标",
        alternateName: "Lao Huang Tests Indicators",
        inLanguage: "zh-CN",
        author: { "@type": "Person", name: "躺平的老黄" },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#org`,
        name: "老黄测指标",
        url: `${SITE_URL}/`,
      },
    ],
  };
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">{children}</main>
        <SiteFooter />
        <WebAnalyticsBeacon />
      </body>
    </html>
  );
}
