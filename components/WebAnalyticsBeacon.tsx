"use client";

import Script from "next/script";

// Cloudflare Web Analytics（大陆可加载，不用 Google）。
// 优先用 Pages 项目自带的 Web Analytics（一键启用后 Cloudflare 会在下次部署自动注入，
// 本组件无需改动也能共存）；如果 Dashboard 里建了独立的 Web Analytics site，
// 把它的 token 填到 NEXT_PUBLIC_CF_BEACON_TOKEN（或下面的常量），两版（/ 与 /global/）
// 共用同一 layout，都会被统计到。
// 大陆加载域名：static.cloudflareinsights.com 可直连。
const BEACON_TOKEN = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN || "";

export default function WebAnalyticsBeacon() {
  if (!BEACON_TOKEN) return null;
  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token: BEACON_TOKEN })}
      strategy="afterInteractive"
    />
  );
}
