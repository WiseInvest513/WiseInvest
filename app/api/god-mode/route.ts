import { NextRequest, NextResponse } from 'next/server';
import { HttpsProxyAgent } from 'https-proxy-agent';
import https from 'https';
import http from 'http';

// Force dynamic to prevent Vercel from caching stale data at build time
export const dynamic = 'force-dynamic';

/**
 * God Mode API Route
 * 上帝视角 API 路由
 * 
 * 跨市场性能分析：指数、加密货币、大宗商品、市场领导者股票
 * 实现 24 小时缓存策略
 */

// ==================== 资产配置 ====================

interface AssetConfig {
  symbol: string;
  type: 'index' | 'crypto' | 'stock' | 'commodity';
  name: string;
  group: 'A' | 'B' | 'C' | 'D';
}

const GOD_MODE_ASSETS: AssetConfig[] = [
  // Group A: Indices
  { symbol: 'NDX', type: 'index', name: 'Nasdaq 100', group: 'A' },
  { symbol: 'SPX', type: 'index', name: 'S&P 500', group: 'A' },
  
  // Group B: Crypto
  { symbol: 'BTC', type: 'crypto', name: 'Bitcoin', group: 'B' },
  { symbol: 'ETH', type: 'crypto', name: 'Ethereum', group: 'B' },
  { symbol: 'BNB', type: 'crypto', name: 'Binance Coin', group: 'B' },
  { symbol: 'OKB', type: 'crypto', name: 'OKB', group: 'B' },
  { symbol: 'SOL', type: 'crypto', name: 'Solana', group: 'B' },
  
  // Group C: Commodities
  { symbol: 'GC=F', type: 'commodity', name: 'Gold', group: 'C' },
  { symbol: 'SI=F', type: 'commodity', name: 'Silver', group: 'C' },
  { symbol: 'HG=F', type: 'commodity', name: 'Copper', group: 'C' },
  { symbol: 'PL=F', type: 'commodity', name: 'Platinum', group: 'C' },
  
  // Group D: Market Leaders (Top Stocks)
  { symbol: 'NVDA', type: 'stock', name: 'NVIDIA', group: 'D' },
  { symbol: 'AAPL', type: 'stock', name: 'Apple', group: 'D' },
  { symbol: 'MSFT', type: 'stock', name: 'Microsoft', group: 'D' },
  { symbol: 'AMZN', type: 'stock', name: 'Amazon', group: 'D' },
  { symbol: 'META', type: 'stock', name: 'Meta', group: 'D' },
  { symbol: 'GOOGL', type: 'stock', name: 'Alphabet', group: 'D' },
  { symbol: 'TSLA', type: 'stock', name: 'Tesla', group: 'D' },
  { symbol: 'AMD', type: 'stock', name: 'AMD', group: 'D' },
  { symbol: 'NFLX', type: 'stock', name: 'Netflix', group: 'D' },
  { symbol: 'AVGO', type: 'stock', name: 'Broadcom', group: 'D' },
  { symbol: 'LLY', type: 'stock', name: 'Eli Lilly', group: 'D' },
  { symbol: 'JPM', type: 'stock', name: 'JPMorgan', group: 'D' },
  { symbol: 'V', type: 'stock', name: 'Visa', group: 'D' },
  { symbol: 'MA', type: 'stock', name: 'Mastercard', group: 'D' },
  { symbol: 'JNJ', type: 'stock', name: 'Johnson & Johnson', group: 'D' },
  { symbol: 'WMT', type: 'stock', name: 'Walmart', group: 'D' },
  { symbol: 'PG', type: 'stock', name: 'Procter & Gamble', group: 'D' },
  { symbol: 'UNH', type: 'stock', name: 'UnitedHealth', group: 'D' },
  { symbol: 'HD', type: 'stock', name: 'Home Depot', group: 'D' },
  { symbol: 'DIS', type: 'stock', name: 'Disney', group: 'D' },
  { symbol: 'BAC', type: 'stock', name: 'Bank of America', group: 'D' },
  { symbol: 'XOM', type: 'stock', name: 'Exxon Mobil', group: 'D' },
  { symbol: 'CVX', type: 'stock', name: 'Chevron', group: 'D' },
  { symbol: 'COST', type: 'stock', name: 'Costco', group: 'D' },
  { symbol: 'ABBV', type: 'stock', name: 'AbbVie', group: 'D' },
  { symbol: 'PEP', type: 'stock', name: 'PepsiCo', group: 'D' },
  { symbol: 'ADBE', type: 'stock', name: 'Adobe', group: 'D' },
  { symbol: 'CRM', type: 'stock', name: 'Salesforce', group: 'D' },
  { symbol: 'NKE', type: 'stock', name: 'Nike', group: 'D' },
];

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
};

// ==================== 缓存机制 ====================

interface CachedData {
  date: string; // UTC date string (YYYY-MM-DD)
  data: GodModeData[];
  timestamp: number;
}

interface GodModeData {
  symbol: string;
  name: string;
  type: 'index' | 'crypto' | 'stock' | 'commodity';
  group: 'A' | 'B' | 'C' | 'D';
  currentPrice: number;
  yields: {
    '3M': number | null;
    '6M': number | null;
    '1Y': number | null;
    '3Y': number | null;
    '5Y': number | null;
  };
}

const godModeCache = new Map<string, CachedData>();

function getTodayUTC(): string {
  const now = new Date();
  const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return utcDate.toISOString().split('T')[0];
}

function getCachedData(): GodModeData[] | null {
  const today = getTodayUTC();
  const cached = godModeCache.get('god-mode');
  
  if (cached && cached.date === today) {
    // 检查是否在24小时内
    const age = Date.now() - cached.timestamp;
    if (age < 24 * 60 * 60 * 1000) {
      return cached.data;
    }
  }
  
  return null;
}

function setCachedData(data: GodModeData[]): void {
  const today = getTodayUTC();
  godModeCache.set('god-mode', {
    date: today,
    data,
    timestamp: Date.now(),
  });
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

    const req = (urlObj.protocol === 'https:' ? https : http).request({
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      ...(proxyAgent && { agent: proxyAgent }),
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        clearTimeout(timeout);
        const body = Buffer.concat(chunks);
        resolve(new Response(body, {
          status: res.statusCode || 200,
          statusText: res.statusMessage || 'OK',
          headers: new Headers({
            'content-type': res.headers['content-type'] || 'application/json',
          }),
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

async function fetchStockPrice(symbol: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?interval=1m&range=1d`;
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

async function fetchStockHistorical(symbol: string, date: Date): Promise<number | null> {
  try {
    const timestamp = Math.floor(date.getTime() / 1000);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?interval=1d&period1=${timestamp}&period2=${timestamp + 86400}`;
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

function getPreviousTradingDay(date: Date): Date {
  const result = new Date(date);
  const dayOfWeek = result.getUTCDay();
  
  if (dayOfWeek === 0) {
    result.setUTCDate(result.getUTCDate() - 2);
  } else if (dayOfWeek === 6) {
    result.setUTCDate(result.getUTCDate() - 1);
  }
  
  return result;
}

function getTargetDates(): Record<string, Date> {
  const now = new Date();
  return {
    '3M': new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, now.getUTCDate())),
    '6M': new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 6, now.getUTCDate())),
    '1Y': new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate())),
    '3Y': new Date(Date.UTC(now.getUTCFullYear() - 3, now.getUTCMonth(), now.getUTCDate())),
    '5Y': new Date(Date.UTC(now.getUTCFullYear() - 5, now.getUTCMonth(), now.getUTCDate())),
  };
}

async function fetchPrice(symbol: string, type: 'index' | 'crypto' | 'stock' | 'commodity'): Promise<number | null> {
  if (type === 'crypto') {
    return await fetchCryptoPrice(symbol);
  } else if (type === 'index') {
    return await fetchIndexPrice(symbol);
  } else {
    // stock or commodity (both use Yahoo Finance)
    return await fetchStockPrice(symbol);
  }
}

async function fetchHistoricalPrice(symbol: string, type: 'index' | 'crypto' | 'stock' | 'commodity', date: Date): Promise<number | null> {
  let targetDate = date;
  
  // 对于股票和大宗商品，如果是周末，调整到上一个交易日
  if (type === 'stock' || type === 'commodity') {
    targetDate = getPreviousTradingDay(date);
  }
  
  if (type === 'crypto') {
    return await fetchCryptoHistorical(symbol, targetDate);
  } else if (type === 'index') {
    return await fetchIndexHistorical(symbol, targetDate);
  } else {
    return await fetchStockHistorical(symbol, targetDate);
  }
}

// ==================== 收益率计算 ====================

async function calculateYields(asset: AssetConfig): Promise<GodModeData | null> {
  const targetDates = getTargetDates();
  const currentPrice = await fetchPrice(asset.symbol, asset.type);
  
  if (!currentPrice) return null;
  
  const yields: Record<string, number | null> = {};
  
  // 并行获取所有历史价格
  const historicalPromises = Object.entries(targetDates).map(async ([period, date]) => {
    const historicalPrice = await fetchHistoricalPrice(asset.symbol, asset.type, date);
    return { period, price: historicalPrice };
  });
  
  const historicalResults = await Promise.all(historicalPromises);
  
  // 计算收益率
  for (const { period, price } of historicalResults) {
    if (price && price > 0) {
      yields[period] = ((currentPrice - price) / price) * 100;
    } else {
      yields[period] = null;
    }
  }
  
  return {
    symbol: asset.symbol,
    name: asset.name,
    type: asset.type,
    group: asset.group,
    currentPrice,
    yields: yields as GodModeData['yields'],
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
    
    // 并行计算所有资产的收益率
    const results: GodModeData[] = [];
    const promises = GOD_MODE_ASSETS.map(asset => calculateYields(asset));
    const settledResults = await Promise.allSettled(promises);
    
    for (const result of settledResults) {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    }
    
    // 缓存结果
    setCachedData(results);
    
    return NextResponse.json({ data: results, cached: false });
  } catch (error) {
    console.error('God Mode API error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate god mode data' },
      { status: 500 }
    );
  }
}

