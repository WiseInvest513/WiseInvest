"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PortfolioProvider, usePortfolioStore } from "@/lib/portfolio/store";
import { useAssetPrices, usePortfolioStats, useChartData } from "@/lib/portfolio/hooks";
import { AssetCommandCenter } from "@/lib/portfolio/components/AssetCommandCenter";
import { AddAssetModal } from "@/lib/portfolio/components/AddAssetModal";
import { AssetGrowthChart } from "@/lib/portfolio/components/AssetGrowthChart";
import { AllocationChart } from "@/lib/portfolio/components/AllocationChart";
import { HoldingsList } from "@/lib/portfolio/components/HoldingsList";
import type { Asset } from "@/lib/portfolio/types";

/**
 * Portfolio Tracker Page - Main Entry Point
 * 投资组合追踪页面：主入口
 * 
 * Architecture:
 * - View Layer: This component orchestrates all UI components
 * - Logic Layer: Uses custom hooks (usePortfolioStats, useAssetPrices, etc.)
 * - Data Layer: React Context store handles persistence
 */

function PortfolioTrackerContent() {
  const { assets, addAsset, removeAsset } = usePortfolioStore();
  const { prices, isLoading } = useAssetPrices();
  const stats = usePortfolioStats();
  const chartData = useChartData();
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddAsset = (asset: Asset) => {
    addAsset(asset);
  };

  const handleDeleteAsset = (id: string) => {
    if (confirm("确定要删除这个资产吗？")) {
      removeAsset(id);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <div className="mb-4">
          <Link
            href="/tools"
            className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回工具列表
          </Link>
        </div>

        {/* Component A: Asset Command Center */}
        <AssetCommandCenter
          stats={stats}
          onAddAsset={() => setShowAddModal(true)}
        />

        {/* Component B & C: Charts and Holdings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Asset Growth Chart */}
          <AssetGrowthChart data={chartData} />

          {/* Allocation Chart */}
          <AllocationChart
            assets={assets}
            prices={prices}
            totalValue={stats.totalValue}
          />
        </div>

        {/* Holdings List */}
        <HoldingsList
          assets={assets}
          prices={prices}
          isLoading={isLoading}
          onDelete={handleDeleteAsset}
        />
      </div>

      {/* Component B: Add Asset Modal */}
      <AddAssetModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAsset}
      />
    </div>
  );
}

export default function PortfolioTrackerPage() {
  return (
    <PortfolioProvider>
      <PortfolioTrackerContent />
    </PortfolioProvider>
  );
}
