/**
 * Macro Economic Data Configuration
 * 宏观经济数据配置
 * 
 * These values change monthly/quarterly and are manually updated.
 * 这些值每月/每季度更新，需要手动维护。
 */

export interface MacroConfig {
  fedRate: number; // Federal Funds Rate (%)
  cpi: number; // Consumer Price Index YoY (%)
  nextFOMC: string; // Next FOMC Meeting Date (YYYY-MM-DD)
  wiseComment: string; // Author's 1-sentence market summary
}

export const MACRO_CONFIG: MacroConfig = {
  fedRate: 5.50, // Current Fed Rate: 5.50%
  cpi: 3.2, // Current CPI YoY: 3.2%
  nextFOMC: "2024-12-18", // Next FOMC Meeting
  wiseComment: "等待鲍威尔讲话，市场观望情绪浓厚。",
};

