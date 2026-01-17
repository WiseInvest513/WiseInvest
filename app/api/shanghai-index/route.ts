/**
 * API Route: /api/shanghai-index
 * 
 * 获取上证指数数据的服务器端 API
 * 使用 yahoo-finance2 库
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShanghaiIndexCurrent, getShanghaiIndexByDate } from '@/lib/services/shanghai-index-service';
import { getShanghaiIndexPriceByDate } from '@/lib/services/stock-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action'); // 'current' 或 'historical'
    const date = searchParams.get('date'); // 格式: YYYY-MM-DD
    
    console.log('[API /api/shanghai-index] 请求参数:', { action, date });
    console.log('[API /api/shanghai-index] 请求 URL:', request.url);
    
    if (action === 'current') {
      // 获取当前价格
      console.log('[API /api/shanghai-index] 开始获取当前价格...');
      
      let result: Awaited<ReturnType<typeof getShanghaiIndexCurrent>>;
      try {
        result = await getShanghaiIndexCurrent();
        console.log('[API /api/shanghai-index] getShanghaiIndexCurrent 返回:', result);
      } catch (error: any) {
        console.error('[API /api/shanghai-index] getShanghaiIndexCurrent 抛出异常:', error);
        console.error('[API /api/shanghai-index] 错误堆栈:', error.stack);
        return NextResponse.json(
          { 
            error: '获取上证指数当前价格时发生异常',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          },
          { status: 500 }
        );
      }
      
      if (!result) {
        console.error('[API /api/shanghai-index] 获取当前价格失败，返回 null');
        return NextResponse.json(
          { 
            error: '获取上证指数当前价格失败',
            message: '函数返回 null，请查看服务器控制台日志获取详细错误信息'
          },
          { status: 500 }
        );
      }
      
      console.log('[API /api/shanghai-index] ✅ 成功获取当前价格:', result);
      return NextResponse.json({
        price: result.price,
        changePercent: result.changePercent,
        updateTime: result.updateTime.toISOString(),
        source: 'Yahoo Finance',
      });
    } else if (action === 'historical' && date) {
      // 获取历史价格（使用 yahoo-finance2 库）
      console.log(`[API /api/shanghai-index] 开始获取历史价格: ${date}`);
      
      let price: number | null;
      try {
        // 优先使用新的 stock-service（使用 yahoo-finance2）
        price = await getShanghaiIndexPriceByDate(date);
        console.log(`[API /api/shanghai-index] stock-service 返回价格: ${price}`);
        
        // 如果新服务失败，降级到旧服务
        if (price === null) {
          console.log(`[API /api/shanghai-index] stock-service 返回 null，降级到 shanghai-index-service`);
          price = await getShanghaiIndexByDate(date);
        }
      } catch (error: any) {
        console.error(`[API /api/shanghai-index] 获取历史价格时发生异常:`, error);
        console.error(`[API /api/shanghai-index] 错误堆栈:`, error.stack);
        return NextResponse.json(
          { 
            error: `获取 ${date} 的上证指数价格时发生异常`,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          },
          { status: 500 }
        );
      }
      
      if (price === null) {
        console.error(`[API /api/shanghai-index] 获取 ${date} 的历史价格失败，返回 null`);
        return NextResponse.json(
          { 
            error: `获取 ${date} 的上证指数价格失败`,
            message: '请查看服务器控制台日志获取详细错误信息'
          },
          { status: 500 }
        );
      }
      
      console.log(`[API /api/shanghai-index] ✅ 成功获取历史价格: ${price}`);
      return NextResponse.json({
        price,
        date,
        source: 'Yahoo Finance (yahoo-finance2)',
      });
    } else {
      return NextResponse.json(
        { error: '无效的参数。需要 action=current 或 action=historical&date=YYYY-MM-DD' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('[API /api/shanghai-index] ❌ 捕获到异常:', error);
    console.error('[API /api/shanghai-index] 错误消息:', error.message);
    console.error('[API /api/shanghai-index] 错误堆栈:', error.stack);
    return NextResponse.json(
      { 
        error: error.message || '服务器错误',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
