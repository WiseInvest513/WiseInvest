import { NextRequest, NextResponse } from "next/server";
import https from "node:https";
import { HttpsProxyAgent } from "https-proxy-agent";

export const runtime = "nodejs";

const ALLOWED_SYMBOLS = {
  BTC: {
    name: "比特币",
    proxyLabel: "BTC-USDT",
    source: "OKX 日线",
    sourceUrl: "https://www.okx.com/trade-spot/btc-usdt",
    quoteCurrency: "USDT",
    okxInstrument: "BTC-USDT",
  },
  ETH: {
    name: "以太坊",
    proxyLabel: "ETH-USDT",
    source: "OKX 日线",
    sourceUrl: "https://www.okx.com/trade-spot/eth-usdt",
    quoteCurrency: "USDT",
    okxInstrument: "ETH-USDT",
  },
  QQQ: {
    name: "纳斯达克 100",
    proxyLabel: "QQQ ETF",
    source: "Nasdaq Historical",
    sourceUrl: "https://www.nasdaq.com/market-activity/etf/qqq/historical",
    quoteCurrency: "USD",
    okxInstrument: null,
  },
} as const;

type AllowedSymbol = keyof typeof ALLOWED_SYMBOLS;
type ZoneStatus = "regular" | "batting" | "deep";

interface NasdaqHistoryRow {
  date?: string;
  close?: string;
}

interface OkxHistoryResponse {
  code?: string;
  msg?: string;
  data?: string[][];
}

interface PricePoint {
  date: string;
  close: number;
}

interface ChartPoint extends PricePoint {
  rollingHigh: number;
  drawdown: number;
}

interface DcaZonePayload {
  symbol: AllowedSymbol;
  name: string;
  proxyLabel: string;
  source: string;
  sourceUrl: string;
  quoteCurrency: "USD" | "USDT";
  asOf: string;
  currentPrice: number;
  high52Week: number;
  high52WeekDate: string;
  drawdown: number;
  distanceToBattingZone: number;
  status: ZoneStatus;
  points: ChartPoint[];
  stale?: boolean;
}

const MEMORY_CACHE_MS = 60 * 60 * 1000;
const memoryCache = new Map<
  AllowedSymbol,
  { data: DcaZonePayload; timestamp: number }
>();

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseNasdaqDate(value: string) {
  const [month, day, year] = value.split("/");
  if (!month || !day || !year) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function parsePrice(value: string) {
  const price = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(price) && price > 0 ? price : null;
}

function getStatus(drawdown: number): ZoneStatus {
  if (drawdown <= -20) return "deep";
  if (drawdown <= -10) return "batting";
  return "regular";
}

function normalizeRows(rows: NasdaqHistoryRow[]): PricePoint[] {
  const uniqueByDate = new Map<string, PricePoint>();

  for (const row of rows) {
    if (!row.date || !row.close) continue;
    const date = parseNasdaqDate(row.date);
    const close = parsePrice(row.close);
    if (!date || close === null) continue;
    uniqueByDate.set(date, { date, close });
  }

  return [...uniqueByDate.values()].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

function normalizeOkxRows(rows: string[][]): PricePoint[] {
  const uniqueByDate = new Map<string, PricePoint>();

  for (const row of rows) {
    if (row[8] !== "1") continue;

    const timestamp = Number(row[0]);
    const close = Number(row[4]);
    if (!Number.isFinite(timestamp) || !Number.isFinite(close) || close <= 0) {
      continue;
    }

    const date = new Date(timestamp).toISOString().slice(0, 10);
    uniqueByDate.set(date, { date, close });
  }

  return [...uniqueByDate.values()].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

function getDevelopmentProxy() {
  const configuredProxy =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy;

  if (configuredProxy) return configuredProxy;
  return process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:7897"
    : null;
}

function requestJson<T>(url: string, timeoutMs = 12_000): Promise<T> {
  const proxyUrl = getDevelopmentProxy();
  const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        agent,
        headers: {
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9",
          "User-Agent": "WiseInvest/1.0",
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if (!response.statusCode || response.statusCode >= 400) {
            reject(
              new Error(`行情接口返回 ${response.statusCode || "未知状态"}`)
            );
            return;
          }

          try {
            resolve(JSON.parse(body) as T);
          } catch {
            reject(new Error("行情接口返回了无效数据"));
          }
        });
      }
    );

    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error("行情请求超时"));
    });
    request.on("error", reject);
  });
}

async function fetchOkxPrices(symbol: "BTC" | "ETH") {
  const instrument = ALLOWED_SYMBOLS[symbol].okxInstrument;
  const rows: string[][] = [];
  let after: string | null = null;

  for (let page = 0; page < 3; page += 1) {
    const url = new URL("https://www.okx.com/api/v5/market/history-candles");
    url.searchParams.set("instId", instrument);
    url.searchParams.set("bar", "1Dutc");
    url.searchParams.set("limit", "300");
    if (after) url.searchParams.set("after", after);

    const response = await requestJson<OkxHistoryResponse>(url.toString());
    if (response.code !== "0" || !Array.isArray(response.data)) {
      throw new Error(response.msg || "OKX 未返回有效历史行情");
    }

    rows.push(...response.data);
    const oldestTimestamp = response.data.at(-1)?.[0];
    if (!oldestTimestamp || response.data.length < 300) break;
    after = oldestTimestamp;
  }

  return normalizeOkxRows(rows);
}

async function fetchQqqPrices(forceRefresh = false) {
  const startDate = new Date();
  startDate.setUTCMonth(startDate.getUTCMonth() - 30);

  const url = new URL(
    "https://api.nasdaq.com/api/quote/QQQ/historical"
  );
  url.searchParams.set("assetclass", "etf");
  url.searchParams.set("fromdate", formatIsoDate(startDate));
  url.searchParams.set("limit", "5000");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
    ...(forceRefresh
      ? { cache: "no-store" as const }
      : { next: { revalidate: 60 * 60 } }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(`Nasdaq API returned ${response.status}`);
  }

  const json = await response.json();
  const rows = json?.data?.tradesTable?.rows;
  if (!Array.isArray(rows)) {
    throw new Error("Nasdaq API 未返回有效历史行情");
  }

  return normalizeRows(rows);
}

function buildPayload(symbol: AllowedSymbol, prices: PricePoint[]): DcaZonePayload {
  const lookback = symbol === "QQQ" ? 252 : 365;

  if (prices.length < lookback * 2 - 1) {
    throw new Error("历史行情不足，暂时无法计算近 52 周回撤");
  }

  const pointsWithDrawdown: ChartPoint[] = prices.map((point, index) => {
    const windowStart = Math.max(0, index - (lookback - 1));
    let rollingHigh = point.close;

    for (let cursor = windowStart; cursor <= index; cursor += 1) {
      rollingHigh = Math.max(rollingHigh, prices[cursor].close);
    }

    return {
      ...point,
      rollingHigh: round(rollingHigh),
      drawdown: round((point.close / rollingHigh - 1) * 100),
    };
  });

  const points = pointsWithDrawdown.slice(-lookback);
  const latest = points[points.length - 1];
  const latestWindow = prices.slice(-lookback);
  const highPoint = latestWindow.reduce((highest, point) =>
    point.close > highest.close ? point : highest
  );
  const drawdown = round((latest.close / highPoint.close - 1) * 100);
  const details = ALLOWED_SYMBOLS[symbol];

  return {
    symbol,
    name: details.name,
    proxyLabel: details.proxyLabel,
    source: details.source,
    sourceUrl: details.sourceUrl,
    quoteCurrency: details.quoteCurrency,
    asOf: latest.date,
    currentPrice: round(latest.close),
    high52Week: round(highPoint.close),
    high52WeekDate: highPoint.date,
    drawdown,
    distanceToBattingZone:
      drawdown <= -10 ? 0 : round(Math.max(0, 10 - Math.abs(drawdown))),
    status: getStatus(drawdown),
    points,
  };
}

async function fetchZoneData(
  symbol: AllowedSymbol,
  forceRefresh = false
): Promise<DcaZonePayload> {
  const cached = memoryCache.get(symbol);
  const now = Date.now();

  if (!forceRefresh && cached && now - cached.timestamp < MEMORY_CACHE_MS) {
    return cached.data;
  }

  try {
    const prices =
      symbol === "QQQ"
        ? await fetchQqqPrices(forceRefresh)
        : await fetchOkxPrices(symbol);
    const data = buildPayload(symbol, prices);
    memoryCache.set(symbol, { data, timestamp: now });
    return data;
  } catch (error) {
    if (cached) {
      return { ...cached.data, stale: true };
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const rawSymbol = request.nextUrl.searchParams.get("symbol")?.toUpperCase();
  const symbol: AllowedSymbol =
    rawSymbol === "ETH" ? "ETH" : rawSymbol === "QQQ" ? "QQQ" : "BTC";
  const forceRefresh = request.nextUrl.searchParams.has("refresh");

  if (rawSymbol && !(rawSymbol in ALLOWED_SYMBOLS)) {
    return NextResponse.json(
      { error: "仅支持 BTC、ETH 与 QQQ" },
      { status: 400 }
    );
  }

  try {
    const data = await fetchZoneData(symbol, forceRefresh);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error(`[DCA Zone] Failed to load ${symbol}:`, error);
    return NextResponse.json(
      { error: "行情暂时不可用，请稍后重试" },
      { status: 503 }
    );
  }
}
