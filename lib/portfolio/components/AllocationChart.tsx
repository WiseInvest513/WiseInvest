"use client";

/**
 * Allocation Chart - Donut Chart Component
 * 资产分配环形图组件
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { Asset } from "../types";
import type { PriceData } from "../types";

interface AllocationChartProps {
  assets: Asset[];
  prices: Map<string, PriceData>;
  totalValue: number;
}

const COLORS = ["#FF9F0A", "#4A90E2", "#50C878", "#FFD700", "#9B59B6", "#E74C3C", "#3498DB"];

export function AllocationChart({ assets, prices, totalValue }: AllocationChartProps) {
  const data = assets
    .map((asset) => {
      const priceData = prices.get(asset.symbol);
      if (!priceData) return null;
      
      const value = asset.amount * priceData.price;
      const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
      
      return {
        name: asset.symbol,
        value: percentage,
        amount: value,
      };
    })
    .filter((item): item is { name: string; value: number; amount: number } => item !== null)
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl border-amber-500/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-serif font-semibold text-white mb-4">资产分配</h3>
          <div className="text-center text-gray-400 py-8">
            <div className="text-sm">暂无数据</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl border-amber-500/20">
      <CardContent className="p-6">
        <h3 className="text-xl font-serif font-semibold text-white mb-4">资产分配</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(255, 159, 10, 0.2)',
                borderRadius: '8px',
              }}
              formatter={(value: number | undefined, name: string | undefined, props: any) => {
                if (value === undefined || !props?.payload) return ['', name || ''];
                return [
                  `${value.toFixed(1)}% ($${props.payload.amount?.toLocaleString() || '0'})`,
                  props.payload.name || name || '',
                ];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-gray-300">{item.name}</span>
              </div>
              <span className="text-gray-400 font-mono">{item.value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

