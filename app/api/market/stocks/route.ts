import { NextResponse } from "next/server";

const CACHE_DURATION = 60 * 60 * 1000; // 1 小时
const TICKERS = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA"];

export interface StockData {
  ticker: string;
  name: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  marketCap: number | null;
  pe: number | null;
  forwardPE: number | null;
  eps: number | null;
  epsForward: number | null;
  week52High: number | null;
  week52Low: number | null;
  week52ChangePercent: number | null;
  beta: number | null;
  dividendYield: number | null;
  targetPrice: number | null;
  priceToBook: number | null;
  // From quoteSummary
  revenue: number | null;
  revenueGrowth: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  roe: number | null;
  freeCashflow: number | null;
  updatedAt: number;
}

let cache: { data: StockData[]; timestamp: number } | null = null;

const YF_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

export async function GET() {
  const now = Date.now();

  if (cache && now - cache.timestamp < CACHE_DURATION) {
    return NextResponse.json({ stocks: cache.data, cached: true, updatedAt: cache.timestamp });
  }

  try {
    // 1. 批量获取行情快照
    const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${TICKERS.join(",")}&fields=symbol,shortName,regularMarketPrice,regularMarketChange,regularMarketChangePercent,marketCap,trailingPE,forwardPE,epsTrailingTwelveMonths,epsForward,fiftyTwoWeekHigh,fiftyTwoWeekLow,fiftyTwoWeekChangePercent,beta,dividendYield,targetMeanPrice,priceToBook`;

    const quoteRes = await fetch(quoteUrl, {
      headers: YF_HEADERS,
      signal: AbortSignal.timeout(10000),
    });
    if (!quoteRes.ok) throw new Error(`Quote API ${quoteRes.status}`);
    const quoteJson = await quoteRes.json();
    const quotes: Record<string, any> = {};
    for (const q of quoteJson.quoteResponse?.result ?? []) {
      quotes[q.symbol] = q;
    }

    // 2. 并行获取各股详细财务数据
    const summaries = await Promise.all(
      TICKERS.map((ticker) =>
        fetch(
          `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=defaultKeyStatistics,financialData`,
          { headers: YF_HEADERS, signal: AbortSignal.timeout(10000) }
        )
          .then((r) => r.json())
          .catch(() => null)
      )
    );

    const stocks: StockData[] = TICKERS.map((ticker, i) => {
      const q = quotes[ticker] ?? {};
      const summary = summaries[i]?.quoteSummary?.result?.[0];
      const stats = summary?.defaultKeyStatistics;
      const fin = summary?.financialData;

      const pct = (v: any) => (v?.raw != null ? +(v.raw * 100).toFixed(2) : null);
      const raw = (v: any) => (v?.raw != null ? v.raw : null);

      return {
        ticker,
        name: q.shortName ?? ticker,
        price: q.regularMarketPrice ?? 0,
        priceChange: q.regularMarketChange ?? 0,
        priceChangePercent: q.regularMarketChangePercent ?? 0,
        marketCap: q.marketCap ?? null,
        pe: q.trailingPE ?? null,
        forwardPE: q.forwardPE ?? null,
        eps: q.epsTrailingTwelveMonths ?? null,
        epsForward: q.epsForward ?? null,
        week52High: q.fiftyTwoWeekHigh ?? null,
        week52Low: q.fiftyTwoWeekLow ?? null,
        week52ChangePercent: q.fiftyTwoWeekChangePercent != null ? +(q.fiftyTwoWeekChangePercent * 100).toFixed(2) : null,
        beta: q.beta ?? raw(stats?.beta),
        dividendYield: q.dividendYield != null ? +(q.dividendYield * 100).toFixed(2) : null,
        targetPrice: q.targetMeanPrice ?? null,
        priceToBook: q.priceToBook ?? raw(stats?.priceToBook),
        revenue: raw(fin?.totalRevenue),
        revenueGrowth: pct(fin?.revenueGrowth),
        grossMargin: pct(fin?.grossMargins),
        operatingMargin: pct(fin?.operatingMargins),
        netMargin: pct(fin?.profitMargins),
        roe: pct(fin?.returnOnEquity),
        freeCashflow: raw(fin?.freeCashflow),
        updatedAt: now,
      };
    });

    cache = { data: stocks, timestamp: now };
    return NextResponse.json({ stocks, updatedAt: now });
  } catch (err) {
    if (cache) {
      return NextResponse.json({ stocks: cache.data, updatedAt: cache.timestamp, stale: true });
    }
    return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 503 });
  }
}
