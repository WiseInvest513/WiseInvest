/**
 * IndexYieldService - 指数收益率计算服务
 * 
 * 参考 CryptoYieldService 和 ROI Calculator 的实现方式：
 * - 当前价格：使用 CachedPriceService.getCurrentPrice（浏览器端调用，带缓存）
 * - 历史价格：使用 CachedPriceService.getHistoricalPrice（浏览器端调用，带缓存）
 * 
 * 计算 VOO、QQQ、DIA、VGT、SH000001 在过去 3个月、6个月、1年、3年、5年的收益率
 */

import { CachedPriceService, type AssetType } from '@/lib/services/CachedPriceService';

export interface YieldData {
  historicalPrice: number;
  historicalDate: string;
  historicalSource: string;
  currentPrice: number;
  currentPriceSource: string;
  yieldPercent: number;
  changeAmount: number;
  exists: boolean;
  error?: string;
}

export interface IndexYieldResult {
  symbol: string;
  name: string;
  currentPrice: number;
  currentPriceSource: string;
  timeframes: {
    m3: YieldData; // 3个月
    m6: YieldData; // 6个月
    y1: YieldData; // 1年
    y3: YieldData; // 3年
    y5: YieldData; // 5年
  };
}

export class IndexYieldService {
  private static readonly INDEX_ASSETS = [
    { symbol: 'VOO', name: '标普500', assetType: 'index' as AssetType },
    { symbol: 'QQQ', name: '纳斯达克100', assetType: 'index' as AssetType },
    { symbol: 'DIA', name: '道琼斯', assetType: 'index' as AssetType },
    { symbol: 'VGT', name: '信息技术板块', assetType: 'index' as AssetType },
    { symbol: 'SH000001', name: '上证指数', assetType: 'domestic' as AssetType },
  ];

  private static readonly TIMEFRAMES = [
    { key: 'm3', label: '3个月', months: 3 },
    { key: 'm6', label: '6个月', months: 6 },
    { key: 'y1', label: '1年', months: 12 },
    { key: 'y3', label: '3年', months: 36 },
    { key: 'y5', label: '5年', months: 60 },
  ];

  /**
   * 计算目标日期（从今天往前推）
   */
  private static getTargetDate(monthsAgo: number): Date {
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setMonth(targetDate.getMonth() - monthsAgo);
    targetDate.setHours(0, 0, 0, 0);
    targetDate.setMinutes(0, 0, 0);
    return targetDate;
  }

  /**
   * 计算单个指数的收益率
   * 参考 CryptoYieldService 的实现方式：一次一次调用，不使用并行
   */
  static async calculateYield(symbol: string, name: string, assetType: AssetType): Promise<IndexYieldResult | null> {
    console.log(`[IndexYieldService] 开始计算 ${symbol} (${name}), 资产类型: ${assetType}`);
    console.log('='.repeat(60));

    try {
      // 1. 获取当前价格（参考 ROI Calculator，使用 CachedPriceService）
      console.log(`[IndexYieldService] 步骤1: 获取 ${symbol} 的当前价格...`);
      const currentPriceResult = await CachedPriceService.getCurrentPrice(assetType, symbol);

      if (!currentPriceResult || !currentPriceResult.price || currentPriceResult.price <= 0) {
        console.error(`[IndexYieldService] ${symbol} 无法获取当前价格`);
        return null;
      }

      const currentPrice = currentPriceResult.price;
      const currentPriceSource = currentPriceResult.source || 'Unknown';

      console.log(`[IndexYieldService] ✅ ${symbol} 当前价格: $${currentPrice.toFixed(2)} (来源: ${currentPriceSource})`);
      console.log('');

      // 2. 一次一次获取每个时间段的历史价格（参考 ROI Calculator）
      const timeframes: Record<string, YieldData> = {};

      for (const tf of this.TIMEFRAMES) {
        try {
          const targetDate = this.getTargetDate(tf.months);
          const dateStr = targetDate.toISOString().split('T')[0];

          console.log(`[IndexYieldService] 步骤${tf.key}: 获取 ${symbol} ${tf.label}前 (${dateStr}) 的历史价格...`);

          // 参考 ROI Calculator：使用 CachedPriceService.getHistoricalPrice
          const historicalResult = await CachedPriceService.getHistoricalPrice(assetType, symbol, targetDate);

          if (
            historicalResult &&
            historicalResult.exists &&
            historicalResult.price &&
            historicalResult.price > 0
          ) {
            const historicalPrice = historicalResult.price;
            const yieldPercent = ((currentPrice - historicalPrice) / historicalPrice) * 100;
            const changeAmount = currentPrice - historicalPrice;

            timeframes[tf.key] = {
              historicalPrice: Math.round(historicalPrice * 100) / 100,
              historicalDate: historicalResult.date || dateStr,
              historicalSource: historicalResult.source || 'Unknown',
              currentPrice: Math.round(currentPrice * 100) / 100,
              currentPriceSource,
              yieldPercent: Math.round(yieldPercent * 100) / 100,
              changeAmount: Math.round(changeAmount * 100) / 100,
              exists: true,
            };

            console.log(
              `[IndexYieldService] ✅ ${symbol} ${tf.label}: 历史价格 $${historicalPrice.toFixed(2)} → 当前价格 $${currentPrice.toFixed(2)} = ${yieldPercent >= 0 ? '+' : ''}${yieldPercent.toFixed(2)}% (来源: ${historicalResult.source})`
            );
          } else {
            console.warn(`[IndexYieldService] ⚠️ ${symbol} ${tf.label}: 无法获取历史价格`, historicalResult);
            timeframes[tf.key] = {
              historicalPrice: 0,
              historicalDate: dateStr,
              historicalSource: 'Error',
              currentPrice: Math.round(currentPrice * 100) / 100,
              currentPriceSource,
              yieldPercent: 0,
              changeAmount: 0,
              exists: false,
              error: historicalResult?.error || '无法获取历史价格',
            };
          }
        } catch (error: any) {
          console.error(`[IndexYieldService] ❌ ${symbol} ${tf.label} 获取失败:`, error.message);
          timeframes[tf.key] = {
            historicalPrice: 0,
            historicalDate: '',
            historicalSource: 'Error',
            currentPrice: Math.round(currentPrice * 100) / 100,
            currentPriceSource,
            yieldPercent: 0,
            changeAmount: 0,
            exists: false,
            error: error.message,
          };
        }
        console.log('');
      }

      console.log('='.repeat(60));
      console.log(`[IndexYieldService] ✅ ${symbol} 计算完成`);

      return {
        symbol,
        name,
        currentPrice: Math.round(currentPrice * 100) / 100,
        currentPriceSource,
        timeframes: {
          m3: timeframes.m3 || this.createEmptyYieldData(currentPrice, currentPriceSource, '3个月'),
          m6: timeframes.m6 || this.createEmptyYieldData(currentPrice, currentPriceSource, '6个月'),
          y1: timeframes.y1 || this.createEmptyYieldData(currentPrice, currentPriceSource, '1年'),
          y3: timeframes.y3 || this.createEmptyYieldData(currentPrice, currentPriceSource, '3年'),
          y5: timeframes.y5 || this.createEmptyYieldData(currentPrice, currentPriceSource, '5年'),
        },
      };
    } catch (error: any) {
      console.error(`[IndexYieldService] ❌ ${symbol} 计算失败:`, error.message);
      console.error(`[IndexYieldService] 错误堆栈:`, error.stack);
      return null;
    }
  }

  /**
   * 创建空的收益率数据
   */
  private static createEmptyYieldData(
    currentPrice: number,
    currentPriceSource: string,
    label: string
  ): YieldData {
    return {
      historicalPrice: 0,
      historicalDate: '',
      historicalSource: 'Error',
      currentPrice: Math.round(currentPrice * 100) / 100,
      currentPriceSource,
      yieldPercent: 0,
      changeAmount: 0,
      exists: false,
      error: `${label}数据未计算`,
    };
  }

  /**
   * 获取支持的指数列表
   */
  static getSupportedAssets() {
    return this.INDEX_ASSETS;
  }

  /**
   * 获取时间框架列表
   */
  static getTimeframes() {
    return this.TIMEFRAMES;
  }
}
