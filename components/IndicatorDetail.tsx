import Link from "next/link";
import { getIndicator, getArticle, hasChinaVideo, hasGlobalVideo, youtubeWatch } from "@/lib/data";
import type { Edition } from "@/lib/site";
import VerdictBadge from "./VerdictBadge";
import StatsGrid from "./StatsGrid";
import YouTubeLite from "./YouTubeLite";
import BiliLite from "./BiliLite";
import ArticleBody from "./ArticleBody";
import ArticleCharts from "./charts/ArticleCharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card } from "./ui/card";

export default function IndicatorDetail({ id, edition }: { id: string; edition: Edition }) {
  const i = getIndicator(id);
  if (!i || i.ep === null) return null;
  const prefix = edition === "global" ? "/global" : "";
  const showVideo = edition === "china" ? hasChinaVideo(i) : hasGlobalVideo(i);
  const article = getArticle(i.id);
  const defaultTab = showVideo ? "video" : "article";
  const watch = youtubeWatch(i.youtube);

  return (
    <article>
      <Link href={`${prefix}/` || "/"} className="text-sm text-neutral-400 hover:text-neutral-600">
        ← 返回全部指标
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          第{i.ep}集 · {i.name}
        </h1>
        <VerdictBadge verdict={i.verdict} />
      </div>
      {i.title && <p className="mt-1 text-neutral-500">{i.title}｜什么指标不赚钱 第{i.ep}集</p>}
      <p className="mt-2 text-xs text-neutral-400">
        {edition === "china" ? "国内版 · B站视频 + 文章" : "海外版 · YouTube 视频 + 文章"} ·{" "}
        <Link href={edition === "china" ? `/global/i/${i.id}/` : `/i/${i.id}/`} className="hover:underline">
          切换到{edition === "china" ? "海外版" : "国内版"} →
        </Link>
      </p>

      <StatsGrid i={i} />

      {i.note && (
        <p className="mt-4 rounded-xl bg-neutral-100 p-4 text-sm leading-relaxed text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
          {i.note}
        </p>
      )}

      {i.example && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-bold">节目中的例子</h2>
          <Card className="p-4 text-sm leading-relaxed">
            <p className="font-medium">{i.example.stock}</p>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">{i.example.detail}</p>
            <p className="mt-2 text-xs text-neutral-400">单个例子只为演示流程，全市场结论看上面整表数字。</p>
          </Card>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-1 text-lg font-bold">交互图表</h2>
        <p className="mb-3 text-xs leading-relaxed text-neutral-400">
          下图由回测 JSON 直接驱动（可点/可触摸查看数值），与文章“图注”一一对应：分布 → 净值 → 时代/拿法 → 随机对照 → 费用 → 12 只抽样。
          K 线为形态示意（演示数据），非真实个股。
        </p>
        <ArticleCharts id={i.id} seed={i.ep ?? 7} />
      </section>

      <section className="mt-8">
        <Tabs defaultValue={defaultTab}>
          <TabsList>
            {showVideo && <TabsTrigger value="video">视频</TabsTrigger>}
            <TabsTrigger value="article">文章</TabsTrigger>
            <TabsTrigger value="data">数据</TabsTrigger>
          </TabsList>

          {showVideo && (
            <TabsContent value="video">
              {edition === "china" && i.bili ? (
                <div>
                  <BiliLite biliUrl={i.bili} title={i.title ?? i.name} />
                  <p className="mt-3 text-xs text-neutral-400">
                    国内版只嵌入 B站视频，不加载任何 YouTube / Google 资源。
                  </p>
                </div>
              ) : null}
              {edition === "global" && i.youtube ? (
                <div>
                  <YouTubeLite videoId={i.youtube} title={i.title ?? i.name} />
                  <p className="mt-3 text-xs text-neutral-400">
                    隐私增强模式（youtube-nocookie），点击缩略图才加载播放器，保持页面轻量。
                  </p>
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {edition === "global" && watch && (
                  <a
                    href={watch}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
                  >
                    ▶ 在 YouTube 观看
                  </a>
                )}
                {edition === "china" && i.bili && (
                  <a
                    href={i.bili}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
                  >
                    ▶ 在 B站观看
                  </a>
                )}
                {i.zhihu && (
                  <a
                    href={i.zhihu}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-neutral-300 bg-white px-4 py-2 font-medium text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300"
                  >
                    知乎文章
                  </a>
                )}
              </div>
            </TabsContent>
          )}

          <TabsContent value="article">
            <Card className="p-5 sm:p-7">
              <ArticleBody id={i.id} />
              {i.zhihu && (
                <p className="mt-6 text-sm">
                  <a href={i.zhihu} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    在知乎阅读原文 →
                  </a>
                  <span className="ml-2 text-xs text-neutral-400">（来源：{article.source === "zhihu" ? "知乎已发表" : "回测数据摘要"}）</span>
                </p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="data">
            <Card className="overflow-hidden">
              <div className="grid grid-cols-2 gap-px bg-neutral-200 text-sm dark:bg-neutral-800 sm:grid-cols-4">
                {[
                  ["每笔收益", i.perTrade !== null ? `${i.perTrade.toFixed(2)}%` : "—"],
                  ["中位数", i.median !== null ? `${i.median.toFixed(2)}%` : "—"],
                  ["胜率", i.winRate !== null ? `${i.winRate.toFixed(2)}%` : "—"],
                  ["组合年化", i.portfolio !== null ? `${i.portfolio.toFixed(2)}%` : "—"],
                  ["事件分位", i.eventPct !== null ? `${i.eventPct.toFixed(1)}%` : "—"],
                  ["组合分位", i.portfolioPct !== null ? `${i.portfolioPct.toFixed(1)}%` : "—"],
                  ["成交笔数", i.trades !== null ? i.trades.toLocaleString("zh-CN") : "—"],
                  ["结论", i.verdict],
                ].map(([k, v]) => (
                  <div key={k} className="bg-white p-4 dark:bg-neutral-950">
                    <div className="text-xs text-neutral-500">{k}</div>
                    <div className="mt-1 font-bold tabular-nums">{v}</div>
                  </div>
                ))}
              </div>
            </Card>
            <p className="mt-3 text-xs text-neutral-400">
              口径：信号次日开盘买、持有 5 个交易日后开盘卖，往返扣 0.30%。“—”表示来源中无该数字。
            </p>
          </TabsContent>
        </Tabs>
      </section>

      <p className="mt-8 rounded-xl bg-neutral-100 p-4 text-xs font-medium leading-relaxed text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
        投资者教育，不构成投资建议。以上均为历史回测，过往业绩不代表未来表现，投资有风险，入市需谨慎。
      </p>
    </article>
  );
}
