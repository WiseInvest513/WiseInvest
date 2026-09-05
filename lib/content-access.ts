import {
  defaultArticleAccessRule,
  defaultRoadmapAccessRule,
  publicArticlePaths,
  vipArticlePaths,
  publicCapitalFlowRouteIds,
  publicRoadmapDetailIds,
  type ContentAccessLevel,
} from "@/lib/content-access-rules";

export type { ContentAccessLevel } from "@/lib/content-access-rules";

type ContentAccessRule = {
  access: ContentAccessLevel;
  reason: string;
};

const WISE_INVEST_HOSTS = new Set(["wise-invest.org", "www.wise-invest.org", "localhost", "127.0.0.1"]);
export type ContentItemType = "ARTICLE" | "ROADMAP_DETAIL" | "ROADMAP_ROUTE";

export type ContentItemRef = {
  contentType: ContentItemType;
  contentKey: string;
  href: string;
};

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

export function normalizePath(value: string) {
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

export function resolveContentItem(value: string): ContentItemRef {
  const normalized = normalizePath(value);
  const { pathname } = splitPathAndSearch(normalized);

  if (/^\/articles\/[^/]+\/[^/]+$/.test(pathname)) {
    return {
      contentType: "ARTICLE",
      contentKey: pathname,
      href: normalized,
    };
  }

  if (/^\/roadmap\/[^/]+$/.test(pathname)) {
    return {
      contentType: "ROADMAP_DETAIL",
      contentKey: pathname,
      href: normalized,
    };
  }

  if (pathname === "/roadmap") {
    return {
      contentType: "ROADMAP_ROUTE",
      contentKey: normalized,
      href: normalized,
    };
  }

  return {
    contentType: "ARTICLE",
    contentKey: normalized,
    href: normalized,
  };
}

export function getContentAccessRule(hrefOrPath: string): ContentAccessRule {
  const { pathname, searchParams } = splitPathAndSearch(hrefOrPath);

  if (/^\/articles\/[^/]+\/[^/]+$/.test(pathname)) {
    if (publicArticlePaths.has(pathname)) return { access: "PUBLIC", reason: "公开示范文章" };
    if (vipArticlePaths.has(pathname)) return { access: "VIP", reason: "Wise VIP 会员专属内容" };
    return defaultArticleAccessRule;
  }

  const roadmapDetail = pathname.match(/^\/roadmap\/([^/]+)$/);
  if (roadmapDetail) {
    const roadmapId = decodeURIComponent(roadmapDetail[1]);
    return publicRoadmapDetailIds.has(roadmapId)
      ? { access: "PUBLIC", reason: "公开学习路线" }
      : defaultRoadmapAccessRule;
  }

  if (pathname === "/roadmap") {
    const routeId = searchParams.get("route") ?? "overview";
    return publicCapitalFlowRouteIds.has(routeId)
      ? { access: "PUBLIC", reason: "公开资金路径" }
      : defaultRoadmapAccessRule;
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

export function canReadContentAccess(access: ContentAccessLevel, membershipTier?: string | null) {
  if (access === "PUBLIC") return true;
  if (!membershipTier) return false;
  if (access === "MEMBER") return true;
  if (access === "VIP") return membershipTier === "VIP" || membershipTier === "VIP_PLUS";
  return membershipTier === "VIP_PLUS";
}

export function createContentPreview(content: string, maxChars = 1200) {
  const lines = content
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() && !line.trim().startsWith("!["));

  const selected: string[] = [];
  let total = 0;

  for (const line of lines) {
    selected.push(line);
    total += line.length;
    if (total >= maxChars && selected.some((item) => /^#{1,3}\s+/.test(item))) break;
    if (selected.length >= 16) break;
  }

  return selected.join("\n\n");
}
