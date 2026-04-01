import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `资源导航 - ${siteConfig.name}`,
  description: "精选投资相关资源：交易所、钱包、DeFi平台、数据分析工具、教育资源等，每一个都经过亲测推荐。",
  openGraph: {
    title: `资源导航 - ${siteConfig.name}`,
    description: "精选交易所、钱包、DeFi平台、数据工具等投资必备资源",
    url: siteConfig.url("/resources"),
  },
  alternates: {
    canonical: siteConfig.url("/resources"),
  },
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
