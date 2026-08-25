import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { createFaqJsonLd, createPageJsonLd, SeoFaqBlock, SeoJsonLd, seoPageConfigs } from "@/lib/seo-jsonld";

const seo = seoPageConfigs["/ipo"];

export const metadata: Metadata = {
  title: "A 股集合打新与港股打新入口：流程、资格、收益记录和风险说明 - Wise Invest",
  description: "Wise Invest 打新页面，整理 A 股集合打新、港股打新、参与流程、持仓资格、收益记录、服务群和风险说明。",
  keywords: ["A 股打新", "港股打新", "集合打新", "新股申购", "打新流程", "打新收益", "Wise Invest"],
  alternates: {
    canonical: siteConfig.url("/ipo"),
  },
  openGraph: {
    title: "A 股集合打新与港股打新入口 - Wise Invest",
    description: "查看打新流程、资格、收益记录和风险说明。",
    url: siteConfig.url("/ipo"),
    siteName: siteConfig.name,
    type: "website",
  },
};

export default function IpoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SeoJsonLd data={[createPageJsonLd(seo), createFaqJsonLd(seo)]} />
      {children}
      <SeoFaqBlock items={seo.faqs} title="打新常见问题" />
    </>
  );
}
