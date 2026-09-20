import { request as httpsRequest, type RequestOptions } from "node:https";
import type { ClientRequest, IncomingMessage } from "node:http";
import { HttpsProxyAgent } from "https-proxy-agent";
import type {
  PointCategory,
  PointInstrument,
  PointInstrumentSearch,
  PointQuote,
} from "./types";

// Public market data only: this module never accepts a URL, API key or order.
const BINANCE_ORIGIN = "https://fapi.binance.com";
const EXCHANGE_INFO_PATH = "/fapi/v1/exchangeInfo";
const PRICE_PATH = "/fapi/v2/ticker/price";
const CATALOG_TTL = 15 * 60_000;
const CONFIRMATION_TTL = 60_000;
export const POINT_QUOTE_TTL = 5 * 60_000;
const MAX_STALE_AGE = 24 * 60 * 60_000;
const MAX_CATALOG_ITEMS = 5_000;
const REQUEST_TIMEOUT = 7_000;
const MAX_RESPONSE_BYTES = 4 * 1024 * 1024;
const SOURCE = "BINANCE_USD_M_LAST_PRICE" as const;
const SUPPORTED_CONTRACTS = new Set(["PERPETUAL", "TRADIFI_PERPETUAL"]);

// These enrich an existing exchangeInfo result; they never create instruments.
const VERIFIED_NAMES: Record<
  string,
  {
    name: string;
    category: PointCategory;
    baseAsset: string;
    sourceUrl: string;
  }
> = {
  BTCUSDT: {
    name: "Bitcoin（比特币）",
    category: "CRYPTO",
    baseAsset: "BTC",
    sourceUrl: "https://www.binance.com/en/price/bitcoin",
  },
  ETHUSDT: {
    name: "Ethereum（以太坊）",
    category: "CRYPTO",
    baseAsset: "ETH",
    sourceUrl: "https://www.binance.com/en/price/ethereum",
  },
  MUUSDT: {
    name: "Micron Technology（美光科技）",
    category: "EQUITY",
    baseAsset: "MU",
    sourceUrl:
      "https://www.binance.com/en/support/announcement/detail/80549fadb3e447d1a859b8cedd0ccd69",
  },
  INTCUSDT: {
    name: "Intel Corporation（英特尔）",
    category: "EQUITY",
    baseAsset: "INTC",
    sourceUrl:
      "https://www.binance.com/en/support/announcement/detail/d592f6ba938746cbadaaf5a8a714abd6",
  },
};

export class BinancePointError extends Error {
  code: "INVALID_SYMBOL" | "UNSUPPORTED_INSTRUMENT" | "UPSTREAM_UNAVAILABLE";
  constructor(code: BinancePointError["code"], message: string) {
    super(message);
    this.name = "BinancePointError";
    this.code = code;
  }
}

export function isPointBinanceSymbol(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z0-9]{2,30}$/.test(value);
}

function isPositiveDecimal(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 80 &&
    /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value) &&
    /[1-9]/.test(value)
  );
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function categoryFor(
  row: Record<string, unknown>,
  verified?: { category: PointCategory },
): PointCategory {
  // Classification is explicit provider metadata, never a stock-ticker regex.
  const metadata = [
    row.underlyingType,
    ...(Array.isArray(row.underlyingSubType) ? row.underlyingSubType : []),
  ]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toUpperCase());
  if (
    metadata.some((value) =>
      ["STOCK", "STOCKS", "EQUITY", "EQUITIES"].includes(value),
    )
  )
    return "EQUITY";
  if (verified) return verified.category;
  if (metadata.includes("COIN") || metadata.includes("CRYPTO")) return "CRYPTO";
  return "OTHER";
}

function parseInstrument(
  value: unknown,
  fetchedAt: number,
): PointInstrument | null {
  const row = record(value);
  if (
    !row ||
    !isPointBinanceSymbol(row.symbol) ||
    typeof row.baseAsset !== "string" ||
    typeof row.quoteAsset !== "string" ||
    typeof row.marginAsset !== "string" ||
    typeof row.contractType !== "string" ||
    typeof row.status !== "string"
  )
    return null;
  const priceFilter = Array.isArray(row.filters)
    ? row.filters
        .map(record)
        .find((filter) => filter?.filterType === "PRICE_FILTER")
    : null;
  if (!priceFilter || !isPositiveDecimal(priceFilter.tickSize)) return null;
  const candidate = VERIFIED_NAMES[row.symbol];
  const verified =
    candidate?.baseAsset === row.baseAsset &&
    row.quoteAsset === "USDT" &&
    row.marginAsset === "USDT"
      ? candidate
      : undefined;
  return {
    provider: "BINANCE",
    market: "USD_M_FUTURES",
    symbol: row.symbol,
    name: verified?.name ?? `${row.baseAsset}（全称待核验）`,
    category: categoryFor(row, verified),
    contractType: row.contractType,
    baseAsset: row.baseAsset,
    quoteAsset: row.quoteAsset,
    marginAsset: row.marginAsset,
    tickSize: priceFilter.tickSize,
    status: row.status,
    sourceUrl: verified?.sourceUrl ?? null,
    verifiedAt: new Date(fetchedAt).toISOString(),
  };
}

function isSupported(item: PointInstrument) {
  return (
    SUPPORTED_CONTRACTS.has(item.contractType) &&
    item.status === "TRADING" &&
    item.quoteAsset === "USDT" &&
    item.marginAsset === "USDT"
  );
}

function unavailableQuote(symbol: string, message: string): PointQuote {
  return {
    symbol,
    price: null,
    sourceTime: null,
    fetchedAt: null,
    status: "unavailable",
    source: SOURCE,
    message,
  };
}

type CachedQuote = { price: string; sourceTime: number; fetchedAt: number };
type Catalog = { items: Map<string, PointInstrument>; fetchedAt: number };
type Transport = (input: string, init: RequestInit) => Promise<Response>;
type Options = { fetch?: Transport; now?: () => number; timeoutMs?: number };

type TransportOptions = {
  env?: NodeJS.ProcessEnv;
  fetch?: Transport;
  request?: typeof httpsRequest;
};

function proxyUrlFromEnvironment(env: NodeJS.ProcessEnv): string | undefined {
  const configured = [
    env.POINT_HTTPS_PROXY,
    env.https_proxy,
    env.HTTPS_PROXY,
    env.http_proxy,
    env.HTTP_PROXY,
  ].find((value) => value?.trim());
  if (!configured) return undefined;
  try {
    const url = new URL(configured.trim());
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      throw new Error();
    return url.href;
  } catch {
    // Never include a proxy URL: it may contain credentials.
    throw new Error("Invalid Binance HTTPS proxy configuration");
  }
}

async function boundedNativeResponse(response: Response): Promise<Response> {
  if (!response.body) return response;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES)
        throw new Error("Binance response exceeds size limit");
      chunks.push(value);
    }
    return new Response(new Uint8Array(Buffer.concat(chunks)), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}

/** Server-only, public GET transport. Proxying is opt-in; direct is the default. */
export function createBinancePointTransport(
  options: TransportOptions = {},
): Transport {
  const env = options.env ?? process.env;
  return async (input, init) => {
    if (
      ![`${BINANCE_ORIGIN}${EXCHANGE_INFO_PATH}`, `${BINANCE_ORIGIN}${PRICE_PATH}`].includes(input) ||
      (init.method && init.method !== "GET") ||
      init.body != null
    )
      throw new Error("Unsupported Binance public market-data request");
    init.signal?.throwIfAborted();
    const proxyUrl = proxyUrlFromEnvironment(env);
    if (!proxyUrl) {
      const response = await (options.fetch ?? fetch)(input, {
        ...init,
        redirect: "error",
      });
      return boundedNativeResponse(response);
    }

    // Forward cancellation to the proxy socket as well as the final request;
    // otherwise a stalled CONNECT handshake can outlive the request timeout.
    const agent = new HttpsProxyAgent(proxyUrl, {
      signal: init.signal ?? undefined,
    });
    const outgoingHeaders: Record<string, string> = {};
    new Headers(init.headers).forEach((value, key) => {
      outgoingHeaders[key] = value;
    });
    // This transport buffers JSON; do not negotiate compressed response bodies.
    outgoingHeaders["accept-encoding"] = "identity";
    return new Promise<Response>((resolve, reject) => {
      let settled = false;
      let req: ClientRequest | undefined;
      let incoming: IncomingMessage | undefined;
      const finish = (error?: Error, response?: Response) => {
        if (settled) return;
        settled = true;
        init.signal?.removeEventListener("abort", onAbort);
        if (error) {
          incoming?.destroy();
          req?.destroy();
          reject(error);
        } else {
          resolve(response!);
        }
        agent.destroy();
      };
      const onAbort = () =>
        finish(new DOMException("Binance request aborted", "AbortError"));
      const onError = () => finish(new Error("Binance proxy request failed"));
      const requestOptions: RequestOptions = {
        method: "GET",
        headers: outgoingHeaders,
        agent,
        signal: init.signal ?? undefined,
      };
      try {
        req = (options.request ?? httpsRequest)(input, requestOptions, (res) => {
          if (settled) {
            res.destroy();
            return;
          }
          incoming = res;
          const chunks: Buffer[] = [];
          let bytes = 0;
          res.on("error", onError);
          res.on("aborted", onError);
          res.on("data", (chunk: Buffer) => {
            if (settled) return;
            bytes += chunk.length;
            if (bytes > MAX_RESPONSE_BYTES) {
              finish(new Error("Binance response exceeds size limit"));
              return;
            }
            chunks.push(chunk);
          });
          res.on("end", () => {
            if (settled) return;
            try {
              const headers = new Headers();
              for (const [name, value] of Object.entries(res.headers)) {
                if (Array.isArray(value))
                  value.forEach((entry) => headers.append(name, entry));
                else if (value !== undefined) headers.set(name, value);
              }
              const status = res.statusCode ?? 502;
              finish(undefined, new Response(
                [204, 205, 304].includes(status) ? null : new Uint8Array(Buffer.concat(chunks)),
                { status, statusText: res.statusMessage, headers },
              ));
            } catch {
              onError();
            }
          });
        });
        req.on("error", onError);
        init.signal?.addEventListener("abort", onAbort, { once: true });
        if (init.signal?.aborted) onAbort();
        else req.end();
      } catch {
        onError();
      }
    });
  };
}

/** Dependency injection keeps tests deterministic without any production mock/fallback path. */
export function createBinancePointService(options: Options = {}) {
  const transport: Transport =
    options.fetch ?? createBinancePointTransport();
  const now = options.now ?? Date.now;
  let catalog: Catalog | null = null;
  let catalogFlight: Promise<Catalog> | null = null;
  let quoteFlight: Promise<void> | null = null;
  let quoteSnapshotAt: number | null = null;
  let latestSymbols = new Set<string>();
  const quotes = new Map<string, CachedQuote>();
  const failures = new Map<string, { retryAt: number; count: number }>();
  let providerRetryAt = 0;
  let quoteFailure: string | null = null;

  async function request<T>(
    path: string,
    parse: (payload: unknown) => T,
  ): Promise<T> {
    const current = now();
    const previousFailure = failures.get(path);
    if (
      current < providerRetryAt ||
      (previousFailure && current < previousFailure.retryAt)
    ) {
      throw new BinancePointError(
        "UPSTREAM_UNAVAILABLE",
        "Binance 行情暂不可用，正在等待重试窗口",
      );
    }
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? REQUEST_TIMEOUT,
    );
    let retryAfterMs = 0;
    try {
      const response = await transport(`${BINANCE_ORIGIN}${path}`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        if (response.status === 429 || response.status === 418) {
          const header = response.headers.get("retry-after");
          if (header) {
            const seconds = Number(header);
            retryAfterMs = Number.isFinite(seconds)
              ? Math.max(0, seconds * 1_000)
              : Math.max(0, Date.parse(header) - now());
          }
          // A rate limit is shared by both endpoints on this server instance.
          providerRetryAt =
            now() +
            Math.max(Number.isFinite(retryAfterMs) ? retryAfterMs : 0, 60_000);
        }
        throw new Error(`Binance HTTP ${response.status}`);
      }
      // HTTP 200 is not a successful refresh until the payload is usable. Keep
      // malformed provider responses inside the same bounded retry policy.
      const payload = parse(await response.json());
      failures.delete(path);
      return payload;
    } catch {
      const count = Math.min((previousFailure?.count ?? 0) + 1, 7);
      failures.set(path, {
        count,
        retryAt:
          now() +
          Math.max(
            5_000 * 2 ** (count - 1),
            Number.isFinite(retryAfterMs) ? retryAfterMs : 0,
          ),
      });
      throw new BinancePointError(
        "UPSTREAM_UNAVAILABLE",
        "Binance 数据暂不可用，请稍后重试",
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async function getCatalog(maxAge = CATALOG_TTL): Promise<Catalog> {
    const age = catalog ? now() - catalog.fetchedAt : Infinity;
    if (catalog && age >= 0 && age < maxAge) return catalog;
    if (catalogFlight) return catalogFlight;
    catalogFlight = (async () => {
      catalog = await request(EXCHANGE_INFO_PATH, (value) => {
        const payload = record(value);
        if (
          !payload ||
          !Array.isArray(payload.symbols) ||
          payload.symbols.length === 0 ||
          payload.symbols.length > MAX_CATALOG_ITEMS
        )
          throw new Error("Invalid instrument response");
        const fetchedAt = now();
        const items = new Map<string, PointInstrument>();
        for (const row of payload.symbols) {
          const item = parseInstrument(row, fetchedAt);
          if (item) items.set(item.symbol, item);
        }
        if (!items.size) throw new Error("No valid instruments");
        return { items, fetchedAt };
      });
      return catalog;
    })();
    try {
      return await catalogFlight;
    } finally {
      catalogFlight = null;
    }
  }

  async function searchBinanceInstruments(
    query = "",
    category?: PointCategory,
  ): Promise<PointInstrumentSearch> {
    try {
      const result = await getCatalog();
      const needle = query.trim().toLocaleLowerCase().slice(0, 100);
      const items = [...result.items.values()]
        .filter(
          (item) =>
            isSupported(item) &&
            (!category || item.category === category) &&
            (!needle ||
              `${item.symbol} ${item.name} ${item.baseAsset}`
                .toLocaleLowerCase()
                .includes(needle)),
        )
        .sort(
          (a, b) =>
            Number(b.symbol.toLocaleLowerCase() === needle) -
              Number(a.symbol.toLocaleLowerCase() === needle) ||
            a.symbol.localeCompare(b.symbol),
        )
        .slice(0, 50);
      return {
        items,
        fetchedAt: new Date(result.fetchedAt).toISOString(),
        unavailable: false,
      };
    } catch {
      // Never quietly promote stale discovery data into a selectable instrument.
      return {
        items: [],
        fetchedAt: null,
        unavailable: true,
        message: "Binance 标的目录暂不可用，无法核验或选择标的",
      };
    }
  }

  async function getBinanceInstrument(
    symbol: string,
  ): Promise<PointInstrument> {
    if (!isPointBinanceSymbol(symbol))
      throw new BinancePointError(
        "INVALID_SYMBOL",
        "请输入 Binance 完整且精确的合约代码",
      );
    // Mutations re-check contract type and exchange status at least every minute.
    const result = await getCatalog(CONFIRMATION_TTL);
    const item = result.items.get(symbol);
    if (!item || !isSupported(item))
      throw new BinancePointError(
        "UNSUPPORTED_INSTRUMENT",
        "该代码不在 Binance 当前可交易的 USDT 永续合约目录中",
      );
    return { ...item };
  }

  async function refreshQuotes(): Promise<void> {
    if (
      quoteSnapshotAt !== null &&
      now() >= quoteSnapshotAt &&
      now() - quoteSnapshotAt < POINT_QUOTE_TTL
    )
      return;
    if (quoteFlight) return quoteFlight;
    quoteFlight = (async () => {
      try {
        const snapshot = await request(PRICE_PATH, (payload) => {
          const rows = Array.isArray(payload)
            ? payload
            : record(payload)
              ? [payload]
              : [];
          if (!rows.length || rows.length > MAX_CATALOG_ITEMS)
            throw new Error("Invalid ticker response");
          const fetchedAt = now();
          const entries = new Map<string, CachedQuote>();
          for (const value of rows) {
            const row = record(value);
            if (
              !row ||
              !isPointBinanceSymbol(row.symbol) ||
              !isPositiveDecimal(row.price) ||
              typeof row.time !== "number" ||
              !Number.isSafeInteger(row.time) ||
              row.time <= 0 ||
              row.time > fetchedAt ||
              fetchedAt - row.time > MAX_STALE_AGE
            )
              continue;
            if (!catalog?.items.has(row.symbol)) continue;
            const previous = entries.get(row.symbol) ?? quotes.get(row.symbol);
            // A regressing timestamp cannot turn an older or replayed price fresh.
            if (previous && row.time < previous.sourceTime) continue;
            entries.set(row.symbol, {
              price: row.price,
              sourceTime: row.time,
              fetchedAt,
            });
          }
          // An unusable batch must retry after backoff, not masquerade as a
          // successful five-minute snapshot or replace previously good data.
          if (!entries.size) throw new Error("No valid ticker rows");
          return { entries, fetchedAt };
        });
        for (const [symbol, quote] of snapshot.entries) {
          quotes.delete(symbol);
          quotes.set(symbol, quote);
        }
        while (quotes.size > MAX_CATALOG_ITEMS)
          quotes.delete(quotes.keys().next().value!);
        latestSymbols = new Set(snapshot.entries.keys());
        quoteSnapshotAt = snapshot.fetchedAt;
        quoteFailure = null;
      } catch {
        quoteFailure =
          "Binance 行情暂不可用；如显示价格，则为上一次成功获取的数据";
      }
    })();
    try {
      await quoteFlight;
    } finally {
      quoteFlight = null;
    }
  }

  async function getBinanceQuotes(symbols: string[]): Promise<PointQuote[]> {
    if (
      !Array.isArray(symbols) ||
      symbols.length > 50 ||
      symbols.some((symbol) => !isPointBinanceSymbol(symbol))
    ) {
      throw new BinancePointError(
        "INVALID_SYMBOL",
        "最多查询 50 个完整且精确的 Binance 合约代码",
      );
    }
    const unique = [...new Set(symbols)];
    if (!unique.length) return [];
    let currentCatalog: Catalog;
    try {
      currentCatalog = await getCatalog();
    } catch {
      return unique.map((symbol) =>
        fallback(symbol, "Binance 标的目录暂不可用，无法确认合约状态"),
      );
    }
    if (
      unique.some((symbol) => {
        const item = currentCatalog.items.get(symbol);
        return item && isSupported(item);
      })
    )
      await refreshQuotes();
    return unique.map((symbol) => {
      const item = currentCatalog.items.get(symbol);
      if (!item || !isSupported(item))
        return unavailableQuote(
          symbol,
          "Binance 暂不支持该标的，或合约当前非可交易状态",
        );
      const cached = quotes.get(symbol);
      const current = now();
      if (!cached)
        return unavailableQuote(
          symbol,
          quoteFailure ?? "Binance 本次响应未提供该合约的有效行情",
        );
      if (quoteFailure || !latestSymbols.has(symbol))
        return fallback(
          symbol,
          quoteFailure ?? "Binance 本次响应缺少该合约行情；显示上次数据",
        );
      if (
        cached.sourceTime > cached.fetchedAt ||
        cached.fetchedAt > current ||
        current - cached.sourceTime >= POINT_QUOTE_TTL ||
        current - cached.fetchedAt >= POINT_QUOTE_TTL
      ) {
        return fallback(symbol, "Binance 行情已超过 5 分钟，仅供参考");
      }
      return {
        symbol,
        price: cached.price,
        sourceTime: new Date(cached.sourceTime).toISOString(),
        fetchedAt: new Date(cached.fetchedAt).toISOString(),
        status: "fresh",
        source: SOURCE,
      };
    });
  }

  function fallback(symbol: string, message: string): PointQuote {
    const cached = quotes.get(symbol);
    const current = now();
    if (
      !cached ||
      cached.sourceTime > cached.fetchedAt ||
      cached.fetchedAt > current ||
      current - cached.sourceTime > MAX_STALE_AGE ||
      current - cached.fetchedAt > MAX_STALE_AGE
    )
      return unavailableQuote(symbol, message);
    return {
      symbol,
      price: cached.price,
      sourceTime: new Date(cached.sourceTime).toISOString(),
      fetchedAt: new Date(cached.fetchedAt).toISOString(),
      status: "stale",
      source: SOURCE,
      message,
    };
  }

  return { searchBinanceInstruments, getBinanceInstrument, getBinanceQuotes };
}

const service = createBinancePointService();
export const searchBinanceInstruments = service.searchBinanceInstruments;
export const getBinanceInstrument = service.getBinanceInstrument;
export const getBinanceQuotes = service.getBinanceQuotes;
