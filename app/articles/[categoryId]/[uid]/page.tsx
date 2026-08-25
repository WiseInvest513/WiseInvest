import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import {
  getAllArticles,
  getArticleByRoute,
  getArticlePrimaryImage,
  getArticleRoute,
  getArticleFaqs,
  getArticleSeoKeywords,
  toArticleListItem,
} from "@/lib/articles";
import { genUid } from "@/lib/article-uid";
import { ArticlesContent } from "@/app/articles/articles-content";

// 所有文章均在构建时静态生成，不存在的路径返回 404
// Serverless Function 运行时不再读取文件系统
export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllArticles().map((article) => ({
    categoryId: article.categoryId,
    uid: genUid(article.id),
  }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ categoryId: string; uid: string }> }
): Promise<Metadata> {
  const { categoryId, uid } = await params;
  const article = getArticleByRoute(categoryId, uid);
  if (!article) return {};

  const url = siteConfig.url(getArticleRoute(article));
  const image = getArticlePrimaryImage(article);
  const images = image
    ? [{ url: image.startsWith("http") ? image : siteConfig.url(image), alt: article.title }]
    : undefined;
  const keywords = getArticleSeoKeywords(article);

  return {
    title: `${article.title} - ${siteConfig.name}`,
    description: article.summary,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
      url,
      siteName: siteConfig.name,
      publishedTime: article.date || undefined,
      authors: [siteConfig.name],
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: article.title,
      description: article.summary,
      images: images?.map((item) => item.url),
    },
  };
}

// dynamicParams=false 保证此组件只在构建时被调用（SSG）
// 运行时所有已知路径均从 CDN 直接返回静态 HTML，未知路径返回 404
export default async function ArticleUidPage(
  { params }: { params: Promise<{ categoryId: string; uid: string }> }
) {
  const { categoryId, uid } = await params;
  const article = getArticleByRoute(categoryId, uid);
  if (!article) notFound();

  const allArticles = getAllArticles();
  const url = siteConfig.url(getArticleRoute(article));
  const image = getArticlePrimaryImage(article);
  const absoluteImage = image
    ? image.startsWith("http")
      ? image
      : siteConfig.url(image)
    : undefined;
  const keywords = getArticleSeoKeywords(article);
  const articleFaqs = getArticleFaqs(article);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    datePublished: article.date || undefined,
    dateModified: article.date || undefined,
    keywords,
    author: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.baseUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    image: absoluteImage ? [absoluteImage] : undefined,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: siteConfig.name,
        item: siteConfig.baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "文章",
        item: siteConfig.url("/articles"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: url,
      },
    ],
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: articleFaqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <ArticlesContent
        initialArticle={article}
        initialArticleId={article.id}
        initialArticles={allArticles.map(toArticleListItem)}
        initialCategoryId={article.categoryId}
        initialFaqs={articleFaqs}
      />
    </>
  );
}
