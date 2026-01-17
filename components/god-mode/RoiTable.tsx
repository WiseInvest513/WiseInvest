"use client";

import { AssetYieldData } from "@/lib/mock/god-mode-data";

interface RoiTableProps {
  data: AssetYieldData[];
  title: string;
  description?: string;
}

/**
 * Reusable ROI Table Component
 * 可复用的收益率表格组件
 * 
 * 支持热力图样式和响应式设计
 */
export function RoiTable({ data, title, description }: RoiTableProps) {
  // 获取热力图颜色
  const getHeatMapColor = (value: number | null): string => {
    if (value === null) return "bg-muted";
    if (value >= 50) return "bg-green-600 text-white";
    if (value >= 10) return "bg-green-500/30 text-green-400";
    if (value >= -10) return "bg-muted text-foreground";
    return "bg-red-500/20 text-red-400";
  };

  // 格式化收益率
  const formatYield = (value: number | null): string => {
    if (value === null) return "N/A";
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[800px]">
        <thead className="sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <tr className="border-b border-border">
            <th className="text-left p-3 font-semibold sticky left-0 bg-background/95 backdrop-blur-sm z-20">
              资产
            </th>
            <th className="text-right p-3 font-semibold">当前价格</th>
            <th className="text-right p-3 font-semibold">3个月</th>
            <th className="text-right p-3 font-semibold">6个月</th>
            <th className="text-right p-3 font-semibold">1年</th>
            <th className="text-right p-3 font-semibold">3年</th>
            <th className="text-right p-3 font-semibold">5年</th>
          </tr>
        </thead>
        <tbody>
          {data.map((asset) => (
            <tr
              key={asset.symbol}
              className="border-b border-border/50 hover:bg-muted/50 transition-colors"
            >
              <td className="p-3 sticky left-0 bg-background/95 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{asset.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                    {asset.symbol}
                  </span>
                </div>
              </td>
              <td className="p-3 text-right font-mono">
                {asset.price.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </td>
              <td
                className={`p-3 text-right font-mono font-semibold ${getHeatMapColor(asset.changes.m3)}`}
              >
                {formatYield(asset.changes.m3)}
              </td>
              <td
                className={`p-3 text-right font-mono font-semibold ${getHeatMapColor(asset.changes.m6)}`}
              >
                {formatYield(asset.changes.m6)}
              </td>
              <td
                className={`p-3 text-right font-mono font-bold ${getHeatMapColor(asset.changes.y1)}`}
              >
                {formatYield(asset.changes.y1)}
              </td>
              <td
                className={`p-3 text-right font-mono font-semibold ${getHeatMapColor(asset.changes.y3)}`}
              >
                {formatYield(asset.changes.y3)}
              </td>
              <td
                className={`p-3 text-right font-mono font-semibold ${getHeatMapColor(asset.changes.y5)}`}
              >
                {formatYield(asset.changes.y5)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

