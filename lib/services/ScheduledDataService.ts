/**
 * ScheduledDataService - 定时数据获取服务
 * 
 * 用于在服务器端定时获取和缓存数据
 * - 股票数据：凌晨3:00开始，间隔5秒
 * - 指数数据：凌晨3:30开始，间隔5秒
 * - 加密数据：凌晨4:00开始，间隔5秒
 * - 国内指数数据：凌晨4:30开始，间隔5秒
 * 
 * 每个定时器获取过去3个月、6个月、1年、3年、5年的历史数据
 * 自动处理周末，调整到周五
 */

import { CachedPriceService, type AssetType } from './CachedPriceService';
import { HistoricalPriceService } from './HistoricalPriceService';
import { CurrentPriceService } from './CurrentPriceService';
import type { AssetYieldData } from '@/lib/mock/god-mode-data';

// ==================== 配置 ====================

// 时间框架配置
const TIMEFRAMES = [
  { key: 'm3', label: '3个月前', months: 3 },
  { key: 'm6', label: '6个月前', months: 6 },
  { key: 'y1', label: '1年前', months: 12 },
  { key: 'y3', label: '3年前', months: 36 },
  { key: 'y5', label: '5年前', months: 60 },
];

// 股票配置（美股七巨头）
const STOCK_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
];

// 指数配置
const INDEX_SYMBOLS = [
  { symbol: 'VOO', name: '标普500', assetType: 'index' as AssetType },
  { symbol: 'QQQ', name: '纳斯达克100', assetType: 'index' as AssetType },
  { symbol: 'DIA', name: '道琼斯', assetType: 'index' as AssetType },
  { symbol: 'VGT', name: '信息技术板块', assetType: 'index' as AssetType },
];

// 加密配置
const CRYPTO_SYMBOLS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'BNB', name: 'Binance Coin' },
  { symbol: 'SOL', name: 'Solana' },
];

// 国内指数配置
const DOMESTIC_SYMBOLS = [
  { symbol: 'SH000001', name: '上证指数', assetType: 'domestic' as AssetType },
];

// 请求间隔（毫秒）
const REQUEST_INTERVAL = 5000; // 5秒

// ==================== 日期工具 ====================

class DateUtils {
  /**
   * 如果是周末，向前找到最近的周五
   */
  static adjustToLastFriday(date: Date): Date {
    const adjusted = new Date(date);
    const dayOfWeek = adjusted.getUTCDay();
    
    if (dayOfWeek === 0) {
      adjusted.setUTCDate(adjusted.getUTCDate() - 2);
    } else if (dayOfWeek === 6) {
      adjusted.setUTCDate(adjusted.getUTCDate() - 1);
    }
    
    return adjusted;
  }
  
  /**
   * 计算目标日期（从今天往前推指定月数）
   */
  static getTargetDate(monthsAgo: number): Date {
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setMonth(targetDate.getMonth() - monthsAgo);
    targetDate.setHours(0, 0, 0, 0);
    return targetDate;
  }
  
  /**
   * 将 Date 对象转换为 YYYY-MM-DD 字符串
   */
  static toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

// ==================== 数据获取工具 ====================

class DataFetcher {
  /**
   * 等待指定时间（毫秒）
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 获取单个资产的所有历史价格数据
   */
  static async fetchAssetHistoricalData(
    type: AssetType,
    symbol: string,
    name: string
  ): Promise<AssetYieldData | null> {
    try {
      console.log(`[DataFetcher] 开始获取 ${name} (${symbol}) 的数据...`);
      
      // 1. 获取当前价格
      const currentResult = await CachedPriceService.getCurrentPrice(type, symbol);
      if (!currentResult || !currentResult.price || currentResult.price <= 0) {
        console.error(`[DataFetcher] ❌ ${symbol} 当前价格无效`);
        return null;
      }
      
      const currentPrice = currentResult.price;
      console.log(`[DataFetcher] ✅ ${symbol} 当前价格: $${currentPrice.toFixed(2)}`);
      
      // 等待5秒（数据返回后）
      await this.sleep(REQUEST_INTERVAL);
      
      // 2. 获取每个时间段的历史价格
      const changes: Record<string, number> = {
        m3: 0,
        m6: 0,
        y1: 0,
        y3: 0,
        y5: 0,
      };
      
      for (const timeframe of TIMEFRAMES) {
        const targetDate = DateUtils.getTargetDate(timeframe.months);
        const adjustedDate = DateUtils.adjustToLastFriday(targetDate);
        
        console.log(`[DataFetcher] 获取 ${symbol} ${timeframe.label} (${DateUtils.toDateString(adjustedDate)}) 的历史价格...`);
        
        try {
          const historicalResult = await CachedPriceService.getHistoricalPrice(type, symbol, targetDate);
          
          if (historicalResult && historicalResult.exists && historicalResult.price > 0 && currentPrice > 0) {
            const historicalPrice = historicalResult.price;
            const yieldPercent = ((currentPrice - historicalPrice) / historicalPrice) * 100;
            changes[timeframe.key] = Math.round(yieldPercent * 100) / 100;
            
            console.log(`[DataFetcher] ✅ ${symbol} ${timeframe.label}: $${historicalPrice.toFixed(2)} → $${currentPrice.toFixed(2)} = ${yieldPercent >= 0 ? '+' : ''}${yieldPercent.toFixed(2)}%`);
          } else {
            console.warn(`[DataFetcher] ⚠️ ${symbol} ${timeframe.label}: 无法获取有效历史价格`);
          }
        } catch (error: any) {
          console.error(`[DataFetcher] ❌ ${symbol} ${timeframe.label} 获取失败:`, error.message);
        }
        
        // 等待5秒（数据返回后，除了最后一个请求）
        if (timeframe.key !== TIMEFRAMES[TIMEFRAMES.length - 1].key) {
          await this.sleep(REQUEST_INTERVAL);
        }
      }
      
      return {
        symbol,
        name,
        price: currentPrice,
        changes,
      };
    } catch (error: any) {
      console.error(`[DataFetcher] ❌ ${symbol} 获取数据失败:`, error.message);
      return null;
    }
  }
  
  /**
   * 批量获取资产数据（顺序执行，间隔5秒）
   */
  static async fetchBatchData(
    type: AssetType,
    symbols: Array<{ symbol: string; name: string; assetType?: AssetType }>
  ): Promise<AssetYieldData[]> {
    const results: AssetYieldData[] = [];
    
    for (const item of symbols) {
      const assetType = item.assetType || type;
      const result = await this.fetchAssetHistoricalData(assetType, item.symbol, item.name);
      
      if (result) {
        results.push(result);
      }
      
      // 等待5秒（数据返回后，除了最后一个）
      if (item !== symbols[symbols.length - 1]) {
        await this.sleep(REQUEST_INTERVAL);
      }
    }
    
    return results;
  }
}

// ==================== 缓存管理 ====================

class CacheManager {
  // localStorage 键名
  private static readonly CACHE_KEYS = {
    stock: 'stock_yields_cached_data',
    index: 'index_yields_cached_data',
    crypto: 'crypto_yields_cached_data',
    domestic: 'domestic_yields_cached_data',
  };
  
  private static readonly LAST_UPDATE_KEYS = {
    stock: 'stock_yields_last_update',
    index: 'index_yields_last_update',
    crypto: 'crypto_yields_last_update',
    domestic: 'domestic_yields_last_update',
  };
  
  /**
   * 保存数据到缓存
   * 服务器端：数据会通过 API 写入到客户端 localStorage（通过 API 路由）
   * 客户端：直接写入 localStorage
   */
  static async saveData(type: 'stock' | 'index' | 'crypto' | 'domestic', data: AssetYieldData[]): Promise<void> {
    const cacheKey = this.CACHE_KEYS[type];
    const updateKey = this.LAST_UPDATE_KEYS[type];
    
    // 检查是否在服务器端
    if (typeof window === 'undefined') {
      // 服务器端：通过 API 路由保存到客户端缓存
      // 注意：这需要客户端页面来调用 API，或者使用其他持久化方案
      console.log(`[CacheManager] 服务器端：数据已获取，需要通过 API 保存到客户端缓存`);
      console.log(`[CacheManager] 数据预览: ${data.length} 条记录`);
      
      // TODO: 可以在这里实现服务器端持久化（文件系统、数据库等）
      // 目前数据会通过定时任务获取，客户端页面会从缓存读取
    } else {
      // 客户端：使用 localStorage
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(updateKey, Date.now().toString());
        console.log(`[CacheManager] ✅ 已保存 ${type} 数据到缓存: ${data.length} 条`);
      } catch (error) {
        console.error(`[CacheManager] ❌ 保存 ${type} 数据失败:`, error);
      }
    }
  }
  
  /**
   * 从缓存加载数据
   */
  static loadData(type: 'stock' | 'index' | 'crypto' | 'domestic'): AssetYieldData[] | null {
    const cacheKey = this.CACHE_KEYS[type];
    
    if (typeof window === 'undefined') {
      // 服务器端：从持久化存储加载（TODO: 实现）
      return null;
    } else {
      // 客户端：从 localStorage 加载
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          if (Array.isArray(data) && data.length > 0) {
            console.log(`[CacheManager] ✅ 从缓存加载 ${type} 数据: ${data.length} 条`);
            return data;
          }
        }
      } catch (error) {
        console.error(`[CacheManager] ❌ 加载 ${type} 数据失败:`, error);
      }
      return null;
    }
  }
}

// ==================== 定时器服务 ====================

export class ScheduledDataService {
  private static timers: Map<string, NodeJS.Timeout> = new Map();
  private static isRunning: Map<string, boolean> = new Map();
  
  /**
   * 启动股票数据定时器（凌晨3:00）
   */
  static startStockTimer(): void {
    this.scheduleTask('stock', 3, 0, async () => {
      console.log('[ScheduledDataService] 🕐 开始执行股票数据获取任务...');
      const data = await DataFetcher.fetchBatchData('stock', STOCK_SYMBOLS);
      await CacheManager.saveData('stock', data);
      console.log('[ScheduledDataService] ✅ 股票数据获取完成');
    });
  }
  
  /**
   * 启动指数数据定时器（凌晨3:30）
   */
  static startIndexTimer(): void {
    this.scheduleTask('index', 3, 30, async () => {
      console.log('[ScheduledDataService] 🕐 开始执行指数数据获取任务...');
      const data = await DataFetcher.fetchBatchData('index', INDEX_SYMBOLS);
      await CacheManager.saveData('index', data);
      console.log('[ScheduledDataService] ✅ 指数数据获取完成');
    });
  }
  
  /**
   * 启动加密数据定时器（凌晨4:00）
   */
  static startCryptoTimer(): void {
    this.scheduleTask('crypto', 4, 0, async () => {
      console.log('[ScheduledDataService] 🕐 开始执行加密数据获取任务...');
      const data = await DataFetcher.fetchBatchData('crypto', CRYPTO_SYMBOLS);
      await CacheManager.saveData('crypto', data);
      console.log('[ScheduledDataService] ✅ 加密数据获取完成');
    });
  }
  
  /**
   * 启动国内指数数据定时器（凌晨4:30）
   */
  static startDomesticTimer(): void {
    this.scheduleTask('domestic', 4, 30, async () => {
      console.log('[ScheduledDataService] 🕐 开始执行国内指数数据获取任务...');
      const data = await DataFetcher.fetchBatchData('domestic', DOMESTIC_SYMBOLS);
      await CacheManager.saveData('domestic', data);
      console.log('[ScheduledDataService] ✅ 国内指数数据获取完成');
    });
  }
  
  /**
   * 启动所有定时器
   */
  static startAllTimers(): void {
    console.log('[ScheduledDataService] 🚀 启动所有定时器...');
    this.startStockTimer();
    this.startIndexTimer();
    this.startCryptoTimer();
    this.startDomesticTimer();
    console.log('[ScheduledDataService] ✅ 所有定时器已启动');
  }
  
  /**
   * 停止所有定时器
   */
  static stopAllTimers(): void {
    console.log('[ScheduledDataService] 🛑 停止所有定时器...');
    this.timers.forEach((timer, key) => {
      clearInterval(timer);
      console.log(`[ScheduledDataService] 已停止定时器: ${key}`);
    });
    this.timers.clear();
    this.isRunning.clear();
  }
  
  /**
   * 调度任务（每天在指定时间执行）
   */
  private static scheduleTask(
    name: string,
    hour: number,
    minute: number,
    task: () => Promise<void>
  ): void {
    const runTask = async () => {
      // 检查是否正在运行
      if (this.isRunning.get(name)) {
        console.log(`[ScheduledDataService] ⚠️ ${name} 任务正在运行，跳过本次执行`);
        return;
      }
      
      this.isRunning.set(name, true);
      
      try {
        await task();
      } catch (error: any) {
        console.error(`[ScheduledDataService] ❌ ${name} 任务执行失败:`, error.message);
      } finally {
        this.isRunning.set(name, false);
      }
    };
    
    // 立即检查是否需要执行（如果当前时间在指定时间范围内）
    const checkAndRun = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // 如果在执行时间范围内（3:00-5:00），检查是否需要立即执行
      if (currentHour >= 3 && currentHour < 5) {
        // 检查是否到了指定时间或已过指定时间
        if (currentHour === hour && currentMinute >= minute) {
          console.log(`[ScheduledDataService] 🕐 当前时间 ${currentHour}:${currentMinute.toString().padStart(2, '0')}，立即执行 ${name} 任务`);
          runTask();
        } else if (currentHour > hour) {
          console.log(`[ScheduledDataService] 🕐 当前时间 ${currentHour}:${currentMinute.toString().padStart(2, '0')}，已过 ${hour}:${minute.toString().padStart(2, '0')}，立即执行 ${name} 任务`);
          runTask();
        }
      }
    };
    
    // 立即检查一次
    checkAndRun();
    
    // 设置定时器，每分钟检查一次
    const timer = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // 如果到了指定时间，执行任务
      if (currentHour === hour && currentMinute === minute) {
        console.log(`[ScheduledDataService] 🕐 定时触发 ${name} 任务 (${hour}:${minute.toString().padStart(2, '0')})`);
        runTask();
      }
    }, 60000); // 每分钟检查一次
    
    this.timers.set(name, timer);
    console.log(`[ScheduledDataService] ✅ 已启动定时器: ${name} (每天 ${hour}:${minute.toString().padStart(2, '0')})`);
  }
  
  /**
   * 手动触发任务（用于测试）
   */
  static async triggerTask(name: 'stock' | 'index' | 'crypto' | 'domestic'): Promise<void> {
    console.log(`[ScheduledDataService] 🔧 手动触发任务: ${name}`);
    
    switch (name) {
      case 'stock':
        const stockData = await DataFetcher.fetchBatchData('stock', STOCK_SYMBOLS);
        await CacheManager.saveData('stock', stockData);
        break;
      case 'index':
        const indexData = await DataFetcher.fetchBatchData('index', INDEX_SYMBOLS);
        await CacheManager.saveData('index', indexData);
        break;
      case 'crypto':
        const cryptoData = await DataFetcher.fetchBatchData('crypto', CRYPTO_SYMBOLS);
        await CacheManager.saveData('crypto', cryptoData);
        break;
      case 'domestic':
        const domesticData = await DataFetcher.fetchBatchData('domestic', DOMESTIC_SYMBOLS);
        await CacheManager.saveData('domestic', domesticData);
        break;
    }
  }
}
