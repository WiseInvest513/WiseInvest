/**
 * 测试接口：单独测试 BTC 的价格获取和收益率计算
 */

import { NextRequest, NextResponse } from 'next/server';
import { CurrentPriceService } from '@/lib/services/CurrentPriceService';
import { HistoricalPriceService } from '@/lib/services/HistoricalPriceService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const skipCache = searchParams.get('skipCache') === 'true';
    
    const symbol = 'BTC';
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 测试 BTC 价格获取（${skipCache ? '跳过缓存' : '使用缓存'}）`);
    console.log('='.repeat(60));
    
    // 1. 获取当前价格
    console.log('\n📊 步骤1: 获取当前价格...');
    const currentPriceResult = await CurrentPriceService.getPrice('crypto', symbol);
    console.log('当前价格结果:', JSON.stringify(currentPriceResult, null, 2));
    
    if (!currentPriceResult || !currentPriceResult.price || currentPriceResult.price <= 0) {
      return NextResponse.json({ error: '无法获取当前价格' }, { status: 500 });
    }
    
    const currentPrice = currentPriceResult.price;
    console.log(`✅ 当前价格: $${currentPrice.toFixed(2)}`);
    
    // 2. 计算3个月前的日期（使用与主接口相同的逻辑）
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    threeMonthsAgo.setHours(0, 0, 0, 0);
    threeMonthsAgo.setMinutes(0, 0, 0);
    
    const dateStr = threeMonthsAgo.toISOString().split('T')[0];
    const timestamp = threeMonthsAgo.getTime();
    
    console.log(`\n📅 步骤2: 计算3个月前的日期...`);
    console.log(`今天: ${today.toISOString()}`);
    console.log(`3个月前: ${threeMonthsAgo.toISOString()} (${dateStr})`);
    console.log(`时间戳: ${timestamp}`);
    
    // 3. 获取3个月前的历史价格（注意：加密货币不应该调整到周五）
    console.log(`\n📊 步骤3: 获取3个月前的历史价格（跳过缓存=${skipCache}）...`);
    const historicalResult = await HistoricalPriceService.getPrice('crypto', symbol, threeMonthsAgo);
    
    console.log('历史价格结果:', JSON.stringify(historicalResult, null, 2));
    
    if (!historicalResult || !historicalResult.exists || !historicalResult.price || historicalResult.price <= 0) {
      return NextResponse.json({ 
        error: '无法获取历史价格',
        currentPrice,
        historicalResult 
      }, { status: 500 });
    }
    
    const historicalPrice = historicalResult.price;
    console.log(`✅ 历史价格: $${historicalPrice.toFixed(2)} (日期: ${historicalResult.date})`);
    
    // 4. 计算收益率
    console.log(`\n💰 步骤4: 计算收益率...`);
    const yieldPercent = ((currentPrice - historicalPrice) / historicalPrice) * 100;
    const changeAmount = currentPrice - historicalPrice;
    const isProfit = yieldPercent > 0;
    
    console.log(`当前价格: $${currentPrice.toFixed(2)}`);
    console.log(`历史价格: $${historicalPrice.toFixed(2)}`);
    console.log(`变化金额: $${changeAmount >= 0 ? '+' : ''}${changeAmount.toFixed(2)}`);
    console.log(`收益率: ${isProfit ? '+' : ''}${yieldPercent.toFixed(2)}%`);
    console.log(`状态: ${isProfit ? '盈利' : '亏损'}`);
    
    return NextResponse.json({
      success: true,
      symbol,
      currentPrice: {
        price: currentPrice,
        source: currentPriceResult.source,
        timestamp: new Date().toISOString(),
      },
      historicalPrice: {
        price: historicalPrice,
        date: historicalResult.date,
        source: historicalResult.source,
        targetDate: dateStr,
        timestamp: threeMonthsAgo.getTime(),
      },
      calculation: {
        changeAmount,
        yieldPercent: Math.round(yieldPercent * 100) / 100,
        isProfit,
      },
    });
  } catch (error: any) {
    console.error('❌ 测试失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '测试失败',
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
