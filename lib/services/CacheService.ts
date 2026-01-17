/**
 * CacheService - 缓存服务
 * 
 * 负责管理价格数据的缓存，使用 localStorage 存储
 * - 当前价格：缓存 12 小时
 * - 历史价格：永久缓存（因为历史数据不会变化）
 * 
 * 注意：此服务仅在客户端（浏览器）环境中使用
 * 服务器端会自动跳过缓存，直接调用底层服务
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry?: number; // 过期时间戳（可选，历史数据不需要）
}

interface HistoricalDateRange {
  years: number; // 1, 3, 5, 10
}

/**
 * 检查是否在客户端环境
 */
function isClientSide(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

class CacheService {
  private static readonly CURRENT_PRICE_TTL = 12 * 60 * 60 * 1000; // 12 小时
  private static readonly CACHE_PREFIX_CURRENT = 'price_current_';
  private static readonly CACHE_PREFIX_HISTORICAL = 'price_historical_';
  
  /**
   * 获取当前价格缓存键
   */
  private static getCurrentPriceKey(type: string, symbol: string): string {
    return `${this.CACHE_PREFIX_CURRENT}${type}_${symbol.toUpperCase()}`;
  }
  
  /**
   * 获取历史价格缓存键
   */
  private static getHistoricalPriceKey(type: string, symbol: string, date: string): string {
    return `${this.CACHE_PREFIX_HISTORICAL}${type}_${symbol.toUpperCase()}_${date}`;
  }
  
  /**
   * 检查日期是否在允许的历史范围内（1年、3年、5年、10年）
   */
  static isDateInAllowedRange(date: Date): boolean {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
    const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
    const tenYearsAgo = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
    
    // 检查是否在过去 10 年内
    if (date < tenYearsAgo) {
      return false;
    }
    
    // 检查是否在 1年、3年、5年、10年的边界上（允许一定的容差）
    const dateTime = date.getTime();
    const ranges = [
      { start: oneYearAgo.getTime(), end: now.getTime() },
      { start: threeYearsAgo.getTime(), end: now.getTime() },
      { start: fiveYearsAgo.getTime(), end: now.getTime() },
      { start: tenYearsAgo.getTime(), end: now.getTime() },
    ];
    
    // 如果日期在任何范围内，返回 true
    return ranges.some(range => dateTime >= range.start && dateTime <= range.end);
  }
  
  /**
   * 获取当前价格缓存
   */
  static getCurrentPrice<T>(type: string, symbol: string): T | null {
    if (!isClientSide()) {
      return null; // 服务器端直接返回 null
    }
    
    try {
      const key = this.getCurrentPriceKey(type, symbol);
      const cached = localStorage.getItem(key);
      
      if (!cached) {
        return null;
      }
      
      const entry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();
      
      // 检查是否过期
      if (entry.expiry && now > entry.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      
      // 检查是否超过 12 小时
      if (now - entry.timestamp > this.CURRENT_PRICE_TTL) {
        localStorage.removeItem(key);
        return null;
      }
      
      console.log(`[CacheService] ✅ 命中当前价格缓存: ${type}/${symbol} (缓存时间: ${new Date(entry.timestamp).toLocaleString()})`);
      return entry.data;
    } catch (error) {
      console.error(`[CacheService] 读取缓存失败:`, error);
      return null;
    }
  }
  
  /**
   * 设置当前价格缓存
   */
  static setCurrentPrice<T>(type: string, symbol: string, data: T): void {
    if (!isClientSide()) {
      return; // 服务器端直接返回，不缓存
    }
    
    try {
      const key = this.getCurrentPriceKey(type, symbol);
      const now = Date.now();
      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        expiry: now + this.CURRENT_PRICE_TTL,
      };
      
      localStorage.setItem(key, JSON.stringify(entry));
      console.log(`[CacheService] 💾 保存当前价格缓存: ${type}/${symbol}`);
    } catch (error) {
      console.error(`[CacheService] 保存缓存失败:`, error);
      // localStorage 可能已满，尝试清理旧缓存
      this.cleanupOldCache();
    }
  }
  
  /**
   * 获取历史价格缓存
   */
  static getHistoricalPrice<T>(type: string, symbol: string, date: Date): T | null {
    if (!isClientSide()) {
      return null; // 服务器端直接返回 null
    }
    
    try {
      // 检查日期是否在允许范围内
      if (!this.isDateInAllowedRange(date)) {
        console.log(`[CacheService] ⚠️ 日期不在允许范围内: ${date.toISOString().split('T')[0]}`);
        return null;
      }
      
      const dateStr = date.toISOString().split('T')[0];
      const key = this.getHistoricalPriceKey(type, symbol, dateStr);
      const cached = localStorage.getItem(key);
      
      if (!cached) {
        return null;
      }
      
      const entry: CacheEntry<T> = JSON.parse(cached);
      console.log(`[CacheService] ✅ 命中历史价格缓存: ${type}/${symbol}/${dateStr}`);
      return entry.data;
    } catch (error) {
      console.error(`[CacheService] 读取历史缓存失败:`, error);
      return null;
    }
  }
  
  /**
   * 设置历史价格缓存（永久缓存）
   */
  static setHistoricalPrice<T>(type: string, symbol: string, date: Date, data: T): void {
    if (!isClientSide()) {
      return; // 服务器端直接返回，不缓存
    }
    
    try {
      // 检查日期是否在允许范围内
      if (!this.isDateInAllowedRange(date)) {
        console.log(`[CacheService] ⚠️ 日期不在允许范围内，不缓存: ${date.toISOString().split('T')[0]}`);
        return;
      }
      
      const dateStr = date.toISOString().split('T')[0];
      const key = this.getHistoricalPriceKey(type, symbol, dateStr);
      const now = Date.now();
      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        // 历史数据不设置过期时间，永久缓存
      };
      
      localStorage.setItem(key, JSON.stringify(entry));
      console.log(`[CacheService] 💾 保存历史价格缓存: ${type}/${symbol}/${dateStr}`);
    } catch (error) {
      console.error(`[CacheService] 保存历史缓存失败:`, error);
      // localStorage 可能已满，尝试清理旧缓存
      this.cleanupOldCache();
    }
  }
  
  /**
   * 清理过期的当前价格缓存
   */
  static cleanupOldCache(): void {
    if (!isClientSide()) {
      return; // 服务器端直接返回
    }
    
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];
      
      // 遍历所有 localStorage 键
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        // 只处理当前价格缓存
        if (key.startsWith(this.CACHE_PREFIX_CURRENT)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const entry: CacheEntry<any> = JSON.parse(cached);
              // 如果过期或超过 12 小时，标记删除
              if (entry.expiry && now > entry.expiry) {
                keysToRemove.push(key);
              } else if (now - entry.timestamp > this.CURRENT_PRICE_TTL) {
                keysToRemove.push(key);
              }
            }
          } catch (e) {
            // 解析失败，也删除
            keysToRemove.push(key);
          }
        }
      }
      
      // 删除过期的缓存
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`[CacheService] 🗑️ 清理过期缓存: ${key}`);
      });
      
      if (keysToRemove.length > 0) {
        console.log(`[CacheService] ✅ 清理了 ${keysToRemove.length} 个过期缓存`);
      }
    } catch (error) {
      console.error(`[CacheService] 清理缓存失败:`, error);
    }
  }
  
  /**
   * 按类型清除缓存（调试用）
   * @param types 要清除的资产类型数组，如 ['crypto'], ['index', 'domestic'], ['stock']
   * @returns 清除的缓存数量
   */
  static clearCacheByTypes(types: string[]): number {
    if (!isClientSide()) {
      console.log(`[CacheService] 服务器端环境，跳过缓存清除`);
      return 0; // 服务器端直接返回 0
    }
    
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        // 检查是否是价格缓存
        if (key.startsWith(this.CACHE_PREFIX_CURRENT) || key.startsWith(this.CACHE_PREFIX_HISTORICAL)) {
          // 提取类型：price_current_{type}_{symbol} 或 price_historical_{type}_{symbol}_{date}
          const parts = key.split('_');
          if (parts.length >= 3) {
            const type = parts[2]; // 获取类型部分
            if (types.includes(type)) {
              keysToRemove.push(key);
            }
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`[CacheService] 🗑️ 清除了 ${keysToRemove.length} 个缓存 (类型: ${types.join(', ')})`);
      return keysToRemove.length;
    } catch (error) {
      console.error(`[CacheService] 清除缓存失败:`, error);
      return 0;
    }
  }

  /**
   * 清除所有缓存（调试用）
   * @returns 清除的缓存数量
   */
  static clearAllCache(): number {
    if (!isClientSide()) {
      console.log(`[CacheService] 服务器端环境，跳过缓存清除`);
      return 0; // 服务器端直接返回 0
    }
    
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(this.CACHE_PREFIX_CURRENT) || key.startsWith(this.CACHE_PREFIX_HISTORICAL))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`[CacheService] 🗑️ 清除了 ${keysToRemove.length} 个缓存`);
      return keysToRemove.length;
    } catch (error) {
      console.error(`[CacheService] 清除缓存失败:`, error);
      return 0;
    }
  }
  
  /**
   * 获取缓存统计信息（调试用）
   */
  static getCacheStats(): { current: number; historical: number; total: number } {
    if (!isClientSide()) {
      return { current: 0, historical: 0, total: 0 }; // 服务器端返回空统计
    }
    
    let current = 0;
    let historical = 0;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        if (key.startsWith(this.CACHE_PREFIX_CURRENT)) {
          current++;
        } else if (key.startsWith(this.CACHE_PREFIX_HISTORICAL)) {
          historical++;
        }
      }
    } catch (error) {
      console.error(`[CacheService] 获取缓存统计失败:`, error);
    }
    
    return {
      current,
      historical,
      total: current + historical,
    };
  }
}

export default CacheService;
