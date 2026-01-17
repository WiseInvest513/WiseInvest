"use client";

import { Card, CardContent } from "@/components/ui/card";
import { calculatePurchasingPower } from "@/lib/constants/purchasing-power";
import { usdToCny } from "@/lib/utils/exchange-rates";

interface PurchasingPowerCardProps {
  valueUSD: number;
  isProfit?: boolean;
  className?: string;
}

/**
 * Purchasing Power Card Component
 * 购买力卡片组件
 * 
 * 将投资收益转换为真实世界物品的购买力，帮助用户更好地理解收益的实际价值
 */
export function PurchasingPowerCard({
  valueUSD,
  isProfit = true,
  className = "",
}: PurchasingPowerCardProps) {
  // 转换为 CNY
  const valueCNY = usdToCny(Math.abs(valueUSD));
  
  // 计算购买力
  const power = calculatePurchasingPower(valueCNY);

  if (!power || valueCNY <= 0) {
    return null;
  }

  const { primary, secondary } = power;
  const isPositive = isProfit && valueUSD > 0;

  return (
    <Card
      className={`${
        isPositive
          ? "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 border-amber-500/30"
          : "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-gray-800/10 border-blue-500/30"
      } backdrop-blur-xl ${className}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* 主要物品图标 */}
          <div className="text-6xl flex-shrink-0">
            {primary.item.icon}
          </div>

          {/* 文本内容 */}
          <div className="flex-1">
            <div
              className={`text-lg font-serif font-semibold mb-2 ${
                isPositive ? "text-amber-700 dark:text-amber-300" : "text-blue-700 dark:text-blue-300"
              }`}
            >
              {isPositive ? "恭喜！" : "遗憾！"}
            </div>
            <div className="text-foreground/90 text-sm leading-relaxed">
              {isProfit ? (
                // 购买力校正器界面：显示"价格相当于"
                <>
                  你的资产价格相当于{" "}
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {primary.quantity}
                  </span>{" "}
                  个 {primary.item.icon} {primary.item.name}
                  {secondary && secondary.quantity > 0 && (
                    <>
                      {" "}
                      +{" "}
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {secondary.quantity}
                      </span>{" "}
                      个 {secondary.item.icon} {secondary.item.name}
                    </>
                  )}
                  ！
                </>
              ) : (
                // 其他界面：显示盈利/亏损
                isPositive ? (
                  <>
                    你的收益相当于赚了{" "}
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {primary.quantity}
                    </span>{" "}
                    个 {primary.item.icon} {primary.item.name}
                    {secondary && secondary.quantity > 0 && (
                      <>
                        {" "}
                        +{" "}
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {secondary.quantity}
                        </span>{" "}
                        个 {secondary.item.icon} {secondary.item.name}
                      </>
                    )}
                    ！
                  </>
                ) : (
                  <>
                    这波回撤痛失了{" "}
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {primary.quantity}
                    </span>{" "}
                    个 {primary.item.icon} {primary.item.name}
                    {secondary && secondary.quantity > 0 && (
                      <>
                        {" "}
                        +{" "}
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {secondary.quantity}
                        </span>{" "}
                        个 {secondary.item.icon} {secondary.item.name}
                      </>
                    )}
                    ...
                  </>
                )
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-2 font-mono">
              ≈ ¥{valueCNY.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

