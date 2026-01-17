import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TimeWealthMachine } from "@/components/tools/TimeWealthMachine";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "财富时光机 - Wise Invest",
  description: "时光倒流：看看如果X年前投资现在会有多少钱",
};

export default function TimeWealthMachinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <div className="sticky top-16 z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-800/50 pt-6 pb-4 mb-6">
          <Link
            href="/tools"
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors font-sans"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回工具列表
          </Link>
        </div>

        {/* Tool Component */}
        <TimeWealthMachine />
      </div>
    </div>
  );
}

