/**
 * Scheduled Data Initialization
 * 
 * 在服务器启动时自动初始化定时器
 * 只在服务器端运行
 */

import { ScheduledDataService } from './ScheduledDataService';

/**
 * 初始化定时器服务
 * 只在服务器端执行
 */
export function initScheduledDataService(): void {
  // 检查是否在服务器端
  if (typeof window !== 'undefined') {
    console.log('[ScheduledDataInit] 客户端环境，跳过定时器初始化');
    return;
  }
  
  console.log('[ScheduledDataInit] 🚀 初始化定时数据服务...');
  
  try {
    // 启动所有定时器
    ScheduledDataService.startAllTimers();
    
    console.log('[ScheduledDataInit] ✅ 定时数据服务初始化完成');
  } catch (error: any) {
    console.error('[ScheduledDataInit] ❌ 定时数据服务初始化失败:', error.message);
  }
}

// 如果直接运行此文件（用于测试），立即初始化
if (require.main === module) {
  initScheduledDataService();
}
