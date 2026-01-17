"use client";

/**
 * Global Asset Service - 统一资产追踪服务
 * 采用策略模式（Strategy Design Pattern）实现模块化架构
 * 
 * 架构：
 * - AssetProvider (抽象基类)
 * - CryptoProvider (加密货币)
 * - StockProvider (股票)
 * - IndexProvider (指数)
 * - GlobalAssetService (门面类)
 */

// ==================== 类型定义 ====================

export type AssetType = 'crypto' | 'stock' | 'index';

export interface PriceResult {
  symbol: string;
  price: number;
  source: string;
  timestamp: number;
  change24h?: number;
  change24hPercent?: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: AssetType;
  exchange?: string;
}

export interface HistoricalPriceResult {
  symbol: string;
  date: string;
  price: number;
  source: string;
}

// ==================== 抽象基类 ====================

abstract class AssetProvider {
  abstract getPrice(symbol: string): Promise<PriceResult | null>;
  abstract search(query: string): Promise<SearchResult[]>;
  abstract getHistorical(symbol: string, date: Date): Promise<HistoricalPriceResult | null>;
  
  protected async fetchJson(url: string, timeout: number = 8000): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// ==================== 加密货币提供者 ====================

class CryptoProvider extends AssetProvider {
  private readonly COINPAPRIKA_IDS: Record<string, string> = {
    BTC: 'btc-bitcoin',
    ETH: 'eth-ethereum',
    BNB: 'bnb-binance-coin',
    OKB: 'okb-okb',
    SOL: 'sol-solana',
  };

  async getPrice(symbol: string): Promise<PriceResult | null> {
    const coinpaprikaId = this.COINPAPRIKA_IDS[symbol.toUpperCase()];
    if (!coinpaprikaId) {
      return null;
    }

    try {
      const response = await fetch(`/api/price?type=crypto&action=price&symbol=${symbol}`);
      if (!response.ok) return null;

      const data = await response.json();
      if (data.error || !data.price) return null;

      return {
        symbol: symbol.toUpperCase(),
        price: data.price,
        source: data.source || 'CoinPaprika',
        timestamp: data.timestamp || Date.now(),
        change24h: data.change24h,
        change24hPercent: data.change24hPercent,
      };
    } catch {
      return null;
    }
  }

  async search(query: string): Promise<SearchResult[]> {
    try {
      const response = await fetch(`/api/price?type=crypto&action=search&query=${encodeURIComponent(query)}`);
      if (!response.ok) return [];

      const data = await response.json();
      if (data.error || !Array.isArray(data.results)) return [];

      return data.results.map((item: any) => ({
        symbol: item.symbol || item.id?.toUpperCase(),
        name: item.name,
        type: 'crypto' as AssetType,
      }));
    } catch {
      return [];
    }
  }

  async getHistorical(symbol: string, date: Date): Promise<HistoricalPriceResult | null> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(`/api/price?type=crypto&action=historical&symbol=${symbol}&date=${dateStr}`);
      if (!response.ok) return null;

      const data = await response.json();
      if (data.error || !data.price) return null;

      return {
        symbol: symbol.toUpperCase(),
        date: data.date || dateStr,
        price: data.price,
        source: data.source || 'CoinGecko',
      };
    } catch {
      return null;
    }
  }
}

// ==================== 股票提供者 ====================

class StockProvider extends AssetProvider {
  private readonly MAGNIFICENT_7 = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'];

  async getPrice(symbol: string): Promise<PriceResult | null> {
    try {
      const response = await fetch(`/api/price?type=stock&action=price&symbol=${symbol.toUpperCase()}`);
      if (!response.ok) return null;

      const data = await response.json();
      if (data.error || !data.price) return null;

      return {
        symbol: symbol.toUpperCase(),
        price: data.price,
        source: data.source || 'Yahoo Finance',
        timestamp: data.timestamp || Date.now(),
        change24h: data.change24h,
        change24hPercent: data.change24hPercent,
      };
    } catch {
      return null;
    }
  }

  async search(query: string): Promise<SearchResult[]> {
    try {
      const response = await fetch(`/api/price?type=stock&action=search&query=${encodeURIComponent(query)}`);
      if (!response.ok) return [];

      const data = await response.json();
      if (data.error || !Array.isArray(data.results)) return [];

      return data.results.map((item: any) => ({
        symbol: item.symbol,
        name: item.name || item.longname,
        type: 'stock' as AssetType,
        exchange: item.exchange,
      }));
    } catch {
      return [];
    }
  }

  async getHistorical(symbol: string, date: Date): Promise<HistoricalPriceResult | null> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(`/api/price?type=stock&action=historical&symbol=${symbol}&date=${dateStr}`);
      if (!response.ok) return null;

      const data = await response.json();
      if (data.error || !data.price) return null;

      return {
        symbol: symbol.toUpperCase(),
        date: data.date || dateStr,
        price: data.price,
        source: data.source || 'Yahoo Finance',
      };
    } catch {
      return null;
    }
  }
}

// ==================== 指数提供者 ====================

class IndexProvider extends AssetProvider {
  private readonly INDICES: Record<string, { symbol: string; name: string }> = {
    'NDX': { symbol: '^NDX', name: 'Nasdaq 100' },
    'SPX': { symbol: '^GSPC', name: 'S&P 500' },
    'DJI': { symbol: '^DJI', name: 'Dow Jones Industrial Average' },
    'TNX': { symbol: '^TNX', name: '10-Year Treasury Yield' },
    'VIX': { symbol: '^VIX', name: 'VIX Volatility Index' },
  };

  async getPrice(symbol: string): Promise<PriceResult | null> {
    const index = this.INDICES[symbol.toUpperCase()];
    if (!index) return null;

    try {
      const response = await fetch(`/api/price?type=index&action=price&symbol=${index.symbol}`);
      if (!response.ok) return null;

      const data = await response.json();
      if (data.error || !data.price) return null;

      return {
        symbol: symbol.toUpperCase(),
        price: data.price,
        source: data.source || 'Yahoo Finance',
        timestamp: data.timestamp || Date.now(),
        change24h: data.change24h,
        change24hPercent: data.change24hPercent,
      };
    } catch {
      return null;
    }
  }

  async search(query: string): Promise<SearchResult[]> {
    // 指数不支持搜索，返回预定义列表
    return Object.entries(this.INDICES).map(([key, value]) => ({
      symbol: key,
      name: value.name,
      type: 'index' as AssetType,
    }));
  }

  async getHistorical(symbol: string, date: Date): Promise<HistoricalPriceResult | null> {
    const index = this.INDICES[symbol.toUpperCase()];
    if (!index) return null;

    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(`/api/price?type=index&action=historical&symbol=${index.symbol}&date=${dateStr}`);
      if (!response.ok) return null;

      const data = await response.json();
      if (data.error || !data.price) return null;

      return {
        symbol: symbol.toUpperCase(),
        date: data.date || dateStr,
        price: data.price,
        source: data.source || 'Yahoo Finance',
      };
    } catch {
      return null;
    }
  }

  getAvailableIndices(): SearchResult[] {
    return Object.entries(this.INDICES).map(([key, value]) => ({
      symbol: key,
      name: value.name,
      type: 'index' as AssetType,
    }));
  }
}

// ==================== 数字格式化工具 ====================

export function toPlainDecimalString(num: number | string): string {
  const s = String(num);
  if (!/[eE]/.test(s)) return s;

  const [coeffRaw, expRaw] = s.toLowerCase().split('e');
  const exp = parseInt(expRaw, 10);

  let coeff = coeffRaw;
  let sign = '';
  if (coeff.startsWith('-')) {
    sign = '-';
    coeff = coeff.slice(1);
  }

  const parts = coeff.split('.');
  const intPart = parts[0] || '0';
  const fracPart = parts[1] || '';
  const digits = (intPart + fracPart).replace(/^0+(?=\d)/, '') || '0';

  if (exp >= 0) {
    const zeros = exp - fracPart.length;
    if (zeros >= 0) return sign + digits + '0'.repeat(zeros);
    const idx = intPart.length + exp;
    return sign + digits.slice(0, idx) + '.' + digits.slice(idx);
  }

  const zeros = (-exp) - intPart.length;
  if (zeros >= 0) return sign + '0.' + '0'.repeat(zeros) + digits;
  const idx = intPart.length + exp;
  return sign + digits.slice(0, idx) + '.' + digits.slice(idx);
}

export function evaluateMathExpression(raw: string | null | undefined): number {
  if (!raw) return NaN;
  
  const s = String(raw)
    .replace(/,/g, '')
    .replace(/＋/g, '+')
    .replace(/－/g, '-')
    .replace(/×/g, '*')
    .replace(/÷/g, '/');
  
  if (!s.trim()) return NaN;
  if (/[^0-9+\-*/().\s]/.test(s)) return NaN;

  try {
    // 简单的安全评估（仅支持基本运算）
    const result = Function(`"use strict"; return (${s})`)();
    return typeof result === 'number' && isFinite(result) ? result : NaN;
  } catch {
    return NaN;
  }
}

// ==================== 缓存机制 ====================

const CACHE_TTL = 60 * 1000; // 60秒缓存
const priceCache = new Map<string, { ts: number; data: PriceResult }>();

function readCache<T>(key: string): T | null {
  const cached = priceCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.ts > CACHE_TTL) {
    priceCache.delete(key);
    return null;
  }
  return cached.data as T;
}

function writeCache(key: string, data: PriceResult): void {
  priceCache.set(key, { ts: Date.now(), data });
}

// ==================== 全局资产服务（门面类） ====================

export class GlobalAssetService {
  private cryptoProvider: CryptoProvider;
  private stockProvider: StockProvider;
  private indexProvider: IndexProvider;

  constructor() {
    this.cryptoProvider = new CryptoProvider();
    this.stockProvider = new StockProvider();
    this.indexProvider = new IndexProvider();
  }

  /**
   * 获取价格
   */
  async getPrice(symbol: string, type: AssetType): Promise<PriceResult | null> {
    const cacheKey = `${type}:${symbol.toUpperCase()}`;
    const cached = readCache<PriceResult>(cacheKey);
    if (cached) return cached;

    let result: PriceResult | null = null;

    switch (type) {
      case 'crypto':
        result = await this.cryptoProvider.getPrice(symbol);
        break;
      case 'stock':
        result = await this.stockProvider.getPrice(symbol);
        break;
      case 'index':
        result = await this.indexProvider.getPrice(symbol);
        break;
    }

    if (result) {
      writeCache(cacheKey, result);
    }

    return result;
  }

  /**
   * 搜索资产
   */
  async searchAssets(query: string, type: AssetType): Promise<SearchResult[]> {
    switch (type) {
      case 'crypto':
        return await this.cryptoProvider.search(query);
      case 'stock':
        return await this.stockProvider.search(query);
      case 'index':
        return this.indexProvider.getAvailableIndices();
      default:
        return [];
    }
  }

  /**
   * 获取历史价格
   */
  async getHistorical(symbol: string, type: AssetType, date: Date): Promise<HistoricalPriceResult | null> {
    switch (type) {
      case 'crypto':
        return await this.cryptoProvider.getHistorical(symbol, date);
      case 'stock':
        return await this.stockProvider.getHistorical(symbol, date);
      case 'index':
        return await this.indexProvider.getHistorical(symbol, date);
      default:
        return null;
    }
  }

  /**
   * 批量获取价格
   */
  async getBatchPrices(symbols: string[], type: AssetType): Promise<Map<string, PriceResult>> {
    const results = new Map<string, PriceResult>();
    const promises = symbols.map(async (symbol) => {
      const price = await this.getPrice(symbol, type);
      if (price) {
        results.set(symbol.toUpperCase(), price);
      }
    });
    
    await Promise.all(promises);
    return results;
  }
}

// 导出单例（延迟初始化，确保只在客户端使用）
// 使用函数而不是类，避免在模块加载时执行
function createAssetService() {
  let _instance: GlobalAssetService | null = null;

  const getInstance = (): GlobalAssetService => {
    if (typeof window === 'undefined') {
      // 服务器端返回一个模拟对象，避免错误
      return {
        getPrice: async () => null,
        searchAssets: async () => [],
        getHistorical: async () => null,
        getBatchPrices: async () => new Map(),
      } as any;
    }
    
    if (!_instance) {
      _instance = new GlobalAssetService();
    }
    
    return _instance;
  };

  return {
    getPrice: async (symbol: string, type: AssetType): Promise<PriceResult | null> => {
      return getInstance().getPrice(symbol, type);
    },
    searchAssets: async (query: string, type: AssetType): Promise<SearchResult[]> => {
      return getInstance().searchAssets(query, type);
    },
    getHistorical: async (symbol: string, type: AssetType, date: Date): Promise<HistoricalPriceResult | null> => {
      return getInstance().getHistorical(symbol, type, date);
    },
    getBatchPrices: async (symbols: string[], type: AssetType): Promise<Map<string, PriceResult>> => {
      return getInstance().getBatchPrices(symbols, type);
    },
  };
}

export const assetService = createAssetService();

