// 「你想测哪个指标」表单校验（前后端共用同一口径，Pages Function 内有同逻辑 JS 版）
// 长度限制：防止 DB 爆炸 + 邮件爆炸
export const LIMITS = {
  indicatorMin: 1,
  indicatorMax: 50,
  usageMax: 500,
  contactMax: 100,
  marketOptions: ["A股", "港股", "美股", "其他"] as const,
};

export type Market = (typeof LIMITS.marketOptions)[number];

export interface RequestInput {
  indicator: string;
  usage?: string;
  market?: string;
  contact?: string;
  // 蜜罐：正常用户永远为空，bot 会填
  website?: string;
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
  cleaned?: {
    indicator: string;
    usage: string;
    market: string;
    contact: string;
  };
  isHoneypot?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateRequest(input: RequestInput): ValidationResult {
  const honeypot = (input.website ?? "").trim();
  if (honeypot.length > 0) {
    return { ok: true, isHoneypot: true, cleaned: { indicator: "", usage: "", market: "其他", contact: "" } };
  }
  const indicator = (input.indicator ?? "").trim().replace(/\s+/g, " ");
  if (!indicator) return { ok: false, error: "请填写指标名称" };
  if (indicator.length > LIMITS.indicatorMax) return { ok: false, error: `指标名称最多 ${LIMITS.indicatorMax} 字` };

  const usage = (input.usage ?? "").trim();
  if (usage.length > LIMITS.usageMax) return { ok: false, error: `用法/参数最多 ${LIMITS.usageMax} 字` };

  const marketRaw = (input.market ?? "其他").trim();
  const market = (LIMITS.marketOptions as readonly string[]).includes(marketRaw) ? marketRaw : "其他";

  const contact = (input.contact ?? "").trim();
  if (contact) {
    if (contact.length > LIMITS.contactMax) return { ok: false, error: "联系邮箱过长" };
    if (!EMAIL_RE.test(contact)) return { ok: false, error: "联系邮箱格式不对（可留空）" };
  }

  return { ok: true, cleaned: { indicator, usage, market, contact } };
}

// 邮件主题：「[指标请求] RSI（A股）」，超长截断
export function buildSubject(indicator: string, market: string): string {
  const ind = indicator.slice(0, 30);
  return `[指标请求] ${ind}（${market}）`;
}

// Asia/Shanghai 时间（邮件 + 后台显示用，DB 存 UTC ISO）
export function shanghaiTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

export const TURNSTILE_SITEKEY = "0x4AAAAAAFL4i2y48ow-Wt1_";
