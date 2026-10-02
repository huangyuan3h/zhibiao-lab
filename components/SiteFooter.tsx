"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { editionFromPath } from "@/lib/site";
import { PLAYLIST_URL } from "@/lib/data";

export default function SiteFooter() {
  const pathname = usePathname();
  const edition = editionFromPath(pathname);
  const isGlobal = edition === "global";

  return (
    <footer className="border-t border-neutral-200 bg-white pb-safe dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto max-w-5xl px-4 py-8 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/" className="hover:text-neutral-900 dark:hover:text-white">
            国内版（B站）
          </Link>
          <Link href="/global/" className="hover:text-neutral-900 dark:hover:text-white">
            海外版（YouTube）
          </Link>
          <Link
            href={isGlobal ? "/global/leads/" : "/leads/"}
            className="hover:text-neutral-900 dark:hover:text-white"
          >
            有苗头
          </Link>
          <Link
            href={isGlobal ? "/global/about/" : "/about/"}
            className="hover:text-neutral-900 dark:hover:text-white"
          >
            回测方法
          </Link>
          <Link
            href={isGlobal ? "/global/request/" : "/request/"}
            className="hover:text-neutral-900 dark:hover:text-white"
          >
            想测指标
          </Link>
          {!isGlobal ? (
            <a
              href="https://www.bilibili.com/video/BV13MaG6MEbE"
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-900 dark:hover:text-white"
            >
              B站合集 ↗
            </a>
          ) : (
            <a
              href={PLAYLIST_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-900 dark:hover:text-white"
            >
              YouTube 播放列表 ↗
            </a>
          )}
        </div>
        <p className="mt-4">老黄测指标 · 作者：躺平的老黄 · 系列「什么指标不赚钱」/ 栏目「有点苗头」（即将上线）</p>
        <p className="mt-1 font-medium text-neutral-700 dark:text-neutral-300">
          投资者教育，不构成投资建议。以上均为历史回测，过往业绩不代表未来表现，投资有风险，入市需谨慎。
        </p>
      </div>
    </footer>
  );
}
