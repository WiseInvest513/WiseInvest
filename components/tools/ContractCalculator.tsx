"use client";

import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Zap, Calculator, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

/**
 * 合约交易计算器
 * 
 * 功能：
 * - 计算保证金
 * - 计算盈亏
 * - 计算强平价格
 * - 计算未来价格对应的盈亏
 */
export function ContractCalculator() {
  // 输入参数
  const [entryPrice, setEntryPrice] = useState<string>("");
  const [positionSize, setPositionSize] = useState<string>(""); // 开仓金额（合约价值）
  const [leverage, setLeverage] = useState<string>("10"); // 杠杆倍数
  const [currentPrice, setCurrentPrice] = useState<string>("");
  const [futurePrice, setFuturePrice] = useState<string>("");
  const [maintenanceMarginRate, setMaintenanceMarginRate] = useState<string>("0.5"); // 维持保证金率（默认0.5%）

  // 计算结果
  const calculations = useMemo(() => {
    const entry = parseFloat(entryPrice) || 0;
    const size = parseFloat(positionSize) || 0;
    const lev = parseFloat(leverage) || 1;
    const current = parseFloat(currentPrice) || 0;
    const future = parseFloat(futurePrice) || 0;
    const mmr = parseFloat(maintenanceMarginRate) || 0.5;

    // 保证金 = 开仓金额 / 杠杆倍数
    // 避免除以 0 的情况
    const margin = lev > 0 ? size / lev : 0;

    // 当前盈亏
    let currentPnL = 0;
    let currentPnLPercent = 0;
    if (entry > 0 && current > 0) {
      currentPnLPercent = ((current - entry) / entry) * lev * 100;
      currentPnL = (currentPnLPercent / 100) * margin;
    }

    // 未来盈亏
    let futurePnL = 0;
    let futurePnLPercent = 0;
    if (entry > 0 && future > 0) {
      futurePnLPercent = ((future - entry) / entry) * lev * 100;
      futurePnL = (futurePnLPercent / 100) * margin;
    }

    // 强平价格计算
    // 做多：强平价格 = 开仓价格 * (1 - (1 - 维持保证金率) / 杠杆倍数)
    // 做空：强平价格 = 开仓价格 * (1 + (1 - 维持保证金率) / 杠杆倍数)
    let liquidationPriceLong = 0;
    let liquidationPriceShort = 0;
    if (entry > 0 && lev > 0) {
      const marginRatio = (1 - mmr / 100) / lev;
      liquidationPriceLong = entry * (1 - marginRatio);
      liquidationPriceShort = entry * (1 + marginRatio);
    }

    // 距离强平价格的距离（百分比）
    let distanceToLiquidationLong = 0;
    let distanceToLiquidationShort = 0;
    if (current > 0) {
      if (liquidationPriceLong > 0) {
        distanceToLiquidationLong = ((current - liquidationPriceLong) / liquidationPriceLong) * 100;
      }
      if (liquidationPriceShort > 0) {
        distanceToLiquidationShort = ((liquidationPriceShort - current) / liquidationPriceShort) * 100;
      }
    }

    return {
      margin,
      currentPnL,
      currentPnLPercent,
      futurePnL,
      futurePnLPercent,
      liquidationPriceLong,
      liquidationPriceShort,
      distanceToLiquidationLong,
      distanceToLiquidationShort,
    };
  }, [entryPrice, positionSize, leverage, currentPrice, futurePrice, maintenanceMarginRate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Calculator className="w-8 h-8 text-primary" />
          合约交易计算器
        </h1>
        <p className="text-muted-foreground">
          计算合约交易的保证金、盈亏、强平价格等关键指标
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：输入参数 */}
        <Card>
          <CardHeader>
            <CardTitle>交易参数</CardTitle>
            <CardDescription>输入您的合约交易信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entryPrice">开仓价格 (USD)</Label>
              <Input
                id="entryPrice"
                type="number"
                placeholder="例如: 50000"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="positionSize">开仓金额 (USD)</Label>
              <Input
                id="positionSize"
                type="number"
                placeholder="例如: 10000"
                value={positionSize}
                onChange={(e) => setPositionSize(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                合约总价值（不是保证金）
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leverage">杠杆倍数</Label>
              <Input
                id="leverage"
                type="number"
                placeholder="例如: 10"
                value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                常用倍数: 5x, 10x, 20x, 50x, 100x
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenanceMarginRate">维持保证金率 (%)</Label>
              <Input
                id="maintenanceMarginRate"
                type="number"
                step="0.1"
                placeholder="例如: 0.5"
                value={maintenanceMarginRate}
                onChange={(e) => setMaintenanceMarginRate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                通常为 0.5% - 1%，不同交易所可能不同
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentPrice">当前价格 (USD)</Label>
              <Input
                id="currentPrice"
                type="number"
                placeholder="例如: 52000"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="futurePrice">未来价格 (USD) <span className="text-muted-foreground">(可选)</span></Label>
              <Input
                id="futurePrice"
                type="number"
                placeholder="例如: 55000"
                value={futurePrice}
                onChange={(e) => setFuturePrice(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                用于计算未来价格对应的盈亏
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 右侧：计算结果 */}
        <div className="space-y-6">
          {/* 保证金 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                保证金
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {formatCurrency(calculations.margin)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                所需保证金 = 开仓金额 ÷ 杠杆倍数
              </p>
            </CardContent>
          </Card>

          {/* 当前盈亏 */}
          {currentPrice && parseFloat(currentPrice) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {calculations.currentPnL >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  )}
                  当前盈亏
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${calculations.currentPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(calculations.currentPnL)}
                </div>
                <div className={`text-xl mt-2 ${calculations.currentPnLPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercent(calculations.currentPnLPercent)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  基于当前价格计算
                </p>
              </CardContent>
            </Card>
          )}

          {/* 未来盈亏 */}
          {futurePrice && parseFloat(futurePrice) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {calculations.futurePnL >= 0 ? (
                    <ArrowUpRight className="w-5 h-5 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-red-500" />
                  )}
                  未来盈亏
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${calculations.futurePnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(calculations.futurePnL)}
                </div>
                <div className={`text-xl mt-2 ${calculations.futurePnLPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercent(calculations.futurePnLPercent)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  当价格达到 {formatCurrency(parseFloat(futurePrice))} 时的盈亏
                </p>
              </CardContent>
            </Card>
          )}

          {/* 强平价格 */}
          {entryPrice && parseFloat(entryPrice) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  强平价格
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">做多强平价格</span>
                  </div>
                  <div className="text-2xl font-bold text-red-500">
                    {formatCurrency(calculations.liquidationPriceLong)}
                  </div>
                  {currentPrice && parseFloat(currentPrice) > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      距离强平: {formatPercent(calculations.distanceToLiquidationLong)}
                    </p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium">做空强平价格</span>
                  </div>
                  <div className="text-2xl font-bold text-red-500">
                    {formatCurrency(calculations.liquidationPriceShort)}
                  </div>
                  {currentPrice && parseFloat(currentPrice) > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      距离强平: {formatPercent(calculations.distanceToLiquidationShort)}
                    </p>
                  )}
                </div>

                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-xs text-yellow-800 dark:text-yellow-400">
                    ⚠️ 当价格达到强平价格时，您的仓位将被强制平仓，保证金可能全部损失
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 风险提示 */}
      <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            风险提示
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-red-800 dark:text-red-400">
            <li>• 合约交易具有极高的风险，可能导致全部本金损失</li>
            <li>• 杠杆倍数越高，风险越大，强平价格越接近开仓价格</li>
            <li>• 请确保充分了解合约交易的风险，谨慎操作</li>
            <li>• 建议设置止损，控制风险</li>
            <li>• 本计算器仅供参考，实际强平价格可能因交易所规则而有所不同</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
