"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calculator, Copy, CheckCircle2, Download, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/**
 * 加密货币收益率计算页面
 * 用于计算并更新 CRYPTO_YIELDS 数据
 */

export default function CalculateCryptoYieldsPage() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [skipCache, setSkipCache] = useState(false);

  const handleCalculate = async () => {
    setIsCalculating(true);
    setError(null);
    setResults(null);

    try {
      const url = skipCache 
        ? '/api/crypto-yields/calculate?skipCache=true'
        : '/api/crypto-yields/calculate';
      
      console.log(`[前端] 开始计算，跳过缓存: ${skipCache}`);
      const startTime = Date.now();
      
      const response = await fetch(url);
      const data = await response.json();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[前端] 计算完成，耗时: ${duration}秒`);

      if (data.success) {
        setResults(data);
      } else {
        setError(data.error || '计算失败');
      }
    } catch (err: any) {
      setError(err.message || '请求失败');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCopyCode = () => {
    if (results?.codeOutput) {
      navigator.clipboard.writeText(results.codeOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadCode = () => {
    if (results?.codeOutput) {
      const blob = new Blob([results.codeOutput], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'CRYPTO_YIELDS.ts';
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <div className="mb-4">
          <Link
            href="/tools/god-mode/crypto-yields"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回收益率页面
          </Link>
        </div>

        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calculator className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="text-2xl font-bold">
                  计算加密货币收益率
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  计算 BTC、ETH、BNB、OKB、SOL 在过去 3个月、6个月、1年、3年、5年的收益率
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Calculate Options */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="skipCache"
                checked={skipCache}
                onChange={(e) => setSkipCache(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label
                htmlFor="skipCache"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                跳过缓存，获取最新数据（如果缓存数据过旧，建议勾选此项）
              </Label>
            </div>
            
            <Button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="w-full"
              size="lg"
            >
              {isCalculating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  正在并行计算中...（所有资产同时获取，请稍候）
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  开始计算（并行模式）
                </>
              )}
            </Button>
            
            {isCalculating && (
              <div className="text-sm text-muted-foreground text-center">
                <p>⚡ 正在并行获取所有资产的数据...</p>
                <p className="mt-1">BTC、ETH、BNB、OKB、SOL 同时计算中</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-red-500">
            <CardContent className="pt-6">
              <p className="text-red-600 dark:text-red-400">❌ {error}</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle>计算结果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Data Preview */}
              <div>
                <h3 className="font-semibold mb-2">数据预览：</h3>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm">
                    {JSON.stringify(results.data, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Code Output */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">代码输出（复制到 lib/mock/god-mode-data.ts）：</h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCopyCode}
                      variant="outline"
                      size="sm"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          复制代码
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleDownloadCode}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      下载
                    </Button>
                  </div>
                </div>
                <div className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm font-mono">
                    {results.codeOutput}
                  </pre>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📝 使用说明：
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <li>复制上面的代码</li>
                  <li>打开文件：<code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">lib/mock/god-mode-data.ts</code></li>
                  <li>找到 <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">CRYPTO_YIELDS</code> 数组</li>
                  <li>替换整个数组内容</li>
                  <li>保存文件，页面会自动更新</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
