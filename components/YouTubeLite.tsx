"use client";

import * as React from "react";
import { youtubeNocookieEmbed, youtubeThumbnail, youtubeWatch } from "@/lib/data";

// 轻量 facade：点击前不加载任何 YouTube iframe，只有一张缩略图 + 播放按钮
export default function YouTubeLite({ videoId, title }: { videoId: string; title: string }) {
  const [play, setPlay] = React.useState(false);
  const embed = youtubeNocookieEmbed(videoId);
  const watch = youtubeWatch(videoId);

  if (play && embed) {
    return (
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-black dark:border-neutral-800">
        <iframe
          className="aspect-video w-full"
          src={`${embed}&autoplay=1`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
      <button
        onClick={() => setPlay(true)}
        className="relative block w-full text-left"
        aria-label={`播放视频：${title}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={youtubeThumbnail(videoId)}
          alt={title}
          loading="lazy"
          className="aspect-video w-full bg-neutral-100 object-cover dark:bg-neutral-900"
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/70 text-2xl text-white">
            ▶
          </span>
        </span>
        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
          YouTube · 点击加载
        </span>
      </button>
      {watch && (
        <div className="flex items-center justify-between bg-white px-4 py-2 text-sm dark:bg-neutral-950">
          <span className="truncate text-neutral-500">{title}</span>
          <a href={watch} target="_blank" rel="noreferrer" className="ml-3 shrink-0 text-blue-600 hover:underline">
            在 YouTube 观看
          </a>
        </div>
      )}
    </div>
  );
}
