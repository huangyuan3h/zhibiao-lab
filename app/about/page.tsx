import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "回测方法",
  description: "指标实验室回测方法：hold5、扣费0.30%、与随机买入对照。历史回测，不构成投资建议。",
};

export default function AboutPage() {
  return (
    <div className="prose-sm max-w-none">
      <h1 className="text-2xl font-bold">回测方法</h1>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-700">
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-bold">1. 信号与持有（hold5）</h2>
          <p className="mt-1">
            指标在 T 日收盘产生信号，T+1 日开盘买入，拿满 5 个交易日后开盘卖出（简称
            hold5）。一字涨停买不进、一字跌停卖不出时顺延成交。第 3 集国庆节效应为分类讨论特辑，不用此口径。
          </p>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-bold">2. 扣费</h2>
          <p className="mt-1">
            每笔按往返 0.30% 扣费（佣金、印花税、杂费与滑点的保守取值）。每笔净收益 = 卖出价/买入价 − 1 −
            0.30%。另有 0.15% / 0.50% 敏感性档，结论方向不变。
          </p>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-bold">3. 和随机买入比</h2>
          <p className="mt-1">
            同一入场日、同样持有天数，随机换一只股票、同样成本：事件层 1000 次、组合层 200
            次蒙特卡洛。分位越低表示越差于随机——本系列绝大多数指标事件/组合分位都是
            0.0%，也就是比每一次随机买入都差。
          </p>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-bold">4. “明确不赚钱”三条</h2>
          <p className="mt-1">
            只有同时满足才做视频：(a) 扣费后每笔净均值为负；(b) 组合年化跑输沪深300与中证500；(c)
            多个时代毛超额多为负。第 13 集 4 个候选都不满足，于是停更一集，只做研究。
          </p>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-bold">5. 数据与局限</h2>
          <p className="mt-1">
            A 股日线（前复权算指标/收益），2010-01-01 至 2026-08-31，沪深主板+创业板+科创板约 5499
            只（含已退市者，仍有残余幸存者偏差）。组合是简化的 10
            份等额轮动模拟，信号多时常年满仓轮动，年化数字绝对值会被放大——看结论请先看“每笔收益/胜率/随机分位”。
          </p>
        </section>
        <p className="rounded-xl bg-gray-100 p-4 font-medium">
          以上均为历史回测，不构成投资建议。过往业绩不代表未来表现，投资有风险，入市需谨慎。
        </p>
      </div>
    </div>
  );
}
