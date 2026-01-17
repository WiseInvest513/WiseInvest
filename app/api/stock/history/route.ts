/**
 * API Route: /api/stock/history
 * 
 * 服务器端代理：获取股票/指数历史价格
 * 使用新浪财经 API（国内数据源）
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbolParam = searchParams.get('symbol') || '000001.SS'; // 默认上证指数
    const date = searchParams.get('date'); // 格式: YYYY-MM-DD
    
    console.log('[API /api/stock/history] 请求参数:', { symbol: symbolParam, date });
    
    // 验证参数
    if (!date) {
      return NextResponse.json(
        { error: '缺少必需参数: date' },
        { status: 400 }
      );
    }
    
    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: '日期格式错误，应为 YYYY-MM-DD' },
        { status: 400 }
      );
    }
    
    try {
      console.log(`[API /api/stock/history] 开始获取历史价格: ${symbolParam} @ ${date}`);
      
      // 转换符号格式：000001.SS -> sh000001
      let sinaSymbol = 'sh000001'; // 默认上证指数
      if (symbolParam.includes('000001')) {
        sinaSymbol = 'sh000001';
      }
      // 可以在这里添加其他股票/指数的转换逻辑
      
      console.log(`[API /api/stock/history] 转换后的新浪符号: ${sinaSymbol}`);
      
      // 构建新浪财经 API URL
      // scale=240 表示 240 分钟 = 1 天
      // datalen=1023 获取最近 1023 天的数据（约3年）
      const apiUrl = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${sinaSymbol}&scale=240&ma=no&datalen=1023`;
      
      console.log(`[API /api/stock/history] 请求新浪财经 API: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });
      
      if (!response.ok) {
        throw new Error(`新浪财经 API 请求失败: HTTP ${response.status} ${response.statusText}`);
      }
      
      const rawData = await response.json();
      console.log(`[API /api/stock/history] 新浪财经返回 ${rawData.length} 条数据`);
      
      if (!Array.isArray(rawData) || rawData.length === 0) {
        console.warn(`[API /api/stock/history] ⚠️ 新浪财经返回空数据或格式错误`);
        return NextResponse.json(
          { 
            error: `未找到 ${date} 的历史价格数据`,
            message: '新浪财经 API 返回空数据'
          },
          { status: 404 }
        );
      }
      
      // 映射为标准格式并解析数值
      const data = rawData.map((item: any) => ({
        date: item.day, // 新浪返回的日期格式：YYYY-MM-DD
        open: parseFloat(item.open) || 0,
        high: parseFloat(item.high) || 0,
        low: parseFloat(item.low) || 0,
        close: parseFloat(item.close) || 0,
        volume: parseFloat(item.volume) || 0,
      }));
      
      console.log(`[API /api/stock/history] 解析后的数据示例（前3条）:`, data.slice(0, 3));
      
      // 找到最接近目标日期的数据
      const targetDate = new Date(date);
      const targetTimestamp = targetDate.getTime();
      let closestItem: any = null;
      let minDiff = Infinity;
      
      for (const item of data) {
        const itemDate = new Date(item.date);
        const diff = Math.abs(itemDate.getTime() - targetTimestamp);
        if (diff < minDiff) {
          minDiff = diff;
          closestItem = item;
        }
      }
      
      if (!closestItem || !closestItem.close || closestItem.close <= 0) {
        console.warn(`[API /api/stock/history] ⚠️ 未找到有效的价格数据`);
        return NextResponse.json(
          { 
            error: `未找到有效的价格数据`,
            message: '数据格式可能不正确'
          },
          { status: 404 }
        );
      }
      
      const diffDays = Math.round(minDiff / (1000 * 60 * 60 * 24));
      const closestDate = closestItem.date;
      
      console.log(`[API /api/stock/history] ✅ 找到最接近的日期: ${closestDate} (相差 ${diffDays} 天), 价格: ${closestItem.close}`);
      
      return NextResponse.json({
        price: Math.round(closestItem.close * 100) / 100,
        date: date,
        closestDate: closestDate,
        diffDays: diffDays,
        source: 'Sina Finance (新浪财经)',
      });
      
    } catch (sinaError: any) {
      console.error('[API /api/stock/history] ❌ 新浪财经 API 错误:', sinaError);
      console.error('[API /api/stock/history] 错误消息:', sinaError.message);
      console.error('[API /api/stock/history] 错误堆栈:', sinaError.stack);
      
      return NextResponse.json(
        { 
          error: '获取历史价格失败',
          message: sinaError.message,
          stack: process.env.NODE_ENV === 'development' ? sinaError.stack : undefined
        },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('[API /api/stock/history] ❌ 捕获到异常:', error);
    console.error('[API /api/stock/history] 错误消息:', error.message);
    console.error('[API /api/stock/history] 错误堆栈:', error.stack);
    
    return NextResponse.json(
      { 
        error: error.message || '服务器错误',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
