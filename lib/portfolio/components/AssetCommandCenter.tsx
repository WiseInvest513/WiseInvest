"use client";

/**
 * Asset Command Center - Top Header Component
 * 资产命令中心：顶部总览区域
 */

import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { PortfolioStats } from "../types";

interface AssetCommandCenterProps {
  stats: PortfolioStats;
  onAddAsset: () => void;
}

export function AssetCommandCenter({ stats, onAddAsset }: AssetCommandCenterProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 资产总额卡片 */}
      <Card className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl border-amber-500/20 col-span-1 md:col-span-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400 mb-2">资产总额</div>
              <div className="text-5xl font-serif font-bold text-white mb-2 drop-shadow-[0_0_20px_rgba(255,159,10,0.3)]">
                ${stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-2">
                {stats.profit >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-sm font-mono ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.profit >= 0 ? '+' : ''}${stats.profit.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({stats.profitPercent >= 0 ? '+' : ''}{stats.profitPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
            <Button
              onClick={onAddAsset}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加资产
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 24h 盈亏卡片 */}
      <Card className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl border-amber-500/20">
        <CardContent className="p-6">
          <div className="text-sm text-gray-400 mb-2">24h 盈亏</div>
          <div className="flex items-center gap-2 mb-2">
            {stats.change24h >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
            <span className={`text-2xl font-mono font-bold ${stats.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.change24h >= 0 ? '+' : ''}{stats.change24hPercent.toFixed(2)}%
            </span>
          </div>
          <div className="text-sm text-gray-400 font-mono">
            {stats.change24h >= 0 ? '+' : ''}${stats.change24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

