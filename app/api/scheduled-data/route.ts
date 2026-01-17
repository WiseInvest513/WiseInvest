/**
 * Scheduled Data API Route
 * 
 * 用于管理定时数据获取服务
 * - GET: 获取定时器状态
 * - POST: 启动/停止定时器
 * - POST /trigger: 手动触发任务
 */

import { NextRequest, NextResponse } from 'next/server';
import { ScheduledDataService } from '@/lib/services/ScheduledDataService';

// Force dynamic to prevent Vercel from caching stale data at build time
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: '定时器服务运行中',
      timers: {
        stock: '每天 3:00',
        index: '每天 3:30',
        crypto: '每天 4:00',
        domestic: '每天 4:30',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, task } = await request.json();
    
    if (action === 'start') {
      ScheduledDataService.startAllTimers();
      return NextResponse.json({
        success: true,
        message: '所有定时器已启动',
      });
    }
    
    if (action === 'stop') {
      ScheduledDataService.stopAllTimers();
      return NextResponse.json({
        success: true,
        message: '所有定时器已停止',
      });
    }
    
    if (action === 'trigger' && task) {
      await ScheduledDataService.triggerTask(task);
      return NextResponse.json({
        success: true,
        message: `任务 ${task} 已触发`,
      });
    }
    
    return NextResponse.json(
      { success: false, error: '无效的操作' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
