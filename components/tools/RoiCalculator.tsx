"use client";

import { useState, useRef } from "react";
import { Clock, TrendingUp, DollarSign, Zap, ArrowUpRight, Loader2, Rocket, Wifi, AlertCircle, Download, Copy, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CachedPriceService, type AssetType } from "@/lib/services/CachedPriceService";
import { toPng } from "html-to-image";

interface Asset {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  color: string;
  borderColor: string;
  bg: string;
}

// Asset ID mapping: frontend id -> CoinGecko API id
const COINGECKO_ID_MAP: Record<string, string> = {
  btc: 'bitcoin',
  eth: 'ethereum',
  sol: 'solana',
};

// DexScreener query mapping
const DEXSCREENER_MAP: Record<string, { query?: string; contractAddress?: string }> = {
  btc: { query: 'bitcoin' },
  eth: { query: 'ethereum', contractAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' },
  sol: { query: 'solana' },
};

// 左边：加密货币（5个）
const CRYPTO_ASSETS: Asset[] = [
  {
    id: "btc",
    name: "Bitcoin",
    symbol: "BTC",
    icon: "₿",
    color: "text-orange-500",
    borderColor: "border-orange-500",
    bg: "bg-orange-50 dark:bg-orange-900/20",
  },
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    icon: "Ξ",
    color: "text-blue-500",
    borderColor: "border-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    id: "sol",
    name: "Solana",
    symbol: "SOL",
    icon: "◎",
    color: "text-purple-500",
    borderColor: "border-purple-500",
    bg: "bg-purple-50 dark:bg-purple-900/20",
  },
  {
    id: "bnb",
    name: "BNB",
    symbol: "BNB",
    icon: "🔶",
    color: "text-yellow-500",
    borderColor: "border-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
  },
  {
    id: "okb",
    name: "OKB",
    symbol: "OKB",
    icon: "🟢",
    color: "text-green-500",
    borderColor: "border-green-500",
    bg: "bg-green-50 dark:bg-green-900/20",
  },
];

// 右边：指数/股票（5个）
const INDEX_ASSETS: Asset[] = [
  {
    id: "voo",
    name: "标普500",
    symbol: "VOO",
    icon: "📊",
    color: "text-cyan-500",
    borderColor: "border-cyan-500",
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
  },
  {
    id: "qqq",
    name: "纳斯达克100",
    symbol: "QQQ",
    icon: "📈",
    color: "text-indigo-500",
    borderColor: "border-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
  },
  {
    id: "dia",
    name: "道琼斯",
    symbol: "DIA",
    icon: "🏛️",
    color: "text-teal-500",
    borderColor: "border-teal-500",
    bg: "bg-teal-50 dark:bg-teal-900/20",
  },
  {
    id: "vgt",
    name: "信息技术板块",
    symbol: "VGT",
    icon: "💻",
    color: "text-pink-500",
    borderColor: "border-pink-500",
    bg: "bg-pink-50 dark:bg-pink-900/20",
  },
  {
    id: "sh000001",
    name: "上证指数",
    symbol: "SH000001",
    icon: "🇨🇳",
    color: "text-red-500",
    borderColor: "border-red-500",
    bg: "bg-red-50 dark:bg-red-900/20",
  },
];

// 合并所有资产（用于默认选择）
const ALL_ASSETS = [...CRYPTO_ASSETS, ...INDEX_ASSETS];

// Fallback Data 已移除，统一使用 unified-price-service

const USD_TO_CNY = 7; // 汇率：1 USD = 7 CNY

const TIME_OPTIONS = [
  { years: 0.5, label: "半年前" },
  { years: 1, label: "1年前" },
  { years: 3, label: "3年前" },
  { years: 5, label: "5年前" },
];

interface CalculationResult {
  historicalPrice: number; // CNY价格
  currentPrice: number; // CNY价格
  historicalPriceUsd: number; // USD价格
  currentPriceUsd: number; // USD价格
  priceMultiplier: number;
  finalValue: number; // USD
  finalValueCNY?: number; // CNY
  profit: number; // USD
  profitCNY?: number; // CNY
  roi: number;
  fallback?: boolean;
  source?: string;
  purchaseDate?: string; // 购买日期
  currentDate?: string; // 当前日期
}

export function RoiCalculator() {
  const [selectedAsset, setSelectedAsset] = useState<Asset>(CRYPTO_ASSETS[0]);
  const [investmentAmount, setInvestmentAmount] = useState(10000);
  const [selectedYears, setSelectedYears] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 导出相关状态
  const shareRef = useRef<HTMLDivElement>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("zh-CN", {
      maximumFractionDigits: 2,
    }).format(value);
  };

  // 生成带水印的图片
  const generateImageWithWatermark = async (baseImageDataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('无法创建画布上下文'));
          return;
        }
        
        // 设置画布尺寸
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 绘制原始图片
        ctx.drawImage(img, 0, 0);
        
        // 获取当前时间
        const now = new Date();
        const timeStr = now.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
        const url = 'localhost:3002/tools/roi-calculator';
        
        // 设置文字样式（使用更大的字体和更好的对比度）
        const fontSize = Math.max(16, canvas.width / 50); // 根据图片大小调整字体
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textBaseline = 'bottom';
        
        // 左下角：作者
        const authorText = 'X@Wise投资有术';
        const authorX = 20;
        const authorY = canvas.height - 15;
        
        // 添加文字阴影和背景以提高可读性
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.textAlign = 'left';
        ctx.fillText(authorText, authorX, authorY);
        
        // 右下角：时间和网址
        ctx.textAlign = 'right';
        const timeUrlText = `${timeStr} | ${url}`;
        const timeUrlX = canvas.width - 20;
        const timeUrlY = canvas.height - 15;
        ctx.fillText(timeUrlText, timeUrlX, timeUrlY);
        
        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // 转换为 data URL
        const watermarkedDataUrl = canvas.toDataURL('image/png');
        resolve(watermarkedDataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };
      
      img.src = baseImageDataUrl;
    });
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
      
      // 生成基础图片
      const baseDataUrl = await toPng(shareRef.current, {
        backgroundColor: "#ffffff",
        quality: 1.0,
        pixelRatio: 1.5,
        cacheBust: true,
      });
      
      if (!baseDataUrl || baseDataUrl.length === 0) {
        console.error("toPng returned empty result");
        return null;
      }
      
      // 添加水印
      const watermarkedDataUrl = await generateImageWithWatermark(baseDataUrl);
      
      return watermarkedDataUrl;
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
      const response = await fetch(imagePreview);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy image:", error);
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
      const yearsLabel = selectedYears === 0.5 ? '半年前' : `${selectedYears}年前`;
      link.download = `ROI计算-${selectedAsset.symbol}-${yearsLabel}-投资${investmentAmount}USD.png`;
      link.href = imagePreview;
      link.click();
      setShowShareDialog(false);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  // 打开分享对话框并生成预览
  const handleShare = async () => {
    if (!calculation) return;
    
    setShowShareDialog(true);
    setTimeout(async () => {
      const preview = await generateImagePreview();
      if (preview) {
        setImagePreview(preview);
      } else {
        console.error("Failed to generate preview image");
      }
    }, 100);
  };


  const handleCalculate = async () => {
    const startTime = performance.now();
    setIsLoading(true);
    setError(null);
    setCalculation(null);

    // Calculate target date - 准确计算到指定时间前的同一天
    // 支持半年（0.5年）、1年、3年、5年
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 标准化为当天 00:00:00
    
    // 计算过去的日期（支持小数年，如0.5年=6个月）
    const monthsAgo = Math.round(selectedYears * 12);
    const pastDate = new Date(today);
    pastDate.setMonth(pastDate.getMonth() - monthsAgo);
    pastDate.setHours(0, 0, 0, 0); // 标准化为当天 00:00:00
    const purchaseDateStr = pastDate.toISOString().split('T')[0];
    const currentDateStr = today.toISOString().split('T')[0];
    
    const yearsLabel = selectedYears === 0.5 ? '半年前' : `${selectedYears}年前`;
    console.log(`[RoiCalculator] 计算日期: 今天=${currentDateStr}, ${yearsLabel}=${purchaseDateStr}`);

    try {
      const symbol = selectedAsset.symbol;
      console.log(`[RoiCalculator] handleCalculate: Starting for asset ${selectedAsset.id}, symbol: ${symbol}`);
      
      if (!symbol) {
        // 优雅降级：不抛出错误，显示提示信息
        setError('资产符号无效，请重新选择');
        setIsLoading(false);
        return;
      }

      // 识别资产类型
      const upper = symbol.toUpperCase();
      let assetType: AssetType = 'crypto';
      if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA'].includes(upper)) {
        assetType = 'stock';
      } else if (['QQQ', 'VOO', 'DIA', 'VGT'].includes(upper)) {
        assetType = 'index';
      } else if (['SH000001'].includes(upper)) {
        assetType = 'domestic';
      }
      
      console.log(`[RoiCalculator] 识别资产类型: ${assetType} for ${symbol}`);

      // 获取当前价格（使用 CachedPriceService - 带缓存层）
      console.log(`[RoiCalculator] 获取 ${symbol} 的当前价格（使用缓存层）...`);
      const currentPriceResult = await CachedPriceService.getCurrentPrice(assetType, symbol);
      
      if (!currentPriceResult || !currentPriceResult.price || currentPriceResult.price <= 0) {
        const errorMsg = '获取当前价格失败，请稍后重试';
        setError(errorMsg);
        setIsLoading(false);
        return;
      }
      
      const currentPriceUsd = currentPriceResult.price;
      let source = currentPriceResult.source || 'Unknown';

      // 获取历史价格（使用 CachedPriceService - 带缓存层）
      console.log(`[RoiCalculator] 获取 ${symbol} 在 ${purchaseDateStr} 的历史价格（使用缓存层）...`);
      const historicalPriceResult = await CachedPriceService.getHistoricalPrice(assetType, symbol, pastDate);
      
      if (!historicalPriceResult || !historicalPriceResult.exists || !historicalPriceResult.price || historicalPriceResult.price <= 0) {
        const errorMsg = historicalPriceResult?.error || `${symbol} 在 ${purchaseDateStr} 时还不存在或数据不可用`;
        setError(errorMsg);
        setIsLoading(false);
        return;
      }
      
      const historicalPriceUsd = historicalPriceResult.price;
      source = `${source} / ${historicalPriceResult.source}`;

      // 投资金额现在是 USD，价格也是 USD，直接计算
      const priceMultiplier = currentPriceUsd / historicalPriceUsd;
      const finalValue = investmentAmount * priceMultiplier;
      const profit = finalValue - investmentAmount;
      const roi = ((finalValue - investmentAmount) / investmentAmount) * 100;

      // 转换为 CNY 用于显示
      const historyPrice = historicalPriceUsd * USD_TO_CNY;
      const currentPrice = currentPriceUsd * USD_TO_CNY;
      const finalValueCNY = finalValue * USD_TO_CNY;
      const profitCNY = profit * USD_TO_CNY;

      setCalculation({
        historicalPrice: historyPrice, // CNY (用于显示)
        currentPrice: currentPrice, // CNY (用于显示)
        historicalPriceUsd: historicalPriceUsd, // USD
        currentPriceUsd: currentPriceUsd, // USD
        priceMultiplier,
        finalValue: finalValue, // USD (主要显示)
        finalValueCNY: finalValueCNY, // CNY (用于显示)
        profit: profit, // USD (主要显示)
        profitCNY: profitCNY, // CNY (用于显示)
        roi,
        fallback: source.includes('Fallback'),
        source: source,
        purchaseDate: purchaseDateStr,
        currentDate: currentDateStr,
      });
    } catch (err: any) {
      console.error('Error calculating:', err);
      // 优雅降级：显示错误但不崩溃
      setError(err.message || '计算失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Controls - MOVED TO TOP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              选择资产
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {/* 左边：加密货币 */}
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  加密货币
                </div>
                {CRYPTO_ASSETS.map((asset) => {
                  const isSelected = selectedAsset.id === asset.id;

                  return (
                    <button
                      key={asset.id}
                      onClick={() => {
                        setSelectedAsset(asset);
                        setCalculation(null);
                        setError(null);
                      }}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? `${asset.bg} ${asset.borderColor} shadow-lg scale-105`
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`text-3xl ${asset.color}`}>
                          {asset.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-slate-900 dark:text-slate-50">
                            {asset.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {asset.symbol}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 右边：指数/股票 */}
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  指数/股票
                </div>
                {INDEX_ASSETS.map((asset) => {
                  const isSelected = selectedAsset.id === asset.id;

                  return (
                    <button
                      key={asset.id}
                      onClick={() => {
                        setSelectedAsset(asset);
                        setCalculation(null);
                        setError(null);
                      }}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? `${asset.bg} ${asset.borderColor} shadow-lg scale-105`
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`text-3xl ${asset.color}`}>
                          {asset.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-slate-900 dark:text-slate-50">
                            {asset.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {asset.symbol}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investment Amount & Time Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              投资参数
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Investment Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">投资金额 (USD)</Label>
              <Input
                id="amount"
                type="number"
                value={investmentAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  // 只允许数字和小数点
                  if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                    const numValue = parseFloat(value) || 0;
                    // 限制最大值：1千万（10,000,000）
                    if (numValue <= 10000000) {
                      setInvestmentAmount(numValue);
                      setCalculation(null);
                      setError(null);
                    }
                  }
                }}
                onBlur={(e) => {
                  // 确保小数点后最多两位
                  const value = parseFloat(e.target.value) || 0;
                  setInvestmentAmount(Math.round(value * 100) / 100);
                }}
                min={0}
                max={10000000}
                step={0.01}
                placeholder="0.00"
                className="text-lg font-semibold"
              />
              <div className="flex gap-2 flex-wrap">
                {[1000, 5000, 10000, 50000, 100000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInvestmentAmount(amount);
                      setCalculation(null);
                      setError(null);
                    }}
                    className={
                      investmentAmount === amount
                        ? "bg-yellow-400 border-yellow-500"
                        : ""
                    }
                  >
                    ${amount >= 10000 ? `${amount / 10000}万` : amount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <Label>投资时间</Label>
              <div className="grid grid-cols-2 gap-3">
                {TIME_OPTIONS.map((option) => {
                  const isSelected = selectedYears === option.years;

                  return (
                    <button
                      key={option.years}
                      onClick={() => {
                        setSelectedYears(option.years);
                        setCalculation(null);
                        setError(null);
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "bg-yellow-400 dark:bg-yellow-500 border-yellow-500 dark:border-yellow-600 text-black font-bold shadow-md"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold">{option.label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Source Info */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Wifi className="h-5 w-5 text-blue-500" />
            <div>
              <Label className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                数据来源：实时价格API
              </Label>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                当前价格：CoinPaprika API（加密货币）、Yahoo Finance（股票/指数）或新浪财经（上证指数）。历史价格：币安 API（加密货币）、Yahoo Finance（股票/指数）或新浪财经（上证指数）。所有价格数据均通过缓存层优化，减少API调用。价格按汇率7转换为CNY。如果资产在指定日期不存在，将显示错误提示。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculate Button */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
        <CardContent className="p-6">
          <Button
            onClick={handleCalculate}
            disabled={isLoading || investmentAmount <= 0}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                正在穿越时空...
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5 mr-2" />
                开始穿越 (开始计算)
              </>
            )}
          </Button>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-3 text-center font-semibold">
              ⚠️ {error}
            </p>
          )}
          {calculation && !error && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 text-center">
              💡 使用历史参考数据（数据来源: {calculation.source || 'Historical Reference Data'}）
            </p>
          )}
        </CardContent>
      </Card>


      {/* Result Card - MOVED TO BOTTOM */}
      {calculation && !error && (
        <div className="space-y-4">
          <Card
            ref={shareRef}
            className={`${selectedAsset.bg} border-2 border-transparent shadow-2xl relative overflow-hidden`}
          >
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-black/20"></div>
          <CardContent className="relative p-8 md:p-12">
            <div className="text-center space-y-6">
              {/* Main ROI Display - HUGE */}
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold">
                  如果 {selectedYears === 0.5 ? '半年前' : `${selectedYears}年前`} 投资
                </p>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className={`text-5xl ${selectedAsset.color} font-black`}>
                    {selectedAsset.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {selectedAsset.name}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedAsset.symbol}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Information - Clear Display with USD and CNY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">购买时价格</p>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-50">
                      ${(calculation.historicalPriceUsd || calculation.historicalPrice / USD_TO_CNY).toFixed(2)} USD
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      = {formatCurrency(calculation.historicalPrice)} CNY
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      汇率: 1 USD = {USD_TO_CNY} CNY
                    </p>
                  </div>
                  {calculation.purchaseDate && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      {calculation.purchaseDate}
                    </p>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">当前价格</p>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-50">
                      ${(calculation.currentPriceUsd || calculation.currentPrice / USD_TO_CNY).toFixed(2)} USD
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      = {formatCurrency(calculation.currentPrice)} CNY
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      汇率: 1 USD = {USD_TO_CNY} CNY
                    </p>
                  </div>
                  {calculation.currentDate && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      {calculation.currentDate}
                    </p>
                  )}
                </div>
              </div>

              {/* ROI Percentage - MASSIVE with Clear Positive/Negative */}
              <div className="py-8">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 uppercase tracking-wider">
                  投资回报率
                </p>
                <div className="flex items-baseline justify-center gap-2">
                  <span
                    className={`text-8xl md:text-9xl font-black drop-shadow-lg ${
                      calculation.roi > 0 
                        ? "text-green-600 dark:text-green-400" 
                        : calculation.roi < 0
                        ? "text-red-600 dark:text-red-400"
                        : selectedAsset.color
                    }`}
                  >
                    {calculation.roi > 0 ? "+" : ""}
                    {formatNumber(calculation.roi)}
                  </span>
                  <span className="text-4xl font-bold text-slate-700 dark:text-slate-300">
                    %
                  </span>
                </div>
                <p className={`text-lg font-bold mt-4 ${
                  calculation.roi > 0 
                    ? "text-green-600 dark:text-green-400" 
                    : calculation.roi < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-slate-600 dark:text-slate-400"
                }`}>
                  {calculation.roi > 0 ? "✅ 盈利" : calculation.roi < 0 ? "❌ 亏损" : "➖ 持平"}
                </p>
              </div>

              {/* Value Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {/* Initial Investment */}
                <div className="p-6 bg-white/80 dark:bg-slate-900/80 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-slate-500" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase">
                      当时投资金额
                    </p>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-slate-50">
                    {formatUSD(investmentAmount)}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    {formatCurrency(investmentAmount * USD_TO_CNY)} CNY
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    购买价格: ${calculation.historicalPriceUsd.toFixed(2)} USD ({formatCurrency(calculation.historicalPrice)} CNY)
                  </p>
                </div>

                {/* Final Value - 还剩下多少钱 */}
                <div
                  className={`p-6 ${selectedAsset.bg} rounded-xl border-2 ${selectedAsset.borderColor} relative`}
                >
                  <div className="absolute top-2 right-2">
                    <Zap
                      className={`h-5 w-5 ${selectedAsset.color} animate-pulse`}
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className={`h-5 w-5 ${selectedAsset.color}`} />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase">
                      还剩下多少钱
                    </p>
                  </div>
                  <p className={`text-3xl font-black ${selectedAsset.color}`}>
                    {formatUSD(calculation.finalValue)}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    {calculation.finalValueCNY ? formatCurrency(calculation.finalValueCNY) : formatCurrency(calculation.finalValue * USD_TO_CNY)} CNY
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    当前价格: ${calculation.currentPriceUsd.toFixed(2)} USD ({formatCurrency(calculation.currentPrice)} CNY)
                  </p>
                </div>

                {/* Profit/Loss */}
                <div className={`p-6 rounded-xl border-2 ${
                  calculation.profit > 0
                    ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                    : calculation.profit < 0
                    ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                    : "bg-slate-50 dark:bg-slate-900/20 border-slate-300 dark:border-slate-700"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUpRight className={`h-5 w-5 ${
                      calculation.profit > 0
                        ? "text-green-600 dark:text-green-400"
                        : calculation.profit < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-slate-600 dark:text-slate-400"
                    }`} />
                    <p className={`text-sm font-semibold uppercase ${
                      calculation.profit > 0
                        ? "text-green-700 dark:text-green-400"
                        : calculation.profit < 0
                        ? "text-red-700 dark:text-red-400"
                        : "text-slate-700 dark:text-slate-400"
                    }`}>
                      {calculation.profit > 0 ? "总收益" : calculation.profit < 0 ? "总亏损" : "盈亏平衡"}
                    </p>
                  </div>
                  <p className={`text-3xl font-black ${
                    calculation.profit > 0
                      ? "text-green-600 dark:text-green-400"
                      : calculation.profit < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-slate-600 dark:text-slate-400"
                  }`}>
                    {calculation.profit > 0 ? "+" : ""}
                    {formatUSD(calculation.profit)}
                  </p>
                  <p className={`text-xs mt-2 ${
                    calculation.profit > 0
                      ? "text-green-600 dark:text-green-400"
                      : calculation.profit < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-slate-600 dark:text-slate-400"
                  }`}>
                    {calculation.profitCNY ? formatCurrency(calculation.profitCNY) : formatCurrency(calculation.profit * USD_TO_CNY)} CNY
                  </p>
                  <p className={`text-xs mt-1 ${
                    calculation.profit > 0
                      ? "text-green-600 dark:text-green-400"
                      : calculation.profit < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-slate-600 dark:text-slate-400"
                  }`}>
                    {formatNumber(calculation.priceMultiplier)}x 倍{calculation.profit > 0 ? "增长" : calculation.profit < 0 ? "下跌" : "变化"}
                  </p>
                </div>
              </div>

              {/* Emotional Message */}
              <div className="mt-8 p-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl border-2 border-yellow-300 dark:border-yellow-700">
                <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                  {calculation.profit > investmentAmount * 2
                    ? "🚀 错过了财富自由的机会？"
                    : calculation.profit > investmentAmount
                    ? "💎 时间是最好的朋友"
                    : "📈 投资需要耐心"}
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-2">
                  {calculation.profit > investmentAmount * 2
                    ? `如果${selectedYears === 0.5 ? '半年前' : `${selectedYears}年前`}投资 ${formatUSD(investmentAmount)}，现在价值 ${formatUSD(calculation.finalValue)}！`
                    : `历史不会重演，但未来仍有机会。长期投资是关键。`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Export Button */}
        <Button
          onClick={handleShare}
          className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
        >
          <Download className="h-5 w-5 mr-2" />
          导出结果图片
        </Button>
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-800 max-h-[90vh] flex flex-col [&>button]:text-slate-300 [&>button]:hover:text-white [&>button]:hover:bg-slate-800">
          <DialogHeader className="flex-shrink-0 pb-2">
            <DialogTitle className="text-yellow-400">导出 ROI 计算结果</DialogTitle>
            <DialogDescription className="text-slate-400">
              预览图片后，选择复制或下载
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-2 flex-1 flex flex-col min-h-0">
            {/* 图片预览区域 */}
            <div className="relative w-full bg-slate-800 rounded-lg border border-slate-700 overflow-auto flex-1 min-h-0" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {isGenerating ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-2"></div>
                    <p className="text-sm text-slate-400">正在生成预览...</p>
                  </div>
                </div>
              ) : imagePreview ? (
                <img
                  src={imagePreview}
                  alt="ROI 计算结果预览"
                  className="w-full h-auto"
                  style={{ maxWidth: '100%' }}
                />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-sm text-slate-400">预览加载失败</p>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
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
                className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold"
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
