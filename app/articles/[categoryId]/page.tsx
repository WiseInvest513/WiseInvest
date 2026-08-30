import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, Calendar, Clock } from "lucide-react";
import { categories, subcategories } from "@/lib/articles-data";
import { getAllArticles, getArticleRoute } from "@/lib/articles";
import { siteConfig } from "@/lib/config";
import { ProtectedContentLink } from "@/components/content-access-gate";

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
  const articleCategoryIds = new Set(getAllArticles().map((article) => article.categoryId));
  return categories
    .filter((category) => articleCategoryIds.has(category.id))
    .map((category) => ({ categoryId: category.id }));
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
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const { categoryId } = await params;
  const category = categories.find((item) => item.id === categoryId);
  if (!category) notFound();

  const articles = getAllArticles().filter((article) => article.categoryId === category.id);
  if (articles.length === 0) notFound();

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
      <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 md:px-6 md:py-10">
        <section className="mx-auto max-w-6xl">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-amber-300 hover:text-amber-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-700 dark:hover:text-amber-300"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            全部文章
          </Link>

          <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_16px_42px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300">
              <BookOpen className="h-3.5 w-3.5" />
              {category.emoji} {category.name}
            </div>
            <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-4xl">
              {seo.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
              {seo.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {(categorySeo[category.id]?.keywords ?? [category.name]).slice(0, 8).map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {articles.map((article) => {
              const subcategory = subcategories.find((item) => item.id === article.subcategoryId);
              return (
                <ProtectedContentLink
                  key={article.id}
                  href={getArticleRoute(article)}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-[0_16px_36px_rgba(245,158,11,0.12)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-700"
                >
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    {subcategory && (
                      <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {subcategory.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {article.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      约 {article.readTime} 分钟
                    </span>
                  </div>
                  <h2 className="mt-3 line-clamp-2 text-lg font-black leading-7 text-slate-900 transition-colors group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-300">
                    {article.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {article.summary}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-amber-700 dark:text-amber-300">
                    阅读教程
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </ProtectedContentLink>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
