export const SITE_URL = "https://zhibiao.it-t.xyz";
export const GLOBAL_PREFIX = "/global";

// China 版是根路径（B站 only），global 版是 /global/（YouTube only）
export type Edition = "china" | "global";

export function editionFromPath(pathname: string | null | undefined): Edition {
  if (pathname?.startsWith("/global")) return "global";
  return "china";
}

export function canonicalUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}

export function counterpartUrl(path: string, edition: Edition): string {
  // 给定当前 path，返回另一版本的 URL path
  if (edition === "china") {
    // /i/x/ -> /global/i/x/ ; / -> /global/ ; /leads/ -> /global/leads/
    if (path === "/") return "/global/";
    return `/global${path === "/" ? "/" : path}`;
  }
  // global -> china: strip /global prefix
  if (path === "/global/" || path === "/global") return "/";
  return path.replace(/^\/global/, "") || "/";
}

export const SITE_NAME = "什么指标不赚钱 · 指标实验室";
export const AUTHOR_PEN_NAME = "躺平的老黄";
