import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categories, subcategories } from "@/lib/articles-data";
import { getAllArticles, getArticleRoute, toArticleListItem } from "@/lib/articles";
import { siteConfig } from "@/lib/config";
import { ArticlesContent } from "../articles-content";

export const dynamicParams = false;

const categorySeo: Record<string, { title: string; description: string; keywords: string[] }> = {
  vcard: {
    title: "虚拟 U 卡教程合集：大陆用户开卡、AI 订阅、Apple Pay 与支付宝绑定",
    description: "Wise Invest 虚拟 U 卡教程合集，整理 MPCard、Bitget Wallet Card、SafePal、BenPay、Bybit Card 等开卡、充值、邀请码和支付绑定流程。",
    keywords: ["虚拟 U 卡", "U 卡教程", "大陆用户虚拟卡", "AI 订阅卡", "Apple Pay", "支付宝", "微信支付"],
  },
  crypto: {
    title: "加密交易所注册入金教程：Binance、OKX、Bybit、Bitget 大陆用户指南",
    description: "Wise Invest 加密交易所教程合集，覆盖 Binance 币安、OKX 欧易、Bybit、Bitget 的注册、KYC、C2C 入金、买币和理财使用。",
    keywords: ["币安注册", "OKX 注册", "Bybit 注册", "Bitget 注册", "C2C 入金", "USDT", "KYC"],
  },
  predict: {
    title: "预测市场入门：Predict.fun、BTC 5 分钟预测与风险指南",
    description: "Wise Invest 预测市场文章合集，介绍 Predict.fun、BTC 5 分钟预测、市场价格与概率、结算规则、资金准备和地区限制，帮助读者理解机制与风险。",
    keywords: ["预测市场", "Predict.fun", "BTC 5 分钟预测", "预测市场入门", "结算规则", "交易风险"],
  },
  broker: {
    title: "港美股券商开户教程：盈透证券、嘉信证券、复星、致富开户和入金指南",
    description: "Wise Invest 港美股券商开户教程合集，整理盈透证券 IBKR、嘉信证券 Schwab、复星、致富、第一证券等开户、入金和账户使用流程。",
    keywords: ["美股券商开户", "盈透证券开户", "嘉信证券开户", "港美股开户", "券商入金"],
  },
  bank: {
    title: "境外银行开户教程：Wise、香港银行、新加坡银行和见证开户指南",
    description: "Wise Invest 境外银行教程合集，覆盖 Wise、汇丰、中银香港、众安、香港蚂蚁、新加坡海湾银行和见证开户流程。",
    keywords: ["境外银行开户", "香港银行开户", "Wise 注册", "新加坡银行开户", "见证开户"],
  },
  index: {
    title: "指数基金与 ETF 定投教程：标普500、纳斯达克100 和长期复利指南",
    description: "Wise Invest 指数投资教程合集，整理标普500、纳斯达克100、ETF、场内外基金区别、定投策略和复利计算思路。",
    keywords: ["指数基金", "ETF", "标普500", "纳斯达克100", "定投", "复利"],
  },
};

export function generateStaticParams() {
  return categories.map((category) => ({ categoryId: category.id }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ categoryId: string }> }
): Promise<Metadata> {
  const { categoryId } = await params;
  const category = categories.find((item) => item.id === categoryId);
  if (!category) return {};

  const seo = categorySeo[category.id] ?? {
    title: `${category.name}文章教程合集`,
    description: `Wise Invest ${category.name}文章合集，整理相关投资、出海、Web3 和工具教程。`,
    keywords: [category.name, "Wise Invest", "投资教程"],
  };
  const url = siteConfig.url(`/articles/${category.id}`);

  return {
    title: `${seo.title} - ${siteConfig.name}`,
    description: seo.description,
    keywords: ["Wise Invest", category.name, ...seo.keywords],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url,
      siteName: siteConfig.name,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: seo.title,
      description: seo.description,
    },
  };
}

export default async function CategoryPage(
  { params, searchParams }: {
    params: Promise<{ categoryId: string }>;
    searchParams: Promise<{ subcategory?: string }>;
  }
) {
  const { categoryId } = await params;
  const category = categories.find((item) => item.id === categoryId);
  if (!category) notFound();

  const { subcategory: subcategoryId } = await searchParams;
  const subcategory = subcategories.find((item) => item.id === subcategoryId && item.categoryId === category.id);
  const allArticles = getAllArticles();
  const articles = allArticles.filter((article) => article.categoryId === category.id);

  const seo = categorySeo[category.id] ?? {
    title: `${category.name}文章教程合集`,
    description: `Wise Invest ${category.name}文章合集，整理相关投资、出海、Web3 和工具教程。`,
    keywords: [category.name],
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: siteConfig.name, item: siteConfig.baseUrl },
      { "@type": "ListItem", position: 2, name: "文章", item: siteConfig.url("/articles") },
      { "@type": "ListItem", position: 3, name: category.name, item: siteConfig.url(`/articles/${category.id}`) },
    ],
  };
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: seo.title,
    description: seo.description,
    url: siteConfig.url(`/articles/${category.id}`),
    itemListElement: articles.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: article.title,
      description: article.summary,
      url: siteConfig.url(getArticleRoute(article)),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <ArticlesContent
        key={`${category.id}:${subcategory?.id ?? "all"}`}
        initialArticles={allArticles.map(toArticleListItem)}
        initialCategoryId={category.id}
        initialSubcategoryId={subcategory?.id}
      />
    </>
  );
}
