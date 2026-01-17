/**
 * CachedPriceService - 带缓存的价格服务中间层
 * 
 * 这个类是对 CurrentPriceService 和 HistoricalPriceService 的包装，
 * 添加了缓存机制：
 * - 当前价格：缓存 12 小时
 * - 历史价格：永久缓存（只缓存过去 1年、3年、5年、10年的数据）
 * 
 * 使用方式：
 * const price = await CachedPriceService.getCurrentPrice('crypto', 'BTC');
 * const price = await CachedPriceService.getHistoricalPrice('crypto', 'BTC', new Date('2024-01-01'));
 */

import { CurrentPriceService, type CurrentPriceResult, type AssetType } from './CurrentPriceService';
import { HistoricalPriceService, type HistoricalPriceResult } from './HistoricalPriceService';
import CacheService from './CacheService';

/**
 * 检查是否在服务器端运行
 */
function isServerSide(): boolean {
  return typeof window === 'undefined';
}

export class CachedPriceService {
  /**
   * 验证当前价格是否有效
   * 只有真实有效的价格才应该被缓存
   */
  private static isValidCurrentPrice(result: CurrentPriceResult): boolean {
    // 检查价格是否有效
    if (!result || !result.price || result.price <= 0 || !isFinite(result.price)) {
      console.warn(`[CachedPriceService] ⚠️ 价格无效，不缓存: price=${result?.price}`);
      return false;
    }
    
    // 检查是否是降级数据（Fallback），降级数据不应该被缓存
    if (result.source && result.source.includes('Fallback')) {
      console.warn(`[CachedPriceService] ⚠️ 降级数据，不缓存: source=${result.source}`);
      return false;
    }
    
    return true;
  }

  /**
   * 获取当前价格（带缓存）
   * @param type 资产类型：'crypto' | 'stock' | 'index'
   * @param symbol 资产代码：如 'BTC', 'AAPL', 'QQQ'
   */
  static async getCurrentPrice(type: AssetType, symbol: string): Promise<CurrentPriceResult> {
    // 服务器端：直接调用底层服务，不使用缓存
    if (isServerSide()) {
      console.log(`[CachedPriceService] 服务器端环境，跳过缓存，直接获取当前价格: ${type}/${symbol}`);
      return await CurrentPriceService.getPrice(type, symbol);
    }
    
    // 客户端：使用缓存
    // 1. 先检查缓存
    const cached = CacheService.getCurrentPrice<CurrentPriceResult>(type, symbol);
    if (cached) {
      return cached;
    }
    
    // 2. 缓存未命中，调用底层服务
    console.log(`[CachedPriceService] 缓存未命中，调用底层服务获取当前价格: ${type}/${symbol}`);
    const result = await CurrentPriceService.getPrice(type, symbol);
    
    // 3. 验证价格有效性，只有真实有效的价格才保存到缓存
    if (this.isValidCurrentPrice(result)) {
      CacheService.setCurrentPrice(type, symbol, result);
      console.log(`[CachedPriceService] ✅ 价格有效，已保存到缓存: ${type}/${symbol}`);
    } else {
      console.log(`[CachedPriceService] ⚠️ 价格无效，未保存到缓存: ${type}/${symbol}`);
    }
    
    return result;
  }
  
  /**
   * 验证历史价格是否有效
   * 只有真实有效的价格才应该被缓存
   */
  private static isValidHistoricalPrice(result: HistoricalPriceResult): boolean {
    // 检查数据是否存在
    if (!result || !result.exists) {
      console.warn(`[CachedPriceService] ⚠️ 历史数据不存在，不缓存: exists=${result?.exists}`);
      return false;
    }
    
    // 检查价格是否有效
    if (!result.price || result.price <= 0 || !isFinite(result.price)) {
      console.warn(`[CachedPriceService] ⚠️ 历史价格无效，不缓存: price=${result?.price}`);
      return false;
    }
    
    // 检查是否是降级数据（Fallback），降级数据不应该被缓存
    if (result.source && result.source.includes('Fallback')) {
      console.warn(`[CachedPriceService] ⚠️ 降级数据，不缓存: source=${result.source}`);
      return false;
    }
    
    return true;
  }

  /**
   * 获取历史价格（带缓存）
   * @param type 资产类型：'crypto' | 'stock' | 'index'
   * @param symbol 资产代码：如 'BTC', 'AAPL', 'QQQ'
   * @param date 日期对象
   */
  static async getHistoricalPrice(type: AssetType, symbol: string, date: Date): Promise<HistoricalPriceResult> {
    // 服务器端：直接调用底层服务，不使用缓存
    if (isServerSide()) {
      console.log(`[CachedPriceService] 服务器端环境，跳过缓存，直接获取历史价格: ${type}/${symbol}/${date.toISOString().split('T')[0]}`);
      return await HistoricalPriceService.getPrice(type, symbol, date);
    }
    
    // 客户端：使用缓存
    // 1. 检查日期是否在允许范围内（1年、3年、5年、10年）
    if (!CacheService.isDateInAllowedRange(date)) {
      console.warn(`[CachedPriceService] 日期不在允许范围内: ${date.toISOString().split('T')[0]}`);
      // 仍然调用底层服务，但不会缓存结果
      return await HistoricalPriceService.getPrice(type, symbol, date);
    }
    
    // 2. 先检查缓存
    const cached = CacheService.getHistoricalPrice<HistoricalPriceResult>(type, symbol, date);
    if (cached) {
      return cached;
    }
    
    // 3. 缓存未命中，调用底层服务
    console.log(`[CachedPriceService] 缓存未命中，调用底层服务获取历史价格: ${type}/${symbol}/${date.toISOString().split('T')[0]}`);
    const result = await HistoricalPriceService.getPrice(type, symbol, date);
    
    // 4. 验证价格有效性，只有真实有效的价格才保存到缓存
    if (this.isValidHistoricalPrice(result)) {
      CacheService.setHistoricalPrice(type, symbol, date, result);
      console.log(`[CachedPriceService] ✅ 历史价格有效，已保存到缓存: ${type}/${symbol}/${date.toISOString().split('T')[0]}`);
    } else {
      console.log(`[CachedPriceService] ⚠️ 历史价格无效，未保存到缓存: ${type}/${symbol}/${date.toISOString().split('T')[0]}`);
    }
    
    return result;
  }
  
  /**
   * 获取支持的资产列表（直接转发）
   */
  static getSupportedAssets(): {
    crypto: string[];
    stock: string[];
    index: string[];
    domestic: string[];
  } {
    return CurrentPriceService.getSupportedAssets();
  }
  
  /**
   * 清理过期缓存（仅客户端）
   */
  static cleanupCache(): void {
    if (isServerSide()) {
      console.log(`[CachedPriceService] 服务器端环境，跳过缓存清理`);
      return;
    }
    CacheService.cleanupOldCache();
  }
  
  /**
   * 按类型清除缓存（调试用，仅客户端）
   * @param types 要清除的资产类型数组，如 ['crypto'], ['index', 'domestic'], ['stock']
   * @returns 清除的缓存数量
   */
  static clearCacheByTypes(types: AssetType[]): number {
    if (isServerSide()) {
      console.log(`[CachedPriceService] 服务器端环境，跳过缓存清除`);
      return 0;
    }
    return CacheService.clearCacheByTypes(types);
  }

  /**
   * 清除所有缓存（调试用，仅客户端）
   * @returns 清除的缓存数量
   */
  static clearAllCache(): number {
    if (isServerSide()) {
      console.log(`[CachedPriceService] 服务器端环境，跳过缓存清除`);
      return 0;
    }
    return CacheService.clearAllCache();
  }
  
  /**
   * 获取缓存统计信息（调试用，仅客户端）
   */
  static getCacheStats(): { current: number; historical: number; total: number } {
    if (isServerSide()) {
      return { current: 0, historical: 0, total: 0 };
    }
    return CacheService.getCacheStats();
  }
}

// 导出类型
export type { CurrentPriceResult, HistoricalPriceResult, AssetType } from './CurrentPriceService';
export type { HistoricalPriceResult as HistoricalPriceResultType } from './HistoricalPriceService';
