export type ContentAccessLevel = "PUBLIC" | "MEMBER" | "VIP";

type ContentAccessRule = {
  access: ContentAccessLevel;
  reason: string;
};

const PUBLIC_ARTICLE_PATHS = new Set([
  "/articles/web/EYO11DG3",
]);

const PUBLIC_ROADMAP_DETAIL_IDS = new Set([
  "crypto-trading",
  "binance-alpha-okx-boost",
]);

const PUBLIC_CAPITAL_FLOW_ROUTE_IDS = new Set([
  "overview",
  "onchain-us-stocks",
]);

const WISE_INVEST_HOSTS = new Set(["wise-invest.org", "www.wise-invest.org", "localhost", "127.0.0.1"]);

export function isWiseInvestHref(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("/")) return true;
  try {
    return WISE_INVEST_HOSTS.has(new URL(trimmed).hostname);
  } catch {
    return false;
  }
}

export function toWiseInvestRelativeHref(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("/")) return trimmed;

  try {
    const url = new URL(trimmed);
    if (!WISE_INVEST_HOSTS.has(url.hostname)) return trimmed;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return trimmed;
  }
}

function normalizePath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "/";

  if (!isWiseInvestHref(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed, "https://www.wise-invest.org");
    return `${url.pathname.replace(/\/$/, "") || "/"}${url.search}`;
  } catch {
    const [pathname = "/", search = ""] = trimmed.split("?");
    const normalizedPathname = pathname.replace(/\/$/, "") || "/";
    return search ? `${normalizedPathname}?${search}` : normalizedPathname;
  }
}

function splitPathAndSearch(value: string) {
  const normalized = normalizePath(value);
  const [pathname = "/", search = ""] = normalized.split("?");
  return {
    pathname,
    searchParams: new URLSearchParams(search),
  };
}

export function getContentAccessRule(hrefOrPath: string): ContentAccessRule {
  const { pathname, searchParams } = splitPathAndSearch(hrefOrPath);

  if (/^\/articles\/[^/]+\/[^/]+$/.test(pathname)) {
    return PUBLIC_ARTICLE_PATHS.has(pathname)
      ? { access: "PUBLIC", reason: "公开示范文章" }
      : { access: "MEMBER", reason: "完整文章需要登录 Wise ID 后阅读" };
  }

  const roadmapDetail = pathname.match(/^\/roadmap\/([^/]+)$/);
  if (roadmapDetail) {
    const roadmapId = decodeURIComponent(roadmapDetail[1]);
    return PUBLIC_ROADMAP_DETAIL_IDS.has(roadmapId)
      ? { access: "PUBLIC", reason: "公开学习路线" }
      : { access: "MEMBER", reason: "完整学习路线需要登录 Wise ID 后查看" };
  }

  if (pathname === "/roadmap") {
    const routeId = searchParams.get("route") ?? "overview";
    return PUBLIC_CAPITAL_FLOW_ROUTE_IDS.has(routeId)
      ? { access: "PUBLIC", reason: "公开资金路径" }
      : { access: "MEMBER", reason: "完整资金路径需要登录 Wise ID 后查看" };
  }

  return { access: "PUBLIC", reason: "公开页面" };
}

export function requiresLoginForContent(hrefOrPath: string) {
  return getContentAccessRule(hrefOrPath).access !== "PUBLIC";
}

export function getLockedContentHint(hrefOrPath: string) {
  const rule = getContentAccessRule(hrefOrPath);
  return rule.access === "PUBLIC" ? null : rule.reason;
}

export function buildLoginHref(callbackUrl: string) {
  return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
