import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HourlyWageRevealer } from "@/components/tools/HourlyWageRevealer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "打工人时薪真相 - Wise Invest",
  description: "将月薪转换为时薪，揭示时间的真实价值（5个场景对比）",
};

export default function HourlyWagePage() {
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
        <HourlyWageRevealer />
      </div>
    </div>
  );
}

