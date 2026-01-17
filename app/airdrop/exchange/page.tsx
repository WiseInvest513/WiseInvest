"use client";

import { ExchangeAirdrop } from "@/components/tools/ExchangeAirdrop";

export default function ExchangeAirdropPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1600px] mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-bold text-slate-900 mb-2">
            交易所空投追踪
          </h1>
          <p className="text-lg text-slate-600">
            实时监控 Binance Launchpool/Megadrop 和 OKX Jumpstart 最新公告
          </p>
        </div>

        {/* Exchange Airdrop Component */}
        <ExchangeAirdrop />
      </div>
    </div>
  );
}

