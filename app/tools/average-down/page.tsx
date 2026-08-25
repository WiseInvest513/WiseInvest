import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AverageDownCalc } from "@/components/tools/AverageDownCalc";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "补仓计算器：股票、ETF、BTC 补仓后平均成本和回本涨幅 - Wise Invest",
  description: "Wise Invest 补仓计算器，输入原持仓、买入价、补仓金额和补仓价格，计算新的平均成本、回本涨幅和仓位变化。",
  keywords: ["补仓计算器", "平均成本计算", "回本涨幅", "股票补仓", "ETF 补仓", "BTC 补仓", "仓位管理"],
  alternates: {
    canonical: "https://www.wise-invest.org/tools/average-down",
  },
  openGraph: {
    title: "补仓计算器 - Wise Invest",
    description: "计算补仓后的平均成本、回本涨幅和仓位变化。",
    url: "https://www.wise-invest.org/tools/average-down",
    type: "website",
  },
};

export default function AverageDownPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AverageDownCalc />
    </div>
  );
}
