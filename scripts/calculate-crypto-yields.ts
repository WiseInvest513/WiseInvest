/**
 * 计算加密货币收益率脚本
 * 
 * 计算主流加密货币（BTC、ETH、BNB、OKB、SOL）在过去不同时间段的收益率
 * 时间框架：3个月、6个月、1年、3年、5年
 * 
 * 使用方法：
 * npx tsx scripts/calculate-crypto-yields.ts
 */

import { CachedPriceService } from '../lib/services/CachedPriceService';
import type { AssetType } from '../lib/services/CurrentPriceService';

interface CryptoYieldResult {
  symbol: string;
  name: string;
  price: number;
  changes: {
    m3: number; // 3 months
    m6: number; // 6 months
    y1: number; // 1 year
    y3: number; // 3 years
    y5: number; // 5 years
  };
}

const CRYPTO_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'BNB', name: 'Binance Coin' },
  { symbol: 'OKB', name: 'OKB' },
  { symbol: 'SOL', name: 'Solana' },
];

/**
 * 计算目标日期（从今天往前推）
 */
function getTargetDate(monthsAgo: number): Date {
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setMonth(targetDate.getMonth() - monthsAgo);
  targetDate.setHours(0, 0, 0, 0);
  return targetDate;
}

/**
 * 计算单个加密货币的收益率
 */
async function calculateCryptoYield(symbol: string, name: string): Promise<CryptoYieldResult | null> {
  console.log(`\n[计算收益率] 开始计算 ${symbol} (${name})...`);
  
  try {
    // 获取当前价格
    const currentPriceResult = await CachedPriceService.getCurrentPrice('crypto', symbol);
    
    if (!currentPriceResult || !currentPriceResult.price || currentPriceResult.price <= 0) {
      console.error(`[${symbol}] ❌ 无法获取当前价格`);
      return null;
    }
    
    const currentPrice = currentPriceResult.price;
    console.log(`[${symbol}] ✅ 当前价格: $${currentPrice.toFixed(2)}`);
    
    // 定义时间框架（月份）
    const timeframes = [
      { key: 'm3', label: '3个月', months: 3 },
      { key: 'm6', label: '6个月', months: 6 },
      { key: 'y1', label: '1年', months: 12 },
      { key: 'y3', label: '3年', months: 36 },
      { key: 'y5', label: '5年', months: 60 },
    ];
    
    const changes: Record<string, number> = {};
    
    // 计算每个时间框架的收益率
    for (const tf of timeframes) {
      try {
        const targetDate = getTargetDate(tf.months);
        const dateStr = targetDate.toISOString().split('T')[0];
        
        console.log(`[${symbol}] 📅 获取 ${tf.label} 前 (${dateStr}) 的历史价格...`);
        
        const historicalPriceResult = await CachedPriceService.getHistoricalPrice(
          'crypto',
          symbol,
          targetDate
        );
        
        if (
          historicalPriceResult &&
          historicalPriceResult.exists &&
          historicalPriceResult.price &&
          historicalPriceResult.price > 0
        ) {
          const historicalPrice = historicalPriceResult.price;
          const yieldPercent = ((currentPrice - historicalPrice) / historicalPrice) * 100;
          
          changes[tf.key] = Math.round(yieldPercent * 100) / 100; // 保留两位小数
          
          console.log(
            `[${symbol}] ✅ ${tf.label}: 历史价格 $${historicalPrice.toFixed(2)} → 当前价格 $${currentPrice.toFixed(2)} = ${yieldPercent >= 0 ? '+' : ''}${yieldPercent.toFixed(2)}%`
          );
        } else {
          console.warn(`[${symbol}] ⚠️ ${tf.label}: 无法获取历史价格`);
          changes[tf.key] = 0; // 如果无法获取，设置为 0
        }
      } catch (error: any) {
        console.error(`[${symbol}] ❌ ${tf.label} 计算失败:`, error.message);
        changes[tf.key] = 0;
      }
      
      // 添加延迟，避免 API 限流
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return {
      symbol,
      name,
      price: Math.round(currentPrice * 100) / 100,
      changes: {
        m3: changes.m3 || 0,
        m6: changes.m6 || 0,
        y1: changes.y1 || 0,
        y3: changes.y3 || 0,
        y5: changes.y5 || 0,
      },
    };
  } catch (error: any) {
    console.error(`[${symbol}] ❌ 计算失败:`, error.message);
    return null;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始计算加密货币收益率...');
  console.log('='.repeat(60));
  
  const results: CryptoYieldResult[] = [];
  
  // 依次计算每个加密货币
  for (const asset of CRYPTO_ASSETS) {
    const result = await calculateCryptoYield(asset.symbol, asset.name);
    if (result) {
      results.push(result);
    }
    
    // 每个资产之间添加延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 计算结果汇总:');
  console.log('='.repeat(60));
  
  // 输出结果
  console.log('\nexport const CRYPTO_YIELDS: AssetYieldData[] = [');
  results.forEach((result, index) => {
    const isLast = index === results.length - 1;
    console.log(
      `  { symbol: "${result.symbol}", name: "${result.name}", price: ${result.price}, changes: { m3: ${result.changes.m3}, m6: ${result.changes.m6}, y1: ${result.changes.y1}, y3: ${result.changes.y3}, y5: ${result.changes.y5} } }${isLast ? '' : ','}`
    );
  });
  console.log('];\n');
  
  // 输出 JSON 格式（方便复制）
  console.log('JSON 格式:');
  console.log(JSON.stringify(results, null, 2));
  
  console.log('\n✅ 计算完成！');
  console.log('请将上面的数据复制到 lib/mock/god-mode-data.ts 文件中更新 CRYPTO_YIELDS');
}

// 运行脚本
main().catch((error) => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
