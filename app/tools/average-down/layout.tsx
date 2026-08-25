import { createFaqJsonLd, createPageJsonLd, SeoFaqBlock, SeoJsonLd, seoPageConfigs } from "@/lib/seo-jsonld";

const seo = seoPageConfigs["/tools/average-down"];

export default function AverageDownLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SeoJsonLd data={[createPageJsonLd(seo), createFaqJsonLd(seo)]} />
      {children}
      <SeoFaqBlock items={seo.faqs} title="补仓计算器常见问题" />
    </>
  );
}
