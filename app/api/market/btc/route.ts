import { NextResponse } from "next/server";

const CACHE_DURATION = 60 * 60 * 1000; // 1 小时

interface BTCData {
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  priceChangePercent7d: number;
  priceChangePercent30d: number;
  priceChangePercent1y: number;
  marketCap: number;
  dominance: number;
  volume24h: number;
  circulatingSupply: number;
  ath: number;
  athDate: string;
  updatedAt: number;
  stale?: boolean;
}

let cache: { data: BTCData; timestamp: number } | null = null;

export async function GET() {
  const now = Date.now();

  if (cache && now - cache.timestamp < CACHE_DURATION) {
    return NextResponse.json({ ...cache.data, cached: true });
  }

  try {
    const [coinRes, globalRes] = await Promise.all([
      fetch(
        "https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false",
        { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }
      ),
      fetch("https://api.coingecko.com/api/v3/global", {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      }),
    ]);

    if (!coinRes.ok || !globalRes.ok) throw new Error("CoinGecko API error");

    const coin = await coinRes.json();
    const global = await globalRes.json();
    const md = coin.market_data;

    const data: BTCData = {
      price: md.current_price.usd,
      priceChange24h: md.price_change_24h,
      priceChangePercent24h: md.price_change_percentage_24h,
      priceChangePercent7d: md.price_change_percentage_7d,
      priceChangePercent30d: md.price_change_percentage_30d,
      priceChangePercent1y: md.price_change_percentage_1y,
      marketCap: md.market_cap.usd,
      dominance: global.data.market_cap_percentage.btc,
      volume24h: md.total_volume.usd,
      circulatingSupply: md.circulating_supply,
      ath: md.ath.usd,
      athDate: md.ath_date.usd,
      updatedAt: now,
    };

    cache = { data, timestamp: now };
    return NextResponse.json(data);
  } catch {
    if (cache) {
      return NextResponse.json({ ...cache.data, stale: true });
    }
    return NextResponse.json({ error: "Failed to fetch BTC data" }, { status: 503 });
  }
}
