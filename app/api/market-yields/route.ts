import { NextRequest, NextResponse } from 'next/server';
import { HttpsProxyAgent } from 'https-proxy-agent';
import https from 'https';
import http from 'http';

// Force dynamic to prevent Vercel from caching stale data at build time
export const dynamic = 'force-dynamic';

/**
 * Market Yields API Route
 * 资产收益率 API 路由
 * 
 * 实现 "Stale-While-Revalidate" 缓存策略
 * 按 UTC 日期缓存，当天有缓存直接返回，否则重新计算
 */

// ==================== 目标资产配置 ====================

interface AssetConfig {
  symbol: string;
  type: 'index' | 'crypto';
  name: string;
}

const CRYPTO_CONFIG: Record<string, { coinpaprikaId: string; coingeckoId: string }> = {
  BTC: { coinpaprikaId: 'btc-bitcoin', coingeckoId: 'bitcoin' },
  ETH: { coinpaprikaId: 'eth-ethereum', coingeckoId: 'ethereum' },
  BNB: { coinpaprikaId: 'bnb-binance-coin', coingeckoId: 'binancecoin' },
  OKB: { coinpaprikaId: 'okb-okb', coingeckoId: 'okb' },
  SOL: { coinpaprikaId: 'sol-solana', coingeckoId: 'solana' },
};

const INDEX_CONFIG: Record<string, { symbol: string; name: string }> = {
  'NDX': { symbol: '^NDX', name: 'Nasdaq 100' },
  'SPX': { symbol: '^GSPC', name: 'S&P 500' },
  'DJI': { symbol: '^DJI', name: 'Dow Jones Industrial Average' },
  'TNX': { symbol: '^TNX', name: '10-Year Treasury Yield' },
  'VIX': { symbol: '^VIX', name: 'VIX Volatility Index' },
};

const TARGET_ASSETS: AssetConfig[] = [
  { symbol: 'NDX', type: 'index', name: 'Nasdaq 100' },
  { symbol: 'SPX', type: 'index', name: 'S&P 500' },
  { symbol: 'BTC', type: 'crypto', name: 'Bitcoin' },
  { symbol: 'ETH', type: 'crypto', name: 'Ethereum' },
  { symbol: 'BNB', type: 'crypto', name: 'Binance Coin' },
  { symbol: 'OKB', type: 'crypto', name: 'OKB' },
  { symbol: 'SOL', type: 'crypto', name: 'Solana' },
];

// ==================== 缓存机制 ====================

interface CachedData {
  date: string; // UTC date string (YYYY-MM-DD)
  data: YieldData[];
  timestamp: number;
}

interface YieldData {
  symbol: string;
  name: string;
  type: 'index' | 'crypto';
  currentPrice: number;
  yields: {
    '3M': number | null;
    '6M': number | null;
    'YTD': number | null;
    '1Y': number | null;
    '3Y': number | null;
    '5Y': number | null;
  };
  historicalPrices: {
    '3M': number | null;
    '6M': number | null;
    'YTD': number | null;
    '1Y': number | null;
    '3Y': number | null;
    '5Y': number | null;
  };
}

const yieldCache = new Map<string, CachedData>();

function getTodayUTC(): string {
  const now = new Date();
  const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return utcDate.toISOString().split('T')[0];
}

function getCachedData(): YieldData[] | null {
  const today = getTodayUTC();
  const cached = yieldCache.get('market-yields');
  
  if (cached && cached.date === today) {
    return cached.data;
  }
  
  return null;
}

function setCachedData(data: YieldData[]): void {
  const today = getTodayUTC();
  yieldCache.set('market-yields', {
    date: today,
    data,
    timestamp: Date.now(),
  });
}

// ==================== 日期工具函数 ====================

/**
 * 获取股票市场的上一个交易日（跳过周末）
 */
function getPreviousTradingDay(date: Date): Date {
  const result = new Date(date);
  const dayOfWeek = result.getUTCDay(); // 0 = Sunday, 6 = Saturday
  
  if (dayOfWeek === 0) {
    // Sunday -> Friday (2 days back)
    result.setUTCDate(result.getUTCDate() - 2);
  } else if (dayOfWeek === 6) {
    // Saturday -> Friday (1 day back)
    result.setUTCDate(result.getUTCDate() - 1);
  }
  
  return result;
}

/**
 * 计算目标日期
 */
function getTargetDates(): Record<string, Date> {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  
  return {
    '3M': new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, now.getUTCDate())),
    '6M': new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 6, now.getUTCDate())),
    'YTD': new Date(Date.UTC(currentYear, 0, 1)), // Jan 1st
    '1Y': new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate())),
    '3Y': new Date(Date.UTC(now.getUTCFullYear() - 3, now.getUTCMonth(), now.getUTCDate())),
    '5Y': new Date(Date.UTC(now.getUTCFullYear() - 5, now.getUTCMonth(), now.getUTCDate())),
  };
}

// ==================== 网络请求工具 ====================

function getProxyAgent() {
  const proxy = process.env.https_proxy || process.env.HTTPS_PROXY || 
                process.env.http_proxy || process.env.HTTP_PROXY;
  return proxy ? new HttpsProxyAgent(proxy) : undefined;
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number = 8000): Promise<Response> {
  const urlObj = new URL(url);
  const proxyAgent = getProxyAgent();
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, timeoutMs);

    // 更真实的浏览器请求头，避免被识别为爬虫
    const headers: Record<string, string> = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Referer': 'https://finance.yahoo.com/',
      'Origin': 'https://finance.yahoo.com',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    };

    const req = (urlObj.protocol === 'https:' ? https : http).request({
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers,
      ...(proxyAgent && { agent: proxyAgent }),
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        clearTimeout(timeout);
        const body = Buffer.concat(chunks).toString();
        const headers = new Headers();
        Object.keys(res.headers).forEach(key => {
          const value = res.headers[key];
          if (value) {
            if (Array.isArray(value)) {
              value.forEach(v => headers.append(key, v));
            } else {
              headers.set(key, value);
            }
          }
        });
        resolve(new Response(body, {
          status: res.statusCode || 200,
          statusText: res.statusMessage || 'OK',
          headers: headers,
        }));
      });
    });

    req.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    req.end();
  });
}

// ==================== 价格获取函数 ====================

async function fetchCryptoPrice(symbol: string): Promise<number | null> {
  const config = CRYPTO_CONFIG[symbol.toUpperCase()];
  if (!config) return null;

  try {
    const url = `https://api.coinpaprika.com/v1/tickers/${config.coinpaprikaId}`;
    const response = await fetchJsonWithTimeout(url, 8000);
    
    if (!response.ok) return null;

    const data = await response.json();
    const price = data?.quotes?.USD?.price;
    
    if (typeof price === 'number' && price > 0 && isFinite(price)) {
      return price;
    }
    
    return null;
  } catch {
    return null;
  }
}

async function fetchCryptoHistorical(symbol: string, date: Date): Promise<number | null> {
  const config = CRYPTO_CONFIG[symbol.toUpperCase()];
  if (!config?.coingeckoId) return null;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const url = `https://api.coingecko.com/api/v3/coins/${config.coingeckoId}/history?date=${day}-${month}-${year}`;

  try {
    const response = await fetchJsonWithTimeout(url, 8000);
    if (!response.ok) return null;

    const data = await response.json();
    const price = data.market_data?.current_price?.usd;
    
    if (typeof price === 'number' && price > 0 && isFinite(price)) {
      return price;
    }
    
    return null;
  } catch {
    return null;
  }
}

async function fetchIndexPrice(symbol: string): Promise<number | null> {
  const index = INDEX_CONFIG[symbol.toUpperCase()];
  let yahooSymbol: string;
  
  if (index) {
    yahooSymbol = index.symbol;
  } else {
    yahooSymbol = symbol.startsWith('^') ? symbol : `^${symbol}`;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d`;
    const response = await fetchJsonWithTimeout(url, 8000);
    
    if (!response.ok) return null;

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    
    if (!result) return null;

    const meta = result.meta;
    const regularMarketPrice = meta?.regularMarketPrice;
    
    if (typeof regularMarketPrice === 'number' && regularMarketPrice > 0) {
      return regularMarketPrice;
    }
    
    return null;
  } catch {
    return null;
  }
}

async function fetchIndexHistorical(symbol: string, date: Date): Promise<number | null> {
  const index = INDEX_CONFIG[symbol.toUpperCase()];
  let yahooSymbol: string;
  
  if (index) {
    yahooSymbol = index.symbol;
  } else {
    yahooSymbol = symbol.startsWith('^') ? symbol : `^${symbol}`;
  }

  try {
    const timestamp = Math.floor(date.getTime() / 1000);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&period1=${timestamp}&period2=${timestamp + 86400}`;
    const response = await fetchJsonWithTimeout(url, 8000);
    
    if (!response.ok) return null;

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    
    if (!result || !result.timestamp || result.timestamp.length === 0) {
      return null;
    }

    const closes = result.indicators?.quote?.[0]?.close;
    if (!closes || closes.length === 0) {
      return null;
    }

    const price = closes[0];
    if (typeof price === 'number' && price > 0 && isFinite(price)) {
      return price;
    }
    
    return null;
  } catch {
    return null;
  }
}

async function fetchPrice(symbol: string, type: 'index' | 'crypto', date?: Date): Promise<number | null> {
  try {
    if (date) {
      // 获取历史价格
      if (type === 'crypto') {
        return await fetchCryptoHistorical(symbol, date);
      } else {
        return await fetchIndexHistorical(symbol, date);
      }
    } else {
      // 获取当前价格
      if (type === 'crypto') {
        return await fetchCryptoPrice(symbol);
      } else {
        return await fetchIndexPrice(symbol);
      }
    }
  } catch (error) {
    console.error(`Failed to fetch price for ${symbol}:`, error);
    return null;
  }
}

// ==================== 收益率计算 ====================

async function calculateYields(asset: AssetConfig): Promise<YieldData | null> {
  const targetDates = getTargetDates();
  const currentPrice = await fetchPrice(asset.symbol, asset.type);
  
  if (!currentPrice) return null;
  
  const historicalPrices: Record<string, number | null> = {};
  const yields: Record<string, number | null> = {};
  
  // 获取所有历史价格
  for (const [period, date] of Object.entries(targetDates)) {
    let targetDate = date;
    
    // 对于股票，如果是周末，调整到上一个交易日
    if (asset.type === 'index') {
      targetDate = getPreviousTradingDay(date);
    }
    
    const historicalPrice = await fetchPrice(asset.symbol, asset.type, targetDate);
    historicalPrices[period] = historicalPrice;
    
    if (historicalPrice && historicalPrice > 0) {
      yields[period] = ((currentPrice - historicalPrice) / historicalPrice) * 100;
    } else {
      yields[period] = null;
    }
  }
  
  return {
    symbol: asset.symbol,
    name: asset.name,
    type: asset.type,
    currentPrice,
    yields: yields as YieldData['yields'],
    historicalPrices: historicalPrices as YieldData['historicalPrices'],
  };
}

// ==================== API 路由处理 ====================

export async function GET(request: NextRequest) {
  try {
    // 检查缓存
    const cached = getCachedData();
    if (cached) {
      return NextResponse.json({ data: cached, cached: true });
    }
    
    // 计算所有资产的收益率
    const results: YieldData[] = [];
    
    for (const asset of TARGET_ASSETS) {
      const yieldData = await calculateYields(asset);
      if (yieldData) {
        results.push(yieldData);
      }
    }
    
    // 缓存结果
    setCachedData(results);
    
    return NextResponse.json({ data: results, cached: false });
  } catch (error) {
    console.error('Market yields API error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate market yields' },
      { status: 500 }
    );
  }
}

