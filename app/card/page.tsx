import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { virtualCardProducts } from "./data";
import CardPageClient from "./card-page-client";

export const metadata: Metadata = {
  title: "虚拟 U 卡资料库：大陆用户开卡、AI 订阅、Apple Pay 与支付宝绑定 - Wise Invest",
  description: "Wise Invest 虚拟 U 卡资料库，对比 MPCard、Bitget Wallet、SafePal、BenPay、Bybit Card 等卡片的开卡条件、邀请码、AI 订阅、Apple Pay、支付宝、微信和费率。",
  keywords: ["虚拟 U 卡", "U 卡申请", "大陆用户虚拟卡", "AI 订阅卡", "Apple Pay", "支付宝", "微信支付", "MPCard", "Bitget Wallet Card", "SafePal Card", "BenPay"],
  alternates: {
    canonical: siteConfig.url("/card"),
  },
  openGraph: {
    title: "虚拟 U 卡资料库：大陆用户开卡、AI 订阅、Apple Pay 与支付宝绑定 - Wise Invest",
    description: "对比 MPCard、Bitget Wallet、SafePal、BenPay、Bybit Card 等虚拟 U 卡的开卡条件、邀请码、支付绑定和费率。",
    url: siteConfig.url("/card"),
    siteName: siteConfig.name,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "虚拟 U 卡资料库：大陆用户开卡、AI 订阅、Apple Pay 与支付宝绑定 - Wise Invest",
    description: "对比 MPCard、Bitget Wallet、SafePal、BenPay、Bybit Card 等虚拟 U 卡的开卡条件、邀请码、支付绑定和费率。",
  },
};

export default function CardPage() {
  const cardJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "虚拟 U 卡资料库：大陆用户开卡、AI 订阅、Apple Pay 与支付宝绑定",
    description: "Wise Invest 虚拟 U 卡、AI 订阅卡、邀请码、支付绑定和教程入口整理。",
    url: siteConfig.url("/card"),
    itemListElement: virtualCardProducts.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.name,
      description: `${product.issuer}：${product.usage}`,
      url: siteConfig.url("/card"),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cardJsonLd) }}
      />
      <CardPageClient />
    </>
  );
}
