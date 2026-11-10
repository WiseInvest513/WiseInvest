import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { virtualCardProducts } from "./data";
import CardPageClient from "./card-page-client";

export const metadata: Metadata = {
  title: "虚拟 U 卡（U卡）资料库：大陆开卡、支付绑定与费率对照 - Wise Invest",
  description: "想办 U卡或虚拟 U 卡，先对照开卡条件、邀请码、AI 订阅、Apple Pay、支付宝、微信和费率。本页是选卡资料库，具体申请步骤请进各卡教程。",
  keywords: ["虚拟 U 卡", "U卡", "U card", "U 卡申请", "大陆用户虚拟卡", "AI 订阅卡", "Apple Pay", "支付宝", "微信支付", "MPCard", "Bitget Wallet Card", "SafePal Card", "BenPay"],
  alternates: {
    canonical: siteConfig.url("/card"),
  },
  openGraph: {
    title: "虚拟 U 卡（U卡）资料库：大陆开卡、支付绑定与费率对照 - Wise Invest",
    description: "想办 U卡或虚拟 U 卡，先对照开卡条件、邀请码、AI 订阅、Apple Pay、支付宝、微信和费率。本页是选卡资料库，具体申请步骤请进各卡教程。",
    url: siteConfig.url("/card"),
    siteName: siteConfig.name,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "虚拟 U 卡（U卡）资料库：大陆开卡、支付绑定与费率对照 - Wise Invest",
    description: "想办 U卡或虚拟 U 卡，先对照开卡条件、邀请码、AI 订阅、Apple Pay、支付宝、微信和费率。本页是选卡资料库，具体申请步骤请进各卡教程。",
  },
};

export default function CardPage() {
  const cardJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "虚拟 U 卡（U卡）资料库：大陆开卡、支付绑定与费率对照",
    description: "对照各类虚拟 U 卡（U卡）的开卡条件、邀请码、支付绑定和费率，按场景选卡后再进入各卡教程。",
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
