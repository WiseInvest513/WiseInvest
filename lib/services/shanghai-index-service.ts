/**
 * ShanghaiIndexService - 上证指数服务（服务器端）
 * 
 * 使用 Yahoo Finance API 直接获取上证指数数据
 * 注意：此服务只能在服务器端运行，不能在浏览器中使用
 * 
 * 上证指数代码：000001.SS
 */

const SHANGHAI_INDEX_SYMBOL = '000001.SS';
const YAHOO_FINANCE_CHART_API = 'https://query1.finance.yahoo.com/v8/finance/chart';
const YAHOO_FINANCE_DOWNLOAD_API = 'https://query1.finance.yahoo.com/v7/finance/download';

export interface ShanghaiIndexCurrent {
  price: number;
  changePercent: number;
  updateTime: Date;
}

export interface ShanghaiIndexHistoryItem {
  date: string;
  close: number;
}

/**
 * 获取上证指数当前价格
 */
export async function getShanghaiIndexCurrent(): Promise<ShanghaiIndexCurrent | null> {
  try {
    console.log('[ShanghaiIndexService] ========== 开始获取上证指数当前价格 ==========');
    console.log('[ShanghaiIndexService] 使用符号:', SHANGHAI_INDEX_SYMBOL);
    
    // 直接调用 Yahoo Finance Chart API
    const url = `${YAHOO_FINANCE_CHART_API}/${SHANGHAI_INDEX_SYMBOL}?interval=1d&range=1d`;
    console.log('[ShanghaiIndexService] 请求 URL:', url);
    
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });
      console.log('[ShanghaiIndexService] Fetch 响应状态:', response.status, response.statusText);
    } catch (fetchError: any) {
      console.error('[ShanghaiIndexService] ❌ Fetch 请求失败:', fetchError.message);
      console.error('[ShanghaiIndexService] Fetch 错误类型:', fetchError.name);
      console.error('[ShanghaiIndexService] Fetch 错误堆栈:', fetchError.stack);
      throw new Error(`网络请求失败: ${fetchError.message}`);
    }
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '无法读取错误响应');
      console.error('[ShanghaiIndexService] ❌ HTTP 错误响应:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}. 响应内容: ${errorText.substring(0, 200)}`);
    }
    
    let data: any;
    try {
      const responseText = await response.text();
      console.log('[ShanghaiIndexService] 响应文本（前500字符）:', responseText.substring(0, 500));
      data = JSON.parse(responseText);
      console.log('[ShanghaiIndexService] 解析后的 JSON 数据:', JSON.stringify(data, null, 2).substring(0, 1000));
    } catch (parseError: any) {
      console.error('[ShanghaiIndexService] ❌ JSON 解析失败:', parseError.message);
      throw new Error(`JSON 解析失败: ${parseError.message}`);
    }
    
    // 解析返回的数据结构
    const result = data?.chart?.result?.[0];
    console.log('[ShanghaiIndexService] 提取的 result:', result ? '存在' : '不存在');
    
    if (!result) {
      console.warn('[ShanghaiIndexService] ⚠️ 数据格式错误，未找到 chart.result[0]');
      console.warn('[ShanghaiIndexService] 完整数据结构:', JSON.stringify(data, null, 2));
      return null;
    }
    
    if (!result.meta) {
      console.warn('[ShanghaiIndexService] ⚠️ 数据格式错误，未找到 result.meta');
      console.warn('[ShanghaiIndexService] result 内容:', JSON.stringify(result, null, 2));
      return null;
    }
    
    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose || meta.previousClose;
    
    console.log('[ShanghaiIndexService] 解析的价格数据:', { price, previousClose });
    
    if (!price || price <= 0 || !isFinite(price)) {
      console.warn('[ShanghaiIndexService] ⚠️ 价格数据无效:', { price, meta });
      return null;
    }
    
    // 计算涨跌幅
    const changePercent = previousClose && previousClose > 0
      ? ((price - previousClose) / previousClose) * 100 
      : 0;
    
    const resultData: ShanghaiIndexCurrent = {
      price: Math.round(price * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      updateTime: new Date(),
    };
    
    console.log('[ShanghaiIndexService] ✅ 成功获取上证指数:', resultData);
    console.log('[ShanghaiIndexService] ========== 获取完成 ==========');
    return resultData;
  } catch (error: any) {
    console.error('[ShanghaiIndexService] ❌❌❌ 获取失败 ❌❌❌');
    console.error('[ShanghaiIndexService] 错误消息:', error.message);
    console.error('[ShanghaiIndexService] 错误类型:', error.name);
    console.error('[ShanghaiIndexService] 错误堆栈:', error.stack);
    console.error('[ShanghaiIndexService] ========== 错误结束 ==========');
    return null;
  }
}

/**
 * 获取上证指数历史价格
 * @param startDate 开始日期（YYYY-MM-DD）
 * @param endDate 结束日期（YYYY-MM-DD），可选，默认为今天
 */
export async function getShanghaiIndexHistory(
  startDate: string,
  endDate?: string
): Promise<ShanghaiIndexHistoryItem[] | null> {
  try {
    console.log('[ShanghaiIndexService] 获取上证指数历史价格:', startDate, 'to', endDate || 'today');
    
    const period1 = Math.floor(new Date(startDate).getTime() / 1000);
    const period2 = endDate 
      ? Math.floor(new Date(endDate).getTime() / 1000) 
      : Math.floor(Date.now() / 1000);
    
    console.log('[ShanghaiIndexService] 时间范围:', { period1, period2, symbol: SHANGHAI_INDEX_SYMBOL });
    
    // 使用 Yahoo Finance Download API 获取历史数据
    const url = `${YAHOO_FINANCE_DOWNLOAD_API}/${SHANGHAI_INDEX_SYMBOL}?period1=${period1}&period2=${period2}&interval=1d&events=history`;
    console.log('[ShanghaiIndexService] 请求 URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log('[ShanghaiIndexService] Yahoo Finance 返回 CSV 数据（前200字符）:', csvText.substring(0, 200));
    
    // 解析 CSV 数据
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      console.warn('[ShanghaiIndexService] CSV 数据为空或格式错误');
      return null;
    }
    
    // 跳过标题行，解析数据
    const result: ShanghaiIndexHistoryItem[] = [];
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',');
      if (columns.length >= 5) {
        const date = columns[0]; // Date
        const close = parseFloat(columns[4]); // Close
        if (date && close > 0) {
          result.push({
            date,
            close: Math.round(close * 100) / 100,
          });
        }
      }
    }
    
    console.log(`[ShanghaiIndexService] ✅ 成功获取 ${result.length} 条历史数据`);
    return result;
  } catch (error: any) {
    console.error('[ShanghaiIndexService] ❌ 获取历史数据失败:', error.message);
    console.error('[ShanghaiIndexService] 错误堆栈:', error.stack);
    return null;
  }
}

/**
 * 获取指定日期的上证指数价格
 * @param date 日期（Date 对象或 YYYY-MM-DD 字符串）
 */
export async function getShanghaiIndexByDate(date: Date | string): Promise<number | null> {
  try {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    console.log('[ShanghaiIndexService] 获取指定日期的上证指数价格:', dateStr);
    
    // 获取该日期前后几天的数据，然后找到最接近的日期
    const startDate = new Date(dateStr);
    startDate.setDate(startDate.getDate() - 7); // 往前7天
    const endDate = new Date(dateStr);
    endDate.setDate(endDate.getDate() + 7); // 往后7天
    
    const historical = await getShanghaiIndexHistory(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    
    if (!historical || historical.length === 0) {
      return null;
    }
    
    // 找到最接近目标日期的数据
    const targetDate = dateStr;
    let closestItem: ShanghaiIndexHistoryItem | null = null;
    let minDiff = Infinity;
    
    for (const item of historical) {
      const diff = Math.abs(new Date(item.date).getTime() - new Date(targetDate).getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closestItem = item;
      }
    }
    
    if (closestItem && closestItem.close > 0) {
      console.log(`[ShanghaiIndexService] ✅ 找到最接近的日期: ${closestItem.date}, 价格: ${closestItem.close}`);
      return closestItem.close;
    }
    
    return null;
  } catch (error: any) {
    console.error('[ShanghaiIndexService] ❌ 获取指定日期价格失败:', error.message);
    return null;
  }
}
