import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { createFaqJsonLd, createPageJsonLd, SeoFaqBlock, SeoJsonLd, seoPageConfigs } from "@/lib/seo-jsonld";

const seo = seoPageConfigs["/tools/portfolio-tracker"];

export const metadata: Metadata = {
  title: "投资组合追踪工具：资产配置、持仓市值和收益变化 - Wise Invest",
  description: "Wise Invest 投资组合追踪工具，用于记录资产持仓、查看组合市值、资产配置比例和收益变化。",
  keywords: ["投资组合", "持仓追踪", "资产配置", "组合收益", "美股组合", "加密资产组合", "投资工具"],
  alternates: {
    canonical: siteConfig.url("/tools/portfolio-tracker"),
  },
  openGraph: {
    title: "投资组合追踪工具 - Wise Invest",
    description: "记录资产持仓、组合市值、配置比例和收益变化。",
    url: siteConfig.url("/tools/portfolio-tracker"),
    siteName: siteConfig.name,
    type: "website",
  },
};

export default function PortfolioTrackerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SeoJsonLd data={[createPageJsonLd(seo), createFaqJsonLd(seo)]} />
      {children}
      <SeoFaqBlock items={seo.faqs} title="投资组合追踪常见问题" />
    </>
  );
}
