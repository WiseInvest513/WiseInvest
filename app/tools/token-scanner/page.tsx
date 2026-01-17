import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";

export const metadata: Metadata = {
  title: "代币扫描器 - Wise Invest",
  description: "扫描和分析代币合约信息",
};

export default function TokenScannerPage() {
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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-400 dark:bg-yellow-500 rounded-full flex items-center justify-center">
                <Search className="h-6 w-6 text-black" />
              </div>
              <div>
                <CardTitle className="text-2xl">代币扫描器</CardTitle>
                <CardDescription>扫描和分析代币合约信息</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-12 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  即将推出...
                </p>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                此工具正在开发中，敬请期待
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

