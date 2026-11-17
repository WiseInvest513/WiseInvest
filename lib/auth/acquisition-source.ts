export const ACQUISITION_SOURCE_COOKIE = "wi_src";
export const ACQUISITION_SITE_COOKIE = "wi_site";
export const ACQUISITION_CONTENT_COOKIE = "wi_cnt";
export const ACQUISITION_SOURCE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;
export const SHARE_SITE_ORIGIN = "https://www.wise-invest.org";
export const UTM_SOURCE_PARAM = "utm_source";
export const UTM_CAMPAIGN_PARAM = "utm_campaign";
export const ACQUISITION_CONTENT_MAX_LENGTH = 180;

export const ACQUISITION_SOURCES = [
  { code: "rednode", label: "小红书" },
  { code: "bili", label: "哔哩哔哩" },
  { code: "vch", label: "视频号" },
  { code: "wx", label: "微信" },
  { code: "x", label: "推特 / X" },
  { code: "yt", label: "YouTube" },
  { code: "tg", label: "Telegram" },
] as const;

export const ACQUISITION_SITES = [
  { code: "vip", label: "VIP" },
  { code: "etf", label: "ETF" },
  { code: "ipo", label: "IPO" },
  { code: "chn", label: "CHAIN" },
  { code: "cry", label: "Crypto" },
  { code: "sim", label: "SIM" },
  { code: "wit", label: "Witness" },
  { code: "hld", label: "Hold" },
] as const;

export type AcquisitionSource = (typeof ACQUISITION_SOURCES)[number]["code"];
export type AcquisitionSite = (typeof ACQUISITION_SITES)[number]["code"];

export type AcquisitionAttribution = {
  acquisitionSource: AcquisitionSource | null;
  acquisitionSite: AcquisitionSite | null;
  acquisitionContent: string | null;
};

export type AcquisitionAttributionInput = {
  acquisitionSource?: string | null;
  acquisitionSite?: string | null;
  acquisitionContent?: string | null;
};

const ACQUISITION_SOURCE_CODES = new Set<string>(ACQUISITION_SOURCES.map((item) => item.code));
const ACQUISITION_SITE_CODES = new Set<string>(ACQUISITION_SITES.map((item) => item.code));
const ACQUISITION_SOURCE_LABELS = Object.fromEntries(
  ACQUISITION_SOURCES.map((item) => [item.code, item.label]),
) as Record<AcquisitionSource, string>;
const ACQUISITION_SITE_LABELS = Object.fromEntries(
  ACQUISITION_SITES.map((item) => [item.code, item.label]),
) as Record<AcquisitionSite, string>;
const SHARE_HOSTS = new Set(["www.wise-invest.org", "wise-invest.org", "localhost", "127.0.0.1"]);
const COOKIE_DOMAIN_HOSTS = new Set(["www.wise-invest.org", "wise-invest.org"]);
const SAFE_CONTENT_PATTERN = /^\/[A-Za-z0-9/_\-.~%&=?]*$/;

type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

type CookieWriter = {
  set: (name: string, value: string, options?: {
    httpOnly?: boolean;
    sameSite?: "lax" | "strict" | "none";
    path?: string;
    secure?: boolean;
    maxAge?: number;
    domain?: string;
  }) => void;
};

type AcquisitionCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  path: "/";
  secure: boolean;
  maxAge: number;
  domain?: string;
};

export function isAcquisitionSource(value: unknown): value is AcquisitionSource {
  return typeof value === "string" && ACQUISITION_SOURCE_CODES.has(value);
}

export function isAcquisitionSite(value: unknown): value is AcquisitionSite {
  return typeof value === "string" && ACQUISITION_SITE_CODES.has(value);
}

export function parseAcquisitionSource(value: unknown): AcquisitionSource | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return isAcquisitionSource(normalized) ? normalized : null;
}

export function parseAcquisitionSite(value: unknown): AcquisitionSite | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return isAcquisitionSite(normalized) ? normalized : null;
}

export function getAcquisitionSourceLabel(source: string | null | undefined): string | null {
  const parsed = parseAcquisitionSource(source);
  return parsed ? ACQUISITION_SOURCE_LABELS[parsed] : null;
}

export function getAcquisitionSiteLabel(site: string | null | undefined): string | null {
  const parsed = parseAcquisitionSite(site);
  return parsed ? ACQUISITION_SITE_LABELS[parsed] : null;
}

export function sanitizeAcquisitionContent(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let raw = value.trim();
  if (!raw) return null;

  if (raw.startsWith("//") || /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(raw)) {
    try {
      const parsed = new URL(raw.startsWith("//") ? `https:${raw}` : raw);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
      raw = `${parsed.pathname}${parsed.search}`;
    } catch {
      return null;
    }
  }

  raw = raw.split("#")[0];
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || raw.includes("://")) {
    return null;
  }

  if (!SAFE_CONTENT_PATTERN.test(raw)) {
    const pathOnly = raw.split("?")[0];
    if (!SAFE_CONTENT_PATTERN.test(pathOnly)) return null;
    raw = pathOnly;
  }

  if (raw.length > ACQUISITION_CONTENT_MAX_LENGTH) {
    raw = raw.slice(0, ACQUISITION_CONTENT_MAX_LENGTH);
  }

  return raw || null;
}

export function formatAcquisitionSource(source: string | null | undefined): string {
  return formatAcquisitionAttribution({ acquisitionSource: source, acquisitionSite: null, acquisitionContent: null });
}

export function formatAcquisitionAttribution(input?: AcquisitionAttributionInput | null): string {
  const source = parseAcquisitionSource(input?.acquisitionSource);
  if (source) return `${ACQUISITION_SOURCE_LABELS[source]}（${source}）`;

  const site = parseAcquisitionSite(input?.acquisitionSite);
  if (!site) return "未记录";

  const content = sanitizeAcquisitionContent(input?.acquisitionContent);
  const label = `${ACQUISITION_SITE_LABELS[site]}（${site}）`;
  return content ? `${label}· ${content}` : label;
}

export function acquisitionSourceCreateData(source?: string | null) {
  return acquisitionAttributionCreateData({ acquisitionSource: source });
}

export function acquisitionAttributionCreateData(input?: AcquisitionAttributionInput | null) {
  const source = parseAcquisitionSource(input?.acquisitionSource);
  if (source) return { acquisitionSource: source };

  const site = parseAcquisitionSite(input?.acquisitionSite);
  if (!site) return {};

  return {
    acquisitionSite: site,
    acquisitionContent: sanitizeAcquisitionContent(input?.acquisitionContent) ?? "/",
  };
}

function readCookieValue(header: string | null | undefined, name: string): string | null {
  if (!header) return null;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    const raw = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  return null;
}

export function getAcquisitionSourceFromCookieHeader(header: string | null | undefined): AcquisitionSource | null {
  return parseAcquisitionSource(readCookieValue(header, ACQUISITION_SOURCE_COOKIE));
}

export function getAcquisitionSiteFromCookieHeader(header: string | null | undefined): AcquisitionSite | null {
  return parseAcquisitionSite(readCookieValue(header, ACQUISITION_SITE_COOKIE));
}

export function getAcquisitionContentFromCookieHeader(header: string | null | undefined): string | null {
  return sanitizeAcquisitionContent(readCookieValue(header, ACQUISITION_CONTENT_COOKIE));
}

export function getAcquisitionAttributionFromCookieHeader(header: string | null | undefined): AcquisitionAttribution {
  return {
    acquisitionSource: getAcquisitionSourceFromCookieHeader(header),
    acquisitionSite: getAcquisitionSiteFromCookieHeader(header),
    acquisitionContent: getAcquisitionContentFromCookieHeader(header),
  };
}

export function getAcquisitionSourceFromCookieStore(cookies: CookieReader | null | undefined): AcquisitionSource | null {
  return parseAcquisitionSource(cookies?.get(ACQUISITION_SOURCE_COOKIE)?.value);
}

export function getAcquisitionSiteFromCookieStore(cookies: CookieReader | null | undefined): AcquisitionSite | null {
  return parseAcquisitionSite(cookies?.get(ACQUISITION_SITE_COOKIE)?.value);
}

export function getAcquisitionContentFromCookieStore(cookies: CookieReader | null | undefined): string | null {
  return sanitizeAcquisitionContent(cookies?.get(ACQUISITION_CONTENT_COOKIE)?.value);
}

export function getAcquisitionAttributionFromCookieStore(cookies: CookieReader | null | undefined): AcquisitionAttribution {
  return {
    acquisitionSource: getAcquisitionSourceFromCookieStore(cookies),
    acquisitionSite: getAcquisitionSiteFromCookieStore(cookies),
    acquisitionContent: getAcquisitionContentFromCookieStore(cookies),
  };
}

export function hasFirstTouchAcquisition(cookies: CookieReader | null | undefined): boolean {
  return Boolean(getAcquisitionSourceFromCookieStore(cookies) || getAcquisitionSiteFromCookieStore(cookies));
}

export function getAcquisitionCookieOptions(request: { nextUrl: URL }): AcquisitionCookieOptions {
  const hostname = request.nextUrl.hostname.toLowerCase();
  const options: AcquisitionCookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: request.nextUrl.protocol === "https:",
    maxAge: ACQUISITION_SOURCE_MAX_AGE_SECONDS,
  };

  if (COOKIE_DOMAIN_HOSTS.has(hostname)) {
    options.domain = ".wise-invest.org";
  }

  return options;
}

export function applyFirstTouchAcquisitionCookie(
  request: { nextUrl: URL; cookies: CookieReader },
  response: { cookies: CookieWriter },
) {
  if (hasFirstTouchAcquisition(request.cookies)) return false;

  const incomingSource = parseAcquisitionSource(request.nextUrl.searchParams.get(UTM_SOURCE_PARAM));
  const cookieOptions = getAcquisitionCookieOptions(request);

  if (incomingSource) {
    response.cookies.set(ACQUISITION_SOURCE_COOKIE, incomingSource, cookieOptions);
    return true;
  }

  const incomingSite = parseAcquisitionSite(request.nextUrl.searchParams.get(UTM_SOURCE_PARAM));
  if (!incomingSite) return false;

  const content = sanitizeAcquisitionContent(request.nextUrl.searchParams.get(UTM_CAMPAIGN_PARAM)) ?? "/";
  response.cookies.set(ACQUISITION_SITE_COOKIE, incomingSite, cookieOptions);
  response.cookies.set(ACQUISITION_CONTENT_COOKIE, content, cookieOptions);
  return true;
}

export function resolveShareTarget(rawInput: string, origin = SHARE_SITE_ORIGIN): URL | null {
  const trimmed = rawInput.trim();
  const base = origin.replace(/\/$/, "");

  if (!trimmed || trimmed === "/") {
    return new URL(`${base}/`);
  }

  if (trimmed.startsWith("/")) {
    try {
      return new URL(trimmed, `${base}/`);
    } catch {
      return null;
    }
  }

  const candidate = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (!SHARE_HOSTS.has(parsed.hostname.toLowerCase())) return null;
    return new URL(`${base}${parsed.pathname}${parsed.search}${parsed.hash}`);
  } catch {
    return null;
  }
}

export function buildShareUrl(rawInput: string, source: string, origin = SHARE_SITE_ORIGIN) {
  const parsedSource = parseAcquisitionSource(source);
  if (!parsedSource) {
    return { ok: false as const, message: "请选择有效的分享渠道。" };
  }

  const target = resolveShareTarget(rawInput, origin);
  if (!target) {
    return { ok: false as const, message: "请输入站内路径或 Wise Invest 官网链接。" };
  }

  target.searchParams.set(UTM_SOURCE_PARAM, parsedSource);
  return { ok: true as const, url: target.toString(), path: `${target.pathname}${target.search}${target.hash}` };
}

export function buildSiteAttributionUrl(
  rawInput: string,
  site: string,
  content: string,
  origin = SHARE_SITE_ORIGIN,
) {
  const parsedSite = parseAcquisitionSite(site);
  if (!parsedSite) {
    return { ok: false as const, message: "请选择有效的分站来源。" };
  }

  const target = resolveShareTarget(rawInput, origin);
  if (!target) {
    return { ok: false as const, message: "请输入站内路径或 Wise Invest 官网链接。" };
  }

  target.searchParams.set(UTM_SOURCE_PARAM, parsedSite);
  target.searchParams.set(UTM_CAMPAIGN_PARAM, sanitizeAcquisitionContent(content) ?? "/");
  return { ok: true as const, url: target.toString(), path: `${target.pathname}${target.search}${target.hash}` };
}
