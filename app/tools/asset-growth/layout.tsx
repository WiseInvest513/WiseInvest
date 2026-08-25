import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { createFaqJsonLd, createPageJsonLd, SeoFaqBlock, SeoJsonLd, seoPageConfigs } from "@/lib/seo-jsonld";

const seo = seoPageConfigs["/tools/asset-growth"];

export const metadata: Metadata = {
  title: "资产增长对比工具：黄金、美股、指数和资产长期回报曲线 - Wise Invest",
  description: "资产增长对比工具，用长期历史数据对比黄金、美股、指数等资产在不同周期的增长路径和回撤阶段。",
  keywords: ["资产增长", "长期回报", "资产配置", "美股回报", "黄金回报", "指数投资", "投资工具"],
  alternates: {
    canonical: siteConfig.url("/tools/asset-growth"),
  },
  openGraph: {
    title: "资产增长对比工具 - Wise Invest",
    description: "对比不同资产的长期增长曲线和关键回撤阶段。",
    url: siteConfig.url("/tools/asset-growth"),
    siteName: siteConfig.name,
    type: "website",
  },
};

export default function AssetGrowthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SeoJsonLd data={[createPageJsonLd(seo), createFaqJsonLd(seo)]} />
      {children}
      <SeoFaqBlock items={seo.faqs} title="资产增长工具常见问题" />
    </>
  );
}
