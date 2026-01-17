"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, TrendingDown, DollarSign, X, Share2, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";

interface CrashScenario {
  id: string;
  name: string;
  date: string;
  description: string;
  crashPrice: { btc: number; eth: number; spy: number };
  currentPrice: { btc: number; eth: number; spy: number };
  equivalent: string;
}

const crashScenarios: CrashScenario[] = [
  {
    id: "covid-crash",
    name: "2020年3月12日 - 新冠崩盘",
    date: "2020-03-12",
    description: "新冠疫情引发的全球市场恐慌，单日暴跌50%",
    crashPrice: { btc: 4800, eth: 135, spy: 2480 },
    currentPrice: { btc: 91205, eth: 3139, spy: 5450 },
    equivalent: "2辆特斯拉 Model 3",
  },
  {
    id: "519-crash",
    name: "2021年5月19日 - 519崩盘",
    date: "2021-05-19",
    description: "中国监管政策引发的加密货币市场暴跌",
    crashPrice: { btc: 30000, eth: 2000, spy: 4150 },
    currentPrice: { btc: 91205, eth: 3139, spy: 5450 },
    equivalent: "1套一线城市首付",
  },
  {
    id: "ftx-collapse",
    name: "2022年11月 - FTX崩盘",
    date: "2022-11-11",
    description: "FTX交易所倒闭引发的市场恐慌",
    crashPrice: { btc: 16000, eth: 1100, spy: 3950 },
    currentPrice: { btc: 91205, eth: 3139, spy: 5450 },
    equivalent: "3年的平均工资",
  },
];

type AssetType = "btc" | "eth" | "spy";

export function PanicSimulator() {
  const [step, setStep] = useState<"input" | "simulating" | "result">("input");
  const [amount, setAmount] = useState(10000);
  const [asset, setAsset] = useState<AssetType>("btc");
  const [selectedScenario, setSelectedScenario] = useState<CrashScenario | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const shareRef = useRef<HTMLDivElement | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSell = () => {
    // 随机选择一个场景
    const randomScenario = crashScenarios[Math.floor(Math.random() * crashScenarios.length)];
    setSelectedScenario(randomScenario);
    setStep("simulating");

    // 模拟延迟
    setTimeout(() => {
      setStep("result");
    }, 2000);
  };

  const calculations = useMemo(() => {
    if (!selectedScenario) return null;

    const crashPrice = selectedScenario.crashPrice[asset];
    const currentPrice = selectedScenario.currentPrice[asset];

    // 计算如果恐慌卖出时的数量
    const quantity = amount / crashPrice;

    // 计算如果持有到现在的价值
    const currentValue = quantity * currentPrice;

    // 计算损失的收益
    const lossOfGains = currentValue - amount;

    return {
      quantity,
      currentValue,
      lossOfGains,
      crashPrice,
      currentPrice,
    };
  }, [selectedScenario, amount, asset]);

  const generateShareImage = async () => {
    if (!shareRef.current || !selectedScenario || !calculations) return;

    try {
      setIsGenerating(true);
      const dataUrl = await toPng(shareRef.current, {
        backgroundColor: "#ffffff",
        quality: 1.0,
        pixelRatio: 2,
      });

      // 下载图片
      const link = document.createElement("a");
      link.download = `panic-sell-receipt-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to generate image:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setStep("input");
    setSelectedScenario(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/tools"
            className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回工具列表
          </Link>
        </div>

        {/* Main Content Container with Background */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-xl p-6 md:p-8 lg:p-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2">
              恐慌模拟器
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              模拟恐慌卖出可能带来的损失，帮助您做出更理性的决策
            </p>
          </div>

          {/* Step 1: Input Screen */}
          {step === "input" && (
            <div className="max-w-2xl mx-auto transition-opacity duration-500">
              <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    <CardTitle className="text-red-900 dark:text-red-300 text-2xl">
                      想要恐慌卖出？
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-slate-700 dark:text-slate-300 text-lg">
                      您今天想要卖出的金额
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">$</span>
                      <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white pl-7 text-lg"
                        step="1000"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Asset Selector */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 text-lg">
                      选择资产
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["btc", "eth", "spy"] as AssetType[]).map((assetType) => (
                        <button
                          key={assetType}
                          onClick={() => setAsset(assetType)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            asset === assetType
                              ? "border-red-500 bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-300 font-bold"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-red-300 dark:hover:border-red-700"
                          }`}
                        >
                          {assetType.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sell Button */}
                  <Button
                    onClick={handleSell}
                    className="w-full h-16 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white text-xl font-bold animate-pulse shadow-lg"
                  >
                    <TrendingDown className="w-6 h-6 mr-2" />
                    我受不了了！立即卖出！
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Simulating */}
          {step === "simulating" && (
            <div className="max-w-2xl mx-auto text-center py-20 transition-opacity duration-500">
              <div className="animate-bounce mb-4">
                <TrendingDown className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 animate-pulse">
                正在模拟...
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                计算您的损失中...
              </p>
            </div>
          )}

          {/* Step 3: Result Screen */}
          {step === "result" && selectedScenario && calculations && (
            <div className="max-w-3xl mx-auto transition-opacity duration-500">
              <Card
                ref={shareRef}
                className="bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-800 shadow-2xl"
              >
                <CardHeader className="border-b border-red-200 dark:border-red-800 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <X className="w-8 h-8 text-red-600 dark:text-red-400" />
                      <CardTitle className="text-red-900 dark:text-red-300 text-2xl">
                        交易被未来的您拒绝
                      </CardTitle>
                    </div>
                    <Button
                      onClick={generateShareImage}
                      disabled={isGenerating}
                      variant="outline"
                      size="sm"
                      className="border-slate-300 dark:border-slate-700"
                    >
                      {isGenerating ? (
                        "生成中..."
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          保存收据
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Scenario Info */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                    <p className="text-slate-700 dark:text-slate-300 text-base mb-2">
                      如果您在 <span className="font-bold text-red-600 dark:text-red-400">{selectedScenario.name}</span> 恐慌卖出
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {selectedScenario.description}
                    </p>
                  </div>

                  {/* Loss Amount - Large Display */}
                  <div className="text-center py-8 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">
                    <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">
                      您将错过的收益
                    </p>
                    <p className="text-red-600 dark:text-red-400 font-bold text-6xl md:text-7xl mb-4 drop-shadow-lg">
                      {formatCurrency(calculations.lossOfGains)}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-base">
                      相当于：{selectedScenario.equivalent}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">卖出时价格</p>
                      <p className="text-slate-900 dark:text-white font-bold text-xl">
                        {formatCurrency(calculations.crashPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">当前价格</p>
                      <p className="text-green-600 dark:text-green-400 font-bold text-xl">
                        {formatCurrency(calculations.currentPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">持有数量</p>
                      <p className="text-slate-900 dark:text-white font-bold text-xl">
                        {calculations.quantity.toFixed(6)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">当前价值</p>
                      <p className="text-green-600 dark:text-green-400 font-bold text-xl">
                        {formatCurrency(calculations.currentValue)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      onClick={reset}
                      variant="outline"
                      className="flex-1 border-slate-300 dark:border-slate-700"
                    >
                      重新模拟
                    </Button>
                    <Button
                      onClick={generateShareImage}
                      disabled={isGenerating}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
                    >
                      {isGenerating ? (
                        "生成中..."
                      ) : (
                        <>
                          <Share2 className="w-4 h-4 mr-2" />
                          分享收据
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
