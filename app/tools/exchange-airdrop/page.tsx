import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ExchangeAirdrop } from "@/components/tools/ExchangeAirdrop";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "交易所空投追踪 - Wise Invest",
  description: "实时监控 Binance Launchpool/Megadrop 和 OKX Jumpstart 公告",
};

export default function ExchangeAirdropPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/tools"
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回工具列表
          </Link>
        </div>

        {/* Tool Component */}
        <ExchangeAirdrop />
      </div>
    </div>
  );
}

