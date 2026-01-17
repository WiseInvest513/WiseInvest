"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CachedPriceService, type CurrentPriceResult, type HistoricalPriceResult, type AssetType } from "@/lib/services/CachedPriceService";
import { Loader2, TrendingUp, TrendingDown, Calendar, RefreshCw, AlertCircle, Clock, Timer, Play, Square } from "lucide-react";
import { toast } from "sonner";

export default function PriceTester() {
  const [assetType, setAssetType] = useState<AssetType>("crypto");
  const [selectedAsset, setSelectedAsset] = useState<string>("BTC");
  const [currentPrice, setCurrentPrice] = useState<CurrentPriceResult | null>(null);
  const [historicalPrice, setHistoricalPrice] = useState<HistoricalPriceResult | null>(null);
  const [customDate, setCustomDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingHistorical, setLoadingHistorical] = useState<boolean>(false);
  const [requestLog, setRequestLog] = useState<string[]>([]);
  const [rateLimitWait, setRateLimitWait] = useState<number>(0);
  const [cacheStats, setCacheStats] = useState<{ current: number; historical: number; total: number } | null>(null);
  const [timerLoading, setTimerLoading] = useState<Record<string, boolean>>({});
  const lastRequestTimeRef = useRef<{ current?: number; historical?: number }>({});
  const rateLimitTimerRef = useRef<NodeJS.Timeout | null>(null);

  const supportedAssets = CachedPriceService.getSupportedAssets();
  
  // 最小请求间隔（毫秒）- 防止快速连续点击
  const MIN_REQUEST_INTERVAL = 1000; // 1 秒

  const getAssetOptions = () => {
    switch (assetType) {
      case "crypto":
        return supportedAssets.crypto;
      case "stock":
        return supportedAssets.stock;
      case "index":
        return supportedAssets.index;
      case "domestic":
        return supportedAssets.domestic || [];
      default:
        return [];
    }
  };

  // 当资产类型改变时，自动选择第一个可用的资产
  useEffect(() => {
    const options = getAssetOptions();
    if (options.length > 0) {
      // 如果当前选中的资产不在新类型的选项中，或者选项为空，则选择第一个
      if (!options.includes(selectedAsset)) {
        setSelectedAsset(options[0]);
        setCurrentPrice(null);
        setHistoricalPrice(null);
      }
    } else {
      // 如果没有可用选项，清空选择
      setSelectedAsset("");
      setCurrentPrice(null);
      setHistoricalPrice(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetType]);

  // 更新缓存统计信息
  useEffect(() => {
    const updateCacheStats = () => {
      const stats = CachedPriceService.getCacheStats();
      setCacheStats(stats);
    };
    
    updateCacheStats();
    // 每次请求后更新统计
    const interval = setInterval(updateCacheStats, 2000);
    return () => clearInterval(interval);
  }, [currentPrice, historicalPrice]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString("zh-CN");
    setRequestLog((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 20)); // 保留最近20条日志
  };

  // 清理速率限制计时器
  useEffect(() => {
    return () => {
      if (rateLimitTimerRef.current) {
        clearInterval(rateLimitTimerRef.current);
      }
    };
  }, []);

  // 速率限制倒计时
  useEffect(() => {
    if (rateLimitWait > 0) {
      rateLimitTimerRef.current = setInterval(() => {
        setRateLimitWait((prev) => {
          if (prev <= 1000) {
            if (rateLimitTimerRef.current) {
              clearInterval(rateLimitTimerRef.current);
            }
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    } else {
      if (rateLimitTimerRef.current) {
        clearInterval(rateLimitTimerRef.current);
      }
    }
  }, [rateLimitWait]);

  const checkRateLimit = (type: 'current' | 'historical'): boolean => {
    const now = Date.now();
    const lastTime = lastRequestTimeRef.current[type];
    
    if (lastTime && now - lastTime < MIN_REQUEST_INTERVAL) {
      const waitMs = MIN_REQUEST_INTERVAL - (now - lastTime);
      setRateLimitWait(waitMs);
      toast.warning(`请求过于频繁，请等待 ${Math.ceil(waitMs / 1000)} 秒后再试`);
      addLog(`⚠️ 请求过快，需要等待 ${Math.ceil(waitMs / 1000)} 秒`);
      return false;
    }
    
    lastRequestTimeRef.current[type] = now;
    return true;
  };

  const handleGetCurrentPrice = useCallback(async () => {
    if (!selectedAsset) {
      toast.error("请选择资产");
      return;
    }

    // 检查速率限制
    if (!checkRateLimit('current')) {
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);
    addLog(`开始获取当前价格: ${assetType} / ${selectedAsset}`);
    
    try {
      console.log(`[PriceTester] 调用 CachedPriceService.getCurrentPrice(${assetType}, ${selectedAsset})`);
      const result = await CachedPriceService.getCurrentPrice(assetType, selectedAsset);
      
      console.log(`[PriceTester] 获取结果:`, result);
      setCurrentPrice(result);
      
      addLog(`✅ 成功: ${result.price} (来源: ${result.source})`);
      toast.success(`成功获取 ${selectedAsset} 当前价格: $${result.price.toLocaleString()}`);
    } catch (error: any) {
      console.error(`[PriceTester] 获取失败:`, error);
      const errorMsg = error.message || '未知错误';
      
      // 检查是否是速率限制错误
      if (errorMsg.includes('rate limit') || errorMsg.includes('429') || errorMsg.includes('Too Many Requests') || errorMsg.includes('速率限制')) {
        addLog(`❌ 速率限制: ${errorMsg}`);
        toast.error(`请求过于频繁，请稍后再试`);
        setRateLimitWait(5000); // 等待 5 秒
      } else {
        addLog(`❌ 失败: ${errorMsg}`);
        toast.error(`获取价格失败: ${errorMsg}`);
      }
      setCurrentPrice(null);
    } finally {
      setLoading(false);
    }
  }, [selectedAsset, assetType, loading]);

  const handleGetHistoricalPrice = useCallback(async () => {
    if (!selectedAsset) {
      toast.error("请选择资产");
      return;
    }

    if (!customDate) {
      toast.error("请选择日期");
      return;
    }

    // 检查速率限制
    if (!checkRateLimit('historical')) {
      return;
    }

    if (loadingHistorical) {
      return;
    }

    setLoadingHistorical(true);
    const date = new Date(customDate);
    addLog(`开始获取历史价格: ${assetType} / ${selectedAsset} / ${customDate}`);
    
    try {
      console.log(`[PriceTester] 调用 CachedPriceService.getHistoricalPrice(${assetType}, ${selectedAsset}, ${date.toISOString()})`);
      const result = await CachedPriceService.getHistoricalPrice(assetType, selectedAsset, date);
      
      console.log(`[PriceTester] 获取结果:`, result);
      setHistoricalPrice(result);
      
      if (result.exists) {
        addLog(`✅ 成功: ${result.price} (日期: ${result.date}, 来源: ${result.source})`);
        toast.success(`成功获取 ${selectedAsset} 历史价格: $${result.price.toLocaleString()}`);
      } else {
        addLog(`⚠️ 数据不存在: ${result.error || "该日期没有数据"}`);
        toast.warning(result.error || "该日期没有数据");
      }
    } catch (error: any) {
      console.error(`[PriceTester] 获取失败:`, error);
      const errorMsg = error.message || '未知错误';
      
      // 检查是否是速率限制错误
      if (errorMsg.includes('rate limit') || errorMsg.includes('429') || errorMsg.includes('Too Many Requests') || errorMsg.includes('速率限制')) {
        addLog(`❌ 速率限制: ${errorMsg}`);
        toast.error(`请求过于频繁，请稍后再试`);
        setRateLimitWait(5000); // 等待 5 秒
      } else {
        addLog(`❌ 失败: ${errorMsg}`);
        toast.error(`获取历史价格失败: ${errorMsg}`);
      }
      setHistoricalPrice(null);
    } finally {
      setLoadingHistorical(false);
    }
  }, [selectedAsset, assetType, customDate, loadingHistorical]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-text-primary">价格服务测试工具</h2>
        <p className="text-text-secondary">测试加密货币和股票/指数的价格获取功能</p>
      </div>

      {/* 资产选择 */}
      <Card>
        <CardHeader>
          <CardTitle>资产选择</CardTitle>
          <CardDescription>选择要查询的资产类型和符号</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>资产类型</Label>
            <select
              value={assetType}
              onChange={(e) => {
                const value = e.target.value as AssetType;
                setAssetType(value);
                // 根据新类型获取选项
                let options: string[] = [];
                switch (value) {
                  case "crypto":
                    options = supportedAssets.crypto;
                    break;
                  case "stock":
                    options = supportedAssets.stock;
                    break;
                  case "index":
                    options = supportedAssets.index;
                    break;
                  case "domestic":
                    options = supportedAssets.domestic || [];
                    break;
                }
                setSelectedAsset(options[0] || "");
                setCurrentPrice(null);
                setHistoricalPrice(null);
                addLog(`切换资产类型: ${value}`);
              }}
              className="w-full px-3 py-2 border border-border-color rounded-md bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="crypto">加密货币 (Crypto)</option>
              <option value="stock">股票 (Stock)</option>
              <option value="index">指数 (Index)</option>
              <option value="domestic">国内 (Domestic)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>资产符号</Label>
            <select
              value={selectedAsset}
              onChange={(e) => {
                setSelectedAsset(e.target.value);
                setCurrentPrice(null);
                setHistoricalPrice(null);
                addLog(`切换资产符号: ${e.target.value}`);
              }}
              className="w-full px-3 py-2 border border-border-color rounded-md bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400"
              disabled={getAssetOptions().length === 0}
            >
              {getAssetOptions().length === 0 ? (
                <option value="">暂无可用资产</option>
              ) : (
                getAssetOptions().map((asset) => (
                  <option key={asset} value={asset}>
                    {asset}
                  </option>
                ))
              )}
            </select>
            <p className="text-xs text-text-tertiary">
              当前选择: {assetType} / {selectedAsset || '未选择'}
              {getAssetOptions().length > 0 && (
                <span className="ml-2">(共 {getAssetOptions().length} 个选项)</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 当前价格查询 */}
      <Card>
        <CardHeader>
          <CardTitle>当前价格查询</CardTitle>
          <CardDescription>获取资产的实时价格</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rateLimitWait > 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-yellow-800 dark:text-yellow-400 text-sm">
                请求过于频繁，请等待 {Math.ceil(rateLimitWait / 1000)} 秒
              </span>
            </div>
          )}
          <Button 
            onClick={handleGetCurrentPrice} 
            disabled={loading || rateLimitWait > 0} 
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                获取中...
              </>
            ) : rateLimitWait > 0 ? (
              <>
                <Clock className="mr-2 h-4 w-4" />
                等待中 ({Math.ceil(rateLimitWait / 1000)}s)
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                获取当前价格
              </>
            )}
          </Button>

          {currentPrice && (
            <div className="p-4 bg-bg-secondary rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">价格</span>
                <span className="text-2xl font-bold text-text-primary">{formatPrice(currentPrice.price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">数据源</span>
                <span className="text-text-primary">{currentPrice.source}</span>
              </div>
              {currentPrice.change24hPercent !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">24h 涨跌</span>
                  <div className="flex items-center gap-2">
                    {currentPrice.change24hPercent >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={`font-semibold ${
                        currentPrice.change24hPercent >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {currentPrice.change24hPercent >= 0 ? "+" : ""}
                      {currentPrice.change24hPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">更新时间</span>
                <span className="text-text-tertiary text-sm">
                  {new Date(currentPrice.timestamp).toLocaleString("zh-CN")}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 历史价格查询（单日） */}
      <Card>
        <CardHeader>
          <CardTitle>历史价格查询（单日）</CardTitle>
          <CardDescription>获取指定日期的历史价格</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>选择日期</Label>
            <Input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          <Button 
            onClick={handleGetHistoricalPrice} 
            disabled={loadingHistorical || !customDate || rateLimitWait > 0} 
            className="w-full"
          >
            {loadingHistorical ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                获取中...
              </>
            ) : rateLimitWait > 0 ? (
              <>
                <Clock className="mr-2 h-4 w-4" />
                等待中 ({Math.ceil(rateLimitWait / 1000)}s)
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                获取历史价格
              </>
            )}
          </Button>

          {historicalPrice && (
            <div className="p-4 bg-bg-secondary rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">日期</span>
                <span className="text-text-primary">{historicalPrice.date}</span>
              </div>
              {historicalPrice.exists ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">价格</span>
                    <span className="text-2xl font-bold text-text-primary">{formatPrice(historicalPrice.price)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">数据源</span>
                    <span className="text-text-primary">{historicalPrice.source}</span>
                  </div>
                </>
              ) : (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <p className="text-yellow-800 dark:text-yellow-400 text-sm">
                      {historicalPrice.error || "该代币在指定日期时还不存在"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 缓存统计 */}
      <Card>
        <CardHeader>
          <CardTitle>缓存统计</CardTitle>
          <CardDescription>查看缓存使用情况</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cacheStats && (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-bg-secondary rounded-lg text-center">
                <div className="text-2xl font-bold text-text-primary">{cacheStats.current}</div>
                <div className="text-xs text-text-tertiary mt-1">当前价格缓存</div>
              </div>
              <div className="p-3 bg-bg-secondary rounded-lg text-center">
                <div className="text-2xl font-bold text-text-primary">{cacheStats.historical}</div>
                <div className="text-xs text-text-tertiary mt-1">历史价格缓存</div>
              </div>
              <div className="p-3 bg-bg-secondary rounded-lg text-center">
                <div className="text-2xl font-bold text-text-primary">{cacheStats.total}</div>
                <div className="text-xs text-text-tertiary mt-1">总缓存数</div>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {/* 清理过期缓存 */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                CachedPriceService.cleanupCache();
                setCacheStats(CachedPriceService.getCacheStats());
                toast.success("已清理过期缓存");
                addLog("清理过期缓存");
              }}
            >
              清理过期缓存
            </Button>

            {/* 分类删除缓存 */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-text-secondary mb-2">按类型删除缓存：</p>
              
              {/* 删除加密货币缓存 */}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={async () => {
                  try {
                    const statsBefore = CachedPriceService.getCacheStats();
                    const confirmed = window.confirm(
                      `确定要删除加密货币缓存吗？\n\n当前缓存总数: ${statsBefore.total} 个\n\n此操作将删除所有加密货币（crypto）类型的缓存数据。`
                    );
                    
                    if (!confirmed) {
                      addLog("用户取消了删除加密货币缓存操作");
                      return;
                    }
                    
                    addLog(`开始删除加密货币缓存`);
                    const clearedCount = CachedPriceService.clearCacheByTypes(['crypto']);
                    
                    await new Promise(resolve => setTimeout(resolve, 100));
                    const statsAfter = CachedPriceService.getCacheStats();
                    setCacheStats(statsAfter);
                    
                    if (clearedCount > 0) {
                      toast.success(`已删除加密货币缓存 (清除了 ${clearedCount} 个)`);
                      addLog(`✅ 删除完成 (清除了 ${clearedCount} 个，剩余: ${statsAfter.total} 个)`);
                    } else {
                      toast.info("没有找到加密货币缓存");
                      addLog(`ℹ️ 没有找到加密货币缓存`);
                    }
                  } catch (error: any) {
                    console.error(`[PriceTester] 删除加密货币缓存失败:`, error);
                    toast.error(`删除失败: ${error.message || '未知错误'}`);
                    addLog(`❌ 删除加密货币缓存失败: ${error.message || '未知错误'}`);
                  }
                }}
              >
                🪙 删除加密货币缓存
              </Button>

              {/* 删除指数缓存（包含国内） */}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={async () => {
                  try {
                    const statsBefore = CachedPriceService.getCacheStats();
                    const confirmed = window.confirm(
                      `确定要删除指数缓存吗？\n\n当前缓存总数: ${statsBefore.total} 个\n\n此操作将删除所有指数（index）和国内（domestic）类型的缓存数据。\n包括：VOO、QQQ、DIA、VGT、SH000001 等。`
                    );
                    
                    if (!confirmed) {
                      addLog("用户取消了删除指数缓存操作");
                      return;
                    }
                    
                    addLog(`开始删除指数缓存（包含国内）`);
                    const clearedCount = CachedPriceService.clearCacheByTypes(['index', 'domestic']);
                    
                    await new Promise(resolve => setTimeout(resolve, 100));
                    const statsAfter = CachedPriceService.getCacheStats();
                    setCacheStats(statsAfter);
                    
                    if (clearedCount > 0) {
                      toast.success(`已删除指数缓存 (清除了 ${clearedCount} 个)`);
                      addLog(`✅ 删除完成 (清除了 ${clearedCount} 个，剩余: ${statsAfter.total} 个)`);
                    } else {
                      toast.info("没有找到指数缓存");
                      addLog(`ℹ️ 没有找到指数缓存`);
                    }
                  } catch (error: any) {
                    console.error(`[PriceTester] 删除指数缓存失败:`, error);
                    toast.error(`删除失败: ${error.message || '未知错误'}`);
                    addLog(`❌ 删除指数缓存失败: ${error.message || '未知错误'}`);
                  }
                }}
              >
                📊 删除指数缓存（包含国内）
              </Button>

              {/* 删除股票缓存 */}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={async () => {
                  try {
                    const statsBefore = CachedPriceService.getCacheStats();
                    const confirmed = window.confirm(
                      `确定要删除股票缓存吗？\n\n当前缓存总数: ${statsBefore.total} 个\n\n此操作将删除所有股票（stock）类型的缓存数据。\n包括：AAPL、MSFT、GOOGL、AMZN、META、TSLA、NVDA 等。`
                    );
                    
                    if (!confirmed) {
                      addLog("用户取消了删除股票缓存操作");
                      return;
                    }
                    
                    addLog(`开始删除股票缓存`);
                    const clearedCount = CachedPriceService.clearCacheByTypes(['stock']);
                    
                    await new Promise(resolve => setTimeout(resolve, 100));
                    const statsAfter = CachedPriceService.getCacheStats();
                    setCacheStats(statsAfter);
                    
                    if (clearedCount > 0) {
                      toast.success(`已删除股票缓存 (清除了 ${clearedCount} 个)`);
                      addLog(`✅ 删除完成 (清除了 ${clearedCount} 个，剩余: ${statsAfter.total} 个)`);
                    } else {
                      toast.info("没有找到股票缓存");
                      addLog(`ℹ️ 没有找到股票缓存`);
                    }
                  } catch (error: any) {
                    console.error(`[PriceTester] 删除股票缓存失败:`, error);
                    toast.error(`删除失败: ${error.message || '未知错误'}`);
                    addLog(`❌ 删除股票缓存失败: ${error.message || '未知错误'}`);
                  }
                }}
              >
                📈 删除股票缓存
              </Button>

              {/* 删除所有缓存 */}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={async () => {
                  try {
                    const statsBefore = CachedPriceService.getCacheStats();
                    const confirmed = window.confirm(
                      `⚠️ 确定要清除所有缓存吗？\n\n当前缓存:\n• 当前价格: ${statsBefore.current} 个\n• 历史价格: ${statsBefore.historical} 个\n• 总计: ${statsBefore.total} 个\n\n此操作将删除所有类型的缓存数据，不可恢复！`
                    );
                    
                    if (!confirmed) {
                      addLog("用户取消了清除所有缓存操作");
                      return;
                    }
                    
                    addLog(`开始清除所有缓存 (当前: ${statsBefore.total} 个)`);
                    const clearedCount = CachedPriceService.clearAllCache();
                    
                    await new Promise(resolve => setTimeout(resolve, 100));
                    const statsAfter = CachedPriceService.getCacheStats();
                    setCacheStats(statsAfter);
                    
                    if (clearedCount > 0) {
                      toast.success(`已清除所有缓存 (清除了 ${clearedCount} 个)`);
                      addLog(`✅ 清除完成 (清除了 ${clearedCount} 个，剩余: ${statsAfter.total} 个)`);
                    } else {
                      toast.info("没有需要清除的缓存");
                      addLog(`ℹ️ 没有需要清除的缓存`);
                    }
                  } catch (error: any) {
                    console.error(`[PriceTester] 清除所有缓存失败:`, error);
                    toast.error(`清除失败: ${error.message || '未知错误'}`);
                    addLog(`❌ 清除所有缓存失败: ${error.message || '未知错误'}`);
                  }
                }}
              >
                🗑️ 清除所有缓存
              </Button>
            </div>
          </div>
          <div className="text-xs text-text-tertiary space-y-1">
            <p>• 当前价格缓存有效期：12 小时</p>
            <p>• 历史价格缓存：永久（仅缓存过去 1年、3年、5年、10年的数据）</p>
            <p>• 缓存可有效减少 API 请求，避免触发速率限制</p>
          </div>
        </CardContent>
      </Card>

      {/* 定时器管理 */}
      <Card>
        <CardHeader>
          <CardTitle>定时器管理</CardTitle>
          <CardDescription>手动触发定时数据获取任务（用于测试和调试）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs text-text-tertiary space-y-1 mb-4">
            <p>• 定时器会在服务器端自动运行（股票 3:00，指数 3:30，加密 4:00，国内指数 4:30）</p>
            <p>• 手动触发会立即执行数据获取任务，获取过去 3个月、6个月、1年、3年、5年的数据</p>
            <p>• 每个请求间隔 5 秒，数据返回后才继续下一个</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* 触发股票数据获取 */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={async () => {
                if (timerLoading.stock) return;
                setTimerLoading(prev => ({ ...prev, stock: true }));
                addLog("开始手动触发股票数据获取任务...");
                
                try {
                  const response = await fetch('/api/scheduled-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'trigger', task: 'stock' }),
                  });
                  
                  const result = await response.json();
                  
                  if (result.success) {
                    toast.success("股票数据获取任务已触发");
                    addLog("✅ 股票数据获取任务已触发");
                  } else {
                    toast.error(result.error || "触发失败");
                    addLog(`❌ 触发失败: ${result.error || '未知错误'}`);
                  }
                } catch (error: any) {
                  console.error('[PriceTester] 触发股票任务失败:', error);
                  toast.error(`触发失败: ${error.message || '未知错误'}`);
                  addLog(`❌ 触发失败: ${error.message || '未知错误'}`);
                } finally {
                  setTimerLoading(prev => ({ ...prev, stock: false }));
                }
              }}
              disabled={timerLoading.stock}
            >
              {timerLoading.stock ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  执行中...
                </>
              ) : (
                <>
                  <Timer className="mr-2 h-4 w-4" />
                  触发股票任务
                </>
              )}
            </Button>

            {/* 触发指数数据获取 */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={async () => {
                if (timerLoading.index) return;
                setTimerLoading(prev => ({ ...prev, index: true }));
                addLog("开始手动触发指数数据获取任务...");
                
                try {
                  const response = await fetch('/api/scheduled-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'trigger', task: 'index' }),
                  });
                  
                  const result = await response.json();
                  
                  if (result.success) {
                    toast.success("指数数据获取任务已触发");
                    addLog("✅ 指数数据获取任务已触发");
                  } else {
                    toast.error(result.error || "触发失败");
                    addLog(`❌ 触发失败: ${result.error || '未知错误'}`);
                  }
                } catch (error: any) {
                  console.error('[PriceTester] 触发指数任务失败:', error);
                  toast.error(`触发失败: ${error.message || '未知错误'}`);
                  addLog(`❌ 触发失败: ${error.message || '未知错误'}`);
                } finally {
                  setTimerLoading(prev => ({ ...prev, index: false }));
                }
              }}
              disabled={timerLoading.index}
            >
              {timerLoading.index ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  执行中...
                </>
              ) : (
                <>
                  <Timer className="mr-2 h-4 w-4" />
                  触发指数任务
                </>
              )}
            </Button>

            {/* 触发加密数据获取 */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={async () => {
                if (timerLoading.crypto) return;
                setTimerLoading(prev => ({ ...prev, crypto: true }));
                addLog("开始手动触发加密数据获取任务...");
                
                try {
                  const response = await fetch('/api/scheduled-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'trigger', task: 'crypto' }),
                  });
                  
                  const result = await response.json();
                  
                  if (result.success) {
                    toast.success("加密数据获取任务已触发");
                    addLog("✅ 加密数据获取任务已触发");
                  } else {
                    toast.error(result.error || "触发失败");
                    addLog(`❌ 触发失败: ${result.error || '未知错误'}`);
                  }
                } catch (error: any) {
                  console.error('[PriceTester] 触发加密任务失败:', error);
                  toast.error(`触发失败: ${error.message || '未知错误'}`);
                  addLog(`❌ 触发失败: ${error.message || '未知错误'}`);
                } finally {
                  setTimerLoading(prev => ({ ...prev, crypto: false }));
                }
              }}
              disabled={timerLoading.crypto}
            >
              {timerLoading.crypto ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  执行中...
                </>
              ) : (
                <>
                  <Timer className="mr-2 h-4 w-4" />
                  触发加密任务
                </>
              )}
            </Button>

            {/* 触发国内指数数据获取 */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={async () => {
                if (timerLoading.domestic) return;
                setTimerLoading(prev => ({ ...prev, domestic: true }));
                addLog("开始手动触发国内指数数据获取任务...");
                
                try {
                  const response = await fetch('/api/scheduled-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'trigger', task: 'domestic' }),
                  });
                  
                  const result = await response.json();
                  
                  if (result.success) {
                    toast.success("国内指数数据获取任务已触发");
                    addLog("✅ 国内指数数据获取任务已触发");
                  } else {
                    toast.error(result.error || "触发失败");
                    addLog(`❌ 触发失败: ${result.error || '未知错误'}`);
                  }
                } catch (error: any) {
                  console.error('[PriceTester] 触发国内指数任务失败:', error);
                  toast.error(`触发失败: ${error.message || '未知错误'}`);
                  addLog(`❌ 触发失败: ${error.message || '未知错误'}`);
                } finally {
                  setTimerLoading(prev => ({ ...prev, domestic: false }));
                }
              }}
              disabled={timerLoading.domestic}
            >
              {timerLoading.domestic ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  执行中...
                </>
              ) : (
                <>
                  <Timer className="mr-2 h-4 w-4" />
                  触发国内指数任务
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 请求日志 */}
      <Card>
        <CardHeader>
          <CardTitle>请求日志</CardTitle>
          <CardDescription>查看详细的请求和响应信息（用于调试）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {requestLog.length === 0 ? (
              <p className="text-text-tertiary text-sm">暂无日志</p>
            ) : (
              requestLog.map((log, index) => (
                <div
                  key={index}
                  className="text-xs font-mono p-2 bg-bg-secondary rounded border border-border-color"
                >
                  <span className={log.includes("✅") ? "text-green-600 dark:text-green-400" : log.includes("❌") ? "text-red-600 dark:text-red-400" : log.includes("⚠️") ? "text-yellow-600 dark:text-yellow-400" : "text-text-secondary"}>
                    {log}
                  </span>
                </div>
              ))
            )}
          </div>
          {requestLog.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              onClick={() => setRequestLog([])}
            >
              清空日志
            </Button>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

