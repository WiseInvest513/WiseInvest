"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Coins, RefreshCw, Loader2, BarChart3, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoiChart } from "@/components/god-mode/RoiChart";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CRYPTO_YIELDS } from "@/lib/mock/god-mode-data";
import { CryptoYieldService } from "@/lib/services/CryptoYieldService";
import type { AssetYieldData } from "@/lib/mock/god-mode-data";

/**
 * Crypto Yields Page
 * 加密货币收益率矩阵页面
 */

const LAST_UPDATE_KEY = "crypto_yields_last_update";
const CACHED_DATA_KEY = "crypto_yields_cached_data";
const UPDATE_COOLDOWN = 24 * 60 * 60 * 1000; // 24小时（毫秒）

export default function CryptoYieldsPage() {
  const [isUpdating, setIsUpdating] = useState(false);
  // 调试期间：注释掉24小时更新限制，允许随时更新
  // const [canUpdate, setCanUpdate] = useState(true);
  // const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [cryptoYields, setCryptoYields] = useState<AssetYieldData[]>(CRYPTO_YIELDS);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]); // 选中的资产符号
  const [showCompareDialog, setShowCompareDialog] = useState(false); // 是否显示对比弹窗

  // 从 localStorage 加载缓存的数据
  useEffect(() => {
    const loadCachedData = () => {
      try {
        const cached = localStorage.getItem(CACHED_DATA_KEY);
        if (cached) {
          const data = JSON.parse(cached);
          if (Array.isArray(data) && data.length > 0) {
            console.log("[CryptoYieldsPage] 从缓存加载数据:", data.length, "个资产");
            setCryptoYields(data);
            return;
          }
        }
      } catch (error) {
        console.error("[CryptoYieldsPage] 加载缓存数据失败:", error);
      }
      // 如果没有缓存数据，使用默认的 mock 数据
      console.log("[CryptoYieldsPage] 使用默认 mock 数据");
      setCryptoYields(CRYPTO_YIELDS);
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

  // 更新数据
  const handleUpdateData = async () => {
    // 调试期间：注释掉24小时更新限制检查
    // if (!canUpdate) {
    //   return;
    // }

    setIsUpdating(true);

    try {
      console.log("[CryptoYieldsPage] 开始更新数据...");
      const assets = CryptoYieldService.getSupportedAssets();
      const promises = assets.map((asset) =>
        CryptoYieldService.calculateYield(asset.symbol, asset.name)
      );
      const settledResults = await Promise.allSettled(promises);

      const validResults: AssetYieldData[] = [];
      settledResults.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value) {
          const value = result.value;
          validResults.push({
            symbol: value.symbol,
            name: value.name,
            price: value.currentPrice,
            changes: {
              m3: value.timeframes.m3.yieldPercent,
              m6: value.timeframes.m6.yieldPercent,
              y1: value.timeframes.y1.yieldPercent,
              y3: value.timeframes.y3.yieldPercent,
              y5: value.timeframes.y5.yieldPercent,
            },
          });
        } else {
          const asset = assets[index];
          console.error(`[CryptoYieldsPage] ${asset.symbol} 计算失败`);
        }
      });

      // 保存到 localStorage 缓存
      localStorage.setItem(CACHED_DATA_KEY, JSON.stringify(validResults));
      localStorage.setItem(LAST_UPDATE_KEY, Date.now().toString());

      // 更新页面显示的数据
      setCryptoYields(validResults);
      // 调试期间：注释掉更新后禁用按钮的逻辑
      // setCanUpdate(false);
      // setTimeRemaining("24小时");

      console.log("[CryptoYieldsPage] 数据更新成功，已保存到缓存");
    } catch (error: any) {
      console.error("[CryptoYieldsPage] 更新失败:", error);
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
                <Coins className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle className="text-3xl font-serif font-bold">
                    Crypto ROI Matrix
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    主要加密货币的多时间框架收益率追踪
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button
                  onClick={handleUpdateData}
                  disabled={isUpdating}
                  // 调试期间：注释掉 canUpdate 相关的限制
                  // disabled={isUpdating || !canUpdate}
                  // variant={canUpdate ? "default" : "outline"}
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
                {/* 调试期间：注释掉倒计时显示 */}
                {/* {!canUpdate && timeRemaining && (
                  <p className="text-xs text-muted-foreground">
                    距离下次更新: {timeRemaining}
                  </p>
                )} */}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 资产选择 */}
        <Card className="backdrop-blur-xl border-border">
          <CardHeader>
            <CardTitle>选择要对比的资产</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              勾选想要对比的加密货币（最多选择 2 个进行详细对比，不选择则显示全部）
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                {cryptoYields.map((asset) => {
                  const isSelected = selectedSymbols.includes(asset.symbol);
                  const isDisabled = !isSelected && selectedSymbols.length >= 2;
                  
                  return (
                    <label
                      key={asset.symbol}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary text-primary'
                          : isDisabled
                          ? 'opacity-50 cursor-not-allowed bg-muted border-border'
                          : 'bg-background border-border hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (selectedSymbols.length < 2) {
                              setSelectedSymbols([...selectedSymbols, asset.symbol]);
                            }
                          } else {
                            setSelectedSymbols(selectedSymbols.filter(s => s !== asset.symbol));
                          }
                        }}
                        className="w-4 h-4 rounded border-border"
                      />
                      <span className="text-sm font-medium">{asset.name}</span>
                      <span className="text-xs text-muted-foreground">({asset.symbol})</span>
                    </label>
                  );
                })}
              </div>
              
              {selectedSymbols.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSymbols([])}
                  >
                    <X className="w-4 h-4 mr-2" />
                    清除选择
                  </Button>
                  {selectedSymbols.length === 2 && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShowCompareDialog(true)}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      查看详细对比
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ROI Chart */}
        <Card className="backdrop-blur-xl border-border">
          <CardHeader>
            <CardTitle>加密货币收益率趋势</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {selectedSymbols.length > 0 
                ? `展示选中的 ${selectedSymbols.length} 个加密货币在不同时间框架下的收益率变化趋势`
                : '展示主要加密货币在不同时间框架下的收益率变化趋势'}
            </p>
          </CardHeader>
          <CardContent>
            <RoiChart 
              data={cryptoYields} 
              title="加密货币收益率"
              selectedSymbols={selectedSymbols.length > 0 ? selectedSymbols : undefined}
            />
          </CardContent>
        </Card>

        {/* 对比弹窗 */}
        <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-background">
            <DialogHeader>
              <DialogTitle>详细对比</DialogTitle>
              <DialogDescription>
                对比两个加密货币在所有时间节点的收益率数据
              </DialogDescription>
            </DialogHeader>
            
            {selectedSymbols.length === 2 && (() => {
              const asset1 = cryptoYields.find(a => a.symbol === selectedSymbols[0]);
              const asset2 = cryptoYields.find(a => a.symbol === selectedSymbols[1]);
              
              if (!asset1 || !asset2) return null;
              
              const timeframes = [
                { key: 'm3', label: '3个月前' },
                { key: 'm6', label: '6个月前' },
                { key: 'y1', label: '1年前' },
                { key: 'y3', label: '3年前' },
                { key: 'y5', label: '5年前' },
              ];
              
              return (
                <div className="space-y-2 mt-4">
                  {/* 对比图表 */}
                  <div className="bg-background rounded-lg border border-border p-4">
                    <h3 className="text-lg font-semibold mb-2 text-foreground">对比图表</h3>
                    <div className="w-full" style={{ height: '450px', minHeight: '450px', position: 'relative' }}>
                      {asset1 && asset2 ? (
                        <RoiChart 
                          data={[asset1, asset2]} 
                          title=""
                          selectedSymbols={undefined}
                          showTooltip={true}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <p>数据加载中...</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 详细数据表格 */}
                  <div className="border border-border rounded-lg overflow-hidden bg-background mt-2">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">时间框架</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">
                            {asset1.name} ({asset1.symbol})
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">
                            {asset2.name} ({asset2.symbol})
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">差值</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timeframes.map((tf, index) => {
                          const value1 = asset1.changes[tf.key as keyof typeof asset1.changes];
                          const value2 = asset2.changes[tf.key as keyof typeof asset2.changes];
                          const diff = value1 - value2;
                          
                          return (
                            <tr 
                              key={tf.key}
                              className={`border-b border-border ${
                                index % 2 === 0 ? 'bg-background' : 'bg-muted/50'
                              }`}
                            >
                              <td className="px-4 py-3 text-sm font-medium text-foreground">{tf.label}</td>
                              <td className="px-4 py-3 text-center text-sm">
                                <span className={`font-medium ${value1 >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                  {value1 >= 0 ? '+' : ''}{value1.toFixed(2)}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-sm">
                                <span className={`font-medium ${value2 >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                  {value2 >= 0 ? '+' : ''}{value2.toFixed(2)}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-sm font-semibold">
                                <span className={diff >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
                                  {diff >= 0 ? '+' : ''}{diff.toFixed(2)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* 当前价格对比 */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-background border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-foreground">{asset1.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">${asset1.price.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground mt-1">当前价格</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-background border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-foreground">{asset2.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">${asset2.price.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground mt-1">当前价格</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

