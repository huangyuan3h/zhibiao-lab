"use client";

import * as React from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

interface Row {
  id: number;
  indicator: string;
  usage_text: string;
  market: string;
  contact: string;
  ip: string;
  turnstile_ok: number;
  email_status: string;
  created_at: string;
}

export default function AdminPanel() {
  const [token, setToken] = React.useState("");
  const [rows, setRows] = React.useState<Row[]>([]);
  const [counts, setCounts] = React.useState<{ indicator: string; c: number }[]>([]);
  const [msg, setMsg] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    try {
      const t = sessionStorage.getItem("zhibiao-admin-token") || "";
      if (t) setToken(t);
    } catch {}
  }, []);

  async function load(t?: string) {
    const tk = (t ?? token).trim();
    if (!tk) {
      setMsg("请先输入 Token");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const r = await fetch(`/api/admin?limit=500&token=${encodeURIComponent(tk)}`);
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) {
        setMsg(j?.error || `加载失败（${r.status}）`);
        return;
      }
      setRows(j.rows ?? []);
      setCounts(j.counts ?? []);
      try {
        sessionStorage.setItem("zhibiao-admin-token", tk);
      } catch {}
    } catch {
      setMsg("网络开小差");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Card className="p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="password"
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-950"
            placeholder="输入 ADMIN_TOKEN"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") load();
            }}
          />
          <Button onClick={() => load()} disabled={loading}>
            {loading ? "加载中…" : "加载"}
          </Button>
          <a
            className="inline-flex items-center justify-center rounded-lg border border-neutral-300 px-4 py-2 text-sm hover:border-neutral-400 dark:border-neutral-700"
            href={token ? `/api/admin?format=csv&token=${encodeURIComponent(token)}` : "#"}
            onClick={(e) => {
              if (!token) {
                e.preventDefault();
                setMsg("请先输入 Token");
              }
            }}
          >
            导出 CSV
          </a>
        </div>
        {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
      </Card>

      {counts.length > 0 && (
        <Card className="mt-4 p-4">
          <h2 className="text-sm font-bold">按指标计数（Top）</h2>
          <ul className="mt-2 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
            {counts.slice(0, 20).map((c) => (
              <li key={c.indicator} className="flex justify-between border-b border-neutral-100 py-1 dark:border-neutral-900">
                <span>{c.indicator}</span>
                <span className="font-bold tabular-nums">{c.c}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {rows.length > 0 && (
        <Card className="mt-4 overflow-x-auto p-4">
          <h2 className="mb-2 text-sm font-bold">最新提交（{rows.length}）</h2>
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="text-neutral-500">
                <th className="py-1 pr-2">id</th>
                <th className="py-1 pr-2">指标</th>
                <th className="py-1 pr-2">市场</th>
                <th className="py-1 pr-2">用法</th>
                <th className="py-1 pr-2">联系</th>
                <th className="py-1 pr-2">邮件</th>
                <th className="py-1 pr-2">时间(UTC)</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 200).map((r) => (
                <tr key={r.id} className="border-t border-neutral-100 dark:border-neutral-900">
                  <td className="py-1 pr-2 tabular-nums">{r.id}</td>
                  <td className="py-1 pr-2 font-medium">{r.indicator}</td>
                  <td className="py-1 pr-2">{r.market}</td>
                  <td className="max-w-[260px] truncate py-1 pr-2" title={r.usage_text}>{r.usage_text || "—"}</td>
                  <td className="py-1 pr-2">{r.contact || "—"}</td>
                  <td className="py-1 pr-2">{r.email_status}</td>
                  <td className="py-1 pr-2 tabular-nums">{r.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
