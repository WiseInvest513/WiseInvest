"use client";

/**
 * Holdings List - Asset Table Component
 * 持仓列表：资产详情表格
 */

import { ExternalLink, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Asset } from "../types";
import type { PriceData } from "../types";

interface HoldingsListProps {
  assets: Asset[];
  prices: Map<string, PriceData>;
  isLoading: boolean;
  onDelete: (id: string) => void;
}

export function HoldingsList({ assets, prices, isLoading, onDelete }: HoldingsListProps) {
  if (assets.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl border-amber-500/20">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">还没有添加任何资产</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl border-amber-500/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-serif font-semibold text-white">持仓详情</h3>
          <div className="text-sm text-gray-400">{assets.length} 个资产</div>
        </div>

        <div className="space-y-3">
          {assets.map((asset) => {
            const priceData = prices.get(asset.symbol);
            const currentPrice = priceData?.price || 0;
            const value = asset.amount * currentPrice;
            const cost = asset.amount * asset.avgPrice;
            const profit = value - cost;
            const profitPercent = cost > 0 ? (profit / cost) * 100 : 0;
            const change24h = priceData?.change24hPercent || 0;

            return (
              <div
                key={asset.id}
                className="grid grid-cols-12 gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all items-center backdrop-blur-sm"
              >
                {/* 资产名称 */}
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-mono font-bold text-amber-400">
                    {asset.symbol}
                  </div>
                  <div>
                    <div className="text-white font-medium">{asset.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{asset.amount} {asset.symbol}</div>
                  </div>
                </div>

                {/* 实时价格 */}
                <div className="col-span-2">
                  <div className="text-xs text-gray-400 mb-1">实时价格</div>
                  <div className="text-white font-mono">
                    {isLoading ? '...' : currentPrice > 0 ? `$${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : 'N/A'}
                  </div>
                  {change24h !== 0 && (
                    <div className={`text-xs font-mono ${change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                    </div>
                  )}
                </div>

                {/* 持仓价值 */}
                <div className="col-span-2">
                  <div className="text-xs text-gray-400 mb-1">持仓价值</div>
                  <div className="text-white font-mono">${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                </div>

                {/* 浮动盈亏 */}
                <div className="col-span-2">
                  <div className="text-xs text-gray-400 mb-1">浮动盈亏</div>
                  <div className={`font-mono ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {profit >= 0 ? '+' : ''}${profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-xs font-mono ${profitPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                  </div>
                </div>

                {/* 平均成本 */}
                <div className="col-span-2">
                  <div className="text-xs text-gray-400 mb-1">平均成本</div>
                  <div className="text-white font-mono">${asset.avgPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                </div>

                {/* 操作按钮 */}
                <div className="col-span-1 flex justify-end gap-2">
                  {asset.practiceLink && (
                    <a
                      href={asset.practiceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
                      title="查看实践链接"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-amber-400 transition-colors" />
                    </a>
                  )}
                  <button
                    onClick={() => onDelete(asset.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                    title="删除资产"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

