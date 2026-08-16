import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DcaBattingZone } from "@/components/tools/DcaBattingZone";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "DCA - Wise Invest",
  description:
    "持续追踪 BTC、ETH 与 QQQ 的近52周回撤，识别常规定投、击球区与深度击球区。",
  alternates: {
    canonical: siteConfig.url("/DCA"),
  },
  openGraph: {
    title: "DCA - Wise Invest",
    description: "BTC、ETH、QQQ 持续定投与回撤击球区",
    url: siteConfig.url("/DCA"),
  },
};

export default function DcaPage() {
  return (
    <main className="min-h-screen bg-slate-100 py-6 text-slate-950 dark:bg-slate-950 dark:text-white md:py-10">
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <Link
          href="/"
          className="mb-5 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>
        <DcaBattingZone />
      </div>
    </main>
  );
}
