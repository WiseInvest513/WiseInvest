/**
 * PriceService - 统一价格服务（向后兼容）
 * 
 * 这个文件是为了保持向后兼容性，实际实现已经拆分为：
 * - CurrentPriceService: 获取当前价格
 * - HistoricalPriceService: 获取历史价格
 * 
 * 新代码应该直接使用 CurrentPriceService 和 HistoricalPriceService
 */

export { CurrentPriceService, type CurrentPriceResult, type AssetType } from './CurrentPriceService';
export { HistoricalPriceService, type HistoricalPriceResult } from './HistoricalPriceService';

// 向后兼容的类型导出
export type { CurrentPriceResult as PriceResult } from './CurrentPriceService';
// HistoricalPriceResult 已在上面导出，不需要重复导出

// 向后兼容的类（简化版，内部调用新的服务）
import { CurrentPriceService as NewCurrentPriceService } from './CurrentPriceService';
import { HistoricalPriceService as NewHistoricalPriceService } from './HistoricalPriceService';
import type { AssetType } from './CurrentPriceService';

export class PriceService {
  /**
   * 获取当前价格（自动识别类型）
   * @deprecated 请使用 CurrentPriceService.getPrice(type, symbol)
   */
  static async getCurrentPrice(symbol: string): Promise<import('./CurrentPriceService').CurrentPriceResult> {
    const upper = symbol.toUpperCase();
    
    // 尝试识别类型
    let type: AssetType = 'crypto';
    if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA'].includes(upper)) {
      type = 'stock';
    } else if (['QQQ', 'VOO', 'DIA', 'VGT'].includes(upper)) {
      type = 'index';
    } else if (['SH000001'].includes(upper)) {
      type = 'domestic';
    }
    
    return NewCurrentPriceService.getPrice(type, symbol);
  }
  
  /**
   * 获取历史价格（自动识别类型）
   * @deprecated 请使用 HistoricalPriceService.getPrice(type, symbol, date)
   */
  static async getHistoricalPrice(symbol: string, date: Date): Promise<import('./HistoricalPriceService').HistoricalPriceResult> {
    const upper = symbol.toUpperCase();
    
    // 尝试识别类型
    let type: AssetType = 'crypto';
    if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA'].includes(upper)) {
      type = 'stock';
    } else if (['QQQ', 'VOO', 'DIA', 'VGT'].includes(upper)) {
      type = 'index';
    } else if (['SH000001'].includes(upper)) {
      type = 'domestic';
    }
    
    return NewHistoricalPriceService.getPrice(type, symbol, date);
  }
  
  /**
   * 获取支持的资产列表
   */
  static getSupportedAssets(): {
    crypto: string[];
    stock: string[];
  } {
    return NewCurrentPriceService.getSupportedAssets();
  }
}
