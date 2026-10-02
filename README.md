# 老黄测指标（Lao Huang Tests Indicators）

用 A 股历史数据回测散户常用指标：大多数不赚钱，每一集都有真实回测数字。

- 站点：https://zhibiao.it-t.xyz/（国内版，B站视频） / https://zhibiao.it-t.xyz/global/（海外版，YouTube 隐私增强）
- 作者笔名：躺平的老黄（站内只出现笔名，不出现真实姓名）
- 系列栏目：
  - 系列「什么指标不赚钱」：已测 24 集（ep1–12、ep14–25，ep13 停更），全部不赚钱，下表即全集
  - 栏目「有点苗头」：后续约 50 集表现较好的指标，正在验证，现在显示「即将上线」，不编造任何数据
- 零散页「有苗头」（`/leads/`）：回测中发现的零散赚钱苗头合集，与栏目「有点苗头」不是同一个东西

## 本地开发

```bash
npm install
npm run update-data   # 只读 ledger，重建 data/articles.json + public/charts/*.json
npm test              # 请求校验 18 用例（现已扩充，见下）
npm run build         # 静态导出到 ./out
```

## 请求表单

- 页面：`/request/` + `/global/request/`，组件 `components/RequestForm.tsx`
- 接口：`POST /api/request`（Pages Function，D1 + 限流 + Turnstile + 经 `zhibiao-mailer` Worker 发邮件）
- 后台：`/admin/`（Token 鉴权，`sessionStorage`），汇总 `npm run requests:summary`

## 访问统计

- 首选：Cloudflare Dashboard → Workers & Pages → `zhibiao-lab` → Metrics → Web Analytics → Enable（下次部署自动注入，两版都会统计到，大陆可加载）
- 备选（独立 site）：Dashboard → Web Analytics → 建 site（host `zhibiao.it-t.xyz`）→ 把 token 填到 `NEXT_PUBLIC_CF_BEACON_TOKEN`，`components/WebAnalyticsBeacon.tsx` 会自动注入 `static.cloudflareinsights.com/beacon.min.js`
- 拉数脚本：`scripts/analytics_report.py`（GraphQL Analytics API，最近 7 天访问量/访客/国家/热门页面/来源/设备，输出 markdown；需要 `Account Analytics Read` 权限，见脚本头部与报告）

```bash
CF_ACCOUNT_ID=xxx CF_RUM_SITE_TAG=xxx CLOUDFLARE_API_TOKEN=xxx python3 scripts/analytics_report.py --days 7
```

## 部署

```bash
npm run build
npx wrangler pages deploy ./out --project-name=zhibiao-lab --branch=main
```

生产：https://zhibiao-lab.pages.dev/，自定义域 https://zhibiao.it-t.xyz/（CNAME `zhibiao → zhibiao-lab.pages.dev`，Proxy ON）。

## 数据口径

次日开盘买、拿 5 天后开盘卖（hold5），每笔扣往返 0.30%，与同一天随机买入对照（事件层 1000 次、组合层 200 次）。表格中“—”表示来源无该数字，绝不编造。
