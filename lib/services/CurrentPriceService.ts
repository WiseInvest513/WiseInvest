/**
 * CurrentPriceService - 当前价格服务
 * 
 * 职责：获取资产的当前实时价格
 * 
 * 使用方式：
 * const price = await CurrentPriceService.getPrice('crypto', 'BTC');
 * const price = await CurrentPriceService.getPrice('stock', 'AAPL');
 * const price = await CurrentPriceService.getPrice('index', 'QQQ');
 */

// ==================== 类型定义 ====================

export type AssetType = 'crypto' | 'stock' | 'index' | 'domestic';

export interface CurrentPriceResult {
  price: number;
  source: string;
  timestamp: number;
  change24h?: number;
  change24hPercent?: number;
}

// ==================== 配置 ====================

const CRYPTO_CONFIG: Record<string, { coinpaprikaId: string }> = {
  BTC: { coinpaprikaId: 'btc-bitcoin' },
  ETH: { coinpaprikaId: 'eth-ethereum' },
  BNB: { coinpaprikaId: 'bnb-binance-coin' },
  OKB: { coinpaprikaId: 'okb-okb' },
  SOL: { coinpaprikaId: 'sol-solana' },
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
  // 加密货币
  BTC: 90000,
  ETH: 3200,
  BNB: 420,
  OKB: 45,
  SOL: 150,
  // 股票
  AAPL: 180,
  MSFT: 470,
  GOOGL: 140,
  AMZN: 150,
  META: 480,
  TSLA: 250,
  NVDA: 500,
  // 指数
  QQQ: 400,
  VOO: 450,
  DIA: 380,
  VGT: 420,
  // 国内
  SH000001: 3000,
};

// ==================== 网络请求 ====================

class NetworkRequest {
  static async fetchWithProxy(url: string): Promise<any> {
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
          // contents 可能是字符串（纯文本，如新浪财经的响应）或已经是对象
          // 如果是字符串，直接返回；如果是对象，需要判断是 JSON 字符串还是对象
          if (typeof data.contents === 'string') {
            // 尝试解析 JSON（Yahoo Finance 返回的是 JSON 字符串）
            try {
              return JSON.parse(data.contents);
            } catch {
              // 如果不是 JSON，直接返回字符串（如 CSV）
              return data.contents;
            }
          } else {
            // 已经是对象，直接返回
            return data.contents;
          }
        }
        
        return data;
      } catch (error) {
        continue;
      }
    }
    
    throw new Error('所有代理服务均不可用');
  }
  
  static async fetchCoinPaprika(coinpaprikaId: string): Promise<any> {
    const url = `https://api.coinpaprika.com/v1/tickers/${coinpaprikaId}`;
    return this.fetchWithProxy(url);
  }
  
  static async fetchYahooFinance(symbol: string): Promise<any> {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    return this.fetchWithProxy(url);
  }
  
  /**
   * 获取新浪财经数据（用于国内指数）
   * API: http://hq.sinajs.cn/list=s_sh000001
   * 返回格式: var hq_str_s_sh000001="上证指数,3094.668,-128.073,-3.97,436653,5458126";
   * 注意：由于 CORS 限制，需要使用代理
   */
  static async fetchSinaFinance(sinaCode: string): Promise<any> {
    const url = `http://hq.sinajs.cn/list=${sinaCode}`;
    // 使用代理绕过 CORS 限制
    return this.fetchWithProxy(url);
  }
}

// ==================== 数据解析 ====================

class DataParser {
  static parseCoinPaprika(data: any): CurrentPriceResult {
    const price = data?.quotes?.USD?.price;
    const change24h = data?.quotes?.USD?.percent_change_24h;
    
    if (!price || price <= 0) {
      throw new Error('价格数据无效');
    }
    
    return {
      price: Math.floor(price * 10) / 10,
      source: 'CoinPaprika',
      timestamp: Date.now(),
      change24hPercent: change24h ? Number(change24h) : undefined,
    };
  }
  
  static parseYahooFinance(data: any): CurrentPriceResult {
    const result = data?.chart?.result?.[0];
    if (!result?.meta) {
      throw new Error('数据格式错误');
    }
    
    const meta = result.meta;
    const price = meta.regularMarketPrice || meta.currentPrice || meta.chartPreviousClose;
    const previousClose = meta.previousClose || meta.chartPreviousClose;
    
    if (!price || price <= 0) {
      throw new Error('价格数据无效');
    }
    
    const change24h = previousClose ? price - previousClose : 0;
    const change24hPercent = previousClose ? (change24h / previousClose) * 100 : 0;
    
    return {
      price: Math.round(price * 100) / 100,
      source: 'Yahoo Finance',
      timestamp: Date.now(),
      change24h: previousClose ? Math.round(change24h * 100) / 100 : undefined,
      change24hPercent: previousClose ? Math.round(change24hPercent * 100) / 100 : undefined,
    };
  }
  
  /**
   * 解析新浪财经数据
   * 格式: var hq_str_s_sh000001="上证指数,3094.668,-128.073,-3.97,436653,5458126";
   * 数据含义: 指数名称,当前点数,涨跌额,涨跌幅,成交量(手),成交额(万元)
   * 
   * 注意：代理返回的数据可能是 JSON 格式，需要先提取 contents
   */
  static parseSinaFinance(data: any): CurrentPriceResult {
    try {
      let text = '';
      
      // 检查是否是代理返回的格式
      if (data && typeof data === 'object' && 'contents' in data) {
        text = typeof data.contents === 'string' ? data.contents : JSON.stringify(data.contents);
      } else if (typeof data === 'string') {
        text = data;
      } else {
        throw new Error('数据格式错误：不是字符串或代理格式');
      }
      
      console.log('[parseSinaFinance] 原始数据:', text);
      
      // 提取数据部分
      const match = text.match(/="([^"]+)"/);
      if (!match || !match[1]) {
        throw new Error('数据格式错误：无法匹配数据部分');
      }
      
      const dataArray = match[1].split(',');
      if (dataArray.length < 4) {
        throw new Error(`数据不完整：只有 ${dataArray.length} 个字段`);
      }
      
      const name = dataArray[0]; // 指数名称
      const price = parseFloat(dataArray[1]); // 当前点数
      const change = parseFloat(dataArray[2]); // 涨跌额
      const changePercent = parseFloat(dataArray[3]); // 涨跌幅
      
      console.log('[parseSinaFinance] 解析结果:', { name, price, change, changePercent });
      
      if (!price || !isFinite(price) || price <= 0) {
        throw new Error(`价格数据无效: ${price}`);
      }
      
      return {
        price: Math.round(price * 100) / 100,
        source: 'Sina Finance',
        timestamp: Date.now(),
        change24h: isFinite(change) ? Math.round(change * 100) / 100 : undefined,
        change24hPercent: isFinite(changePercent) ? Math.round(changePercent * 100) / 100 : undefined,
      };
    } catch (error: any) {
      console.error('[parseSinaFinance] 解析失败:', error.message);
      console.error('[parseSinaFinance] 原始数据:', data);
      throw new Error(`解析新浪财经数据失败: ${error.message}`);
    }
  }
}

// ==================== 当前价格服务 ====================

export class CurrentPriceService {
  /**
   * 获取加密货币当前价格
   */
  private static async getCryptoCurrentPrice(symbol: string): Promise<CurrentPriceResult> {
    const config = CRYPTO_CONFIG[symbol.toUpperCase()];
    if (!config) {
      throw new Error(`不支持的加密货币: ${symbol}`);
    }
    
    try {
      const data = await NetworkRequest.fetchCoinPaprika(config.coinpaprikaId);
      return DataParser.parseCoinPaprika(data);
    } catch (error: any) {
      // 降级到默认数据
      const fallbackPrice = FALLBACK_PRICES[symbol.toUpperCase()] || 100;
      return {
        price: fallbackPrice,
        source: 'Fallback (默认数据)',
        timestamp: Date.now(),
      };
    }
  }
  
  /**
   * 获取股票当前价格
   */
  private static async getStockCurrentPrice(symbol: string): Promise<CurrentPriceResult> {
    const config = STOCK_CONFIG[symbol.toUpperCase()];
    if (!config) {
      throw new Error(`不支持的股票: ${symbol}`);
    }
    
    try {
      const data = await NetworkRequest.fetchYahooFinance(config.symbol);
      return DataParser.parseYahooFinance(data);
    } catch (error: any) {
      // 降级到默认数据
      const fallbackPrice = FALLBACK_PRICES[symbol.toUpperCase()] || 100;
      return {
        price: fallbackPrice,
        source: 'Fallback (默认数据)',
        timestamp: Date.now(),
      };
    }
  }
  
  /**
   * 获取指数当前价格
   */
  private static async getIndexCurrentPrice(symbol: string): Promise<CurrentPriceResult> {
    const config = INDEX_CONFIG[symbol.toUpperCase()];
    if (!config) {
      throw new Error(`不支持的指数: ${symbol}`);
    }
    
    try {
      const data = await NetworkRequest.fetchYahooFinance(config.symbol);
      return DataParser.parseYahooFinance(data);
    } catch (error: any) {
      // 降级到默认数据
      const fallbackPrice = FALLBACK_PRICES[symbol.toUpperCase()] || 100;
      return {
        price: fallbackPrice,
        source: 'Fallback (默认数据)',
        timestamp: Date.now(),
      };
    }
  }
  
  /**
   * 获取国内指数当前价格
   * 对于上证指数，直接使用 Yahoo Finance API（通过代理）
   */
  private static async getDomesticCurrentPrice(symbol: string): Promise<CurrentPriceResult> {
    const config = DOMESTIC_CONFIG[symbol.toUpperCase()];
    if (!config) {
      throw new Error(`不支持的国内指数: ${symbol}`);
    }
    
    // 上证指数使用 Yahoo Finance API（先尝试直接请求，失败再用代理）
    if (symbol.toUpperCase() === 'SH000001') {
      try {
        console.log(`[CurrentPriceService] 使用 Yahoo Finance API 获取上证指数价格`);
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/000001.SS?interval=1d&range=1d`;
        console.log(`[CurrentPriceService] 请求 URL: ${url}`);
        
        let data: any;
        
        // 先尝试直接请求（浏览器直接访问可以，说明可能不需要代理）
        try {
          console.log(`[CurrentPriceService] 尝试直接请求 Yahoo Finance API`);
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          data = await response.json();
          console.log(`[CurrentPriceService] 直接请求成功，返回数据:`, data);
        } catch (directError: any) {
          console.warn(`[CurrentPriceService] 直接请求失败:`, directError.message);
          console.log(`[CurrentPriceService] 降级到代理请求`);
          // 如果直接请求失败（可能是 CORS），使用代理
          data = await NetworkRequest.fetchWithProxy(url);
          console.log(`[CurrentPriceService] 代理请求返回数据:`, data);
        }
        
        // 解析返回的数据结构（根据你提供的数据格式）
        const result = data?.chart?.result?.[0];
        if (!result || !result.meta) {
          throw new Error('数据格式错误，未找到 chart.result[0].meta');
        }
        
        const meta = result.meta;
        const price = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose || meta.previousClose;
        
        if (!price || price <= 0) {
          throw new Error(`价格数据无效: ${price}`);
        }
        
        // 计算涨跌幅
        const changePercent = previousClose && previousClose > 0
          ? ((price - previousClose) / previousClose) * 100
          : 0;
        
        return {
          price: Math.round(price * 100) / 100,
          source: 'Yahoo Finance',
          timestamp: Date.now(),
          change24hPercent: Math.round(changePercent * 100) / 100,
        };
      } catch (error: any) {
        console.error(`[CurrentPriceService] Yahoo Finance API 获取失败:`, error.message);
        console.error(`[CurrentPriceService] 错误堆栈:`, error.stack);
        // 降级到默认数据
        const fallbackPrice = FALLBACK_PRICES[symbol.toUpperCase()] || 100;
        return {
          price: fallbackPrice,
          source: 'Fallback (默认数据)',
          timestamp: Date.now(),
        };
      }
    }
    
    // 其他国内指数使用新浪财经 API（通过代理）
    try {
      console.log(`[CurrentPriceService] 获取国内指数价格: ${symbol}, sinaCode: ${config.sinaCode}`);
      const data = await NetworkRequest.fetchSinaFinance(config.sinaCode);
      console.log(`[CurrentPriceService] 新浪财经返回数据:`, data);
      return DataParser.parseSinaFinance(data);
    } catch (error: any) {
      console.error(`[CurrentPriceService] 获取国内指数价格失败:`, error.message);
      // 降级到默认数据
      const fallbackPrice = FALLBACK_PRICES[symbol.toUpperCase()] || 100;
      return {
        price: fallbackPrice,
        source: 'Fallback (默认数据)',
        timestamp: Date.now(),
      };
    }
  }
  
  /**
   * 获取当前价格（统一入口）
   * @param type 资产类型：'crypto' | 'stock' | 'index' | 'domestic'
   * @param symbol 资产代码：如 'BTC', 'AAPL', 'QQQ', 'SH000001'
   */
  static async getPrice(type: AssetType, symbol: string): Promise<CurrentPriceResult> {
    switch (type) {
      case 'crypto':
        return this.getCryptoCurrentPrice(symbol);
      case 'stock':
        return this.getStockCurrentPrice(symbol);
      case 'index':
        return this.getIndexCurrentPrice(symbol);
      case 'domestic':
        return this.getDomesticCurrentPrice(symbol);
      default:
        throw new Error(`不支持的资产类型: ${type}`);
    }
  }
  
  /**
   * 获取支持的资产列表
   */
  static getSupportedAssets(): {
    crypto: string[];
    stock: string[];
    index: string[];
    domestic: string[];
  } {
    return {
      crypto: Object.keys(CRYPTO_CONFIG),
      stock: Object.keys(STOCK_CONFIG),
      index: Object.keys(INDEX_CONFIG),
      domestic: Object.keys(DOMESTIC_CONFIG),
    };
  }
}
