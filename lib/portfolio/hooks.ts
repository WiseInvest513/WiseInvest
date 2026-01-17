"use client";

/**
 * Portfolio Hooks - Logic Layer
 * 投资组合逻辑层（业务逻辑）
 */

import { useEffect, useState, useMemo } from 'react';
import { usePortfolioStore } from './store';
import { assetService } from '@/lib/asset-service';
import type { PriceData, PortfolioStats, ChartDataPoint } from './types';

/**
 * 获取资产价格数据
 */
export function useAssetPrices() {
  const { assets } = usePortfolioStore();
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 确保只在客户端运行
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    if (assets.length === 0) {
      setPrices(new Map());
      setIsLoading(false);
      return;
    }

    const fetchPrices = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 并行获取所有资产价格
        const priceMap = new Map<string, PriceData>();
        const promises = assets.map(async (asset) => {
          try {
            const result = await assetService.getPrice(asset.symbol, asset.type);
            if (result) {
              priceMap.set(asset.symbol, {
                symbol: asset.symbol,
                price: result.price,
                change24h: result.change24h || 0,
                change24hPercent: result.change24hPercent || 0,
                timestamp: result.timestamp,
                source: result.source,
              });
            }
          } catch (err) {
            console.warn(`Failed to fetch price for ${asset.symbol}:`, err);
          }
        });

        await Promise.all(promises);
        setPrices(priceMap);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch prices');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();

    // 每30秒更新一次价格
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [assets]);

  return { prices, isLoading, error };
}

/**
 * 计算投资组合统计数据
 */
export function usePortfolioStats() {
  const { assets } = usePortfolioStore();
  const { prices } = useAssetPrices();

  const stats = useMemo<PortfolioStats>(() => {
    if (assets.length === 0 || prices.size === 0) {
      return {
        totalValue: 0,
        totalCost: 0,
        profit: 0,
        profitPercent: 0,
        change24h: 0,
        change24hPercent: 0,
      };
    }

    let totalValue = 0;
    let totalCost = 0;
    let change24h = 0;

    assets.forEach((asset) => {
      const priceData = prices.get(asset.symbol);
      if (priceData) {
        const value = asset.amount * priceData.price;
        const cost = asset.amount * asset.avgPrice;
        totalValue += value;
        totalCost += cost;
        change24h += priceData.change24h * asset.amount;
      }
    });

    const profit = totalValue - totalCost;
    const profitPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    const change24hPercent = totalValue > 0 ? (change24h / totalValue) * 100 : 0;

    return {
      totalValue,
      totalCost,
      profit,
      profitPercent,
      change24h,
      change24hPercent,
    };
  }, [assets, prices]);

  return stats;
}

/**
 * 生成图表数据
 */
export function useChartData() {
  const stats = usePortfolioStats();
  const { assets } = usePortfolioStore();

  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (assets.length === 0 || stats.totalCost === 0) {
      return [];
    }

    const data: ChartDataPoint[] = [];
    const baseValue = stats.totalCost;
    const targetValue = stats.totalValue;
    const days = 30;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // 模拟增长曲线（从成本到当前价值）
      const progress = i / (days - 1);
      const multiplier = 1 + (stats.profitPercent / 100) * (1 - progress);
      const randomVariation = (Math.random() - 0.5) * 0.05; // ±2.5% 随机波动
      
      data.push({
        date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        value: baseValue * multiplier * (1 + randomVariation),
      });
    }

    return data;
  }, [stats, assets]);

  return chartData;
}

