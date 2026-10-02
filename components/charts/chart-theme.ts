// 与 Karios desktop 对齐后为中文习惯做了调整：
// Karios desktop 用美股习惯（涨绿 #16a34a / 跌红 #dc2626）；
// zhibiao-lab 面向 A 股散户，用 A 股习惯：涨/赚红，跌/亏绿。基准用中性灰。
export const C = {
  accent: "#1a73e8", // 强调色（与 globals.css --color-accent 一致）
  strategy: "#1a73e8",
  bench300: "#737373",
  bench500: "#a3a3a3",
  gain: "#dc2626", // 赚/跑赢：红
  loss: "#16a34a", // 亏/跑输：绿（A股习惯）
  random: "#a855f7", // 随机对照：紫（与 Karios fund-flow 的 margin 紫同系）
  grid: "#e5e5e5",
  tick: "#a3a3a3",
} as const;

export const SRC = "karios-series-output 回测（信号次日开盘买、拿满5天后开盘卖，往返0.30%）";
