import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AverageDownCalc } from "@/components/tools/AverageDownCalc";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "补仓计算器 - Wise Invest",
  description: "计算补仓后的新平均价格和回本涨幅",
};

export default function AverageDownPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AverageDownCalc />
    </div>
  );
}
