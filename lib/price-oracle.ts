/**
 * Universal Price Oracle
 * 统一的价格数据获取接口
 * 支持多个数据源，自动fallback，确保数据可用性
 */

export interface PriceData {
  price: number; // USD价格
  source: string; // 数据来源
  timestamp: number; // 时间戳
}

export interface HistoricalPriceData {
  price: number; // USD价格
  date: string; // 日期 YYYY-MM-DD
  source: string; // 数据来源
}

// Token Symbol to various API identifiers
const TOKEN_CONFIG: Record<string, {
  coingeckoId?: string;
  binanceSymbol?: string;
  okxSymbol?: string;
  type?: 'crypto' | 'stock' | 'index';
}> = {
  BTC: {
    coingeckoId: 'bitcoin',
    binanceSymbol: 'BTCUSDT',
    okxSymbol: 'BTC-USDT',
    type: 'crypto',
  },
  ETH: {
    coingeckoId: 'ethereum',
    binanceSymbol: 'ETHUSDT',
    okxSymbol: 'ETH-USDT',
    type: 'crypto',
  },
  SOL: {
    coingeckoId: 'solana',
    binanceSymbol: 'SOLUSDT',
    okxSymbol: 'SOL-USDT',
    type: 'crypto',
  },
  BNB: {
    coingeckoId: 'binancecoin',
    binanceSymbol: 'BNBUSDT',
    okxSymbol: 'BNB-USDT',
    type: 'crypto',
  },
  OKB: {
    coingeckoId: 'okb',
    binanceSymbol: 'OKBUSDT',
    okxSymbol: 'OKB-USDT',
    type: 'crypto',
  },
  QQQ: {
    type: 'stock',
  },
  SPY: {
    type: 'stock',
  },
  DIA: {
    type: 'stock',
  },
  SH000001: {
    type: 'index',
  },
};

/**
 * 从 Binance API 获取实时价格（支持CORS）
 */
async function fetchPriceFromBinance(symbol: string): Promise<PriceData | null> {
  try {
    const config = TOKEN_CONFIG[symbol];
    if (!config?.binanceSymbol) return null;

    const url = `https://api.binance.com/api/v3/ticker/price?symbol=${config.binanceSymbol}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    if (data.price) {
      const price = parseFloat(data.price);
      if (!isNaN(price) && price > 0) {
        return {
          price,
          source: 'Binance',
          timestamp: Date.now(),
        };
      }
    }

    return null;
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn(`Binance API failed for ${symbol}:`, err.message);
    }
    return null;
  }
}

/**
 * 从 OKX API 获取实时价格（支持CORS）
 */
async function fetchPriceFromOKX(symbol: string): Promise<PriceData | null> {
  try {
    const config = TOKEN_CONFIG[symbol];
    if (!config?.okxSymbol) return null;

    const url = `https://www.okx.com/api/v5/market/ticker?instId=${config.okxSymbol}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    if (data.data && data.data.length > 0 && data.data[0].last) {
      const price = parseFloat(data.data[0].last);
      if (!isNaN(price) && price > 0) {
        return {
          price,
          source: 'OKX',
          timestamp: Date.now(),
        };
      }
    }

    return null;
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn(`OKX API failed for ${symbol}:`, err.message);
    }
    return null;
  }
}

/**
 * 从 CoinGecko API 获取实时价格
 */
async function fetchPriceFromCoinGecko(symbol: string): Promise<PriceData | null> {
  try {
    const config = TOKEN_CONFIG[symbol];
    if (!config?.coingeckoId) return null;

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${config.coingeckoId}&vs_currencies=usd`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    if (data[config.coingeckoId]?.usd) {
      const price = parseFloat(data[config.coingeckoId].usd);
      if (!isNaN(price) && price > 0) {
        return {
          price,
          source: 'CoinGecko',
          timestamp: Date.now(),
        };
      }
    }

    return null;
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn(`CoinGecko API failed for ${symbol}:`, err.message);
    }
    return null;
  }
}

/**
 * 从 CoinGecko 获取历史价格（只获取精确日期，不搜索前后日期）
 */
async function fetchHistoricalPriceFromCoinGecko(
  symbol: string,
  date: Date
): Promise<HistoricalPriceData | null> {
  const config = TOKEN_CONFIG[symbol];
  if (!config?.coingeckoId) {
    console.error(`[CoinGecko] No config found for symbol: ${symbol}`);
    return null;
  }

  // 检查日期是否在未来
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  if (targetDate > today) {
    console.error(`[CoinGecko] Date ${date.toISOString().split('T')[0]} is in the future for ${symbol}`);
    return null;
  }

  // 检查日期是否太早（CoinGecko 通常只支持 2013 年之后的数据）
  const minDate = new Date('2013-04-28');
  if (targetDate < minDate) {
    console.error(`[CoinGecko] Date ${date.toISOString().split('T')[0]} is too early for ${symbol}`);
    return null;
  }

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const url = `https://api.coingecko.com/api/v3/coins/${config.coingeckoId}/history?date=${day}-${month}-${year}`;
  
  console.log(`[CoinGecko] Fetching historical price for ${symbol} on ${date.toISOString().split('T')[0]}: ${url}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

    const startTime = Date.now();
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    const duration = Date.now() - startTime;
    clearTimeout(timeoutId);

    console.log(`[CoinGecko] Response status: ${response.status}, duration: ${duration}ms`);

    if (!response.ok) {
      // 详细记录错误信息
      const errorText = await response.text().catch(() => 'Unable to read error response');
      console.error(`[CoinGecko] API error for ${symbol} on ${date.toISOString().split('T')[0]}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      
      if (response.status === 429) {
        console.error(`[CoinGecko] Rate limit exceeded. Headers:`, Object.fromEntries(response.headers.entries()));
      }
      
      return null;
    }

    const data = await response.json();
    
    // 检查是否有错误信息
    if (data.error) {
      console.error(`[CoinGecko] API returned error:`, data.error);
      return null;
    }
    
    // 检查响应数据结构 - 详细记录以便诊断
    const hasMarketData = !!data.market_data;
    const hasCurrentPrice = !!data.market_data?.current_price;
    const usdValue = data.market_data?.current_price?.usd;
    const hasUsd = usdValue !== undefined && usdValue !== null;
    
    console.log(`[CoinGecko] Response structure check:`, {
      hasMarketData,
      hasCurrentPrice,
      hasUsd,
      usdValue,
      usdValueType: typeof usdValue,
      marketDataKeys: data.market_data ? Object.keys(data.market_data) : [],
      currentPriceKeys: data.market_data?.current_price ? Object.keys(data.market_data.current_price) : [],
    });
    
    // CoinGecko历史API返回的是历史当天的价格，在market_data.current_price.usd中
    if (hasUsd) {
      const price = typeof usdValue === 'number' ? usdValue : parseFloat(String(usdValue));
      
      if (!isNaN(price) && price > 0 && isFinite(price)) {
        console.log(`[CoinGecko] ✅ Successfully fetched price for ${symbol} on ${date.toISOString().split('T')[0]}: $${price}`);
        return {
          price,
          date: date.toISOString().split('T')[0],
          source: 'CoinGecko',
        };
      } else {
        console.error(`[CoinGecko] ❌ Invalid price value:`, {
          rawValue: usdValue,
          rawValueType: typeof usdValue,
          parsed: price,
          isNaN: isNaN(price),
          isPositive: price > 0,
          isFinite: isFinite(price),
        });
      }
    } else {
      // 尝试其他可能的价格字段位置
      const alternativePaths = [
        { path: 'market_data.prices.usd', value: data.market_data?.prices?.usd },
        { path: 'price.usd', value: data.price?.usd },
        { path: 'market_data.price.usd', value: data.market_data?.price?.usd },
      ];
      
      for (const { path, value } of alternativePaths) {
        if (value !== undefined && value !== null) {
          const price = typeof value === 'number' ? value : parseFloat(String(value));
          if (!isNaN(price) && price > 0 && isFinite(price)) {
            console.log(`[CoinGecko] ✅ Found price in alternative field (${path}): $${price}`);
            return {
              price,
              date: date.toISOString().split('T')[0],
              source: 'CoinGecko',
            };
          }
        }
      }
      
      // 详细记录响应结构，帮助诊断问题
      console.error(`[CoinGecko] ❌ Missing price data. Full response structure:`, {
        topLevelKeys: Object.keys(data),
        hasMarketData,
        marketDataStructure: data.market_data ? {
          keys: Object.keys(data.market_data),
          currentPrice: data.market_data.current_price,
          currentPriceType: typeof data.market_data.current_price,
          sampleData: JSON.stringify(data.market_data).substring(0, 500),
        } : 'market_data is null or undefined',
        fullResponseSample: JSON.stringify(data, null, 2).substring(0, 2000), // 记录前2000字符用于诊断
      });
    }

    return null;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error(`[CoinGecko] Request timeout for ${symbol} on ${date.toISOString().split('T')[0]} after 15 seconds`);
    } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
      console.error(`[CoinGecko] Network error for ${symbol}:`, err.message);
    } else {
      console.error(`[CoinGecko] Unexpected error for ${symbol}:`, {
        name: err.name,
        message: err.message,
        stack: err.stack,
      });
    }
    return null;
  }
}

/**
 * 获取实时价格（多数据源并行fallback）
 * @param symbol 代币符号 (BTC, ETH, SOL, BNB, OKB)
 * @returns PriceData | null
 */
export async function getCurrentPrice(symbol: string): Promise<PriceData | null> {
  // 并行请求多个数据源，谁先返回就用谁的
  const sources = [
    () => fetchPriceFromBinance(symbol),      // 优先：Binance（支持CORS，速度快）
    () => fetchPriceFromOKX(symbol),          // 备用1：OKX（支持CORS）
    () => fetchPriceFromCoinGecko(symbol),    // 备用2：CoinGecko
  ];

  // 并行执行所有请求，使用 Promise.allSettled 等待所有结果
  const promises = sources.map(fn => fn().catch(() => null));
  const results = await Promise.allSettled(promises);
  
  // 按优先级顺序检查结果
  for (const settled of results) {
    if (settled.status === 'fulfilled' && settled.value) {
      const result = settled.value;
      if (result.price > 0) {
        return result;
      }
    }
  }

  return null;
}

/**
 * 获取历史价格（只获取精确日期，不搜索前后日期）
 * @param symbol 代币符号
 * @param date 目标日期
 * @returns HistoricalPriceData | null
 */
export async function getHistoricalPrice(
  symbol: string,
  date: Date
): Promise<HistoricalPriceData | null> {
  // 检查日期是否在未来
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  if (targetDate > today) {
    console.error(`[getHistoricalPrice] Cannot fetch historical price for future date: ${date.toISOString().split('T')[0]}`);
    return null;
  }

  // 只获取精确日期的数据，不搜索前后日期
  console.log(`[getHistoricalPrice] Fetching exact date for ${symbol} on ${date.toISOString().split('T')[0]}`);
  const result = await fetchHistoricalPriceFromCoinGecko(symbol, date);
  
  if (!result) {
    console.error(`[getHistoricalPrice] Failed to fetch historical price for ${symbol} on ${date.toISOString().split('T')[0]}`);
  }

  return result;
}

/**
 * 备用数据（当所有API都失败时使用）
 */
/**
 * 备用数据（当所有API都失败时使用）
 * 注意：加密货币不使用fallback，必须获取真实价格
 */
export const FALLBACK_PRICES: Record<string, { current: number; history: Record<number, number> }> = {
  // 加密货币不使用fallback，这里保留是为了向后兼容，但实际不会使用
};

/**
 * 获取价格（带fallback）
 * @param symbol 代币符号
 * @param useFallback 是否允许使用fallback数据
 */
export async function getPriceWithFallback(
  symbol: string,
  useFallback: boolean = true
): Promise<PriceData> {
  const result = await getCurrentPrice(symbol);
  
  if (result && result.price > 0) {
    return result;
  }

  // 如果获取不到真实价格，且不允许使用fallback，抛出错误
  if (!useFallback) {
    throw new Error(`无法获取 ${symbol} 的实时价格，请检查网络连接后重试`);
  }

  // 只有在明确允许的情况下才使用fallback
  if (FALLBACK_PRICES[symbol] && FALLBACK_PRICES[symbol].current > 0) {
    return {
      price: FALLBACK_PRICES[symbol].current,
      source: 'Fallback Database',
      timestamp: Date.now(),
    };
  }

  throw new Error(`无法获取 ${symbol} 的实时价格，请检查网络连接后重试`);
}

/**
 * 获取历史价格（带fallback）
 * @param symbol 代币符号
 * @param date 目标日期
 * @param yearsAgo 多少年前（用于fallback）
 * @param useFallback 是否允许使用fallback数据
 */
export async function getHistoricalPriceWithFallback(
  symbol: string,
  date: Date,
  yearsAgo: number,
  useFallback: boolean = true
): Promise<HistoricalPriceData> {
  // 检查日期是否在未来
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  if (targetDate > today) {
    throw new Error(`无法获取未来日期的历史价格。请选择今天或之前的日期。`);
  }

  console.log(`[getHistoricalPriceWithFallback] Starting fetch for ${symbol} on ${date.toISOString().split('T')[0]}`);

  // 尝试获取历史价格，最多重试3次，每次增加延迟
  let result: HistoricalPriceData | null = null;
  let lastError: string | null = null;
  
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      const delay = 2000 * attempt; // 2秒、4秒
      console.log(`[getHistoricalPriceWithFallback] Retry attempt ${attempt + 1}/3 after ${delay}ms delay`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    try {
      result = await getHistoricalPrice(symbol, date);
      if (result && result.price > 0) {
        console.log(`[getHistoricalPriceWithFallback] Success on attempt ${attempt + 1}`);
        return result;
      } else {
        lastError = `CoinGecko API返回了空结果。请查看浏览器控制台的[CoinGecko]日志获取详细响应信息`;
        console.error(`[getHistoricalPriceWithFallback] Attempt ${attempt + 1} failed: ${lastError}`);
        console.error(`[getHistoricalPriceWithFallback] 请检查控制台中的[CoinGecko] Response structure check 和 Missing price data 日志`);
      }
    } catch (err: any) {
      lastError = err.message || err.toString();
      console.error(`[getHistoricalPriceWithFallback] Attempt ${attempt + 1} error:`, {
        name: err.name,
        message: err.message,
        stack: err.stack,
      });
    }
  }

  // 如果获取不到真实价格，且不允许使用fallback，抛出详细错误
  if (!useFallback) {
    const dateStr = date.toISOString().split('T')[0];
    const errorDetails = lastError ? `错误详情: ${lastError}` : 'CoinGecko API 可能暂时不可用或网络连接问题';
    throw new Error(`无法获取 ${symbol} 在 ${dateStr} 的历史价格。${errorDetails}。请检查：1) 网络连接 2) CoinGecko API 状态 3) 浏览器控制台查看详细错误日志。`);
  }

  // 只有在明确允许的情况下才使用fallback
  if (FALLBACK_PRICES[symbol] && FALLBACK_PRICES[symbol].current > 0) {
    console.warn(`[getHistoricalPriceWithFallback] Using fallback data for ${symbol}`);
    const fallbackPrice = FALLBACK_PRICES[symbol].history[yearsAgo] || 
                          FALLBACK_PRICES[symbol].history[3] || 
                          FALLBACK_PRICES[symbol].current * 0.5;
    
    return {
      price: fallbackPrice,
      date: date.toISOString().split('T')[0],
      source: 'Fallback Database',
    };
  }

  const dateStr = date.toISOString().split('T')[0];
  const errorDetails = lastError ? `错误详情: ${lastError}` : 'CoinGecko API 可能暂时不可用或网络连接问题';
  throw new Error(`无法获取 ${symbol} 在 ${dateStr} 的历史价格。${errorDetails}。请检查：1) 网络连接 2) CoinGecko API 状态 3) 浏览器控制台查看详细错误日志。`);
}

