import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { createFaqJsonLd, createPageJsonLd, SeoFaqBlock, SeoJsonLd, seoPageConfigs } from "@/lib/seo-jsonld";

const seo = seoPageConfigs["/practice/dca-investment"];

export const metadata: Metadata = {
  title: "BTC / ETH 定投实盘：Wise Invest 定投收益曲线、成本和明细记录",
  description: "Wise Invest BTC / ETH 定投实盘页面，持续记录每期买入价格、定投成本、收益曲线、组合市值和长期执行明细。",
  keywords: ["BTC 定投", "ETH 定投", "比特币定投", "以太坊定投", "DCA", "定投收益曲线", "定投明细", "Wise Invest"],
  alternates: {
    canonical: siteConfig.url("/practice/dca-investment"),
  },
  openGraph: {
    title: "BTC / ETH 定投实盘 - Wise Invest",
    description: "查看 Wise 的 BTC / ETH 定投成本、收益曲线和明细记录。",
    url: siteConfig.url("/practice/dca-investment"),
    siteName: siteConfig.name,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "BTC / ETH 定投实盘 - Wise Invest",
    description: "查看 BTC / ETH 定投成本、收益曲线和明细记录。",
  },
};

export default function DcaInvestmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SeoJsonLd data={[createPageJsonLd(seo), createFaqJsonLd(seo)]} />
      {children}
      <SeoFaqBlock items={seo.faqs} title="BTC / ETH 定投常见问题" />
    </>
  );
}
