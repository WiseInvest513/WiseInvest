/**
 * Portfolio Tracker - Type Definitions
 * 投资组合追踪器类型定义
 */

export type AssetType = 'crypto' | 'stock' | 'index';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  amount: number;
  avgPrice: number;
  practiceLink?: string;
  addedAt: number;
}

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  change24hPercent: number;
  timestamp: number;
  source: string;
}

export interface PortfolioStats {
  totalValue: number;
  totalCost: number;
  profit: number;
  profitPercent: number;
  change24h: number;
  change24hPercent: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: AssetType;
  exchange?: string;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

