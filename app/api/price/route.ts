import { NextRequest, NextResponse } from 'next/server';
import { HttpsProxyAgent } from 'https-proxy-agent';
import https from 'https';
import http from 'http';
import {
  RATE_LIMIT_CONFIGS,
  rateLimitedRequest,
} from '@/lib/utils/rate-limiter';

// Force dynamic to prevent Vercel from caching stale data at build time
export const dynamic = 'force-dynamic';
const isDev = process.env.NODE_ENV === 'development';
const debugLog = (...args: unknown[]) => {
  if (isDev) {
    console.log(...args);
  }
};
const debugWarn = (...args: unknown[]) => {
  if (isDev) {
    console.warn(...args);
  }
};

// 创建一个不使用代理的 https Agent
const noProxyAgent = new https.Agent({
  keepAlive: true,
  rejectUnauthorized: true,
});

/**
 * 统一价格代理 API 路由
 * 支持多种资产类型：crypto, stock, index
 * 支持多种操作：price, search, historical
 */

// ==================== 资产配置 ====================

const CRYPTO_CONFIG: Record<string, { coinpaprikaId: string; coingeckoId: string; binanceSymbol: string }> = {
  BTC: { coinpaprikaId: 'btc-bitcoin', coingeckoId: 'bitcoin', binanceSymbol: 'BTCUSDT' },
  ETH: { coinpaprikaId: 'eth-ethereum', coingeckoId: 'ethereum', binanceSymbol: 'ETHUSDT' },
  BNB: { coinpaprikaId: 'bnb-binance-coin', coingeckoId: 'binancecoin', binanceSymbol: 'BNBUSDT' },
  OKB: { coinpaprikaId: 'okb-okb', coingeckoId: 'okb', binanceSymbol: 'OKBUSDT' },
  SOL: { coinpaprikaId: 'sol-solana', coingeckoId: 'solana', binanceSymbol: 'SOLUSDT' },
};

const INDEX_CONFIG: Record<string, { symbol: string; name: string }> = {
  'QQQ': { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
  'VOO': { symbol: 'VOO', name: 'Vanguard S&P 500 ETF' },
  'TNX': { symbol: '^TNX', name: '10-Year Treasury Yield' },
  'VIX': { symbol: '^VIX', name: 'VIX Volatility Index' },
  'SPX': { symbol: '^GSPC', name: 'S&P 500 Index' },
};

type AssetType = 'crypto' | 'stock' | 'index';
type ActionType = 'price' | 'search' | 'historical';
type ApiError = { error: string; [key: string]: unknown };
type PriceResponse = {
  price: number;
  source: string;
  timestamp: number;
  change24h?: number;
  change24hPercent?: number;
  _isMock?: boolean;
};
type SearchResponse = {
  results: Array<{ symbol: string; name?: string; id?: string; exchange?: string; type?: string }>;
  _isMock?: boolean;
};
type HistoricalResponse = {
  price: number;
  date: string;
  source: string;
};
type ApiResponsePayload = ApiError | PriceResponse | SearchResponse | HistoricalResponse;

// ==================== 缓存机制 ====================

const CACHE_TTL = 30 * 1000;
const priceCache = new Map<string, { ts: number; data: ApiResponsePayload }>();

function readCache<T extends ApiResponsePayload>(key: string): T | null {
  const cached = priceCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.ts > CACHE_TTL) return null;
  return cached.data as T;
}

function writeCache(key: string, data: ApiResponsePayload): void {
  priceCache.set(key, { ts: Date.now(), data });
}

// ==================== Mock 数据生成器 (Hybrid Mock/Real Strategy) ====================

const MOCK_PRICES: Record<string, number> = {
  BTC: 90000, // 更新为接近当前市场价（2025年1月）
  ETH: 3200,
  BNB: 420,
  OKB: 45,
  SOL: 150,
  AAPL: 180,
  MSFT: 420,
  GOOGL: 140,
  AMZN: 150,
  NVDA: 500,
  META: 480,
  TSLA: 250,
  'DX-Y.NYB': 104.5,
  DXY: 104.5,
  'GC=F': 2050,
  // Index fallback prices (only used if API completely fails)
  TNX: 4.25, // 10-Year Treasury Yield (realistic range: 3-5%)
  VIX: 15.0, // VIX (realistic range: 10-30)
  SPX: 5200, // S&P 500
};

function generateMockPrice(symbol: string, type: string): any {
  const basePrice = MOCK_PRICES[symbol.toUpperCase()] || 100;
  // 添加 ±2% 的随机波动，模拟实时价格
  const variation = (Math.random() - 0.5) * 0.04;
  const price = basePrice * (1 + variation);
  const change24h = basePrice * (Math.random() - 0.5) * 0.02;
  const change24hPercent = (change24h / basePrice) * 100;

  return {
    price: Math.round(price * 100) / 100,
    source: `Mock (${type})`,
    timestamp: Date.now(),
    change24h: Math.round(change24h * 100) / 100,
    change24hPercent: Math.round(change24hPercent * 100) / 100,
    _isMock: true, // 标记为 Mock 数据
  };
}

function generateMockSearchResults(query: string, type: string): any {
  const mockResults: any[] = [];
  
  if (type === 'crypto') {
    const cryptos = ['BTC', 'ETH', 'BNB', 'SOL', 'DOGE', 'ADA', 'DOT'];
    cryptos.forEach(symbol => {
      if (symbol.toLowerCase().includes(query.toLowerCase()) || 
          query.toLowerCase().includes(symbol.toLowerCase())) {
        mockResults.push({
          symbol,
          name: symbol === 'BTC' ? 'Bitcoin' : symbol === 'ETH' ? 'Ethereum' : `${symbol} Coin`,
          type: 'crypto',
        });
      }
    });
  } else if (type === 'stock') {
    const stocks = [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'MSFT', name: 'Microsoft Corporation' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation' },
      { symbol: 'META', name: 'Meta Platforms Inc.' },
      { symbol: 'TSLA', name: 'Tesla Inc.' },
    ];
    stocks.forEach(stock => {
      if (stock.name.toLowerCase().includes(query.toLowerCase()) ||
          stock.symbol.toLowerCase().includes(query.toLowerCase())) {
        mockResults.push({
          ...stock,
          type: 'stock',
          exchange: 'NASDAQ',
        });
      }
    });
  }

  return { results: mockResults, _isMock: true };
}

// ==================== 网络请求工具 ====================

function getProxyAgent() {
  const proxy = process.env.https_proxy || process.env.HTTPS_PROXY || 
                process.env.http_proxy || process.env.HTTP_PROXY;
  return proxy ? new HttpsProxyAgent(proxy) : undefined;
}

function getRateLimitConfigByHostname(hostname: string) {
  if (hostname.includes('coinpaprika')) return RATE_LIMIT_CONFIGS.coinpaprika;
  if (hostname.includes('binance')) return RATE_LIMIT_CONFIGS.binance;
  if (hostname.includes('yahoo')) return RATE_LIMIT_CONFIGS.yahoo;
  return RATE_LIMIT_CONFIGS.proxy;
}

async function rawFetchJsonWithTimeout(url: string, timeoutMs: number = 8000): Promise<Response> {
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

async function fetchJsonWithTimeout(url: string, timeoutMs: number = 8000): Promise<Response> {
  const urlObj = new URL(url);
  const limitConfig = getRateLimitConfigByHostname(urlObj.hostname);
  return rateLimitedRequest(urlObj.hostname, () => rawFetchJsonWithTimeout(url, timeoutMs), limitConfig);
}

// ==================== 加密货币操作 ====================

async function getCryptoPrice(symbol: string, useMock: boolean = false): Promise<any> {
  const config = CRYPTO_CONFIG[symbol.toUpperCase()];
  if (!config) {
    return { error: 'Unsupported crypto symbol' };
  }

  // 如果启用 Mock 模式，直接返回 Mock 数据
  if (useMock) {
    return generateMockPrice(symbol, 'crypto');
  }

  try {
    const url = `https://api.coinpaprika.com/v1/tickers/${config.coinpaprikaId}`;
    const response = await fetchJsonWithTimeout(url, 8000);
    
    if (!response.ok) {
      return { error: 'CoinPaprika request failed' };
    }

    const data = await response.json();
    const price = data?.quotes?.USD?.price;
    const change24h = data?.quotes?.USD?.percent_change_24h;
    
    if (typeof price === 'number' && price > 0 && isFinite(price)) {
      return {
        price,
        source: 'CoinPaprika',
        timestamp: Date.now(),
        change24h: change24h || 0,
        change24hPercent: change24h || 0,
      };
    }
    
    return { error: 'Invalid price data' };
  } catch (error) {
    // 网络失败时降级到 Mock 数据
    debugWarn(`[Price API] Crypto price fetch failed for ${symbol}, using mock data`);
    return generateMockPrice(symbol, 'crypto');
  }
}

async function searchCrypto(query: string, useMock: boolean = false): Promise<any> {
  // 如果启用 Mock 模式，直接返回 Mock 数据
  if (useMock) {
    return generateMockSearchResults(query, 'crypto');
  }

  try {
    const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`;
    const response = await fetchJsonWithTimeout(url, 8000);
    
    if (!response.ok) {
      return { error: 'CoinGecko search failed' };
    }

    const data = await response.json();
    const coins = data?.coins || [];
    
    return {
      results: coins.slice(0, 10).map((coin: any) => ({
        symbol: coin.symbol?.toUpperCase(),
        name: coin.name,
        id: coin.id,
      })),
    };
  } catch {
    return { error: 'Source unavailable' };
  }
}

/**
 * 使用币安 API 获取加密货币历史价格
 * 币安 API: https://api.binance.com/api/v3/klines
 * 参数: symbol (交易对，如 BTCUSDT), interval (时间间隔，1d=1天), startTime (开始时间戳), limit (返回数量)
 */
async function getCryptoHistoricalFromBinance(symbol: string, date: Date): Promise<any> {
  const config = CRYPTO_CONFIG[symbol.toUpperCase()];
  if (!config || !config.binanceSymbol) {
    return { error: 'Unsupported crypto symbol or missing Binance symbol' };
  }

  const dateStr = date.toISOString().split('T')[0];
  
  try {
    // 将日期转换为时间戳（毫秒）
    // 使用当天的 00:00:00 UTC 时间
    const targetDate = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0, 0, 0, 0
    ));
    const startTime = targetDate.getTime();
    
    // 币安 API 需要结束时间（当天 23:59:59）
    const endDate = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23, 59, 59, 999
    ));
    const endTime = endDate.getTime();
    
    const url = `https://api.binance.com/api/v3/klines?symbol=${config.binanceSymbol}&interval=1d&startTime=${startTime}&endTime=${endTime}&limit=1`;
    
    debugLog(`[Price API] ========== 开始请求币安历史价格 ==========`);
    debugLog(`[Price API] 原始 symbol: ${symbol}`);
    debugLog(`[Price API] Binance symbol: ${config.binanceSymbol}`);
    debugLog(`[Price API] 日期: ${dateStr}`);
    debugLog(`[Price API] 时间戳: startTime=${startTime}, endTime=${endTime}`);
    debugLog(`[Price API] Binance URL: ${url}`);
    debugLog(`[Price API] 使用 noProxyAgent，直接请求 Binance，不使用代理`);
    
    const urlObj = new URL(url);
    const data = await rateLimitedRequest('binance-history', () => new Promise<any>((resolve, reject) => {
      debugLog(`[Price API] 开始发起 https.request...`);
      const req = https.request({
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // 使用不代理的 Agent
        agent: noProxyAgent,
      }, (res) => {
        debugLog(`[Price API] Binance API 响应状态码: ${res.statusCode}`);
        debugLog(`[Price API] Binance API 响应头:`, res.headers);
        
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString();
          debugLog(`[Price API] Binance API 响应体长度: ${body.length}`);
          debugLog(`[Price API] Binance API 响应体前500字符:`, body.substring(0, 500));
          
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const jsonData = JSON.parse(body);
              debugLog(`[Price API] ✅ Binance API 解析成功，数据类型:`, Array.isArray(jsonData) ? 'Array' : typeof jsonData);
              if (Array.isArray(jsonData)) {
                debugLog(`[Price API] 数组长度: ${jsonData.length}`);
              }
              resolve(jsonData);
            } catch (e) {
              console.error(`[Price API] ❌ JSON 解析失败:`, e);
              reject(new Error('Invalid JSON response'));
            }
          } else {
            const errorMsg = `HTTP ${res.statusCode}: ${body.substring(0, 200)}`;
            console.error(`[Price API] ❌ Binance API HTTP 错误: ${errorMsg}`);
            reject(new Error(errorMsg));
          }
        });
      });
      
      req.on('error', (err) => {
        console.error(`[Price API] ❌ Binance API 请求异常:`, err.message);
        console.error(`[Price API] 错误堆栈:`, err.stack);
        reject(err);
      });
      
      req.setTimeout(10000, () => {
        console.error(`[Price API] ❌ Binance API 请求超时`);
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      debugLog(`[Price API] 发送请求...`);
      req.end();
    }), RATE_LIMIT_CONFIGS.binance);
    
    debugLog(`[Price API] ========== Binance API 请求完成 ==========`);
    
    // 币安 klines 返回格式: [[Open time, Open, High, Low, Close, Volume, ...], ...]
    // 我们使用收盘价 (Close)，索引为 4
    debugLog(`[Price API] 开始解析 Binance 返回数据...`);
    debugLog(`[Price API] 数据类型:`, Array.isArray(data) ? 'Array' : typeof data);
    
    if (Array.isArray(data)) {
      debugLog(`[Price API] 数组长度: ${data.length}`);
      if (data.length > 0) {
        const kline = data[0];
        debugLog(`[Price API] 第一个 K线数据类型:`, Array.isArray(kline) ? 'Array' : typeof kline);
        if (Array.isArray(kline)) {
          debugLog(`[Price API] K线数据长度: ${kline.length}`);
          debugLog(`[Price API] K线数据内容:`, kline);
          if (kline.length >= 5) {
            const closePriceStr = kline[4];
            debugLog(`[Price API] 收盘价字符串: ${closePriceStr}, 类型: ${typeof closePriceStr}`);
            const price = parseFloat(String(closePriceStr)); // Close price
            debugLog(`[Price API] 解析后的价格: ${price}, 类型: ${typeof price}, 是否有效: ${price > 0 && isFinite(price)}`);
            if (typeof price === 'number' && price > 0 && isFinite(price)) {
              debugLog(`[Price API] ✅✅✅ 币安成功获取 ${symbol} 在 ${dateStr} 的价格: $${price}`);
              return {
                price,
                date: dateStr,
                source: 'Binance',
              };
            } else {
              console.error(`[Price API] ❌ 价格无效: ${price}`);
            }
          } else {
            console.error(`[Price API] ❌ K线数据长度不足: ${kline.length} < 5`);
          }
        } else {
          console.error(`[Price API] ❌ K线数据不是数组:`, typeof kline);
        }
      } else {
        console.error(`[Price API] ❌ 返回数组为空`);
      }
    } else {
      console.error(`[Price API] ❌ 返回数据不是数组:`, typeof data);
      console.error(`[Price API] 返回数据内容:`, JSON.stringify(data).substring(0, 500));
    }
    
    // 如果没有数据，可能是该日期没有交易数据
    console.error(`[Price API] ❌❌❌ 币安未返回有效数据，可能是 ${symbol} 在 ${dateStr} 时还没有在币安上市`);
    return { error: `${symbol} 在 ${dateStr} 时还没有在币安上市或数据不可用` };
    
  } catch (error: any) {
    console.error(`[Price API] 币安历史价格请求异常: ${error.message}`);
    return { error: `Binance API error: ${error.message}` };
  }
}

async function getCryptoHistorical(symbol: string, date: Date): Promise<any> {
  const config = CRYPTO_CONFIG[symbol.toUpperCase()];
  if (!config) {
    return { error: 'Unsupported crypto symbol' };
  }

  const dateStr = date.toISOString().split('T')[0];
  
  // 使用币安 API 获取历史价格
  debugLog(`[Price API] 使用币安 API 获取 ${symbol} 在 ${dateStr} 的历史价格...`);
  return await getCryptoHistoricalFromBinance(symbol, date);
}

// ==================== 股票操作 ====================

async function getStockPrice(symbol: string, useMock: boolean = false): Promise<any> {
  // 特殊处理：DXY 和 GC=F
  const specialSymbols: Record<string, string> = {
    'DX-Y.NYB': 'DX-Y.NYB',
    'DXY': 'DX-Y.NYB',
    'GC=F': 'GC=F',
  };
  
  const yahooSymbol = specialSymbols[symbol.toUpperCase()] || symbol.toUpperCase();

  // 如果启用 Mock 模式，直接返回 Mock 数据
  if (useMock) {
    return generateMockPrice(symbol, 'stock');
  }

  try {
    // 尝试多个 Yahoo Finance API 端点，如果第一个失败则尝试备用
    const endpoints = [
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d&includePrePost=false&events=div%7Csplit%7Cearn&corsDomain=finance.yahoo.com`,
      `https://query2.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d&includePrePost=false&events=div%7Csplit%7Cearn&corsDomain=finance.yahoo.com`,
    ];
    
    let lastError: any = null;
    
    for (let i = 0; i < endpoints.length; i++) {
      const url = endpoints[i];
      debugLog(`[Price API] 尝试端点 ${i + 1}/${endpoints.length}: ${url}`);
      debugLog(`[Price API] 原始符号: ${symbol}, Yahoo 符号: ${yahooSymbol}`);
      
      try {
        let response: Response;
        try {
          response = await fetchJsonWithTimeout(url, 10000);
        } catch (fetchError: any) {
          console.error(`[Price API] 网络请求失败:`, fetchError.message);
          lastError = fetchError;
          continue; // 尝试下一个端点
        }
        
        // 如果遇到 403 或其他错误，尝试下一个端点
        if (!response.ok) {
          let errorText = 'Unknown error';
          try {
            errorText = await response.text();
          } catch (e) {
            console.error(`[Price API] 无法读取错误响应体:`, e);
          }
          console.error(`[Price API] Yahoo Finance HTTP ${response.status}: ${errorText.substring(0, 200)}`);
          
          // 如果是 403，尝试下一个端点；如果是其他错误，也尝试下一个端点
          if (response.status === 403 || response.status >= 500) {
            lastError = new Error(`Yahoo Finance request failed: HTTP ${response.status}`);
            continue; // 尝试下一个端点
          } else {
            // 4xx 错误（除了 403），直接抛出
            throw new Error(`Yahoo Finance request failed: HTTP ${response.status} - ${errorText.substring(0, 100)}`);
          }
        }

        let data: any;
        try {
          const responseText = await response.text();
          debugLog(`[Price API] Yahoo Finance 原始响应 (前500字符):`, responseText.substring(0, 500));
          data = JSON.parse(responseText);
        } catch (parseError: any) {
          console.error(`[Price API] JSON 解析失败:`, parseError.message);
          lastError = parseError;
          continue; // 尝试下一个端点
        }
        
        debugLog(`[Price API] Yahoo Finance 响应结构:`, JSON.stringify(data, null, 2).substring(0, 1000));
        
        // 检查响应结构
        if (!data || typeof data !== 'object') {
          console.error(`[Price API] 响应不是有效的对象`);
          lastError = new Error('Invalid response: not an object');
          continue; // 尝试下一个端点
        }
        
        const result = data?.chart?.result?.[0];
        
        if (!result) {
          console.error(`[Price API] Yahoo Finance 响应中没有 result 数据`);
          console.error(`[Price API] 完整响应结构:`, JSON.stringify(data, null, 2));
          lastError = new Error('Invalid response structure: no result');
          continue; // 尝试下一个端点
        }

        const meta = result.meta;
        
        if (!meta || typeof meta !== 'object') {
          console.error(`[Price API] result.meta 不存在或不是对象`);
          console.error(`[Price API] result 结构:`, JSON.stringify(result, null, 2).substring(0, 500));
          lastError = new Error('Invalid response structure: no meta data');
          continue; // 尝试下一个端点
        }
        
        debugLog(`[Price API] Yahoo Finance meta 数据:`, JSON.stringify(meta, null, 2));
        
        // 尝试多个价格字段，按优先级
        let price: number | null = null;
        let previousClose: number | null = null;
        
        // 优先级：regularMarketPrice > currentPrice > chartPreviousClose
        if (typeof meta?.regularMarketPrice === 'number' && meta.regularMarketPrice > 0) {
          price = meta.regularMarketPrice;
          debugLog(`[Price API] 使用 regularMarketPrice: ${price}`);
        } else if (typeof meta?.currentPrice === 'number' && meta.currentPrice > 0) {
          price = meta.currentPrice;
          debugLog(`[Price API] 使用 currentPrice: ${price}`);
        } else if (typeof meta?.chartPreviousClose === 'number' && meta.chartPreviousClose > 0) {
          price = meta.chartPreviousClose;
          debugLog(`[Price API] 使用 chartPreviousClose: ${price}`);
        } else {
          // 尝试其他可能的价格字段
          const possibleFields = ['regularMarketPreviousClose', 'previousClose', 'open', 'close'];
          for (const field of possibleFields) {
            if (typeof meta?.[field] === 'number' && meta[field] > 0) {
              price = meta[field];
              debugLog(`[Price API] 使用备用字段 ${field}: ${price}`);
              break;
            }
          }
        }
        
        // 获取前收盘价
        if (typeof meta?.previousClose === 'number' && meta.previousClose > 0) {
          previousClose = meta.previousClose;
        } else if (typeof meta?.chartPreviousClose === 'number' && meta.chartPreviousClose > 0) {
          previousClose = meta.chartPreviousClose;
        } else if (typeof meta?.regularMarketPreviousClose === 'number' && meta.regularMarketPreviousClose > 0) {
          previousClose = meta.regularMarketPreviousClose;
        }
        
        if (!price || price <= 0 || !isFinite(price)) {
          console.error(`[Price API] 无法从 Yahoo Finance 获取有效价格`);
          console.error(`[Price API] meta 对象:`, JSON.stringify(meta, null, 2));
          console.error(`[Price API] 尝试的价格值:`, price);
          lastError = new Error('Invalid price data: no valid price field found');
          continue; // 尝试下一个端点
        }
        
        const change24h = previousClose ? price - previousClose : 0;
        const change24hPercent = previousClose ? (change24h / previousClose) * 100 : 0;
        
        debugLog(`[Price API] ✅ Yahoo Finance 成功获取 ${symbol} 价格: $${price.toFixed(2)} (前收盘: $${previousClose?.toFixed(2) || 'N/A'})`);
        
        return {
          price: Math.round(price * 100) / 100, // 保留2位小数
          source: 'Yahoo Finance',
          timestamp: Date.now(),
          change24h: previousClose ? Math.round(change24h * 100) / 100 : undefined,
          change24hPercent: previousClose ? Math.round(change24hPercent * 100) / 100 : undefined,
        };
      } catch (endpointError: any) {
        console.error(`[Price API] 端点 ${i + 1} 失败:`, endpointError.message);
        lastError = endpointError;
        // 继续尝试下一个端点
      }
    }
    
    // 所有端点都失败了，降级到 Mock 数据
    debugWarn(`[Price API] ⚠️ 所有 Yahoo Finance 端点都失败，降级到 Mock 数据`);
    debugWarn(`[Price API] 最后错误:`, lastError?.message || 'Unknown error');
    return generateMockPrice(symbol, 'stock');
    
  } catch (error: any) {
    console.error(`[Price API] Yahoo Finance 获取 ${symbol} 价格失败:`);
    console.error(`[Price API] 错误消息:`, error.message);
    console.error(`[Price API] 错误堆栈:`, error.stack);
    
    // 如果所有端点都失败，降级到 Mock 数据
    debugWarn(`[Price API] ⚠️ 降级到 Mock 数据`);
    return generateMockPrice(symbol, 'stock');
  }
}

async function searchStock(query: string, useMock: boolean = false): Promise<any> {
  // 如果启用 Mock 模式，直接返回 Mock 数据
  if (useMock) {
    return generateMockSearchResults(query, 'stock');
  }

  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
    const response = await fetchJsonWithTimeout(url, 8000);
    
    if (!response.ok) {
      return { error: 'Yahoo Finance search failed' };
    }

    const data = await response.json();
    const quotes = data?.quotes || [];
    
    return {
      results: quotes
        .filter((quote: any) => quote.quoteType === 'EQUITY')
        .slice(0, 10)
        .map((quote: any) => ({
          symbol: quote.symbol,
          name: quote.longname || quote.shortname,
          exchange: quote.exchange,
        })),
    };
  } catch (error) {
    // 网络失败时降级到 Mock 数据
    debugWarn(`[Price API] Stock search failed for "${query}", using mock data`);
    return generateMockSearchResults(query, 'stock');
  }
}

async function getStockHistorical(symbol: string, date: Date): Promise<any> {
  try {
    // 使用更精确的时间范围：当天的开始和结束时间戳
    const startOfDay = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0, 0, 0, 0
    ));
    const endOfDay = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23, 59, 59, 999
    ));
    
    const period1 = Math.floor(startOfDay.getTime() / 1000);
    const period2 = Math.floor(endOfDay.getTime() / 1000);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?interval=1d&period1=${period1}&period2=${period2}&includePrePost=false&events=div%7Csplit%7Cearn`;
    debugLog(`[Price API] 请求 Yahoo Finance 历史价格: ${url}`);
    
    const response = await fetchJsonWithTimeout(url, 10000);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[Price API] Yahoo Finance 历史价格 HTTP ${response.status}: ${errorText}`);
      return { error: `Yahoo Finance historical request failed: HTTP ${response.status}` };
    }

    let data: any;
    try {
      const responseText = await response.text();
      debugLog(`[Price API] Yahoo Finance 历史价格原始响应 (前500字符):`, responseText.substring(0, 500));
      data = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error(`[Price API] JSON 解析失败:`, parseError.message);
      return { error: `响应解析失败: ${parseError.message}` };
    }
    
    const result = data?.chart?.result?.[0];
    
    if (!result) {
      console.error(`[Price API] Yahoo Finance 历史价格响应中没有 result 数据`);
      console.error(`[Price API] 完整响应结构:`, JSON.stringify(data, null, 2).substring(0, 500));
      return { error: 'No historical data available: invalid response structure' };
    }

    const timestamps = result.timestamp;
    const closes = result.indicators?.quote?.[0]?.close;
    
    if (!timestamps || timestamps.length === 0 || !closes || closes.length === 0) {
      console.error(`[Price API] Yahoo Finance 历史价格没有时间戳或价格数据`);
      console.error(`[Price API] result 结构:`, JSON.stringify(result, null, 2).substring(0, 500));
      return { error: 'No historical data available for this date' };
    }

    // 找到最接近目标日期的数据点
    let closestPrice: number | null = null;
    let closestDate: string | null = null;
    
    for (let i = 0; i < timestamps.length; i++) {
      const ts = timestamps[i];
      const price = closes[i];
      
      if (typeof price === 'number' && price > 0 && isFinite(price)) {
        const dataDate = new Date(ts * 1000).toISOString().split('T')[0];
        const targetDateStr = date.toISOString().split('T')[0];
        
        // 如果日期匹配，直接使用
        if (dataDate === targetDateStr) {
          closestPrice = price;
          closestDate = dataDate;
          break;
        }
        
        // 否则记录最接近的
        if (!closestPrice) {
          closestPrice = price;
          closestDate = dataDate;
        }
      }
    }
    
    if (closestPrice && closestPrice > 0) {
      debugLog(`[Price API] ✅ Yahoo Finance 成功获取 ${symbol} 在 ${closestDate} 的历史价格: $${closestPrice.toFixed(2)}`);
      return {
        price: Math.round(closestPrice * 100) / 100,
        date: closestDate || date.toISOString().split('T')[0],
        source: 'Yahoo Finance',
      };
    }
    
    return { error: 'Invalid historical price data: no valid price found' };
  } catch (error: any) {
    console.error(`[Price API] Yahoo Finance 历史价格请求异常:`, error.message);
    return { error: `Source unavailable: ${error.message}` };
  }
}

// ==================== 指数操作 ====================

async function getIndexPrice(symbol: string, useMock: boolean = false): Promise<any> {
  const index = INDEX_CONFIG[symbol.toUpperCase()];
  let yahooSymbol: string;
  
  if (index) {
    yahooSymbol = index.symbol;
  } else {
    // 如果不在配置中，尝试直接使用symbol作为Yahoo ticker
    yahooSymbol = symbol.startsWith('^') ? symbol : `^${symbol}`;
  }

  // 如果启用 Mock 模式，直接返回 Mock 数据
  if (useMock) {
    return generateMockPrice(symbol, 'index');
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d`;
    const response = await fetchJsonWithTimeout(url, 8000);
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance request failed: HTTP ${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    
    if (!result) {
      throw new Error('Invalid response structure: no result');
    }

    const meta = result.meta;
    
    // 对于 ^TNX (10-Year Treasury Yield)，Yahoo Finance 返回的值就是收益率百分比
    // 对于 ^VIX，返回的值就是波动率指数
    // 尝试多个价格字段，按优先级
    let price: number | null = null;
    let previousClose: number | null = null;
    
    // 优先级：regularMarketPrice > currentPrice > chartPreviousClose
    if (typeof meta?.regularMarketPrice === 'number' && meta.regularMarketPrice > 0) {
      price = meta.regularMarketPrice;
    } else if (typeof meta?.currentPrice === 'number' && meta.currentPrice > 0) {
      price = meta.currentPrice;
    } else if (typeof meta?.chartPreviousClose === 'number' && meta.chartPreviousClose > 0) {
      price = meta.chartPreviousClose;
    }
    
    // 获取前收盘价
    if (typeof meta?.previousClose === 'number' && meta.previousClose > 0) {
      previousClose = meta.previousClose;
    } else if (typeof meta?.chartPreviousClose === 'number' && meta.chartPreviousClose > 0) {
      previousClose = meta.chartPreviousClose;
    }
    
    // 数据验证：对于 TNX 和 VIX，检查值是否在合理范围内
    if (symbol.toUpperCase() === 'TNX') {
      // 10年期国债收益率应该在 0-10% 之间
      if (price && (price < 0 || price > 10)) {
        debugWarn(`[Price API] TNX value ${price} is outside reasonable range (0-10%), treating as invalid`);
        throw new Error(`Invalid TNX value: ${price}`);
      }
    } else if (symbol.toUpperCase() === 'VIX') {
      // VIX 应该在 5-100 之间（极端情况下可能更高，但 98 通常不正常）
      if (price && (price < 5 || price > 100)) {
        debugWarn(`[Price API] VIX value ${price} is outside reasonable range (5-100), treating as invalid`);
        throw new Error(`Invalid VIX value: ${price}`);
      }
    }
    
    if (!price || price <= 0 || !isFinite(price)) {
      throw new Error('Invalid price data: no valid price field found');
    }
    
    const change24h = previousClose ? price - previousClose : 0;
    const change24hPercent = previousClose ? (change24h / previousClose) * 100 : 0;
    
    debugLog(`[Price API] ✅ Successfully fetched ${symbol} (${yahooSymbol}) price: ${price.toFixed(2)}`);
    
    return {
      price: Math.round(price * 100) / 100, // 保留2位小数
      source: 'Yahoo Finance',
      timestamp: Date.now(),
      change24h: previousClose ? Math.round(change24h * 100) / 100 : undefined,
      change24hPercent: previousClose ? Math.round(change24hPercent * 100) / 100 : undefined,
    };
  } catch (error: any) {
    // 网络失败时，返回错误而不是使用可能错误的 Mock 数据
    console.error(`[Price API] Index price fetch failed for ${symbol}:`, error.message);
    // 返回错误，让调用者决定如何处理（显示 "--" 或加载状态）
    return { 
      error: `Failed to fetch ${symbol}: ${error.message}`,
      // 可选：如果确实需要回退，使用合理的默认值
      // price: MOCK_PRICES[symbol.toUpperCase()] || null,
    };
  }
}

async function getIndexHistorical(symbol: string, date: Date): Promise<any> {
  const index = INDEX_CONFIG[symbol.toUpperCase()];
  if (!index) {
    return { error: 'Unsupported index symbol' };
  }

  try {
    const timestamp = Math.floor(date.getTime() / 1000);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${index.symbol}?interval=1d&period1=${timestamp}&period2=${timestamp + 86400}`;
    const response = await fetchJsonWithTimeout(url, 8000);
    
    if (!response.ok) {
      return { error: 'Yahoo Finance historical request failed' };
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    
    if (!result || !result.timestamp || result.timestamp.length === 0) {
      return { error: 'No historical data available' };
    }

    const closes = result.indicators?.quote?.[0]?.close;
    if (!closes || closes.length === 0) {
      return { error: 'No price data available' };
    }

    const price = closes[0];
    if (typeof price === 'number' && price > 0 && isFinite(price)) {
      return {
        price,
        date: date.toISOString().split('T')[0],
        source: 'Yahoo Finance',
      };
    }
    
    return { error: 'Invalid historical price data' };
  } catch {
    return { error: 'Source unavailable' };
  }
}

// ==================== API 路由处理 ====================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as AssetType | null;
    const action = searchParams.get('action') as ActionType | null;
    const symbol = searchParams.get('symbol');
    const query = searchParams.get('query');
    const date = searchParams.get('date');

    if (!type || !action) {
      return NextResponse.json({ error: 'Missing type or action parameter' }, { status: 400 });
    }

    // 价格查询
    if (action === 'price') {
      if (!symbol) {
        return NextResponse.json({ error: 'Missing symbol parameter' }, { status: 400 });
      }

      const cacheKey = `${type}:${symbol.toUpperCase()}`;
      const cached = readCache(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }

      let result: ApiResponsePayload;
      switch (type) {
        case 'crypto':
          result = await getCryptoPrice(symbol);
          break;
        case 'stock':
          result = await getStockPrice(symbol);
          break;
        case 'index':
          result = await getIndexPrice(symbol);
          break;
        default:
          return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
      }

      if ('error' in result) {
        return NextResponse.json(result, { status: 200 });
      }

      writeCache(cacheKey, result);
      return NextResponse.json(result);
    }

    // 搜索
    if (action === 'search') {
      if (!query) {
        return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
      }

      let result: ApiResponsePayload;
      switch (type) {
        case 'crypto':
          result = await searchCrypto(query);
          break;
        case 'stock':
          result = await searchStock(query);
          break;
        case 'index':
          // 指数不支持搜索，返回预定义列表
          result = {
            results: Object.entries(INDEX_CONFIG).map(([key, value]) => ({
              symbol: key,
              name: value.name,
            })),
          };
          break;
        default:
          return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
      }

      return NextResponse.json(result);
    }

    // 历史价格
    if (action === 'historical') {
      if (!symbol || !date) {
        return NextResponse.json({ error: 'Missing symbol or date parameter' }, { status: 400 });
      }

      // 确保日期解析正确（处理时区问题）
      // 如果日期字符串是 YYYY-MM-DD 格式，需要明确指定为 UTC 时间，避免时区偏移
      let targetDate: Date;
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD 格式，解析为 UTC 日期
        const [year, month, day] = date.split('-').map(Number);
        targetDate = new Date(Date.UTC(year, month - 1, day));
      } else {
        targetDate = new Date(date);
      }
      
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
      
      debugLog(`[Price API] 解析日期: ${date} -> ${targetDate.toISOString()} (UTC)`);

      let result: ApiResponsePayload;
      switch (type) {
        case 'crypto':
          result = await getCryptoHistorical(symbol, targetDate);
          break;
        case 'stock':
          result = await getStockHistorical(symbol, targetDate);
          break;
        case 'index':
          result = await getIndexHistorical(symbol, targetDate);
          break;
        default:
          return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
      }

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Price API] Unhandled error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

