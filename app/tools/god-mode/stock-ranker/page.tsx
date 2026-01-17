"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Medal, RefreshCw, Loader2, DollarSign, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TOP_STOCK_PERFORMERS } from "@/lib/mock/god-mode-data";
import { StockRoiChart } from "@/components/god-mode/StockRoiChart";
import { StockYieldService } from "@/lib/services/StockYieldService";
import { CachedPriceService, type AssetType } from "@/lib/services/CachedPriceService";
import type { AssetYieldData } from "@/lib/mock/god-mode-data";

/**
 * Stock Ranker Page
 * 股票领涨榜页面
 * 
 * 显示Top 10年度领涨股票
 * 
 * 新增功能：
 * - 美股七巨头收益率曲线图
 * - 24小时更新限制
 * - localStorage 缓存
 */

const LAST_UPDATE_KEY_STOCK = "stock_yields_last_update";
const CACHED_DATA_KEY_STOCK = "stock_yields_cached_data";

// 美股七巨头配置
const MAGNIFICENT_SEVEN = StockYieldService.getMagnificentSeven();

// 时间框架选项
const TIMEFRAMES = [
  { key: 'm3', label: '3个月前', months: 3 },
  { key: 'm6', label: '6个月前', months: 6 },
  { key: 'y1', label: '1年前', months: 12 },
  { key: 'y3', label: '3年前', months: 36 },
  { key: 'y5', label: '5年前', months: 60 },
];

interface ProgressData {
  current: number;
  total: number;
  currentStock: string;
  currentTimeframe: string;
  lastResult?: {
    symbol: string;
    name: string;
    type: 'current' | 'historical';
    price?: number;
    date?: string;
    source?: string;
    exists?: boolean;
    error?: string;
  };
}

interface DebugPriceResult {
  symbol: string;
  name: string;
  type: 'current' | 'historical';
  price?: number;
  date?: string;
  source?: string;
  exists?: boolean;
  error?: string;
  timestamp?: number;
}

export default function StockRankerPage() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [magnificentSevenData, setMagnificentSevenData] = useState<AssetYieldData[]>([]);
  
  // 更新进度状态
  const [updateProgress, setUpdateProgress] = useState<ProgressData | null>(null);
  
  // 调试相关状态
  const [debugResults, setDebugResults] = useState<DebugPriceResult[]>([]);
  const [debugLoading, setDebugLoading] = useState<Record<string, boolean>>({});

  // 从 localStorage 加载缓存的数据（美股七巨头）
  useEffect(() => {
    const loadCachedData = () => {
      try {
        const cached = localStorage.getItem(CACHED_DATA_KEY_STOCK);
        if (cached) {
          const data = JSON.parse(cached);
          if (Array.isArray(data) && data.length > 0) {
            console.log("[StockRankerPage] 从缓存加载美股七巨头数据:", data.length, "个股票");
            setMagnificentSevenData(data);
            return;
          }
        }
      } catch (error) {
        console.error("[StockRankerPage] 加载缓存数据失败:", error);
      }
      // 如果没有缓存数据，使用空数组（不显示图表）
      console.log("[StockRankerPage] 没有缓存数据，等待更新");
      setMagnificentSevenData([]);
    };

    loadCachedData();
  }, []);

  // 检查是否可以更新 - 24小时更新逻辑已注释掉
  // useEffect(() => {
  //   const checkUpdateStatus = () => {
  //     const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY_STOCK);
  //     if (lastUpdate) {
  //       const lastUpdateTime = parseInt(lastUpdate, 10);
  //       const now = Date.now();
  //       const timeSinceUpdate = now - lastUpdateTime;

  //       if (timeSinceUpdate < UPDATE_COOLDOWN) {
  //         setCanUpdate(false);
  //         const remaining = UPDATE_COOLDOWN - timeSinceUpdate;
  //         const hours = Math.floor(remaining / (60 * 60 * 1000));
  //         const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  //         setTimeRemaining(`${hours}小时${minutes}分钟`);
  //       } else {
  //         setCanUpdate(true);
  //         setTimeRemaining("");
  //       }
  //     }
  //   };

  //   checkUpdateStatus();
  //   // 每分钟更新一次倒计时
  //   const interval = setInterval(checkUpdateStatus, 60000);
  //   return () => clearInterval(interval);
  // }, []);

  // 等待指定时间（毫秒）
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // 更新美股七巨头数据 - 顺序请求，每隔3秒请求一次
  const handleUpdateMagnificentSeven = async () => {
    setIsUpdating(true);
    // 清空之前的数据
    setMagnificentSevenData([]);
    setUpdateProgress({ 
      current: 0, 
      total: MAGNIFICENT_SEVEN.length * TIMEFRAMES.length, 
      currentStock: '', 
      currentTimeframe: '' 
    });

    try {
      console.log("[StockRankerPage] 开始顺序更新数据...");
      console.log(`[StockRankerPage] 总共需要请求: ${MAGNIFICENT_SEVEN.length} 个股票 × ${TIMEFRAMES.length} 个时间段 = ${MAGNIFICENT_SEVEN.length * TIMEFRAMES.length} 个请求`);
      
      const allResults: AssetYieldData[] = [];
      let requestCount = 0;
      const REQUEST_INTERVAL = 5000; // 5秒

      // 遍历每个股票
      for (const stock of MAGNIFICENT_SEVEN) {
        console.log(`\n[StockRankerPage] ========== 开始处理 ${stock.name} (${stock.symbol}) ==========`);
        
        // 1. 获取当前价格
        console.log(`[StockRankerPage] [${++requestCount}/${MAGNIFICENT_SEVEN.length * TIMEFRAMES.length}] 获取 ${stock.symbol} 的当前价格...`);
        setUpdateProgress({
          current: requestCount - 1,
          total: MAGNIFICENT_SEVEN.length * TIMEFRAMES.length,
          currentStock: stock.name,
          currentTimeframe: '当前价格',
        });

        let currentPrice = 0;
        let currentPriceSource = 'Unknown';
        
        try {
          const currentResult = await CachedPriceService.getCurrentPrice('stock', stock.symbol);
          if (currentResult && currentResult.price > 0) {
            currentPrice = currentResult.price;
            currentPriceSource = currentResult.source || 'Unknown';
            console.log(`[StockRankerPage] ✅ ${stock.symbol} 当前价格: $${currentPrice.toFixed(2)} (来源: ${currentPriceSource})`);
            
            // 更新进度，显示获取到的数据
            setUpdateProgress({
              current: requestCount,
              total: MAGNIFICENT_SEVEN.length * TIMEFRAMES.length,
              currentStock: stock.name,
              currentTimeframe: '当前价格',
              lastResult: {
                symbol: stock.symbol,
                name: stock.name,
                type: 'current',
                price: currentPrice,
                source: currentPriceSource,
              },
            });
          } else {
            console.error(`[StockRankerPage] ❌ ${stock.symbol} 当前价格无效:`, currentResult);
            setUpdateProgress({
              current: requestCount,
              total: MAGNIFICENT_SEVEN.length * TIMEFRAMES.length,
              currentStock: stock.name,
              currentTimeframe: '当前价格',
              lastResult: {
                symbol: stock.symbol,
                name: stock.name,
                type: 'current',
                error: '价格无效',
              },
            });
          }
        } catch (error: any) {
          console.error(`[StockRankerPage] ❌ ${stock.symbol} 获取当前价格失败:`, error.message);
          setUpdateProgress({
            current: requestCount,
            total: MAGNIFICENT_SEVEN.length * TIMEFRAMES.length,
            currentStock: stock.name,
            currentTimeframe: '当前价格',
            lastResult: {
              symbol: stock.symbol,
              name: stock.name,
              type: 'current',
              error: error.message || '获取失败',
            },
          });
        }

        // 等待5秒（除了第一个请求）- 确保数据解析完成后再等待
        if (requestCount > 1) {
          console.log(`[StockRankerPage] 数据解析完成，等待 ${REQUEST_INTERVAL / 1000} 秒后继续...`);
          await sleep(REQUEST_INTERVAL);
        }

        // 2. 获取每个时间段的历史价格
        const timeframesData: Record<string, { price: number; yieldPercent: number }> = {
          m3: { price: 0, yieldPercent: 0 },
          m6: { price: 0, yieldPercent: 0 },
          y1: { price: 0, yieldPercent: 0 },
          y3: { price: 0, yieldPercent: 0 },
          y5: { price: 0, yieldPercent: 0 },
        };

        for (const timeframe of TIMEFRAMES) {
          // 计算目标日期
          const today = new Date();
          const targetDate = new Date(today);
          targetDate.setMonth(targetDate.getMonth() - timeframe.months);
          targetDate.setHours(0, 0, 0, 0);

          console.log(`[StockRankerPage] [${++requestCount}/${MAGNIFICENT_SEVEN.length * TIMEFRAMES.length}] 获取 ${stock.symbol} ${timeframe.label} (${targetDate.toISOString().split('T')[0]}) 的历史价格...`);
          setUpdateProgress({
            current: requestCount - 1,
            total: MAGNIFICENT_SEVEN.length * TIMEFRAMES.length,
            currentStock: stock.name,
            currentTimeframe: timeframe.label,
          });

          try {
            const historicalResult = await CachedPriceService.getHistoricalPrice('stock', stock.symbol, targetDate);
            
            if (historicalResult && historicalResult.exists && historicalResult.price > 0 && currentPrice > 0) {
              const historicalPrice = historicalResult.price;
              const yieldPercent = ((currentPrice - historicalPrice) / historicalPrice) * 100;
              
              timeframesData[timeframe.key] = {
                price: historicalPrice,
                yieldPercent: Math.round(yieldPercent * 100) / 100,
              };
              
              console.log(`[StockRankerPage] ✅ ${stock.symbol} ${timeframe.label}: 历史价格 $${historicalPrice.toFixed(2)} → 当前价格 $${currentPrice.toFixed(2)} = ${yieldPercent >= 0 ? '+' : ''}${yieldPercent.toFixed(2)}% (来源: ${historicalResult.source})`);
              
              // 更新进度，显示获取到的数据
              setUpdateProgress({
                current: requestCount,
                total: MAGNIFICENT_SEVEN.length * TIMEFRAMES.length,
                currentStock: stock.name,
                currentTimeframe: timeframe.label,
                lastResult: {
                  symbol: stock.symbol,
                  name: stock.name,
                  type: 'historical',
                  price: historicalPrice,
                  date: historicalResult.date,
                  source: historicalResult.source,
                  exists: true,
                },
              });
            } else {
              console.warn(`[StockRankerPage] ⚠️ ${stock.symbol} ${timeframe.label}: 无法获取有效历史价格`, historicalResult);
              timeframesData[timeframe.key] = {
                price: 0,
                yieldPercent: 0,
              };
              
              setUpdateProgress({
                current: requestCount,
                total: MAGNIFICENT_SEVEN.length * TIMEFRAMES.length,
                currentStock: stock.name,
                currentTimeframe: timeframe.label,
                lastResult: {
                  symbol: stock.symbol,
                  name: stock.name,
                  type: 'historical',
                  exists: false,
                  error: historicalResult?.error || '无法获取历史价格',
                },
              });
            }
          } catch (error: any) {
            console.error(`[StockRankerPage] ❌ ${stock.symbol} ${timeframe.label} 获取失败:`, error.message);
            timeframesData[timeframe.key] = {
              price: 0,
              yieldPercent: 0,
            };
            
            setUpdateProgress({
              current: requestCount,
              total: MAGNIFICENT_SEVEN.length * TIMEFRAMES.length,
              currentStock: stock.name,
              currentTimeframe: timeframe.label,
              lastResult: {
                symbol: stock.symbol,
                name: stock.name,
                type: 'historical',
                error: error.message || '获取失败',
              },
            });
          }

          // 等待5秒（除了最后一个请求）- 确保数据解析完成后再等待
          if (requestCount < MAGNIFICENT_SEVEN.length * TIMEFRAMES.length) {
            console.log(`[StockRankerPage] 数据解析完成，等待 ${REQUEST_INTERVAL / 1000} 秒后继续...`);
            await sleep(REQUEST_INTERVAL);
          }
        }

        // 3. 构建该股票的数据
        if (currentPrice > 0) {
          allResults.push({
            symbol: stock.symbol,
            name: stock.name,
            price: currentPrice,
            changes: {
              m3: timeframesData.m3.yieldPercent,
              m6: timeframesData.m6.yieldPercent,
              y1: timeframesData.y1.yieldPercent,
              y3: timeframesData.y3.yieldPercent,
              y5: timeframesData.y5.yieldPercent,
            },
          });
          console.log(`[StockRankerPage] ✅ ${stock.name} 数据收集完成`);
          
          // 实时更新图表
          setMagnificentSevenData([...allResults]);
        } else {
          console.error(`[StockRankerPage] ❌ ${stock.name} 当前价格无效，跳过`);
        }
      }

      // 保存到 localStorage 缓存
      localStorage.setItem(CACHED_DATA_KEY_STOCK, JSON.stringify(allResults));
      localStorage.setItem(LAST_UPDATE_KEY_STOCK, Date.now().toString());

      // 更新页面显示的数据
      setMagnificentSevenData(allResults);
      setUpdateProgress(null);

      console.log(`[StockRankerPage] ✅ 所有数据更新完成，共 ${allResults.length} 个股票`);
      console.log(`[StockRankerPage] 总耗时: 约 ${(MAGNIFICENT_SEVEN.length * TIMEFRAMES.length * REQUEST_INTERVAL / 1000 / 60).toFixed(1)} 分钟`);
    } catch (error: any) {
      console.error("[StockRankerPage] 更新失败:", error);
      setUpdateProgress(null);
    } finally {
      setIsUpdating(false);
    }
  };

  // 获取单个股票的全部价格（当前价格 + 5个时间段）- 用于测试
  const handleGetAllPrices = async (stock: typeof MAGNIFICENT_SEVEN[0]) => {
    const key = `${stock.symbol}_all`;
    setDebugLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      console.log(`[StockRankerPage] 开始获取 ${stock.name} (${stock.symbol}) 的全部价格...`);
      const REQUEST_INTERVAL = 5000; // 5秒
      const results: DebugPriceResult[] = [];
      
      // 1. 获取当前价格
      console.log(`[StockRankerPage] 步骤1: 获取 ${stock.symbol} 的当前价格...`);
      try {
        const currentResult = await CachedPriceService.getCurrentPrice('stock', stock.symbol);
        
        if (currentResult && currentResult.price > 0) {
          const debugResult: DebugPriceResult = {
            symbol: stock.symbol,
            name: stock.name,
            type: 'current',
            price: currentResult.price,
            source: currentResult.source,
            timestamp: currentResult.timestamp,
          };
          results.push(debugResult);
          setDebugResults(prev => [debugResult, ...prev].slice(0, 20));
          console.log(`[StockRankerPage] ✅ ${stock.symbol} 当前价格: $${currentResult.price.toFixed(2)} (来源: ${currentResult.source})`);
        } else {
          const debugResult: DebugPriceResult = {
            symbol: stock.symbol,
            name: stock.name,
            type: 'current',
            error: '价格无效',
          };
          results.push(debugResult);
          setDebugResults(prev => [debugResult, ...prev].slice(0, 20));
          console.error(`[StockRankerPage] ❌ ${stock.symbol} 当前价格无效`);
        }
      } catch (error: any) {
        const debugResult: DebugPriceResult = {
          symbol: stock.symbol,
          name: stock.name,
          type: 'current',
          error: error.message || '获取失败',
        };
        results.push(debugResult);
        setDebugResults(prev => [debugResult, ...prev].slice(0, 20));
        console.error(`[StockRankerPage] ❌ ${stock.symbol} 获取当前价格失败:`, error.message);
      }
      
      // 等待5秒（数据解析完成后）
      console.log(`[StockRankerPage] 当前价格数据解析完成，等待 ${REQUEST_INTERVAL / 1000} 秒后继续...`);
      await sleep(REQUEST_INTERVAL);
      
      // 2. 获取每个时间段的历史价格
      for (const timeframe of TIMEFRAMES) {
        // 计算目标日期
        const today = new Date();
        const targetDate = new Date(today);
        targetDate.setMonth(targetDate.getMonth() - timeframe.months);
        targetDate.setHours(0, 0, 0, 0);
        
        console.log(`[StockRankerPage] 获取 ${stock.symbol} ${timeframe.label} (${targetDate.toISOString().split('T')[0]}) 的历史价格...`);
        
        try {
          const historicalResult = await CachedPriceService.getHistoricalPrice('stock', stock.symbol, targetDate);
          
          const debugResult: DebugPriceResult = {
            symbol: stock.symbol,
            name: stock.name,
            type: 'historical',
            price: historicalResult.price,
            date: historicalResult.date,
            source: historicalResult.source,
            exists: historicalResult.exists,
            error: historicalResult.error,
          };
          
          results.push(debugResult);
          setDebugResults(prev => [debugResult, ...prev].slice(0, 20));
          
          if (historicalResult.exists && historicalResult.price > 0) {
            console.log(`[StockRankerPage] ✅ ${stock.symbol} ${timeframe.label}: $${historicalResult.price.toFixed(2)} (来源: ${historicalResult.source})`);
          } else {
            console.warn(`[StockRankerPage] ⚠️ ${stock.symbol} ${timeframe.label}: 数据不存在或无效`);
          }
        } catch (error: any) {
          const debugResult: DebugPriceResult = {
            symbol: stock.symbol,
            name: stock.name,
            type: 'historical',
            error: error.message || '获取失败',
          };
          results.push(debugResult);
          setDebugResults(prev => [debugResult, ...prev].slice(0, 20));
          console.error(`[StockRankerPage] ❌ ${stock.symbol} ${timeframe.label} 获取失败:`, error.message);
        }
        
        // 等待5秒（数据解析完成后，除了最后一个请求）
        if (timeframe.key !== TIMEFRAMES[TIMEFRAMES.length - 1].key) {
          console.log(`[StockRankerPage] ${timeframe.label} 数据解析完成，等待 ${REQUEST_INTERVAL / 1000} 秒后继续...`);
          await sleep(REQUEST_INTERVAL);
        }
      }
      
      console.log(`[StockRankerPage] ✅ ${stock.name} 全部价格获取完成，共 ${results.length} 个数据点`);
    } catch (error: any) {
      console.error(`[StockRankerPage] ❌ ${stock.name} 获取全部价格失败:`, error);
      const debugResult: DebugPriceResult = {
        symbol: stock.symbol,
        name: stock.name,
        type: 'current',
        error: error.message || '获取失败',
      };
      setDebugResults(prev => [debugResult, ...prev].slice(0, 20));
    } finally {
      setDebugLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // 调试：获取当前价格
  const handleDebugCurrentPrice = async (stock: typeof MAGNIFICENT_SEVEN[0]) => {
    const key = `${stock.symbol}_current`;
    setDebugLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      console.log(`[Debug] 获取 ${stock.symbol} (${stock.name}) 的当前价格...`);
      const result = await CachedPriceService.getCurrentPrice('stock', stock.symbol);
      
      const debugResult: DebugPriceResult = {
        symbol: stock.symbol,
        name: stock.name,
        type: 'current',
        price: result.price,
        source: result.source,
        timestamp: result.timestamp,
      };
      
      setDebugResults(prev => [debugResult, ...prev].slice(0, 20)); // 保留最近20条
      console.log(`[Debug] ✅ ${stock.symbol} 当前价格:`, result);
    } catch (error: any) {
      const debugResult: DebugPriceResult = {
        symbol: stock.symbol,
        name: stock.name,
        type: 'current',
        error: error.message || '获取失败',
      };
      
      setDebugResults(prev => [debugResult, ...prev].slice(0, 20));
      console.error(`[Debug] ❌ ${stock.symbol} 当前价格获取失败:`, error);
    } finally {
      setDebugLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // 调试：获取历史价格
  const handleDebugHistoricalPrice = async (stock: typeof MAGNIFICENT_SEVEN[0], timeframe: typeof TIMEFRAMES[0]) => {
    const key = `${stock.symbol}_${timeframe.key}`;
    setDebugLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      // 计算目标日期
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setMonth(targetDate.getMonth() - timeframe.months);
      targetDate.setHours(0, 0, 0, 0);
      
      console.log(`[Debug] 获取 ${stock.symbol} (${stock.name}) ${timeframe.label} (${targetDate.toISOString().split('T')[0]}) 的历史价格...`);
      const result = await CachedPriceService.getHistoricalPrice('stock', stock.symbol, targetDate);
      
      const debugResult: DebugPriceResult = {
        symbol: stock.symbol,
        name: stock.name,
        type: 'historical',
        price: result.price,
        date: result.date,
        source: result.source,
        exists: result.exists,
        error: result.error,
      };
      
      setDebugResults(prev => [debugResult, ...prev].slice(0, 20)); // 保留最近20条
      console.log(`[Debug] ✅ ${stock.symbol} ${timeframe.label} 历史价格:`, result);
    } catch (error: any) {
      const debugResult: DebugPriceResult = {
        symbol: stock.symbol,
        name: stock.name,
        type: 'historical',
        error: error.message || '获取失败',
      };
      
      setDebugResults(prev => [debugResult, ...prev].slice(0, 20));
      console.error(`[Debug] ❌ ${stock.symbol} ${timeframe.label} 历史价格获取失败:`, error);
    } finally {
      setDebugLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // 按1年收益率排序（原有逻辑保持不变）
  // TOP_STOCK_PERFORMERS 已清空，排行榜暂时不显示数据
  const sortedStocks = [...TOP_STOCK_PERFORMERS].sort(
    (a, b) => b.changes.y1 - a.changes.y1
  );

  // 获取排名徽章
  const getRankBadge = (index: number): string => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return "";
  };

  // 格式化收益率
  const formatYield = (value: number): string => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  // 获取收益率颜色
  const getYieldColor = (value: number): string => {
    return value >= 0 ? "text-green-500" : "text-red-500";
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        <div className="mb-4">
          <Link
            href="/tools"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回工具列表
          </Link>
        </div>

        {/* Header */}
        <Card className="backdrop-blur-xl border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle className="text-3xl font-serif font-bold">
                    Top Stock Performers
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    纳斯达克/标普500年度领涨股票排行榜（基于1年收益率）
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 美股七巨头收益率曲线图（新增） */}
        <Card className="backdrop-blur-xl border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>美股七巨头收益率趋势</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  展示美股七巨头在不同时间框架下的收益率变化趋势
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button
                  onClick={handleUpdateMagnificentSeven}
                  disabled={isUpdating}
                  variant="default"
                  size="sm"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      更新中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      更新数据
                    </>
                  )}
                </Button>
                {updateProgress && (
                  <div className="text-xs text-muted-foreground text-right">
                    <div>进度: {updateProgress.current} / {updateProgress.total}</div>
                    <div className="mt-1">
                      {updateProgress.currentStock && (
                        <span>正在处理: {updateProgress.currentStock} - {updateProgress.currentTimeframe}</span>
                      )}
                    </div>
                    <div className="mt-1 text-yellow-600 dark:text-yellow-400">
                      每次请求间隔 5 秒，请耐心等待...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 进度条显示 */}
            {updateProgress && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">更新进度</span>
                  <span className="text-muted-foreground">
                    {updateProgress.current} / {updateProgress.total}
                  </span>
                </div>
                <Progress 
                  value={(updateProgress.current / updateProgress.total) * 100} 
                  className="h-2"
                />
                {updateProgress.currentStock && (
                  <div className="text-xs text-muted-foreground">
                    正在处理: <span className="font-semibold text-foreground">{updateProgress.currentStock}</span> - {updateProgress.currentTimeframe}
                  </div>
                )}
                {/* 显示最近获取到的数据 */}
                {updateProgress.lastResult && (
                  <div className={`p-3 rounded-lg border text-xs ${
                    updateProgress.lastResult.error
                      ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                      : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                  }`}>
                    <div className="flex items-start gap-2">
                      {updateProgress.lastResult.error ? (
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground">
                          {updateProgress.lastResult.name} ({updateProgress.lastResult.symbol}) - {updateProgress.lastResult.type === 'current' ? '当前价格' : '历史价格'}
                        </div>
                        {updateProgress.lastResult.error ? (
                          <div className="text-red-600 dark:text-red-400 mt-1">
                            错误: {updateProgress.lastResult.error}
                          </div>
                        ) : (
                          <div className="mt-1 space-y-1">
                            {updateProgress.lastResult.price !== undefined && (
                              <div className="text-foreground">
                                价格: <span className="font-mono font-bold">${updateProgress.lastResult.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</span>
                              </div>
                            )}
                            {updateProgress.lastResult.date && (
                              <div className="text-muted-foreground">
                                日期: {updateProgress.lastResult.date}
                              </div>
                            )}
                            {updateProgress.lastResult.source && (
                              <div className="text-muted-foreground">
                                数据源: {updateProgress.lastResult.source}
                              </div>
                            )}
                            {updateProgress.lastResult.exists !== undefined && (
                              <div className="text-muted-foreground">
                                数据存在: {updateProgress.lastResult.exists ? '是' : '否'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 测试按钮区域 */}
            <div className="p-4 bg-yellow-50/10 dark:bg-yellow-900/5 rounded-lg border border-yellow-500/50">
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  测试工具 - 价格获取测试
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  分别测试每个股票的当前价格和历史价格获取功能
                </p>
              </div>
              <div className="space-y-4">
                {MAGNIFICENT_SEVEN.map((stock) => (
                  <div key={stock.symbol} className="p-3 bg-background rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h5 className="font-semibold text-sm text-foreground">{stock.name}</h5>
                        <p className="text-xs text-muted-foreground">{stock.symbol}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleGetAllPrices(stock)}
                        disabled={debugLoading[`${stock.symbol}_all`] || isUpdating}
                        className="flex items-center gap-2 text-xs bg-yellow-500 hover:bg-yellow-600 text-black"
                      >
                        {debugLoading[`${stock.symbol}_all`] ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            获取中...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3" />
                            获取全部价格
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      获取全部价格 = 当前价格 + 5个时间段（每次请求间隔5秒，数据解析完成后等待）
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDebugCurrentPrice(stock)}
                        disabled={debugLoading[`${stock.symbol}_current`] || debugLoading[`${stock.symbol}_all`] || isUpdating}
                        className="flex items-center gap-2 text-xs"
                      >
                        {debugLoading[`${stock.symbol}_current`] ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            获取中...
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-3 h-3" />
                            获取当前价格
                          </>
                        )}
                      </Button>
                      {TIMEFRAMES.map((timeframe) => (
                        <Button
                          key={timeframe.key}
                          size="sm"
                          variant="outline"
                          onClick={() => handleDebugHistoricalPrice(stock, timeframe)}
                          disabled={debugLoading[`${stock.symbol}_${timeframe.key}`] || debugLoading[`${stock.symbol}_all`] || isUpdating}
                          className="text-xs h-7"
                        >
                          {debugLoading[`${stock.symbol}_${timeframe.key}`] ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              获取中...
                            </>
                          ) : (
                            <>
                              <Calendar className="w-3 h-3 mr-1" />
                              {timeframe.label}
                            </>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 调试结果展示 */}
              {debugResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h5 className="text-sm font-semibold text-foreground">调试结果（最近20条）</h5>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {debugResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border text-xs ${
                          result.error
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                            : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {result.error ? (
                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-foreground">
                              {result.name} ({result.symbol}) - {result.type === 'current' ? '当前价格' : '历史价格'}
                            </div>
                            {result.error ? (
                              <div className="text-red-600 dark:text-red-400 mt-1">
                                错误: {result.error}
                              </div>
                            ) : (
                              <div className="mt-1 space-y-1">
                                {result.price !== undefined && (
                                  <div className="text-foreground">
                                    价格: <span className="font-mono font-bold">${result.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</span>
                                  </div>
                                )}
                                {result.date && (
                                  <div className="text-muted-foreground">
                                    日期: {result.date}
                                  </div>
                                )}
                                {result.source && (
                                  <div className="text-muted-foreground">
                                    数据源: {result.source}
                                  </div>
                                )}
                                {result.exists !== undefined && (
                                  <div className="text-muted-foreground">
                                    数据存在: {result.exists ? '是' : '否'}
                                  </div>
                                )}
                                {result.timestamp && (
                                  <div className="text-muted-foreground">
                                    时间戳: {new Date(result.timestamp).toLocaleString('zh-CN')}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDebugResults([])}
                    className="w-full mt-2"
                  >
                    清空调试结果
                  </Button>
                </div>
              )}
            </div>

            {/* 图表显示 */}
            {magnificentSevenData.length > 0 ? (
              <StockRoiChart data={magnificentSevenData} title="美股七巨头收益率" />
            ) : !updateProgress && (
              <div className="h-[calc(100vh-360px)] min-h-[500px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg mb-2">暂无数据</p>
                  <p className="text-sm">请点击"更新数据"按钮获取美股七巨头的收益率数据</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="backdrop-blur-xl border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="w-5 h-5" />
              年度领涨风云榜
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedStocks.length > 0 ? (
              <div className="space-y-4">
                {sortedStocks.map((stock, index) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between p-6 rounded-lg border border-border hover:bg-muted/50 transition-all hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">
                          #{index + 1}
                        </div>
                        {getRankBadge(index) && (
                          <span className="text-3xl">{getRankBadge(index)}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{stock.name}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {stock.symbol}
                        </div>
                      </div>
                      <div className="text-muted-foreground font-mono">
                        ${stock.price.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground mb-1">1年收益率</div>
                      <div
                        className={`text-4xl font-mono font-bold ${getYieldColor(stock.changes.y1)}`}
                      >
                        {formatYield(stock.changes.y1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg mb-2">暂无数据</p>
                  <p className="text-sm">排行榜数据已清空，等待重新填入</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

