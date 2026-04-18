import { NextResponse } from "next/server";

export interface BTCHistoryPoint {
  d: string;  // YYYY-MM-DD
  p: number;  // price USD
}

const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6小时

let cache: { data: BTCHistoryPoint[]; timestamp: number } | null = null;

const YF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

export async function GET() {
  const now = Date.now();

  if (cache && now - cache.timestamp < CACHE_DURATION) {
    return NextResponse.json({ history: cache.data, cached: true, updatedAt: cache.timestamp });
  }

  try {
    // Yahoo Finance BTC-USD 近13年周K线
    const url =
      "https://query1.finance.yahoo.com/v8/finance/chart/BTC-USD?range=13y&interval=1wk&includePrePost=false";

    const res = await fetch(url, {
      headers: YF_HEADERS,
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status}`);

    const json = await res.json();
    const chart = json?.chart?.result?.[0];
    if (!chart) throw new Error("No chart data");

    const timestamps: number[] = chart.timestamp ?? [];
    const closes: number[] = chart.indicators?.quote?.[0]?.close ?? [];

    const data: BTCHistoryPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const price = closes[i];
      if (price == null || price <= 0) continue;
      const d = new Date(timestamps[i] * 1000).toISOString().substring(0, 10);
      data.push({ d, p: Math.round(price) });
    }

    if (data.length < 50) throw new Error("Insufficient data points");

    cache = { data, timestamp: now };
    return NextResponse.json({ history: data, updatedAt: now });
  } catch (err) {
    if (cache) {
      return NextResponse.json({ history: cache.data, updatedAt: cache.timestamp, stale: true });
    }
    return NextResponse.json({ error: String(err) }, { status: 503 });
  }
}
