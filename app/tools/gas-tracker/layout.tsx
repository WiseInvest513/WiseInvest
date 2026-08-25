import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { createFaqJsonLd, createPageJsonLd, SeoFaqBlock, SeoJsonLd, seoPageConfigs } from "@/lib/seo-jsonld";

const seo = seoPageConfigs["/tools/gas-tracker"];

export const metadata: Metadata = {
  title: "多链 Gas 查询工具：ETH、Solana、Arbitrum、BSC、Base 手续费 - Wise Invest",
  description: "Wise Invest 多链 Gas 查询工具，查看 ETH、Solana、Arbitrum、BSC、Base、BTC、Tron 等网络手续费和转账成本。",
  keywords: ["Gas 查询", "ETH Gas", "Solana Gas", "Arbitrum Gas", "BSC Gas", "Base Gas", "链上手续费", "Web3 工具"],
  alternates: {
    canonical: siteConfig.url("/tools/gas-tracker"),
  },
  openGraph: {
    title: "多链 Gas 查询工具 - Wise Invest",
    description: "查看主流链手续费和转账成本。",
    url: siteConfig.url("/tools/gas-tracker"),
    siteName: siteConfig.name,
    type: "website",
  },
};

export default function GasTrackerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SeoJsonLd data={[createPageJsonLd(seo), createFaqJsonLd(seo)]} />
      {children}
      <SeoFaqBlock items={seo.faqs} title="Gas 查询常见问题" />
    </>
  );
}
