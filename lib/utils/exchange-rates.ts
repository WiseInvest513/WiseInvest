/**
 * Exchange Rate Utilities
 * 汇率转换工具
 * 
 * 参考 app.js 中的汇率逻辑
 */

/**
 * USD 到 CNY 的汇率（可以后续从 API 获取实时汇率）
 * 默认使用固定汇率，实际应用中应该从 API 获取
 */
const USD_TO_CNY_RATE = 7.2; // 示例汇率，实际应该从 API 获取

/**
 * 将 USD 转换为 CNY
 */
export function usdToCny(usd: number): number {
  return usd * USD_TO_CNY_RATE;
}

/**
 * 将 CNY 转换为 USD
 */
export function cnyToUsd(cny: number): number {
  return cny / USD_TO_CNY_RATE;
}

/**
 * 获取当前 USD/CNY 汇率
 */
export function getUsdToCnyRate(): number {
  return USD_TO_CNY_RATE;
}

/**
 * 从资产价格（USD）和数量计算 CNY 价值
 */
export function calculateCnyValue(priceUSD: number, quantity: number): number {
  const totalUSD = priceUSD * quantity;
  return usdToCny(totalUSD);
}

