import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getContentViewerTier } from "@/lib/identity/content-viewer";
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
import { ArticlesContent } from "@/app/articles/articles-content";
import {
  buildLoginHref,
  canReadContentAccess,
} from "@/lib/content-access";
import { createArticlePreview, getArticlePreviewPercentage } from "@/lib/article-preview";
import { getResolvedContentAccessRule } from "@/lib/content-access-server";
import { getArticleRelease, getArticleReleaseAccessRule } from "@/lib/article-release";
import { resolveArticleSeries, getSeriesArticleHref, getSeriesReadingState } from "@/lib/article-series";

// 文章详情需要按登录状态输出全文或公开摘要，不能静态缓存成单一版本。
export const dynamic = "force-dynamic";

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

export default async function ArticleUidPage(
  { params, searchParams }: { params: Promise<{ categoryId: string; uid: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }
) {
  const { categoryId, uid } = await params;
  const article = getArticleByRoute(categoryId, uid);
  if (!article) notFound();
  const query = (await searchParams) ?? {};
  const series = resolveArticleSeries(query?.series, article.id);
  const mapRouteId = typeof query?.route === "string" ? query.route : undefined;

  const seriesContext = { fromSeries: query.fromSeries, fromStage: query.fromStage, fromRoute: query.fromRoute, stage: query.stage };
  const allArticles = getAllArticles();
  const articleRoute = getArticleRoute(article);
  const seriesReading = series ? getSeriesReadingState(series, allArticles, article.id, mapRouteId, seriesContext) : undefined;
  const [membershipTier, resolvedAccessRule] = await Promise.all([
    getContentViewerTier(),
    getResolvedContentAccessRule(articleRoute),
  ]);
  const serverNow = Date.now();
  const release = getArticleRelease(article);
  const accessRule = getArticleReleaseAccessRule(articleRoute, serverNow) ?? resolvedAccessRule;
  const canReadFullArticle = canReadContentAccess(accessRule.access, membershipTier);
  const visibleArticle = canReadFullArticle
    ? article
    : {
        ...article,
        content: createArticlePreview(article),
      };
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
        key={`${article.id}:${series?.id ?? "article"}`}
        initialSeriesId={series?.id}
        initialSeriesContext={seriesContext}
        initialMapRouteId={mapRouteId}
        initialArticle={visibleArticle}
        initialArticleId={article.id}
        initialArticles={allArticles.map(toArticleListItem)}
        initialCategoryId={article.categoryId}
        initialFaqs={articleFaqs}
        limitedRelease={release ? {
          endsAt: release.endsAt,
          serverNow,
          canReadAfterExpiry: canReadContentAccess("VIP", membershipTier),
          previewContent: createArticlePreview(article),
        } : undefined}
        lockedContent={
          canReadFullArticle
            ? undefined
            : {
                reason: accessRule.reason,
                loginHref: buildLoginHref(series ? (seriesReading?.chapters.find(chapter => chapter.articleId === article.id)?.href ?? seriesReading?.existingHref ?? getSeriesArticleHref(series.id, article, mapRouteId)) : articleRoute),
                previewPercentage: getArticlePreviewPercentage(article),
              }
        }
      />
    </>
  );
}
