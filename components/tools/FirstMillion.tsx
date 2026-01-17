"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Calendar, DollarSign, TrendingUp, Target, Clock, PiggyBank, Download, Copy, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toPng } from "html-to-image";

const TARGET_AMOUNT = 1000000; // 1,000,000 CNY
const MAX_YEARS = 100;

interface CalculationResult {
  targetAge: number | null;
  years: number;
  months: number;
  totalMonths: number;
  totalPrincipal: number;
  totalInterest: number;
  finalBalance: number;
  isPossible: boolean;
}

export function FirstMillion() {
  const [currentAge, setCurrentAge] = useState(25);
  const [currentPrincipal, setCurrentPrincipal] = useState(0);
  const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
  const [annualRate, setAnnualRate] = useState(8);
  const shareRef = useRef<HTMLDivElement>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const calculation = useMemo<CalculationResult>(() => {
    let balance = currentPrincipal;
    let months = 0;
    const monthlyRate = annualRate / 100 / 12;

    // Edge case: Already reached the target
    if (balance >= TARGET_AMOUNT) {
      return {
        targetAge: currentAge,
        years: 0,
        months: 0,
        totalMonths: 0,
        totalPrincipal: currentPrincipal,
        totalInterest: 0,
        finalBalance: balance,
        isPossible: true,
      };
    }

    // Edge case: No investment and no growth
    if (monthlyInvestment === 0 && annualRate === 0) {
      return {
        targetAge: null,
        years: 0,
        months: 0,
        totalMonths: 0,
        totalPrincipal: currentPrincipal,
        totalInterest: 0,
        finalBalance: balance,
        isPossible: false,
      };
    }

    // Calculate months needed
    while (balance < TARGET_AMOUNT && months < MAX_YEARS * 12) {
      balance = (balance + monthlyInvestment) * (1 + monthlyRate);
      months++;
    }

    const isPossible = balance >= TARGET_AMOUNT;
    const totalPrincipal = currentPrincipal + monthlyInvestment * months;
    const totalInterest = balance - totalPrincipal;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    const targetAge = isPossible ? currentAge + years + (remainingMonths > 0 ? 1 : 0) : null;

    return {
      targetAge,
      years,
      months: remainingMonths,
      totalMonths: months,
      totalPrincipal,
      totalInterest,
      finalBalance: balance,
      isPossible,
    };
  }, [currentAge, currentPrincipal, monthlyInvestment, annualRate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("zh-CN", {
      maximumFractionDigits: 0,
    }).format(value);
  };

  // 生成图片预览
  const generateImagePreview = async () => {
    if (!shareRef.current) {
      console.error("shareRef.current is null");
      return null;
    }

    try {
      setIsGenerating(true);
      
      // 等待一下确保元素已完全渲染
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 直接使用原始元素生成图片，降低像素比来减小尺寸
      const dataUrl = await toPng(shareRef.current, {
        backgroundColor: "#ffffff",
        quality: 1.0,
        pixelRatio: 1.2, // 降低像素比，减小图片尺寸
        cacheBust: true, // 强制刷新缓存
      });
      
      if (!dataUrl || dataUrl.length === 0) {
        console.error("toPng returned empty result");
        return null;
      }
      
      return dataUrl;
    } catch (error) {
      console.error("Failed to generate image:", error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // 复制图片到剪贴板
  const handleCopyImage = async () => {
    if (!imagePreview) return;

    try {
      // 将 base64 转换为 Blob
      const response = await fetch(imagePreview);
      const blob = await response.blob();
      
      // 复制图片到剪贴板
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy image:", error);
      // 如果复制图片失败，尝试降级到复制图片 URL
      try {
        await navigator.clipboard.writeText(imagePreview);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error("Failed to copy image URL:", fallbackError);
      }
    }
  };

  // 下载图片
  const handleDownloadImage = async () => {
    if (!imagePreview) return;

    try {
      const link = document.createElement("a");
      link.download = `第一桶金倒计时-${currentAge}岁-每月定投${monthlyInvestment}-年化${annualRate}%.png`;
      link.href = imagePreview;
      link.click();
      setShowShareDialog(false);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  // 打开分享对话框并生成预览
  const handleShare = async () => {
    setShowShareDialog(true);
    // 等待对话框打开后再生成预览
    setTimeout(async () => {
      const preview = await generateImagePreview();
      if (preview) {
        setImagePreview(preview);
      } else {
        console.error("Failed to generate preview image");
      }
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Side: Inputs */}
        <div className="flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="h-5 w-5 text-yellow-500" />
                计算参数
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 flex-1">
              {/* Current Age */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="age" className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4" />
                    当前年龄
                  </Label>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                    {currentAge} 岁
                  </span>
                </div>
                <div className="space-y-2">
                  <Slider
                    id="age"
                    min={18}
                    max={80}
                    step={1}
                    value={currentAge}
                    onValueChange={(value) => setCurrentAge(value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>18</span>
                    <span>80</span>
                  </div>
                </div>
                <Input
                  type="number"
                  min={18}
                  max={80}
                  value={currentAge}
                  onChange={(e) => {
                    const val = Math.max(18, Math.min(80, parseInt(e.target.value) || 18));
                    setCurrentAge(val);
                  }}
                  className="text-center font-semibold"
                />
              </div>

              {/* Current Principal */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="principal" className="flex items-center gap-2 text-base">
                    <PiggyBank className="h-4 w-4" />
                    现有本金 (CNY)
                  </Label>
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-50">
                    {formatNumber(currentPrincipal)}
                  </span>
                </div>
                <div className="space-y-2">
                  <Slider
                    id="principal"
                    min={0}
                    max={1000000}
                    step={10000}
                    value={currentPrincipal}
                    onValueChange={(value) => setCurrentPrincipal(value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>0</span>
                    <span>100万</span>
                  </div>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={1000000}
                  step={10000}
                  value={currentPrincipal}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(1000000, parseInt(e.target.value) || 0));
                    setCurrentPrincipal(val);
                  }}
                  className="text-center font-semibold"
                />
              </div>

              {/* Monthly Investment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="monthly" className="flex items-center gap-2 text-base">
                    <DollarSign className="h-4 w-4" />
                    每月定投 (CNY)
                  </Label>
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-50">
                    {formatNumber(monthlyInvestment)}
                  </span>
                </div>
                <div className="space-y-2">
                  <Slider
                    id="monthly"
                    min={0}
                    max={50000}
                    step={500}
                    value={monthlyInvestment}
                    onValueChange={(value) => setMonthlyInvestment(value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>0</span>
                    <span>5万</span>
                  </div>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={50000}
                  step={500}
                  value={monthlyInvestment}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(50000, parseInt(e.target.value) || 0));
                    setMonthlyInvestment(val);
                  }}
                  className="text-center font-semibold"
                />
              </div>

              {/* Annual Interest Rate */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rate" className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4" />
                    年化收益率 (%)
                  </Label>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {annualRate}%
                  </span>
                </div>
                <div className="space-y-2">
                  <Slider
                    id="rate"
                    min={0}
                    max={20}
                    step={0.1}
                    value={annualRate}
                    onValueChange={(value) => setAnnualRate(value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>0%</span>
                    <span>20%</span>
                  </div>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  step={0.1}
                  value={annualRate}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(20, parseFloat(e.target.value) || 0));
                    setAnnualRate(val);
                  }}
                  className="text-center font-semibold"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Result Card */}
        <div className="flex flex-col">
          <Card ref={shareRef} className="flex-1 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800 shadow-xl flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col">
              {calculation.isPossible ? (
                <div className="space-y-5 text-center flex-1 flex flex-col">
                  {/* 分享说明文字 */}
                  <div className="mb-3 p-3 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      如果你在 <span className="font-bold text-yellow-600 dark:text-yellow-400 text-base">{currentAge}</span> 岁时，拿出 <span className="font-bold text-yellow-600 dark:text-yellow-400 text-base">{formatCurrency(currentPrincipal)}</span> 开始定投，你如果每个月定投 <span className="font-bold text-yellow-600 dark:text-yellow-400 text-base">{formatCurrency(monthlyInvestment)}</span>，在确保 <span className="font-bold text-yellow-600 dark:text-yellow-400 text-base">{annualRate}%</span> 年化收益率的情况下。
                    </p>
                  </div>

                  {/* Main Result */}
                  <div className="space-y-2">
                    <p className="text-sm uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold">
                      您将在
                    </p>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-6xl md:text-7xl font-black text-yellow-600 dark:text-yellow-400 drop-shadow-lg">
                        {calculation.targetAge}
                      </span>
                      <span className="text-3xl font-bold text-slate-700 dark:text-slate-300">
                        岁
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                      达成第一桶金目标 🎯
                    </p>
                  </div>

                  {/* Time Breakdown */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-yellow-200 dark:border-yellow-800">
                    <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-lg">
                      <div className="flex items-center justify-center gap-1.5 mb-1.5">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                          总时间
                        </p>
                      </div>
                      <p className="text-2xl font-black text-slate-900 dark:text-slate-50">
                        {calculation.years} 年
                      </p>
                      {calculation.months > 0 && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {calculation.months} 个月
                        </p>
                      )}
                    </div>
                    <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-lg">
                      <div className="flex items-center justify-center gap-1.5 mb-1.5">
                        <Target className="h-4 w-4 text-yellow-500" />
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                          总月数
                        </p>
                      </div>
                      <p className="text-2xl font-black text-slate-900 dark:text-slate-50">
                        {formatNumber(calculation.totalMonths)}
                      </p>
                      <p className="text-xs text-slate-500">个月</p>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="pt-4 border-t border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      资金构成
                    </p>
                    <div className="space-y-3">
                      {/* Principal vs Interest Bars */}
                      <div className="relative h-10 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800">
                        <div
                          className="absolute left-0 top-0 h-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm transition-all duration-500"
                          style={{
                            width: `${(calculation.totalPrincipal / calculation.finalBalance) * 100}%`,
                          }}
                        >
                          {calculation.totalPrincipal > 0 && (
                            <span className="px-2">
                              {((calculation.totalPrincipal / calculation.finalBalance) * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <div
                          className="absolute right-0 top-0 h-full bg-green-500 flex items-center justify-center text-white font-bold text-sm transition-all duration-500"
                          style={{
                            width: `${(calculation.totalInterest / calculation.finalBalance) * 100}%`,
                          }}
                        >
                          {calculation.totalInterest > 0 && (
                            <span className="px-2">
                              {((calculation.totalInterest / calculation.finalBalance) * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Detailed Numbers */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-xs text-blue-700 dark:text-blue-300 mb-1 font-semibold">
                            总本金
                          </p>
                          <p className="text-lg font-black text-blue-900 dark:text-blue-100">
                            {formatCurrency(calculation.totalPrincipal)}
                          </p>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-xs text-green-700 dark:text-green-300 mb-1 font-semibold">
                            总收益
                          </p>
                          <p className="text-lg font-black text-green-900 dark:text-green-100">
                            {formatCurrency(calculation.totalInterest)}
                          </p>
                        </div>
                      </div>

                      {/* Final Balance */}
                      <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border-2 border-yellow-300 dark:border-yellow-700">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-1 font-semibold uppercase">
                          最终资产
                        </p>
                        <p className="text-2xl font-black text-yellow-900 dark:text-yellow-100">
                          {formatCurrency(calculation.finalBalance)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4 py-8">
                  <div className="text-6xl mb-4">😔</div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                    无法达成目标
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    根据当前参数，在 {MAX_YEARS} 年内无法达到 100 万目标。
                  </p>
                  <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      💡 <strong>建议：</strong>
                    </p>
                    <ul className="text-left text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      <li>• 增加每月定投金额</li>
                      <li>• 提高年化收益率</li>
                      <li>• 增加初始本金</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Share Button - 扁平样式，对齐左侧底部 */}
          <Button
            onClick={handleShare}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold py-3 text-base shadow-md shadow-amber-500/20"
          >
            <Download className="mr-2 h-4 w-4" />
            分享好运
          </Button>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-800 max-h-[90vh] flex flex-col [&>button]:text-slate-300 [&>button]:hover:text-white [&>button]:hover:bg-slate-800">
          <DialogHeader className="flex-shrink-0 pb-2">
            <DialogTitle className="text-amber-400">分享好运</DialogTitle>
            <DialogDescription className="text-slate-400">
              预览图片后，选择复制或下载
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-2 flex-1 flex flex-col min-h-0">
            {/* 图片预览区域 - 限制高度并允许滚动 */}
            <div className="relative w-full bg-slate-800 rounded-lg border border-slate-700 overflow-auto flex-1 min-h-0" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {isGenerating ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-2"></div>
                    <p className="text-sm text-slate-400">正在生成预览...</p>
                  </div>
                </div>
              ) : imagePreview ? (
                <img
                  src={imagePreview}
                  alt="第一桶金倒计时预览"
                  className="w-full h-auto"
                  style={{ maxWidth: '100%' }}
                />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-sm text-slate-400">预览加载失败</p>
                </div>
              )}
            </div>

            {/* 操作按钮 - 固定在底部 */}
            <div className="flex gap-3 flex-shrink-0 pt-2 border-t border-slate-700">
              <Button
                onClick={handleCopyImage}
                variant="outline"
                className="flex-1 border-slate-700 bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                disabled={!imagePreview || isGenerating}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    复制图片
                  </>
                )}
              </Button>
              <Button
                onClick={handleDownloadImage}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold"
                disabled={!imagePreview || isGenerating}
              >
                <Download className="mr-2 h-4 w-4" />
                下载图片
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
