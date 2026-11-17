export const ACQUISITION_SOURCE_COOKIE = "wi_src";
export const ACQUISITION_SOURCE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;
export const SHARE_SITE_ORIGIN = "https://www.wise-invest.org";
export const UTM_SOURCE_PARAM = "utm_source";

export const ACQUISITION_SOURCES = [
  { code: "rednode", label: "小红书" },
  { code: "bili", label: "哔哩哔哩" },
  { code: "vch", label: "视频号" },
  { code: "wx", label: "微信" },
  { code: "x", label: "推特 / X" },
  { code: "yt", label: "YouTube" },
  { code: "tg", label: "Telegram" },
] as const;

export type AcquisitionSource = (typeof ACQUISITION_SOURCES)[number]["code"];

const ACQUISITION_SOURCE_CODES = new Set<string>(ACQUISITION_SOURCES.map((item) => item.code));
const ACQUISITION_SOURCE_LABELS = Object.fromEntries(
  ACQUISITION_SOURCES.map((item) => [item.code, item.label]),
) as Record<AcquisitionSource, string>;
const SHARE_HOSTS = new Set(["www.wise-invest.org", "wise-invest.org", "localhost", "127.0.0.1"]);

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
  }) => void;
};

export function isAcquisitionSource(value: unknown): value is AcquisitionSource {
  return typeof value === "string" && ACQUISITION_SOURCE_CODES.has(value);
}

export function parseAcquisitionSource(value: unknown): AcquisitionSource | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return isAcquisitionSource(normalized) ? normalized : null;
}

export function getAcquisitionSourceLabel(source: string | null | undefined): string | null {
  const parsed = parseAcquisitionSource(source);
  return parsed ? ACQUISITION_SOURCE_LABELS[parsed] : null;
}

export function formatAcquisitionSource(source: string | null | undefined): string {
  const parsed = parseAcquisitionSource(source);
  if (!parsed) return "未记录";
  return `${ACQUISITION_SOURCE_LABELS[parsed]}（${parsed}）`;
}

export function acquisitionSourceCreateData(source?: string | null) {
  const parsed = parseAcquisitionSource(source);
  return parsed ? { acquisitionSource: parsed } : {};
}

export function getAcquisitionSourceFromCookieHeader(header: string | null | undefined): AcquisitionSource | null {
  if (!header) return null;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const name = part.slice(0, separator).trim();
    if (name !== ACQUISITION_SOURCE_COOKIE) continue;
    const raw = part.slice(separator + 1).trim();
    try {
      return parseAcquisitionSource(decodeURIComponent(raw));
    } catch {
      return parseAcquisitionSource(raw);
    }
  }

  return null;
}

export function getAcquisitionSourceFromCookieStore(cookies: CookieReader | null | undefined): AcquisitionSource | null {
  return parseAcquisitionSource(cookies?.get(ACQUISITION_SOURCE_COOKIE)?.value);
}

export function applyFirstTouchAcquisitionCookie(
  request: { nextUrl: URL; cookies: CookieReader },
  response: { cookies: CookieWriter },
) {
  if (getAcquisitionSourceFromCookieStore(request.cookies)) return false;

  const incoming = parseAcquisitionSource(request.nextUrl.searchParams.get(UTM_SOURCE_PARAM));
  if (!incoming) return false;

  response.cookies.set(ACQUISITION_SOURCE_COOKIE, incoming, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: request.nextUrl.protocol === "https:",
    maxAge: ACQUISITION_SOURCE_MAX_AGE_SECONDS,
  });
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
