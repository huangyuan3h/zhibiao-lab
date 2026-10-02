"use client";

import * as React from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { TURNSTILE_SITEKEY, validateRequest } from "@/lib/request-validation";

const MARKETS = ["A股", "港股", "美股", "其他"] as const;

declare global {
  interface Window {
    turnstile?: { getResponse: (id?: string) => string; reset: (id?: string) => void };
  }
}

export default function RequestForm() {
  const [indicator, setIndicator] = React.useState("");
  const [usage, setUsage] = React.useState("");
  const [market, setMarket] = React.useState<string>("A股");
  const [contact, setContact] = React.useState("");
  const [website, setWebsite] = React.useState(""); // 蜜罐
  const [status, setStatus] = React.useState<"idle" | "sending" | "ok" | "err">("idle");
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
    return () => {
      try {
        document.head.removeChild(s);
      } catch {}
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validateRequest({ indicator, usage, market, contact, website });
    if (!v.ok) {
      setStatus("err");
      setMsg(v.error ?? "请检查输入");
      return;
    }
    setStatus("sending");
    setMsg("");
    let turnstile = "";
    try {
      const el = document.querySelector<HTMLInputElement>('[name="cf-turnstile-response"]');
      turnstile = el?.value || window.turnstile?.getResponse() || "";
    } catch {}
    try {
      const r = await fetch("/api/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ indicator, usage, market, contact, website, turnstile }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.ok) {
        setStatus("ok");
        setMsg("收到！已记下来，会按顺序回测，出了结果会在节目里讲。");
        setIndicator("");
        setUsage("");
        setContact("");
        setWebsite("");
        try {
          window.turnstile?.reset();
        } catch {}
      } else {
        setStatus("err");
        setMsg(j?.error || `提交失败（${r.status}），请稍后重试`);
        try {
          window.turnstile?.reset();
        } catch {}
      }
    } catch {
      setStatus("err");
      setMsg("网络开小差，请稍后重试");
    }
  }

  const inputCls =
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[15px] outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-400";

  return (
    <Card className="p-5 sm:p-7">
      {status === "ok" ? (
        <div className="py-6 text-center">
          <p className="text-2xl">✅</p>
          <p className="mt-2 font-bold">收到！</p>
          <p className="mt-1 text-sm text-neutral-500">{msg}</p>
          <Button variant="outline" className="mt-4" onClick={() => setStatus("idle")}>
            再提一个
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="req-indicator" className="mb-1 block text-sm font-medium">
              想测的指标 <span className="text-red-500">*</span>
            </label>
            <input
              id="req-indicator"
              className={inputCls}
              placeholder="例如：RSI、MACD 金叉、布林带"
              value={indicator}
              onChange={(e) => setIndicator(e.target.value)}
              maxLength={50}
              required
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="req-usage" className="mb-1 block text-sm font-medium">
              你平时怎么用 / 参数 <span className="font-normal text-neutral-400">（选填）</span>
            </label>
            <textarea
              id="req-usage"
              className={`${inputCls} min-h-[88px] resize-y`}
              placeholder="例如：RSI(14) 跌破 30 买入；MACD 快慢线参数 12,26,9"
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
              maxLength={500}
            />
            <p className="mt-1 text-right text-xs text-neutral-400">{usage.length}/500</p>
          </div>
          <div>
            <span className="mb-1 block text-sm font-medium">市场</span>
            <div className="flex flex-wrap gap-2">
              {MARKETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMarket(m)}
                  aria-pressed={market === m}
                  className={`rounded-full border px-4 py-1.5 text-sm ${
                    market === m
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                      : "border-neutral-300 text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="req-contact" className="mb-1 block text-sm font-medium">
              联系邮箱 <span className="font-normal text-neutral-400">（选填，只用来追问参数）</span>
            </label>
            <input
              id="req-contact"
              className={inputCls}
              placeholder="例如：you@example.com（可留空）"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={100}
              inputMode="email"
              autoComplete="email"
            />
          </div>
          {/* 蜜罐：真人看不到 */}
          <div aria-hidden="true" className="hidden">
            <input
              tabIndex={-1}
              autoComplete="off"
              placeholder="company"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          <div>
            <div className="cf-turnstile" data-sitekey={TURNSTILE_SITEKEY} data-theme="auto" />
            <p className="mt-1 text-xs text-neutral-400">人机验证由 Cloudflare Turnstile 提供，国内可直接加载。</p>
          </div>
          {msg && status === "err" && <p className="text-sm text-red-600">{msg}</p>}
          <Button type="submit" disabled={status === "sending"}>
            {status === "sending" ? "提交中…" : "提交"}
          </Button>
          <p className="text-xs leading-relaxed text-neutral-400">
            提交即同意只用于选题回测。你的联系邮箱（如填）不会公开、不会群发。
          </p>
        </form>
      )}
    </Card>
  );
}
