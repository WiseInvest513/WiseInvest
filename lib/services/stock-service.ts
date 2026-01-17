/**
 * StockService - 股票服务（服务器端）
 * 
 * 直接调用 Yahoo Finance API 获取股票和指数数据
 * 注意：此服务只能在服务器端运行（Server Components, Server Actions, API Routes）
 * 
 * 上证指数代码：000001.SS
 */

export interface StockHistoryItem {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * 获取上证指数历史数据
 * @param startDate 开始日期，格式 'YYYY-MM-DD' (例如: '2025-12-01')
 * @param endDate 结束日期，格式 'YYYY-MM-DD' (例如: '2026-01-14')
 * @returns 历史数据数组，如果失败返回空数组
 */
export async function getShanghaiIndexHistory(
  startDate: string,
  endDate: string
): Promise<StockHistoryItem[]> {
  console.log(`[StockService] 获取上证指数历史数据: ${startDate} 到 ${endDate}`);
  
  try {
    const symbol = '000001.SS';
    
    // 计算时间戳（秒）
    const period1 = Math.floor(new Date(startDate).getTime() / 1000);
    const period2 = Math.floor(new Date(endDate).getTime() / 1000);
    
    const url = `https://query1.finance.yahoo.com/v7/finance/download/${symbol}?period1=${period1}&period2=${period2}&interval=1d&events=history`;
    console.log(`[StockService] 请求 URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log(`[StockService] 获取到 CSV 数据，长度: ${csvText.length}`);
    
    // 解析 CSV
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      console.warn(`[StockService] CSV 数据为空`);
      return [];
    }
    
    const result: StockHistoryItem[] = [];
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',');
      if (columns.length >= 5) {
        const date = columns[0];
        const open = parseFloat(columns[1]);
        const high = parseFloat(columns[2]);
        const low = parseFloat(columns[3]);
        const close = parseFloat(columns[4]);
        const volume = parseFloat(columns[5]) || 0;
        
        if (date && close > 0) {
          result.push({
            date,
            open: open || close,
            high: high || close,
            low: low || close,
            close,
            volume,
          });
        }
      }
    }
    
    console.log(`[StockService] ✅ 成功解析 ${result.length} 条历史数据`);
    return result;
  } catch (error: any) {
    console.error('[StockService] ❌ 获取历史数据错误:', error.message);
    console.error('[StockService] 错误堆栈:', error.stack);
    return [];
  }
}

/**
 * 获取指定日期的上证指数价格
 * @param date 日期，格式 'YYYY-MM-DD' (例如: '2025-12-30')
 * @returns 收盘价，如果失败返回 null
 */
export async function getShanghaiIndexPriceByDate(date: string): Promise<number | null> {
  try {
    console.log(`[StockService] 获取指定日期的上证指数价格: ${date}`);
    
    // 获取该日期前后几天的数据
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 7);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`[StockService] 获取历史数据范围: ${startDateStr} 到 ${endDateStr}`);
    const history = await getShanghaiIndexHistory(startDateStr, endDateStr);
    
    console.log(`[StockService] 获取到 ${history.length} 条历史数据`);
    
    if (history.length === 0) {
      console.warn(`[StockService] ⚠️ 未找到历史数据，日期范围: ${startDateStr} 到 ${endDateStr}`);
      return null;
    }
    
    // 显示所有获取到的日期用于调试
    console.log(`[StockService] 获取到的日期列表:`, history.map(item => item.date).slice(0, 10));
    
    // 找到最接近目标日期的数据
    const targetDate = new Date(date);
    console.log(`[StockService] 目标日期: ${date} (${targetDate.toISOString()})`);
    
    let closestItem: StockHistoryItem | null = null;
    let minDiff = Infinity;
    
    for (const item of history) {
      const itemDate = new Date(item.date);
      const diff = Math.abs(itemDate.getTime() - targetDate.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closestItem = item;
      }
    }
    
    if (closestItem && closestItem.close > 0) {
      const diffDays = Math.round(minDiff / (1000 * 60 * 60 * 24));
      console.log(`[StockService] ✅ 找到最接近的日期: ${closestItem.date} (相差 ${diffDays} 天), 价格: ${closestItem.close}`);
      return closestItem.close;
    }
    
    console.warn(`[StockService] ⚠️ 未找到有效的价格数据`);
    return null;
  } catch (error: any) {
    console.error('[StockService] ❌ 获取指定日期价格失败:', error.message);
    return null;
  }
}
