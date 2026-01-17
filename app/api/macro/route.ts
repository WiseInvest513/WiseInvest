import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

// Force dynamic to prevent Vercel from caching stale data at build time
export const dynamic = 'force-dynamic';

/**
 * Macro Dashboard API Route
 * 宏观仪表板数据获取 API
 * 
 * Production-ready version using yahoo-finance2
 * 适用于 Vercel 部署的生产版本
 */
export async function GET() {
  try {
    console.log('[Macro API] Fetching Macro Data (Yahoo Finance)...');

    // Fetch all concurrently for fastest response time
    const results = await Promise.all([
      yahooFinance.quote('^TNX'),     // 10-Year Treasury Yield
      yahooFinance.quote('DX-Y.NYB'), // US Dollar Index
      yahooFinance.quote('^VIX'),     // VIX Volatility Index
      yahooFinance.quote('GC=F'),     // Gold Futures
      yahooFinance.quote('BTC-USD')   // Bitcoin
    ]);

    const [yield10y, dxy, vix, gold, btc] = results;

    // Helper to safely format data
    const format = (quote: any, isYield = false) => {
      if (!quote) return { value: 0, change: 0 };
      
      let value = quote.regularMarketPrice || 0;
      // CRITICAL: Treasury Yield from Yahoo is usually x10 (e.g. 42.5), need to divide by 10 to get %
      if (isYield) value = value / 10;

      return {
        value: Math.round(value * 100) / 100, // Round to 2 decimal places
        change: Math.round((quote.regularMarketChangePercent || 0) * 100) / 100,
      };
    };

    const payload = {
      success: true,
      treasury10y: format(yield10y, true), // Apply /10 logic for yield
      dxy: format(dxy),
      vix: format(vix),
      gold: format(gold),
      btc: format(btc),
      updateTime: new Date().toISOString(),
      source: 'Yahoo Finance',
    };

    console.log('[Macro API] ✅ Data fetched successfully:', {
      treasury10y: payload.treasury10y.value,
      dxy: payload.dxy.value,
      vix: payload.vix.value,
      gold: payload.gold.value,
      btc: payload.btc.value,
    });

    return NextResponse.json(payload);

  } catch (error: any) {
    console.error('[Macro API] ❌ Error:', error.message);
    // Return 500 so Vercel logs show the error
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch market data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
