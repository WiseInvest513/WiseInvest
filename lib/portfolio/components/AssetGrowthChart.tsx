"use client";

/**
 * Asset Growth Chart - Area Chart Component
 * 资产增长图表：面积图展示
 */

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { ChartDataPoint } from "../types";

interface AssetGrowthChartProps {
  data: ChartDataPoint[];
}

export function AssetGrowthChart({ data }: AssetGrowthChartProps) {
  if (data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl border-amber-500/20 lg:col-span-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-serif font-semibold text-white">资产增长</h3>
            <div className="text-sm text-gray-400">30 天</div>
          </div>
          <div className="h-[300px] flex items-center justify-center text-gray-400">
            暂无数据
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl border-amber-500/20 lg:col-span-2">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-serif font-semibold text-white">资产增长</h3>
          <div className="text-sm text-gray-400">30 天</div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF9F0A" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FF9F0A" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="date"
              stroke="#666"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#666"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(255, 159, 10, 0.2)',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: number | undefined) => value !== undefined ? [`$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, '资产价值'] : ['', '资产价值']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#FF9F0A"
              strokeWidth={2}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

