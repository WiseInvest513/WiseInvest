"use client";

import { useState, useMemo } from "react";
import { Wallet, AlertTriangle, TrendingUp, TrendingDown, DollarSign, BarChart3, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TradingMode = "long" | "short";

interface CalculationResult {
  positionSize: number;
  positionValue: number;
  riskAmount: number;
  leverage: number;
  isValid: boolean;
  errorMessage: string;
}

export function PositionCalculator() {
  const [mode, setMode] = useState<TradingMode>("long");
  const [accountBalance, setAccountBalance] = useState(100000);
  const [riskPercentage, setRiskPercentage] = useState(2);
  const [entryPrice, setEntryPrice] = useState(50000);
  const [stopLossPrice, setStopLossPrice] = useState(48000);

  const calculation = useMemo<CalculationResult>(() => {
    // Validation
    let isValid = true;
    let errorMessage = "";

    if (mode === "long") {
      if (stopLossPrice >= entryPrice) {
        isValid = false;
        errorMessage = "做多模式下，止损价格必须小于入场价格";
      }
    } else {
      if (stopLossPrice <= entryPrice) {
        isValid = false;
        errorMessage = "做空模式下，止损价格必须大于入场价格";
      }
    }

    if (entryPrice <= 0 || stopLossPrice <= 0 || accountBalance <= 0) {
      isValid = false;
      if (!errorMessage) {
        errorMessage = "价格和账户资金必须大于 0";
      }
    }

    if (!isValid) {
      return {
        positionSize: 0,
        positionValue: 0,
        riskAmount: 0,
        leverage: 0,
        isValid: false,
        errorMessage,
      };
    }

    // Calculate price difference
    const priceDiff = Math.abs(entryPrice - stopLossPrice);
    
    // Handle division by zero
    if (priceDiff === 0) {
      return {
        positionSize: 0,
        positionValue: 0,
        riskAmount: 0,
        leverage: 0,
        isValid: false,
        errorMessage: "入场价格和止损价格不能相同",
      };
    }

    // Calculate risk amount
    const riskAmount = accountBalance * (riskPercentage / 100);

    // Calculate position size: (Balance * Risk%) / |Entry - StopLoss|
    const positionSize = riskAmount / priceDiff;

    // Calculate position value
    const positionValue = positionSize * entryPrice;

    // Calculate leverage
    const leverage = accountBalance > 0 ? positionValue / accountBalance : 0;

    return {
      positionSize,
      positionValue,
      riskAmount,
      leverage,
      isValid: true,
      errorMessage: "",
    };
  }, [mode, accountBalance, riskPercentage, entryPrice, stopLossPrice]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return new Intl.NumberFormat("zh-CN", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(value);
  };

  const modeColor = mode === "long" ? "green" : "red";
  const modeBg = mode === "long" 
    ? "bg-green-50 dark:bg-green-900/20" 
    : "bg-red-50 dark:bg-red-900/20";
  const modeBorder = mode === "long"
    ? "border-green-200 dark:border-green-800"
    : "border-red-200 dark:border-red-800";
  const modeText = mode === "long"
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
  const modeAccent = mode === "long"
    ? "bg-green-500"
    : "bg-red-500";

  return (
    <div className="space-y-6">
      {/* Trading Mode Tabs */}
      <Card className={`${modeBg} ${modeBorder} border-2`}>
        <CardContent className="p-6">
          <Tabs value={mode} onValueChange={(value) => setMode(value as TradingMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="long" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                做多 (Long)
              </TabsTrigger>
              <TabsTrigger value="short" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                做空 (Short)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Column: Inputs */}
        <div className="flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <BarChart3 className="h-5 w-5" />
                交易参数
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 flex-1">
              {/* Account Balance */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="balance" className="flex items-center gap-2 text-base">
                    <Wallet className="h-4 w-4" />
                    账户资金 (CNY)
                  </Label>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-50">
                    {formatNumber(accountBalance, 0)}
                  </span>
                </div>
                <Input
                  id="balance"
                  type="number"
                  min={0}
                  step={1000}
                  value={accountBalance}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    setAccountBalance(val);
                  }}
                  className="text-center font-semibold"
                />
              </div>

              {/* Risk Percentage */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="risk" className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4" />
                    单笔风险 (%)
                  </Label>
                  <span className={`text-lg font-bold ${modeText}`}>
                    {riskPercentage}%
                  </span>
                </div>
                <div className="space-y-2">
                  <Slider
                    id="risk"
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={riskPercentage}
                    onValueChange={(value) => setRiskPercentage(value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>0.1%</span>
                    <span>10%</span>
                  </div>
                </div>
                <Input
                  type="number"
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={riskPercentage}
                  onChange={(e) => {
                    const val = Math.max(0.1, Math.min(10, parseFloat(e.target.value) || 0.1));
                    setRiskPercentage(val);
                  }}
                  className="text-center font-semibold"
                />
              </div>

              {/* Entry Price */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="entry" className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4" />
                    入场价格
                  </Label>
                  <span className="text-base font-bold text-slate-900 dark:text-slate-50">
                    {formatNumber(entryPrice, 2)}
                  </span>
                </div>
                <Input
                  id="entry"
                  type="number"
                  min={0}
                  step={0.01}
                  value={entryPrice}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    setEntryPrice(val);
                  }}
                  className="text-center font-semibold"
                />
              </div>

              {/* Stop Loss Price */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="stopLoss" className="flex items-center gap-2 text-base">
                    <TrendingDown className="h-4 w-4" />
                    止损价格
                  </Label>
                  <span className="text-base font-bold text-slate-900 dark:text-slate-50">
                    {formatNumber(stopLossPrice, 2)}
                  </span>
                </div>
                <Input
                  id="stopLoss"
                  type="number"
                  min={0}
                  step={0.01}
                  value={stopLossPrice}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    setStopLossPrice(val);
                  }}
                  className={`text-center font-semibold ${
                    !calculation.isValid ? "border-red-500 focus:border-red-500" : ""
                  }`}
                />
                {!calculation.isValid && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {calculation.errorMessage}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results */}
        <div className="flex flex-col">
          <Card className={`${modeBg} ${modeBorder} border-2 shadow-xl flex-1 flex flex-col`}>
            <CardContent className="p-6 flex-1 flex flex-col">
              {calculation.isValid ? (
                <div className="space-y-5 flex-1 flex flex-col">
                  {/* Main Result: Position Size */}
                  <div className="text-center space-y-2">
                    <p className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold">
                      开仓数量
                    </p>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className={`text-5xl md:text-6xl font-black ${modeText} drop-shadow-lg`}>
                        {formatNumber(calculation.positionSize, 4)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {mode === "long" ? "买入数量" : "卖出数量"}
                    </p>
                  </div>

                  {/* Other Metrics */}
                  <div className="grid grid-cols-1 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    {/* Position Value */}
                    <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-lg">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-slate-500" />
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            仓位价值
                          </p>
                        </div>
                      </div>
                      <p className="text-xl font-black text-slate-900 dark:text-slate-50">
                        {formatCurrency(calculation.positionValue)}
                      </p>
                    </div>

                    {/* Risk Amount */}
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                            亏损金额
                          </p>
                        </div>
                      </div>
                      <p className="text-xl font-black text-red-600 dark:text-red-400">
                        {formatCurrency(calculation.riskAmount)}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                        账户资金的 {riskPercentage}%
                      </p>
                    </div>

                    {/* Leverage */}
                    <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-lg">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-slate-500" />
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            实际杠杆
                          </p>
                        </div>
                      </div>
                      <p className="text-xl font-black text-slate-900 dark:text-slate-50">
                        {formatNumber(calculation.leverage, 2)}x
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {calculation.leverage > 1 ? "使用杠杆" : "无杠杆"}
                      </p>
                    </div>
                  </div>

                  {/* Price Difference Info */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mt-auto">
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">
                        💡 <strong>价格差：</strong>
                      </p>
                      <p className="text-sm font-mono text-slate-900 dark:text-slate-50">
                        {formatNumber(Math.abs(entryPrice - stopLossPrice), 2)} (
                        {((Math.abs(entryPrice - stopLossPrice) / entryPrice) * 100).toFixed(2)}%)
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4 py-8">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                    参数错误
                  </h3>
                  <p className="text-red-600 dark:text-red-400">
                    {calculation.errorMessage}
                  </p>
                  <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      💡 <strong>提示：</strong>
                    </p>
                    <ul className="text-left text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      <li>• 做多：止损价格必须 <strong>小于</strong> 入场价格</li>
                      <li>• 做空：止损价格必须 <strong>大于</strong> 入场价格</li>
                      <li>• 所有价格和金额必须大于 0</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

