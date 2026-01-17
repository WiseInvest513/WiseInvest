import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ImpermanentLoss } from "@/components/tools/ImpermanentLoss";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "无常损失计算器 - Wise Invest",
  description: "计算流动性挖矿中的无常损失",
};

export default function ImpermanentLossPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/tools"
            className="inline-flex items-center text-sm text-slate-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回工具列表
          </Link>
        </div>

        {/* Tool Component */}
        <ImpermanentLoss />
      </div>
    </div>
  );
}

