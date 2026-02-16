"use client";

const ALLOWED_HOST_SUFFIXES = [
  "x.com",
  "t.me",
  "youtube.com",
  "youtu.be",
  "xiaohongshu.com",
  "bilibili.com",
  "mp.weixin.qq.com",
  "investing.com",
  "tradingview.com",
  "seekingalpha.com",
  "coinmarketcap.com",
  "core-wise-invest.org",
  "blog.blacknico.com",
  "blacknico.com",
  "gitbook.io",
  "github.io",
  "gamsgo.com",
  "xesim.cc",
  "binance.com",
  "web3.binance.com",
  "okx.com",
  "web3.okx.com",
  "bitget.com",
  "web3.bitget.com",
  "bybit.com",
  "chiefgroup.com.hk",
  "international.schwab.com",
  "usmartglobal.com",
  "usmart.com",
  "wise.com",
  "za.group",
  "lbmkt.ing",
  "longbridgeapp.com",
  "interactivebrokers.com",
  "ibkr.com",
  "futuhk.com",
  "fotechwealth.com",
  "safepal.com",
  "bsmkweb.com",
  "vmutkhamuut.com",
  "hdmune.cn",
  "cdn.simpleicons.org",
  "api.dicebear.com",
] as const;

const ALLOWED_HTTP_LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, "");
}

function isAllowedHost(hostname: string): boolean {
  const host = normalizeHost(hostname);
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`)
  );
}

function isAllowedProtocol(protocol: string): boolean {
  return protocol === "https:" || protocol === "http:";
}

interface SafeExternalUrlOptions {
  fallback?: string;
  allowHash?: boolean;
}

export function getSafeExternalUrl(
  rawUrl: string | undefined | null,
  options: SafeExternalUrlOptions = {}
): string {
  const { fallback = "#", allowHash = true } = options;

  if (!rawUrl) return fallback;
  const value = rawUrl.trim();
  if (!value) return fallback;
  if (allowHash && value === "#") return "#";

  try {
    const parsed = new URL(value);
    if (!isAllowedProtocol(parsed.protocol)) return fallback;

    if (parsed.protocol === "http:") {
      const host = normalizeHost(parsed.hostname);
      if (!ALLOWED_HTTP_LOCAL_HOSTS.has(host)) return fallback;
      return parsed.toString();
    }

    if (!isAllowedHost(parsed.hostname)) return fallback;
    return parsed.toString();
  } catch {
    return fallback;
  }
}

export function openSafeExternalUrl(rawUrl: string | undefined | null): void {
  const safeUrl = getSafeExternalUrl(rawUrl, { allowHash: true });
  if (safeUrl === "#") return;

  if (typeof window !== "undefined") {
    window.open(safeUrl, "_blank", "noopener,noreferrer");
  }
}

