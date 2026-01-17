"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calculator, RefreshCw, CheckCircle2, XCircle, Loader2, Copy, Download, Code } from "lucide-react";
import { CryptoYieldService, type CryptoYieldResult } from "@/lib/services/CryptoYieldService";
import type { AssetYieldData } from "@/lib/mock/god-mode-data";

export default function CryptoYieldsTestPage() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCalculatingSingle, setIsCalculatingSingle] = useState<string | null>(null);
  const [results, setResults] = useState<CryptoYieldResult[]>([]);
  const [singleResult, setSingleResult] = useState<CryptoYieldResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTC");
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [codeOutput, setCodeOutput] = useState<string>("");

  const assets = CryptoYieldService.getSupportedAssets();
  const timeframes = CryptoYieldService.getTimeframes();

  // 计算所有资产
  const handleCalculateAll = async () => {
    setIsCalculating(true);
    setError(null);
    setResults([]);
    setSingleResult(null);
    setDuration(null);
    const startTime = Date.now();

    try {
      console.log("[测试页面] 开始计算所有资产的收益率...");
      const promises = assets.map((asset) => CryptoYieldService.calculateYield(asset.symbol, asset.name));
      const settledResults = await Promise.allSettled(promises);

      const validResults: CryptoYieldResult[] = [];
      settledResults.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value) {
          validResults.push(result.value);
        } else {
          const asset = assets[index];
          console.error(`[测试页面] ${asset.symbol} 计算失败:`, result.status === "rejected" ? result.reason : "返回值为空");
        }
      });

      setResults(validResults);
      
      // 生成结构化数据代码
      const code = generateCodeOutput(validResults);
      setCodeOutput(code);
      
      const endTime = Date.now();
      setDuration(endTime - startTime);
      console.log(`[测试页面] 所有资产计算完成，耗时: ${endTime - startTime}ms`);
    } catch (err: any) {
      console.error("[测试页面] 计算失败:", err);
      setError(err.message || "计算失败");
    } finally {
      setIsCalculating(false);
    }
  };

  // 计算单个资产
  const handleCalculateSingle = async (symbol: string) => {
    setIsCalculatingSingle(symbol);
    setError(null);
    setSingleResult(null);
    const startTime = Date.now();

    try {
      const asset = assets.find((a) => a.symbol === symbol);
      if (!asset) {
        throw new Error(`不支持的币种: ${symbol}`);
      }

      console.log(`[测试页面] 开始计算 ${symbol} 的收益率...`);
      const result = await CryptoYieldService.calculateYield(asset.symbol, asset.name);

      if (!result) {
        throw new Error(`无法计算 ${symbol} 的收益率`);
      }

      setSingleResult(result);
      const endTime = Date.now();
      console.log(`[测试页面] ${symbol} 计算完成，耗时: ${endTime - startTime}ms`);
    } catch (err: any) {
      console.error(`[测试页面] ${symbol} 计算失败:`, err);
      setError(err.message || `计算 ${symbol} 失败`);
    } finally {
      setIsCalculatingSingle(null);
    }
  };

  // 测试单个时间点
  const handleTestTimeframe = async (symbol: string, timeframeKey: string) => {
    setError(null);
    const asset = assets.find((a) => a.symbol === symbol);
    const timeframe = timeframes.find((tf) => tf.key === timeframeKey);
    
    if (!asset || !timeframe) {
      setError("资产或时间框架不存在");
      return;
    }

    try {
      console.log(`[测试页面] 测试 ${symbol} ${timeframe.label} 的价格获取...`);
      const result = await CryptoYieldService.calculateYield(asset.symbol, asset.name);
      
      if (result) {
        const timeframeData = result.timeframes[timeframeKey as keyof typeof result.timeframes];
        console.log(`[测试页面] ${symbol} ${timeframe.label} 结果:`, timeframeData);
        alert(
          `${symbol} ${timeframe.label}:\n` +
          `历史价格: $${timeframeData.historicalPrice.toFixed(2)} (${timeframeData.historicalDate})\n` +
          `当前价格: $${timeframeData.currentPrice.toFixed(2)}\n` +
          `收益率: ${timeframeData.yieldPercent >= 0 ? "+" : ""}${timeframeData.yieldPercent.toFixed(2)}%\n` +
          `来源: ${timeframeData.historicalSource}`
        );
      }
    } catch (err: any) {
      console.error(`[测试页面] 测试失败:`, err);
      setError(err.message || "测试失败");
    }
  };

  // 复制结果
  const handleCopyResults = () => {
    const dataToCopy = singleResult || (results.length > 0 ? results : null);
    if (!dataToCopy) return;

    const text = JSON.stringify(dataToCopy, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 生成结构化数据代码
  const generateCodeOutput = (results: CryptoYieldResult[]): string => {
    const data: AssetYieldData[] = results.map((result) => ({
      symbol: result.symbol,
      name: result.name,
      price: result.currentPrice,
      changes: {
        m3: result.timeframes.m3.yieldPercent,
        m6: result.timeframes.m6.yieldPercent,
        y1: result.timeframes.y1.yieldPercent,
        y3: result.timeframes.y3.yieldPercent,
        y5: result.timeframes.y5.yieldPercent,
      },
    }));

    return `export const CRYPTO_YIELDS: AssetYieldData[] = [\n${data
      .map(
        (item, index) =>
          `  { symbol: "${item.symbol}", name: "${item.name}", price: ${item.price}, changes: { m3: ${item.changes.m3}, m6: ${item.changes.m6}, y1: ${item.changes.y1}, y3: ${item.changes.y3}, y5: ${item.changes.y5} } }${index < data.length - 1 ? "," : ""}`
      )
      .join("\n")}\n];`;
  };

  // 复制代码
  const handleCopyCode = () => {
    if (!codeOutput) return;
    navigator.clipboard.writeText(codeOutput);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // 下载结果
  const handleDownloadResults = () => {
    const dataToDownload = singleResult || (results.length > 0 ? results : null);
    if (!dataToDownload) return;

    const text = JSON.stringify(dataToDownload, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crypto-yields-${singleResult ? singleResult.symbol : "all"}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatYield = (yieldData: any) => {
    if (!yieldData.exists) {
      return <span className="text-muted-foreground">N/A</span>;
    }
    const isProfit = yieldData.yieldPercent > 0;
    return (
      <span className={isProfit ? "text-green-600" : "text-red-600"}>
        {isProfit ? "+" : ""}
        {yieldData.yieldPercent.toFixed(2)}%
      </span>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>加密货币收益率计算测试</CardTitle>
          <CardDescription>
            测试当前价格和历史价格的获取，计算收益率
            <br />
            <span className="text-xs text-muted-foreground">
              当前价格：使用 CachedPriceService.getCurrentPrice（浏览器端调用）
              <br />
              历史价格：使用 CachedPriceService.getHistoricalPrice（浏览器端调用）
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 计算所有资产 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">计算所有资产</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleCalculateAll} disabled={isCalculating} className="w-full" size="lg">
                  {isCalculating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      正在计算中...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      计算所有资产
                    </>
                  )}
                </Button>
                {duration && (
                  <p className="text-sm text-muted-foreground text-center">耗时: {duration}ms</p>
                )}
              </CardContent>
            </Card>

            {/* 计算单个资产 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">计算单个资产</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>选择币种</Label>
                  <div className="flex flex-wrap gap-2">
                    {assets.map((asset) => (
                      <Button
                        key={asset.symbol}
                        onClick={() => handleCalculateSingle(asset.symbol)}
                        disabled={isCalculatingSingle === asset.symbol}
                        variant={selectedSymbol === asset.symbol ? "default" : "outline"}
                        size="sm"
                      >
                        {isCalculatingSingle === asset.symbol ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          asset.symbol
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 分开测试不同时间点 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">分开测试不同时间点</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>选择币种和时间框架</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {assets.map((asset) =>
                    timeframes.map((tf) => (
                      <Button
                        key={`${asset.symbol}-${tf.key}`}
                        onClick={() => handleTestTimeframe(asset.symbol, tf.key)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        {asset.symbol} {tf.label}
                      </Button>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Card className="border-red-500">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 结构化数据代码输出 */}
          {codeOutput && (
            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      结构化数据代码
                    </CardTitle>
                    <CardDescription className="mt-2">
                      请将下面的代码复制到 <code className="bg-muted px-1 py-0.5 rounded text-xs">lib/mock/god-mode-data.ts</code> 文件中，替换 <code className="bg-muted px-1 py-0.5 rounded text-xs">CRYPTO_YIELDS</code> 数组
                    </CardDescription>
                  </div>
                  <Button onClick={handleCopyCode} variant="default" size="sm">
                    {codeCopied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        复制代码
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{codeOutput}</code>
                </pre>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>📝 使用说明：</strong>
                  </p>
                  <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                    <li>点击上面的"复制代码"按钮</li>
                    <li>打开文件：<code className="bg-blue-100 dark:bg-blue-800 px-1 py-0.5 rounded">lib/mock/god-mode-data.ts</code></li>
                    <li>找到 <code className="bg-blue-100 dark:bg-blue-800 px-1 py-0.5 rounded">CRYPTO_YIELDS</code> 数组（大约在第 50 行）</li>
                    <li>替换整个数组内容为复制的代码</li>
                    <li>保存文件后，<a href="/tools/god-mode/crypto-yields" className="underline font-semibold" target="_blank">查看效果</a></li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 结果显示 */}
          {(results.length > 0 || singleResult) && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">计算结果</CardTitle>
                  <div className="flex space-x-2">
                    <Button onClick={handleCopyResults} variant="outline" size="sm">
                      {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      复制JSON
                    </Button>
                    <Button onClick={handleDownloadResults} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      下载JSON
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(singleResult ? [singleResult] : results).map((result) => (
                    <Card key={result.symbol} className="border">
                      <CardHeader>
                        <CardTitle className="text-base">
                          {result.symbol} ({result.name})
                        </CardTitle>
                        <CardDescription>
                          当前价格: ${result.currentPrice.toFixed(2)} ({result.currentPriceSource})
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {timeframes.map((tf) => {
                            const data = result.timeframes[tf.key as keyof typeof result.timeframes];
                            return (
                              <div key={tf.key}>
                                <p className="text-sm text-muted-foreground">{tf.label}</p>
                                <p className="text-lg font-semibold">{formatYield(data)}</p>
                                {data.exists && (
                                  <>
                                    <p className="text-xs text-muted-foreground">
                                      历史: ${data.historicalPrice.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {data.historicalDate}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {data.historicalSource}
                                    </p>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
