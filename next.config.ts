import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 纯静态站：构建产物为 ./out，可直接 wrangler pages deploy
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
