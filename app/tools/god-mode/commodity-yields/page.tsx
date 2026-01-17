"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoiTable } from "@/components/god-mode/RoiTable";
import { COMMODITY_YIELDS } from "@/lib/mock/god-mode-data";

/**
 * Commodity Yields Page
 * 大宗商品收益率矩阵页面
 */

export default function CommodityYieldsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <div className="mb-4">
          <Link
            href="/tools"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回工具列表
          </Link>
        </div>

        {/* Header */}
        <Card className="backdrop-blur-xl border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="text-3xl font-serif font-bold">
                  Commodity ROI Matrix
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  黄金、白银、铂金、铜等大宗商品的收益率分析
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* ROI Table */}
        <Card className="backdrop-blur-xl border-border">
          <CardHeader>
            <CardTitle>大宗商品收益率矩阵</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              热力图颜色：深绿(&gt;50%) | 浅绿(&gt;10%) | 灰色(-10%~+10%) | 红色(&lt;-10%)
            </p>
          </CardHeader>
          <CardContent>
            <RoiTable data={COMMODITY_YIELDS} title="大宗商品收益率" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

