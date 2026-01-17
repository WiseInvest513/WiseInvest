/**
 * HistoricalPriceService - 历史价格服务
 * 
 * 职责：获取资产的历史价格（指定日期）
 * 
 * 使用方式：
 * const price = await HistoricalPriceService.getPrice('crypto', 'BTC', new Date('2025-01-01'));
 * const price = await HistoricalPriceService.getPrice('stock', 'AAPL', new Date('2025-01-01'));
 * const price = await HistoricalPriceService.getPrice('index', 'QQQ', new Date('2025-01-01'));
 */

import type { AssetType } from './CurrentPriceService';

export type { AssetType };

// ==================== 类型定义 ====================

export interface HistoricalPriceResult {
  price: number;
  date: string;
  source: string;
  exists: boolean;
  error?: string;
}

// ==================== 配置 ====================

const CRYPTO_CONFIG: Record<string, { coinpaprikaId: string; binanceSymbol: string; okxInstId?: string }> = {
  BTC: { coinpaprikaId: 'btc-bitcoin', binanceSymbol: 'BTCUSDT', okxInstId: 'BTC-USDT' },
  ETH: { coinpaprikaId: 'eth-ethereum', binanceSymbol: 'ETHUSDT', okxInstId: 'ETH-USDT' },
  BNB: { coinpaprikaId: 'bnb-binance-coin', binanceSymbol: 'BNBUSDT', okxInstId: 'BNB-USDT' },
  OKB: { coinpaprikaId: 'okb-okb', binanceSymbol: 'OKBUSDT', okxInstId: 'OKB-USDT' }, // OKB 币安不支持，使用 OKX
  SOL: { coinpaprikaId: 'sol-solana', binanceSymbol: 'SOLUSDT', okxInstId: 'SOL-USDT' },
};

const STOCK_CONFIG: Record<string, { symbol: string; name: string }> = {
  AAPL: { symbol: 'AAPL', name: 'Apple Inc.' },
  MSFT: { symbol: 'MSFT', name: 'Microsoft Corporation' },
  GOOGL: { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  AMZN: { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  META: { symbol: 'META', name: 'Meta Platforms Inc.' },
  TSLA: { symbol: 'TSLA', name: 'Tesla Inc.' },
  NVDA: { symbol: 'NVDA', name: 'NVIDIA Corporation' },
};

const INDEX_CONFIG: Record<string, { symbol: string; name: string }> = {
  QQQ: { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
  VOO: { symbol: 'VOO', name: 'Vanguard S&P 500 ETF' },
  DIA: { symbol: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF' },
  VGT: { symbol: 'VGT', name: 'Vanguard Information Technology ETF' },
};

const DOMESTIC_CONFIG: Record<string, { symbol: string; name: string; sinaCode: string }> = {
  SH000001: { symbol: 'SH000001', name: '上证指数', sinaCode: 's_sh000001' },
};

// ==================== 降级数据 ====================

const FALLBACK_PRICES: Record<string, number> = {
  BTC: 90000,
  ETH: 3200,
  BNB: 420,
  OKB: 45,
  SOL: 150,
  AAPL: 180,
  MSFT: 470,
  GOOGL: 140,
  AMZN: 150,
  META: 480,
  TSLA: 250,
  NVDA: 500,
  QQQ: 400,
  VOO: 450,
  DIA: 380,
  VGT: 420,
  // 国内
  SH000001: 3000,
};

// ==================== 日期工具 ====================

class DateUtils {
  /**
   * 将 Date 对象转换为北京时间字符串（YYYY-MM-DD）
   */
  static toBeijingDateString(date: Date): string {
    const beijingTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    const year = beijingTime.getUTCFullYear();
    const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(beijingTime.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  /**
   * 如果是周末，向前找到最近的周五
   * 股票市场不是7*24小时运行，周末不交易，所以遇到周六周日，默认选择周五的数据
   */
  static adjustToLastFriday(date: Date): Date {
    const adjusted = new Date(date);
    // 使用 UTC 时间判断星期几（0=周日, 1=周一, ..., 6=周六）
    const dayOfWeek = adjusted.getUTCDay();
    
    // 如果是周日（0），向前2天到周五
    if (dayOfWeek === 0) {
      adjusted.setUTCDate(adjusted.getUTCDate() - 2);
      console.log(`[DateUtils] 检测到周日，调整为周五: ${date.toISOString().split('T')[0]} -> ${adjusted.toISOString().split('T')[0]}`);
    } 
    // 如果是周六（6），向前1天到周五
    else if (dayOfWeek === 6) {
      adjusted.setUTCDate(adjusted.getUTCDate() - 1);
      console.log(`[DateUtils] 检测到周六，调整为周五: ${date.toISOString().split('T')[0]} -> ${adjusted.toISOString().split('T')[0]}`);
    }
    
    return adjusted;
  }
}

// ==================== 网络请求 ====================

class NetworkRequest {
  private static async fetchWithProxy(url: string): Promise<any> {
    const CORS_PROXIES = [
      'https://api.allorigins.win/get?url=',
      'https://api.codetabs.com/v1/proxy?quest=',
    ];
    
    for (const proxyBase of CORS_PROXIES) {
      try {
        const proxyUrl = proxyBase + encodeURIComponent(url);
        const response = await fetch(proxyUrl, { 
          method: 'GET',
          signal: AbortSignal.timeout(15000)
        });
        
        if (!response.ok) continue;
        
        const text = await response.text();
        const data = JSON.parse(text);
        
        if (data.contents) {
          const contents = typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
          return contents;
        }
        
        return data;
      } catch (error) {
        continue;
      }
    }
    
    throw new Error('所有代理服务均不可用');
  }
  
  /**
   * 使用服务器端 API 路由获取 Binance 历史价格
   * @param cryptoSymbol 加密货币代码（如 'BTC', 'ETH'），不是 Binance 交易对
   */
  static async fetchBinanceViaAPI(cryptoSymbol: string, date: Date): Promise<any> {
    const dateStr = date.toISOString().split('T')[0];
    // 服务器端 API 需要的是原始 symbol（如 'ETH'），不是 binanceSymbol（如 'ETHUSDT'）
    const apiUrl = `/api/price?type=crypto&action=historical&symbol=${cryptoSymbol}&date=${dateStr}`;
    
    console.log('[fetchBinanceViaAPI] 调用服务器端 API:', apiUrl);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // 确保不使用代理
        cache: 'no-store',
      });
      
      console.log('[fetchBinanceViaAPI] 服务器端 API 响应状态:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('[fetchBinanceViaAPI] 服务器端 API 错误响应:', errorText);
        throw new Error(`API request failed: HTTP ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('[fetchBinanceViaAPI] 服务器端 API 返回结果:', result);
      
      if (result.error) {
        console.error('[fetchBinanceViaAPI] 服务器端 API 返回错误:', result.error);
        throw new Error(result.error);
      }
      
      // 转换为 Binance klines 格式
      if (result.price && result.date) {
        const dateObj = new Date(result.date + 'T00:00:00Z');
        const openTime = dateObj.getTime();
        console.log('[fetchBinanceViaAPI] ✅ 成功获取价格:', result.price, '日期:', result.date);
        return [[openTime, result.price, result.price, result.price, result.price, 0]];
      }
      
      throw new Error('Invalid API response format');
    } catch (error: any) {
      console.error('[fetchBinanceViaAPI] 服务器端 API 请求失败:', error.message);
      console.error('[fetchBinanceViaAPI] 错误堆栈:', error.stack);
      throw error;
    }
  }
  
  /**
   * 直接请求 Binance API
   * - 浏览器端：直接请求（不使用代理）
   * - 服务器端：调用服务器端 API 路由（避免在客户端导入 https-proxy-agent）
   */
  static async fetchBinanceDirect(symbol: string, date: Date): Promise<any> {
    // 恢复原来的实现：使用 UTC 方法获取年月日
    // 这是最安全的方法，确保无论 date 对象是如何创建的，都能正确提取 UTC 日期
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).getTime();
    const end = start + 86400000 - 1;
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&startTime=${start}&endTime=${end}&limit=1`;
    
    // 检查是否在服务器端（使用 typeof 检查，避免在构建时被解析）
    const isServerSide = typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node;
    
    if (isServerSide) {
      // 服务器端：使用代理（参考 ROI API）
      console.log('[fetchBinanceDirect] 服务器端请求 Binance API（使用代理）:', url);
      
      try {
        // 获取代理 URL（参考 ROI API）
        const getProxyUrl = (): string => {
          const envProxy = process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY;
          if (envProxy) {
            console.log(`[fetchBinanceDirect] 使用环境变量代理: ${envProxy}`);
            return envProxy;
          }
          const defaultProxy = 'http://127.0.0.1:7890';
          console.log(`[fetchBinanceDirect] 使用默认代理: ${defaultProxy}`);
          return defaultProxy;
        };
        
        const proxyUrl = getProxyUrl();
        
        // 使用 require 动态加载 HttpsProxyAgent（仅在服务器端运行时执行）
        // 注意：webpack 配置已排除此包在客户端打包
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const httpsProxyAgent = require('https-proxy-agent');
        const HttpsProxyAgent = httpsProxyAgent.HttpsProxyAgent || httpsProxyAgent.default || httpsProxyAgent;
        const proxyAgent = new HttpsProxyAgent(proxyUrl);
        
        const fetchOptions: RequestInit = {
          // @ts-ignore - node-fetch types mismatch with Next.js fetch, but 'agent' works in Node env
          agent: proxyAgent,
          cache: 'no-store',
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        };
        
        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`Binance API request failed: HTTP ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('[fetchBinanceDirect] Binance API 返回数据:', data);
        return data;
      } catch (error: any) {
        console.error('[fetchBinanceDirect] 服务器端请求失败:', error.message);
        throw error;
      }
    } else {
      // 浏览器端：先尝试直接请求，失败则使用代理
      console.log('[fetchBinanceDirect] 浏览器端请求 Binance API:', url);
      
      try {
        // 先尝试直接请求
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`Binance API request failed: HTTP ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('[fetchBinanceDirect] ✅ 直接请求成功，返回数据:', data);
        return data;
      } catch (error: any) {
        // 直接请求失败，尝试使用代理
        console.warn('[fetchBinanceDirect] ⚠️ 直接请求失败，尝试使用代理:', error.message);
        console.log('[fetchBinanceDirect] 使用代理请求:', url);
        
        try {
          const proxyData = await NetworkRequest.fetchWithProxy(url);
          console.log('[fetchBinanceDirect] ✅ 代理请求成功，返回数据:', proxyData);
          return proxyData;
        } catch (proxyError: any) {
          console.error('[fetchBinanceDirect] ❌ 代理请求也失败:', proxyError.message);
          throw new Error(`Binance API 请求失败（直接请求和代理都失败）: ${error.message}`);
        }
      }
    }
  }
  
  /**
   * 获取 CoinPaprika 历史价格
   */
  static async fetchCoinPaprikaHistorical(coinpaprikaId: string, date: Date): Promise<any> {
    const dateStr = date.toISOString().split('T')[0];
    const url = `https://api.coinpaprika.com/v1/coins/${coinpaprikaId}/ohlcv/historical?start=${dateStr}&end=${dateStr}`;
    return this.fetchWithProxy(url);
  }
  
  /**
   * 获取 OKX 历史价格（K线数据）
   * OKX API: /api/v5/market/history-candles
   * 
   * OKX 分页逻辑（关键）：
   * - OKX 使用分页游标（`after`）参数
   * - 要获取特定日期的数据，设置 `after = targetTimestamp + 86400000`（目标日期后一天）
   * - 这样会获取比这个时间更早的数据（即目标日期的数据）
   * - 使用 `limit=1` 获取单条记录
   * 
   * 参数：
   * - instId: 交易对，如 OKB-USDT
   * - bar: 时间间隔，1D 表示1天
   * - after: 时间戳（毫秒），返回比这个时间更早的数据（earlier）
   * - limit: 返回数量，设置为 1 获取单条记录
   */
  static async fetchOKXHistorical(instId: string, date: Date): Promise<any> {
    // 计算目标日期的开始时间戳（毫秒）
    const targetDateStart = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0, 0, 0, 0
    ));
    const targetTimestamp = targetDateStart.getTime();
    
    // OKX 分页逻辑：设置 after = targetTimestamp + 86400000（目标日期后一天）
    // 这样会获取比这个时间更早的数据（即目标日期的数据）
    const after = targetTimestamp + 86400000; // 目标日期 + 1天
    
    const url = `https://www.okx.com/api/v5/market/history-candles?instId=${instId}&bar=1D&after=${after}&limit=1`;
    
    console.log('[fetchOKXHistorical] 请求 OKX API:');
    console.log('[fetchOKXHistorical] 目标日期:', date.toISOString().split('T')[0]);
    console.log('[fetchOKXHistorical] targetTimestamp:', targetTimestamp);
    console.log('[fetchOKXHistorical] after (targetTimestamp + 1day):', after);
    console.log('[fetchOKXHistorical] URL:', url);
    
    try {
      // 浏览器直接请求 OKX API
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`OKX API request failed: HTTP ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('[fetchOKXHistorical] OKX API 返回结果:', result);
      
      // 检查响应状态
      if (result.code !== '0') {
        throw new Error(`OKX API error: code=${result.code}, msg=${result.msg || 'Unknown error'}`);
      }
      
      // 检查数据
      if (!Array.isArray(result.data) || result.data.length === 0) {
        console.warn('[fetchOKXHistorical] OKX API 返回空数组，可能是该日期没有数据');
        return { code: '0', msg: '', data: [] };
      }
      
      // 返回数据
      console.log('[fetchOKXHistorical] ✅ OKX API 返回数据:', result.data);
      return result;
    } catch (error: any) {
      console.error('[fetchOKXHistorical] OKX API 请求失败:', error.message);
      throw error;
    }
  }
  
  /**
   * 获取 Yahoo Finance 历史价格
   * 只请求调整后的那一天的数据（不扩大时间范围）
   */
  static async fetchYahooFinanceHistorical(symbol: string, date: Date): Promise<any> {
    // 只请求传入日期的那一天的数据（调用方已经调整过周末）
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
    
    // 验证：period2 - period1 应该只相差不到24小时（86399秒）
    const timeDiff = period2 - period1;
    if (timeDiff > 86400) {
      console.error(`[fetchYahooFinanceHistorical] ⚠️ 时间范围异常: ${timeDiff}秒 (${timeDiff/86400}天), 应该是不到24小时`);
    }
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&period1=${period1}&period2=${period2}`;
    console.log(`[fetchYahooFinanceHistorical] 请求URL: ${url}, 日期: ${date.toISOString().split('T')[0]}, 时间范围: ${timeDiff}秒 (${(timeDiff/3600).toFixed(2)}小时)`);
    return this.fetchWithProxy(url);
  }
}

// ==================== 数据解析 ====================

class DataParser {
  /**
   * 解析 Binance K线数据
   */
  static parseBinance(data: any): { price: number | null; error: string | null } {
    // 检查错误响应
    if (data && typeof data === 'object' && !Array.isArray(data) && 'code' in data && 'msg' in data) {
      const msg = String(data.msg || '').toLowerCase();
      if (msg.includes('restricted location') || msg.includes('service unavailable')) {
        return { price: null, error: 'BINANCE_GEO_RESTRICTED' };
      }
      if (msg.includes('invalid symbol')) {
        return { price: null, error: 'Invalid symbol' };
      }
      return { price: null, error: data.msg || 'Binance API 错误' };
    }
    
    // 解析 K线数据数组
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0]) && data[0].length >= 6) {
      const candle = data[0];
      const closePriceStr = typeof candle[4] === 'string' ? candle[4] : String(candle[4]);
      const closePrice = parseFloat(closePriceStr);
      
      if (closePrice > 0 && isFinite(closePrice)) {
        return { price: closePrice, error: null };
      }
    }
    
    return { price: null, error: '数据格式不正确' };
  }
  
  /**
   * 解析 CoinPaprika 历史价格
   */
  static parseCoinPaprikaHistorical(data: any, targetDate: string): number | null {
    console.log('[parseCoinPaprikaHistorical] 开始解析 CoinPaprika 数据:', data);
    
    // 检查是否是错误响应
    if (data && typeof data === 'object' && 'error' in data) {
      const errorMsg = String(data.error || '');
      console.warn('[parseCoinPaprikaHistorical] CoinPaprika 返回错误:', errorMsg);
      
      // 检查是否是日期限制错误
      if (errorMsg.includes('not allowed in this plan') || errorMsg.includes('before')) {
        console.warn('[parseCoinPaprikaHistorical] CoinPaprika 免费计划限制：无法获取该日期之前的历史数据');
      }
      
      return null;
    }
    
    // 检查是否是代理返回的错误格式
    if (data && typeof data === 'object' && 'contents' in data) {
      try {
        const contents = JSON.parse(data.contents);
        if (contents && typeof contents === 'object' && 'error' in contents) {
          const errorMsg = String(contents.error || '');
          console.warn('[parseCoinPaprikaHistorical] CoinPaprika 代理返回错误:', errorMsg);
          return null;
        }
      } catch (e) {
        // 如果解析失败，继续处理原始数据
      }
    }
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('[parseCoinPaprikaHistorical] 找到数据数组，长度:', data.length);
      for (const item of data) {
        const itemDate = item.time_open ? item.time_open.split('T')[0] : null;
        console.log('[parseCoinPaprikaHistorical] 检查数据项，日期:', itemDate, '目标日期:', targetDate);
        if (itemDate === targetDate && item.close && item.close > 0) {
          const price = Math.floor(item.close * 10) / 10;
          console.log('[parseCoinPaprikaHistorical] ✅ 找到匹配日期的价格:', price);
          return price;
        }
      }
      const firstItem = data[0];
      if (firstItem?.close && firstItem.close > 0) {
        const price = Math.floor(firstItem.close * 10) / 10;
        console.log('[parseCoinPaprikaHistorical] ⚠️ 使用第一个数据项的价格:', price);
        return price;
      }
    }
    
    console.warn('[parseCoinPaprikaHistorical] 未找到有效数据');
    return null;
  }
  
  /**
   * 解析 OKX K线数据
   * OKX 返回格式：
   * {
   *   "code": "0",
   *   "msg": "",
   *   "data": [
   *     [
   *       "1597026383085",  // ts: 开盘时间（毫秒时间戳）
   *       "3.494",           // o: 开盘价
   *       "3.72",            // h: 最高价
   *       "3.494",           // l: 最低价
   *       "3.72",            // c: 收盘价
   *       "24912403",        // vol: 成交量（基础货币）
   *       "67632347.24399722", // volCcy: 成交量（计价货币）
   *       "37632347.24399722", // volCcyQuote: 成交量（计价货币）
   *       "1"                // confirm: 是否完成
   *     ]
   *   ]
   * }
   */
  static parseOKX(data: any, targetDate?: string): { price: number | null; error: string | null; date?: string; volume?: number } {
    console.log('[parseOKX] 开始解析 OKX 数据:', data);
    
    // 检查错误响应
    if (data && typeof data === 'object' && 'code' in data) {
      const code = String(data.code || '');
      if (code !== '0') {
        const msg = data.msg || 'OKX API 错误';
        console.error('[parseOKX] OKX API 错误:', msg);
        return { price: null, error: msg };
      }
    }
    
    // 检查数据数组
    const dataArray = data?.data;
    console.log('[parseOKX] 数据数组:', dataArray, '类型:', Array.isArray(dataArray), '长度:', Array.isArray(dataArray) ? dataArray.length : 'N/A');
    
    if (!Array.isArray(dataArray)) {
      console.error('[parseOKX] data 不是数组');
      return { price: null, error: '数据格式不正确：data 不是数组' };
    }
    
    if (dataArray.length === 0) {
      console.warn('[parseOKX] 数据数组为空');
      return { price: null, error: '该日期没有交易数据' };
    }
    
    // 解析第一个 K线数据
    const candle = dataArray[0];
    console.log('[parseOKX] 第一个 K线数据:', candle);
    
    if (!Array.isArray(candle) || candle.length < 5) {
      console.error('[parseOKX] K线数据格式不正确:', candle);
      return { price: null, error: 'K线数据格式不正确' };
    }
    
    // Index 0: 开盘时间（毫秒时间戳）
    const timestampStr = typeof candle[0] === 'string' ? candle[0] : String(candle[0]);
    const timestamp = parseInt(timestampStr);
    const candleDate = new Date(timestamp).toISOString().split('T')[0];
    
    // Index 4: 收盘价 (c)
    const closePriceStr = typeof candle[4] === 'string' ? candle[4] : String(candle[4]);
    const closePrice = parseFloat(closePriceStr);
    
    // Index 5: 成交量 (vol)
    const volumeStr = typeof candle[5] === 'string' ? candle[5] : String(candle[5]);
    const volume = parseFloat(volumeStr);
    
    console.log('[parseOKX] 解析结果:', {
      timestamp,
      candleDate,
      closePrice,
      volume,
      isValid: closePrice > 0 && isFinite(closePrice),
    });
    
    if (closePrice > 0 && isFinite(closePrice)) {
      return {
        price: closePrice,
        error: null,
        date: candleDate,
        volume: volume > 0 && isFinite(volume) ? volume : undefined,
      };
    }
    
    return { price: null, error: '价格数据无效' };
  }
  
  /**
   * 解析 Yahoo Finance 历史价格
   * 由于请求时已经调整到周五，这里直接取第一条有效数据即可
   */
  static parseYahooFinanceHistorical(data: any, targetDate: string): number | null {
    console.log(`[parseYahooFinanceHistorical] 开始解析，目标日期: ${targetDate}`);
    console.log(`[parseYahooFinanceHistorical] 原始数据:`, JSON.stringify(data).substring(0, 500));
    
    const result = data?.chart?.result?.[0];
    if (!result) {
      console.warn(`[parseYahooFinanceHistorical] ⚠️ 数据格式错误，result 为空`);
      return null;
    }
    
    const timestamps = result.timestamp;
    const closes = result.indicators?.quote?.[0]?.close;
    
    console.log(`[parseYahooFinanceHistorical] timestamps:`, timestamps);
    console.log(`[parseYahooFinanceHistorical] closes:`, closes);
    
    if (!timestamps || !Array.isArray(timestamps) || timestamps.length === 0) {
      console.warn(`[parseYahooFinanceHistorical] ⚠️ timestamps 为空或不是数组`);
      return null;
    }
    
    if (!closes || !Array.isArray(closes) || closes.length === 0) {
      console.warn(`[parseYahooFinanceHistorical] ⚠️ closes 为空或不是数组`);
      return null;
    }
    
    // 精确匹配目标日期
    for (let i = 0; i < timestamps.length; i++) {
      const ts = timestamps[i];
      const price = closes[i];
      if (typeof price === 'number' && price > 0 && !isNaN(price)) {
        const dataDate = new Date(ts * 1000).toISOString().split('T')[0];
        console.log(`[parseYahooFinanceHistorical] 检查数据: 日期=${dataDate}, 价格=${price}, 目标日期=${targetDate}`);
        if (dataDate === targetDate) {
          console.log(`[parseYahooFinanceHistorical] ✅ 精确匹配目标日期 ${targetDate}，价格: ${price}`);
          return Math.round(price * 100) / 100;
        }
      }
    }
    
    // 如果没找到精确匹配，取第一条有效数据
    for (let i = 0; i < timestamps.length; i++) {
      const price = closes[i];
      if (typeof price === 'number' && price > 0 && !isNaN(price)) {
        const dataDate = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
        console.log(`[parseYahooFinanceHistorical] ✅ 使用第一条有效数据: 日期=${dataDate}, 价格=${price}`);
        return Math.round(price * 100) / 100;
      }
    }
    
    console.error(`[parseYahooFinanceHistorical] ❌ 未找到任何有效数据`);
    return null;
  }
}

// ==================== 历史价格服务 ====================

export class HistoricalPriceService {
  /**
   * 获取加密货币历史价格
   */
  private static async getCryptoHistoricalPrice(symbol: string, date: Date): Promise<HistoricalPriceResult> {
    const config = CRYPTO_CONFIG[symbol.toUpperCase()];
    if (!config) {
      return {
        price: 0,
        date: DateUtils.toBeijingDateString(date),
        source: 'Error',
        exists: false,
        error: `不支持的加密货币: ${symbol}`,
      };
    }
    
    // 加密货币是7x24小时交易，不需要调整到周五
    // 直接使用传入的日期
    const dateStr = DateUtils.toBeijingDateString(date);
    console.log(`[HistoricalPriceService] 加密货币 ${symbol} 历史价格查询: 原始日期=${date.toISOString()}, 日期字符串=${dateStr}`);
    
    // 特殊处理：OKB 币安不支持，使用 OKX
    if (symbol.toUpperCase() === 'OKB') {
      if (config.okxInstId) {
        try {
          console.log('[HistoricalPriceService] OKB 使用 OKX API，instId:', config.okxInstId, '日期:', dateStr);
          const okxData = await NetworkRequest.fetchOKXHistorical(config.okxInstId, date);
          console.log('[HistoricalPriceService] OKX 返回原始数据:', okxData);
          
          const okxResult = DataParser.parseOKX(okxData, dateStr);
          console.log('[HistoricalPriceService] OKX 解析结果:', okxResult);
          
          if (okxResult.price && okxResult.price > 0) {
            console.log('[HistoricalPriceService] ✅ OKX 成功获取 OKB 价格:', okxResult.price);
            return {
              price: okxResult.price,
              date: okxResult.date || dateStr,
              source: 'OKX',
              exists: true,
            };
          } else {
            console.warn('[HistoricalPriceService] ⚠️ OKX 返回空数据或解析失败:', okxResult.error);
          }
        } catch (error: any) {
          console.error('[HistoricalPriceService] ❌ OKX 请求异常:', error.message);
          console.error('[HistoricalPriceService] 错误堆栈:', error.stack);
        }
      }
      
      // OKX 失败，直接降级到默认数据
      console.warn('[HistoricalPriceService] OKX 失败，使用默认数据');
    } else {
      // BTC/ETH/BNB/SOL 使用 Binance - 浏览器直接请求
      console.log('[HistoricalPriceService] 开始获取加密货币历史价格:', symbol, '日期:', dateStr, '时间戳:', date.getTime());
      try {
        // 浏览器直接请求 Binance API，不使用服务器端 API
        const binanceData = await NetworkRequest.fetchBinanceDirect(config.binanceSymbol, date);
        console.log('[HistoricalPriceService] Binance 直接请求返回数据:', binanceData);
        
        const binanceResult = DataParser.parseBinance(binanceData);
        console.log('[HistoricalPriceService] parseBinance 解析结果:', binanceResult);
        
        if (binanceResult.price) {
          console.log('[HistoricalPriceService] ✅ 成功获取价格:', binanceResult.price);
          return {
            price: binanceResult.price,
            date: dateStr,
            source: 'Binance',
            exists: true,
          };
        }
        
        // 如果 Binance 返回错误，记录日志
        console.warn('[HistoricalPriceService] ⚠️ Binance 返回错误:', binanceResult.error);
      } catch (error: any) {
        // Binance 请求失败，记录错误
        console.error('[HistoricalPriceService] ❌ Binance 直接请求失败:', error.message);
        console.error('[HistoricalPriceService] 错误堆栈:', error.stack);
        // 直接使用降级数据
      }
    }
    
    // 降级到默认数据
    const fallbackPrice = FALLBACK_PRICES[symbol.toUpperCase()] || 100;
    return {
      price: fallbackPrice,
      date: dateStr,
      source: 'Fallback (默认数据)',
      exists: true,
    };
  }
  
  /**
   * 获取股票历史价格
   */
  private static async getStockHistoricalPrice(symbol: string, date: Date): Promise<HistoricalPriceResult> {
    const config = STOCK_CONFIG[symbol.toUpperCase()];
    if (!config) {
      return {
        price: 0,
        date: DateUtils.toBeijingDateString(date),
        source: 'Error',
        exists: false,
        error: `不支持的股票: ${symbol}`,
      };
    }
    
    // 如果是周末，调整到周五（周六-1天，周日-2天）
    const adjustedDate = DateUtils.adjustToLastFriday(date);
    const dateStr = DateUtils.toBeijingDateString(adjustedDate);
    
    try {
      const data = await NetworkRequest.fetchYahooFinanceHistorical(config.symbol, adjustedDate);
      const price = DataParser.parseYahooFinanceHistorical(data, dateStr);
      
      if (price) {
        return {
          price,
          date: dateStr,
          source: 'Yahoo Finance',
          exists: true,
        };
      }
    } catch (error: any) {
      // 继续降级处理
    }
    
    // 降级到默认数据
    const fallbackPrice = FALLBACK_PRICES[symbol.toUpperCase()] || 100;
    return {
      price: fallbackPrice,
      date: dateStr,
      source: 'Fallback (默认数据)',
      exists: true,
    };
  }
  
  /**
   * 获取指数历史价格
   */
  private static async getIndexHistoricalPrice(symbol: string, date: Date): Promise<HistoricalPriceResult> {
    const config = INDEX_CONFIG[symbol.toUpperCase()];
    if (!config) {
      return {
        price: 0,
        date: DateUtils.toBeijingDateString(date),
        source: 'Error',
        exists: false,
        error: `不支持的指数: ${symbol}`,
      };
    }
    
    // 如果是周末，调整到周五（周六-1天，周日-2天）
    const adjustedDate = DateUtils.adjustToLastFriday(date);
    const dateStr = DateUtils.toBeijingDateString(adjustedDate);
    
    try {
      const data = await NetworkRequest.fetchYahooFinanceHistorical(config.symbol, adjustedDate);
      const price = DataParser.parseYahooFinanceHistorical(data, dateStr);
      
      if (price) {
        return {
          price,
          date: dateStr,
          source: 'Yahoo Finance',
          exists: true,
        };
      }
    } catch (error: any) {
      // 继续降级处理
    }
    
    // 降级到默认数据
    const fallbackPrice = FALLBACK_PRICES[symbol.toUpperCase()] || 100;
    return {
      price: fallbackPrice,
      date: dateStr,
      source: 'Fallback (默认数据)',
      exists: true,
    };
  }
  
  /**
   * 获取国内指数历史价格
   * 对于上证指数，使用 Yahoo Finance Download API（通过代理）
   */
  private static async getDomesticHistoricalPrice(symbol: string, date: Date): Promise<HistoricalPriceResult> {
    const config = DOMESTIC_CONFIG[symbol.toUpperCase()];
    if (!config) {
      return {
        price: 0,
        date: DateUtils.toBeijingDateString(date),
        source: 'Error',
        exists: false,
        error: `不支持的国内指数: ${symbol}`,
      };
    }
    
    // 如果是周末，调整到周五（周六-1天，周日-2天）
    const adjustedDate = DateUtils.adjustToLastFriday(date);
    const dateStr = DateUtils.toBeijingDateString(adjustedDate);
    
    // 上证指数使用服务器端 API（通过新浪财经 API）
    if (symbol.toUpperCase() === 'SH000001') {
      try {
        const apiUrl = `/api/stock/history?symbol=000001.SS&date=${dateStr}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.price && data.price > 0) {
          return {
            price: Math.round(data.price * 100) / 100,
            date: dateStr,
            source: data.source || 'Sina Finance (Server)',
            exists: true,
          };
        }
        
        throw new Error('服务器返回的价格数据无效');
      } catch (error: any) {
        const fallbackPrice = FALLBACK_PRICES[symbol.toUpperCase()] || 100;
        return {
          price: fallbackPrice,
          date: dateStr,
          source: 'Fallback (默认数据)',
          exists: false,
          error: error.message,
        };
      }
    }
    
    // 其他国内指数使用Yahoo Finance（通过代理）
    try {
      const yahooSymbol = symbol === 'SH000001' ? '^SSEC' : config.symbol;
      const data = await NetworkRequest.fetchYahooFinanceHistorical(yahooSymbol, adjustedDate);
      const price = DataParser.parseYahooFinanceHistorical(data, dateStr);
      
      if (price) {
        return {
          price,
          date: dateStr,
          source: 'Yahoo Finance',
          exists: true,
        };
      }
    } catch (error: any) {
      console.warn(`[HistoricalPriceService] Yahoo Finance获取失败:`, error.message);
    }
    
    // 降级到默认数据
    const fallbackPrice = FALLBACK_PRICES[symbol.toUpperCase()] || 100;
    return {
      price: fallbackPrice,
      date: dateStr,
      source: 'Fallback (默认数据)',
      exists: true,
    };
  }
  
  /**
   * 获取历史价格（统一入口）
   * @param type 资产类型：'crypto' | 'stock' | 'index' | 'domestic'
   * @param symbol 资产代码：如 'BTC', 'AAPL', 'QQQ', 'SH000001'
   * @param date 日期对象
   */
  static async getPrice(type: AssetType, symbol: string, date: Date): Promise<HistoricalPriceResult> {
    switch (type) {
      case 'crypto':
        return this.getCryptoHistoricalPrice(symbol, date);
      case 'stock':
        return this.getStockHistoricalPrice(symbol, date);
      case 'index':
        return this.getIndexHistoricalPrice(symbol, date);
      case 'domestic':
        return this.getDomesticHistoricalPrice(symbol, date);
      default:
        throw new Error(`不支持的资产类型: ${type}`);
    }
  }
}
