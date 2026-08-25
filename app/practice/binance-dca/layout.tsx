import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { createFaqJsonLd, createPageJsonLd, SeoFaqBlock, SeoJsonLd, seoPageConfigs } from "@/lib/seo-jsonld";

const seo = seoPageConfigs["/practice/binance-dca"];

export const metadata: Metadata = {
  title: "BNB / QQQ 定投记录：币安生态和纳斯达克 100 ETF 定投实盘",
  description: "Wise Invest BNB / QQQ 定投记录页面，记录 BNB 和 QQQ 第一期及后续买入价格、执行日期和长期跟踪计划。",
  keywords: ["BNB 定投", "QQQ 定投", "币安生态", "纳斯达克100", "ETF 定投", "DCA", "Wise Invest"],
  alternates: {
    canonical: siteConfig.url("/practice/binance-dca"),
  },
  openGraph: {
    title: "BNB / QQQ 定投记录 - Wise Invest",
    description: "记录 BNB 和 QQQ 定投执行价格、日期和长期跟踪计划。",
    url: siteConfig.url("/practice/binance-dca"),
    siteName: siteConfig.name,
    type: "website",
  },
};

export default function BinanceDcaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SeoJsonLd data={[createPageJsonLd(seo), createFaqJsonLd(seo)]} />
      {children}
      <SeoFaqBlock items={seo.faqs} title="BNB / QQQ 定投常见问题" />
    </>
  );
}
