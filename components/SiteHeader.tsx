"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { Sheet, SheetContent } from "./ui/sheet";
import { Button } from "./ui/button";
import { editionFromPath, counterpartUrl } from "@/lib/site";

export default function SiteHeader() {
  const pathname = usePathname();
  const edition = editionFromPath(pathname);
  const prefix = edition === "global" ? "/global" : "";
  const [open, setOpen] = React.useState(false);

  const links = [
    { href: `${prefix}/` || "/", label: "首页" },
    { href: `${prefix}/leads/`, label: "有苗头" },
    { href: `${prefix}/about/`, label: "方法" },
  ];

  const switchHref =
    !pathname || pathname.includes("_not-found") || pathname === "/404" || pathname === "/404/"
      ? edition === "china"
        ? "/global/"
        : "/"
      : counterpartUrl(pathname || "/", edition);
  const switchLabel = edition === "china" ? "海外版 →" : "国内版 →";

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href={`${prefix}/` || "/"} className="text-[15px] font-bold tracking-tight">
          什么指标不赚钱
          <span className="ml-2 hidden rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 sm:inline-block dark:bg-neutral-900">
            {edition === "china" ? "国内版" : "海外版"}
          </span>
        </Link>
        <div className="hidden items-center gap-1 text-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={switchHref}
            className="ml-1 rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400"
            title={edition === "china" ? "切换到 YouTube 的海外版" : "切换到 B站 的国内版"}
          >
            {switchLabel}
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <Link
            href={switchHref}
            className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-500 dark:border-neutral-800"
          >
            {edition === "china" ? "海外版" : "国内版"}
          </Link>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label="打开菜单">
            ☰
          </Button>
        </div>
      </nav>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-bold">什么指标不赚钱</span>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} aria-label="关闭菜单">
              ✕
            </Button>
          </div>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-[15px] text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900"
            >
              {l.label}
            </Link>
          ))}
          <p className="mt-4 px-3 text-xs leading-relaxed text-neutral-400">
            作者：躺平的老黄
            <br />
            投资者教育，不构成投资建议。
          </p>
        </SheetContent>
      </Sheet>
    </header>
  );
}
