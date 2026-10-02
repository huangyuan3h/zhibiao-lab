"use client";

import * as React from "react";
import { biliBvid, biliEmbed } from "@/lib/data";

// B站 click-to-load：点击前不加载 player iframe，保持页面轻
export default function BiliLite({ biliUrl, title }: { biliUrl: string; title: string }) {
  const [play, setPlay] = React.useState(false);
  const bvid = biliBvid(biliUrl);
  const embed = biliEmbed(biliUrl);

  if (play && embed) {
    return (
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-black dark:border-neutral-800">
        <iframe
          className="aspect-video w-full"
          src={embed}
          title={title}
          loading="lazy"
          scrolling="no"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
      <button
        onClick={() => setPlay(true)}
        className="relative block w-full bg-neutral-900 text-left"
        aria-label={`播放B站视频：${title}`}
      >
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-2xl">
            ▶
          </span>
          <span className="max-w-[80%] truncate text-sm text-neutral-300">{title}</span>
          <span className="text-xs text-neutral-500">{bvid}</span>
        </div>
        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
          B站 · 点击加载
        </span>
      </button>
      <div className="flex items-center justify-between bg-white px-4 py-2 text-sm dark:bg-neutral-950">
        <span className="truncate text-neutral-500">B站视频 {bvid}</span>
        <a href={biliUrl} target="_blank" rel="noreferrer" className="ml-3 shrink-0 text-blue-600 hover:underline">
          在 B站观看
        </a>
      </div>
    </div>
  );
}
