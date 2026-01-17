"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoiChart } from "@/components/god-mode/RoiChart";
import { INDEX_YIELDS } from "@/lib/mock/god-mode-data";
import { CachedPriceService, type AssetType } from "@/lib/services/CachedPriceService";
import type { AssetYieldData } from "@/lib/mock/god-mode-data";

/**
 * Index Yields Page
 * 指数收益率矩阵页面
 */

const LAST_UPDATE_KEY = "index_yields_last_update";
const CACHED_DATA_KEY = "index_yields_cached_data";
const UPDATE_COOLDOWN = 24 * 60 * 60 * 1000; // 24小时（毫秒）

// 指数配置
const INDEX_ASSETS = [
  { symbol: 'VOO', name: '标普500', assetType: 'index' as AssetType },
  { symbol: 'QQQ', name: '纳斯达克100', assetType: 'index' as AssetType },
  { symbol: 'DIA', name: '道琼斯', assetType: 'index' as AssetType },
  { symbol: 'VGT', name: '信息技术板块', assetType: 'index' as AssetType },
  { symbol: 'SH000001', name: '上证指数', assetType: 'domestic' as AssetType },
];

// 时间框架选项
const TIMEFRAMES = [
  { key: 'm3', label: '3个月前', months: 3 },
  { key: 'm6', label: '6个月前', months: 6 },
  { key: 'y1', label: '1年前', months: 12 },
  { key: 'y3', label: '3年前', months: 36 },
  { key: 'y5', label: '5年前', months: 60 },
];

export default function IndexYieldsPage() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [indexYields, setIndexYields] = useState<AssetYieldData[]>(INDEX_YIELDS);
  
  // 更新进度状态
  const [updateProgress, setUpdateProgress] = useState<{
    current: number;
    total: number;
    currentIndex: string;
    currentTimeframe: string;
  } | null>(null);

  // 从 localStorage 加载缓存的数据
  useEffect(() => {
    const loadCachedData = () => {
      try {
        const cached = localStorage.getItem(CACHED_DATA_KEY);
        if (cached) {
          const data = JSON.parse(cached);
          if (Array.isArray(data) && data.length > 0) {
            console.log("[IndexYieldsPage] 从缓存加载数据:", data.length, "个指数");
            setIndexYields(data);
            return;
          }
        }
      } catch (error) {
        console.error("[IndexYieldsPage] 加载缓存数据失败:", error);
      }
      // 如果没有缓存数据，使用默认的 mock 数据
      console.log("[IndexYieldsPage] 使用默认 mock 数据");
      setIndexYields(INDEX_YIELDS);
    };

    loadCachedData();
  }, []);

  // 调试期间：注释掉24小时更新限制检查
  // useEffect(() => {
  //   const checkUpdateStatus = () => {
  //     const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
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

  // 更新数据 - 顺序请求，每隔3秒请求一次
  const handleUpdateData = async () => {
    setIsUpdating(true);
    setUpdateProgress({ current: 0, total: INDEX_ASSETS.length * TIMEFRAMES.length, currentIndex: '', currentTimeframe: '' });

    try {
      console.log("[IndexYieldsPage] 开始顺序更新数据...");
      console.log(`[IndexYieldsPage] 总共需要请求: ${INDEX_ASSETS.length} 个指数 × ${TIMEFRAMES.length} 个时间段 = ${INDEX_ASSETS.length * TIMEFRAMES.length} 个请求`);
      
      const allResults: AssetYieldData[] = [];
      let requestCount = 0;
      const REQUEST_INTERVAL = 3000; // 3秒

      // 遍历每个指数
      for (const index of INDEX_ASSETS) {
        console.log(`\n[IndexYieldsPage] ========== 开始处理 ${index.name} (${index.symbol}) ==========`);
        
        // 1. 获取当前价格
        console.log(`[IndexYieldsPage] [${++requestCount}/${INDEX_ASSETS.length * TIMEFRAMES.length}] 获取 ${index.symbol} 的当前价格...`);
        setUpdateProgress({
          current: requestCount - 1,
          total: INDEX_ASSETS.length * TIMEFRAMES.length,
          currentIndex: index.name,
          currentTimeframe: '当前价格'
        });

        let currentPrice = 0;
        let currentPriceSource = 'Unknown';
        
        try {
          const currentResult = await CachedPriceService.getCurrentPrice(index.assetType, index.symbol);
          if (currentResult && currentResult.price > 0) {
            currentPrice = currentResult.price;
            currentPriceSource = currentResult.source || 'Unknown';
            console.log(`[IndexYieldsPage] ✅ ${index.symbol} 当前价格: $${currentPrice.toFixed(2)} (来源: ${currentPriceSource})`);
          } else {
            console.error(`[IndexYieldsPage] ❌ ${index.symbol} 当前价格无效:`, currentResult);
          }
        } catch (error: any) {
          console.error(`[IndexYieldsPage] ❌ ${index.symbol} 获取当前价格失败:`, error.message);
        }

        // 等待3秒（除了第一个请求）
        if (requestCount > 1) {
          console.log(`[IndexYieldsPage] 等待 ${REQUEST_INTERVAL / 1000} 秒后继续...`);
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

          console.log(`[IndexYieldsPage] [${++requestCount}/${INDEX_ASSETS.length * TIMEFRAMES.length}] 获取 ${index.symbol} ${timeframe.label} (${targetDate.toISOString().split('T')[0]}) 的历史价格...`);
          setUpdateProgress({
            current: requestCount - 1,
            total: INDEX_ASSETS.length * TIMEFRAMES.length,
            currentIndex: index.name,
            currentTimeframe: timeframe.label
          });

          try {
            const historicalResult = await CachedPriceService.getHistoricalPrice(index.assetType, index.symbol, targetDate);
            
            if (historicalResult && historicalResult.exists && historicalResult.price > 0 && currentPrice > 0) {
              const historicalPrice = historicalResult.price;
              const yieldPercent = ((currentPrice - historicalPrice) / historicalPrice) * 100;
              
              timeframesData[timeframe.key] = {
                price: historicalPrice,
                yieldPercent: Math.round(yieldPercent * 100) / 100,
              };
              
              console.log(`[IndexYieldsPage] ✅ ${index.symbol} ${timeframe.label}: 历史价格 $${historicalPrice.toFixed(2)} → 当前价格 $${currentPrice.toFixed(2)} = ${yieldPercent >= 0 ? '+' : ''}${yieldPercent.toFixed(2)}% (来源: ${historicalResult.source})`);
            } else {
              console.warn(`[IndexYieldsPage] ⚠️ ${index.symbol} ${timeframe.label}: 无法获取有效历史价格`, historicalResult);
              timeframesData[timeframe.key] = {
                price: 0,
                yieldPercent: 0,
              };
            }
          } catch (error: any) {
            console.error(`[IndexYieldsPage] ❌ ${index.symbol} ${timeframe.label} 获取失败:`, error.message);
            timeframesData[timeframe.key] = {
              price: 0,
              yieldPercent: 0,
            };
          }

          // 等待3秒（除了最后一个请求）
          if (requestCount < INDEX_ASSETS.length * TIMEFRAMES.length) {
            console.log(`[IndexYieldsPage] 等待 ${REQUEST_INTERVAL / 1000} 秒后继续...`);
            await sleep(REQUEST_INTERVAL);
          }
        }

        // 3. 构建该指数的数据
        if (currentPrice > 0) {
          allResults.push({
            symbol: index.symbol,
            name: index.name,
            price: currentPrice,
            changes: {
              m3: timeframesData.m3.yieldPercent,
              m6: timeframesData.m6.yieldPercent,
              y1: timeframesData.y1.yieldPercent,
              y3: timeframesData.y3.yieldPercent,
              y5: timeframesData.y5.yieldPercent,
            },
          });
          console.log(`[IndexYieldsPage] ✅ ${index.name} 数据收集完成`);
        } else {
          console.error(`[IndexYieldsPage] ❌ ${index.name} 当前价格无效，跳过`);
        }
      }

      // 保存到 localStorage 缓存
      localStorage.setItem(CACHED_DATA_KEY, JSON.stringify(allResults));
      localStorage.setItem(LAST_UPDATE_KEY, Date.now().toString());

      // 更新页面显示的数据
      setIndexYields(allResults);
      setUpdateProgress(null);

      console.log(`[IndexYieldsPage] ✅ 所有数据更新完成，共 ${allResults.length} 个指数`);
      console.log(`[IndexYieldsPage] 总耗时: 约 ${(INDEX_ASSETS.length * TIMEFRAMES.length * REQUEST_INTERVAL / 1000 / 60).toFixed(1)} 分钟`);
    } catch (error: any) {
      console.error("[IndexYieldsPage] 更新失败:", error);
      setUpdateProgress(null);
    } finally {
      setIsUpdating(false);
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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
                <BarChart3 className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle className="text-3xl font-serif font-bold">
                    Index ROI Matrix
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    主要指数的多时间框架收益率追踪
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button
                  onClick={handleUpdateData}
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
                      {updateProgress.currentIndex && (
                        <span>正在处理: {updateProgress.currentIndex} - {updateProgress.currentTimeframe}</span>
                      )}
                    </div>
                    <div className="mt-1 text-yellow-600 dark:text-yellow-400">
                      每次请求间隔 3 秒，请耐心等待...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* ROI Chart */}
        <Card className="backdrop-blur-xl border-border">
          <CardHeader>
            <CardTitle>指数收益率趋势</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              展示主要指数在不同时间框架下的收益率变化趋势
            </p>
          </CardHeader>
          <CardContent>
            <RoiChart data={indexYields} title="指数收益率" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
