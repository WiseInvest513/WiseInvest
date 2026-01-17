/**
 * God Mode Mock Data
 * 上帝视角模拟数据
 * 
 * 使用真实市场估算值填充，用于开发和演示
 */

export interface AssetYieldData {
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

// Tool 1: Top Stock Performers (1 Year)
// 原始数据已清空，等待重新填入真实数据
export const TOP_STOCK_PERFORMERS: AssetYieldData[] = [];

// Tool 2: Index Yields
// 模拟数据，用于界面展示
export const INDEX_YIELDS: AssetYieldData[] = [
  {
    symbol: 'VOO',
    name: '标普500',
    price: 450.00,
    changes: {
      m3: 5.2,
      m6: 12.5,
      y1: 28.3,
      y3: 65.8,
      y5: 120.5,
    },
  },
  {
    symbol: 'QQQ',
    name: '纳斯达克100',
    price: 380.00,
    changes: {
      m3: 6.8,
      m6: 15.2,
      y1: 35.6,
      y3: 88.4,
      y5: 165.2,
    },
  },
  {
    symbol: 'DIA',
    name: '道琼斯',
    price: 340.00,
    changes: {
      m3: 4.5,
      m6: 10.8,
      y1: 24.2,
      y3: 55.3,
      y5: 98.7,
    },
  },
  {
    symbol: 'VGT',
    name: '信息技术板块',
    price: 420.00,
    changes: {
      m3: 7.2,
      m6: 16.5,
      y1: 38.9,
      y3: 95.2,
      y5: 178.6,
    },
  },
  {
    symbol: 'SH000001',
    name: '上证指数',
    price: 3100.00,
    changes: {
      m3: -2.3,
      m6: 1.5,
      y1: 8.2,
      y3: 15.6,
      y5: 22.4,
    },
  },
];


// Tool 4: Crypto Yields
// 原始数据已清空，等待重新填入真实数据
export const CRYPTO_YIELDS: AssetYieldData[] = [];
