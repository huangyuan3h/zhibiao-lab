# 资金流全景 · 每日静态同步

范围锁定：**仅三张简单图** — 国家队 / 两融 / 北向（无叠加总览）。

| 图 | 字段 | 单位 |
|---|---|---|
| 国家队 | `etfShareYi` | 亿份（4 码宽基 ETF） |
| 两融 | `marginTrillion` | 万亿元 |
| 北向 | `northDailyYi` + `northD20Yi` | 亿元（2024-08-19 后成交额口径） |

数据：Karios `_load_flow_rows` → `data/national-team.json`（无站内 DB）。

## 一键（每日）

```bash
~/Projects/zhibiao-lab/scripts/daily-fund-flow-sync.sh
```

或分步：

```bash
cd ~/Projects/zhibiao-lab
npm run sync-national-team
npm run build
npx wrangler pages deploy ./out --project-name zhibiao-lab --branch main --commit-dirty=true
```

## 节奏

- **资金流：每日**（建议早档 ~07:40，在 Karios `risk_state_sync` 前一晚 18:50 入库之后）
- **指标集数 `update-data`：可继续隔日**（与本同步拆开）

线上：https://zhibiao.it-t.xyz/national-team/ 与 `/global/national-team/`
