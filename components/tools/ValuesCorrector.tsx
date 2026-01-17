"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Coffee, Smartphone, Car, Home, DollarSign, Download, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as htmlToImage from "html-to-image";

const USD_TO_CNY = 7.3;

// Crypto assets configuration
const CRYPTO_ASSETS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", icon: "₿" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", icon: "Ξ" },
  { id: "binance-coin", symbol: "BNB", name: "BNB", icon: "B" },
  { id: "solana", symbol: "SOL", name: "Solana", icon: "◎" },
];

// Fallback prices (USD) - used if API fails
const FALLBACK_PRICES: Record<string, number> = {
  bitcoin: 68000,
  ethereum: 3800,
  "binance-coin": 600,
  solana: 180,
};

// Comparison items with fixed CNY prices
const COMPARISON_ITEMS = [
  {
    id: "cny",
    name: "人民币",
    price: 1,
    icon: DollarSign,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-900/20",
  },
  {
    id: "coffee",
    name: "瑞幸咖啡",
    price: 9.9,
    icon: Coffee,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-900/20",
  },
  {
    id: "massage",
    name: "会所按摩",
    price: 1598,
    icon: RefreshCw,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-900/20",
  },
  {
    id: "iphone",
    name: "iPhone 15 Pro Max",
    price: 9999,
    icon: Smartphone,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    id: "bmw",
    name: "宝马 X3",
    price: 398000,
    icon: Car,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-900/20",
  },
  {
    id: "condo",
    name: "深圳湾一号首付",
    price: 5000000,
    icon: Home,
    color: "text-yellow-600",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
  },
];

interface PriceData {
  priceUsd: number;
  source: "live" | "fallback";
}

export function ValuesCorrector() {
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTO_ASSETS[0]);
  const [holdings, setHoldings] = useState(1);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, PriceData>>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Fetch prices from CoinCap API (client-side)
  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoadingPrices(true);
      const prices: Record<string, PriceData> = {};

      for (const asset of CRYPTO_ASSETS) {
        try {
          const response = await fetch(`https://api.coincap.io/v2/assets/${asset.id}`);
          if (response.ok) {
            const data = await response.json();
            const priceUsd = parseFloat(data.data?.priceUsd || "0");
            if (priceUsd > 0) {
              prices[asset.id] = { priceUsd, source: "live" };
              continue;
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch ${asset.id} price, using fallback`);
        }
        // Use fallback price
        prices[asset.id] = { priceUsd: FALLBACK_PRICES[asset.id], source: "fallback" };
      }

      setCryptoPrices(prices);
      setIsLoadingPrices(false);
    };

    fetchPrices();
  }, []);

  // Calculate total CNY value
  const totalCnyValue = useMemo(() => {
    const priceData = cryptoPrices[selectedCrypto.id];
    if (!priceData) return 0;
    return holdings * priceData.priceUsd * USD_TO_CNY;
  }, [holdings, selectedCrypto.id, cryptoPrices]);

  // Calculate counts for each comparison item
  const itemCounts = useMemo(() => {
    return COMPARISON_ITEMS.map((item) => ({
      ...item,
      count: item.price > 0 ? totalCnyValue / item.price : 0,
    }));
  }, [totalCnyValue]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 0) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(decimals)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(decimals)}K`;
    }
    return value.toFixed(decimals);
  };

  const handleShareImage = async () => {
    if (!resultsRef.current) return;

    setIsGeneratingImage(true);
    try {
      // Create a container with branding for the image
      const container = document.createElement("div");
      container.style.padding = "24px";
      container.style.backgroundColor = "#ffffff";
      container.style.width = "800px";
      container.style.fontFamily = "system-ui, -apple-system, sans-serif";

      // Clone the results content
      const clonedContent = resultsRef.current.cloneNode(true) as HTMLElement;
      clonedContent.style.backgroundColor = "transparent";

      // Add branding footer
      const footer = document.createElement("div");
      footer.style.marginTop = "24px";
      footer.style.paddingTop = "16px";
      footer.style.borderTop = "1px solid #e5e7eb";
      footer.style.textAlign = "right";
      footer.style.fontSize = "12px";
      footer.style.color = "#6b7280";
      footer.textContent = "Generated by Wise Invest 价值观纠正器";

      container.appendChild(clonedContent);
      container.appendChild(footer);

      // Temporarily add to DOM (hidden)
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      // Generate image
      const dataUrl = await htmlToImage.toPng(container, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      // Clean up
      document.body.removeChild(container);

      // Download
      const link = document.createElement("a");
      link.download = `价值观纠正器-${selectedCrypto.symbol}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to generate image:", error);
      alert("生成图片失败，请稍后重试");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const currentPriceData = cryptoPrices[selectedCrypto.id];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                价值观纠正器 💰
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                将加密货币财富转换为看得见、摸得着的生活物品
              </p>
            </div>
            {currentPriceData && (
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  {selectedCrypto.name} 价格
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  ${currentPriceData.priceUsd.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentPriceData.source === "live" ? "✅ 实时数据" : "📊 参考数据"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            输入参数
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Crypto Selection Tabs */}
          <div className="space-y-3">
            <Label>选择加密货币</Label>
            <Tabs value={selectedCrypto.id} onValueChange={(value) => {
              const crypto = CRYPTO_ASSETS.find(c => c.id === value);
              if (crypto) setSelectedCrypto(crypto);
            }}>
              <TabsList className="grid w-full grid-cols-4">
                {CRYPTO_ASSETS.map((crypto) => (
                  <TabsTrigger key={crypto.id} value={crypto.id} className="flex items-center gap-2">
                    <span className="text-lg">{crypto.icon}</span>
                    <span className="hidden sm:inline">{crypto.symbol}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Holdings Input */}
          <div className="space-y-3">
            <Label htmlFor="holdings">持有数量 ({selectedCrypto.symbol})</Label>
            <Input
              id="holdings"
              type="number"
              min={0}
              step={0.00000001}
              value={holdings}
              onChange={(e) => {
                const val = Math.max(0, parseFloat(e.target.value) || 0);
                setHoldings(val);
              }}
              className="text-2xl font-bold text-center"
              placeholder="输入持有数量"
            />
            <div className="flex gap-2 flex-wrap">
              {[0.1, 0.5, 1, 5, 10].map((val) => (
                <Button
                  key={val}
                  variant="outline"
                  size="sm"
                  onClick={() => setHoldings(val)}
                  className={holdings === val ? "bg-yellow-400 border-yellow-500" : ""}
                >
                  {val} {selectedCrypto.symbol}
                </Button>
              ))}
            </div>
          </div>

          {/* Total Value Display */}
          {totalCnyValue > 0 && (
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border-2 border-yellow-300 dark:border-yellow-700">
              <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-1 font-semibold uppercase">
                总价值
              </p>
              <p className="text-3xl font-black text-yellow-900 dark:text-yellow-100">
                {formatCurrency(totalCnyValue)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {totalCnyValue > 0 && (
        <div ref={resultsRef}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                可以购买
              </CardTitle>
              <Button
                onClick={handleShareImage}
                disabled={isGeneratingImage}
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                {isGeneratingImage ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    分享图片
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {itemCounts.map((item) => {
                  const Icon = item.icon;
                  const displayCount = item.count;
                  const isLargeNumber = displayCount >= 1000;

                  return (
                    <Card
                      key={item.id}
                      className={`${item.bg} border-2 ${item.color.replace("text-", "border-")} hover:shadow-lg transition-all`}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="flex justify-center mb-4">
                          <div className={`p-4 rounded-full ${item.bg} border-2 ${item.color.replace("text-", "border-")}`}>
                            <Icon className={`h-8 w-8 ${item.color}`} />
                          </div>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                          {item.name}
                        </h3>
                        <div className="space-y-1">
                          <p className={`font-black ${isLargeNumber ? "text-4xl" : "text-5xl"} ${item.color} drop-shadow-lg`}>
                            {formatNumber(displayCount, displayCount >= 1000 ? 1 : 0)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.price === 1 ? "元" : `单价: ${formatCurrency(item.price)}`}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {totalCnyValue === 0 && !isLoadingPrices && (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-lg text-slate-600 dark:text-slate-400">
              请输入持有数量开始计算
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoadingPrices && (
        <Card>
          <CardContent className="p-12 text-center">
            <RefreshCw className="h-12 w-12 text-yellow-500 mx-auto mb-4 animate-spin" />
            <p className="text-lg text-slate-600 dark:text-slate-400">
              正在获取实时价格...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

