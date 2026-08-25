import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ContractCalculator } from "@/components/tools/ContractCalculator";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "合约交易计算器：保证金、盈亏、杠杆和强平价格 - Wise Invest",
  description: "Wise Invest 合约交易计算器，用于计算合约保证金、杠杆倍数、盈亏、收益率和强平价格，辅助交易前风险评估。",
  keywords: ["合约计算器", "强平价格计算", "保证金计算", "杠杆交易", "合约盈亏", "币圈合约", "风险控制"],
  alternates: {
    canonical: "https://www.wise-invest.org/tools/contract-calculator",
  },
  openGraph: {
    title: "合约交易计算器 - Wise Invest",
    description: "计算保证金、盈亏、杠杆和强平价格。",
    url: "https://www.wise-invest.org/tools/contract-calculator",
    type: "website",
  },
};

export default function ContractCalculatorPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
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
        <ContractCalculator />
      </div>
    </div>
  );
}
