import { articleSeries, type ArticleSeries } from "./article-library";
import { getSeriesOverviewHref } from "./article-series";
import { genUid } from "./article-uid";
import type { ArticleListItem } from "./articles";

export type SeriesRecommendedArticle = Pick<ArticleListItem,
  "id" | "title" | "summary" | "categoryId" | "date" | "readTime" | "coverImage"
> & { href: string };

export type RelatedSeriesRecommendation = Pick<ArticleSeries,
  "id" | "title" | "description" | "artwork" | "kind"
> & { href: string; publishedCount: number };

type RecommendationPlan = { articles: readonly string[]; series: readonly string[] };

// Editorial relationships: a next subject should follow the reader's current goal.
// IDs resolve against the supplied published list; plans never create placeholder links.
const plans: Readonly<Record<string, RecommendationPlan>> = {
  "investment-foundations": {
    articles: ["passive-millionaire", "index-qa-1", "index-guide"],
    series: ["nasdaq-investing", "us-stock-funding"],
  },
  "nasdaq-investing": {
    articles: ["us-stock-platform-comparison", "IBKR", "wise-register"],
    series: ["investment-foundations", "us-stock-funding"],
  },
  "us-stock-funding": {
    articles: ["nasdaq-investment-guide", "index-guide", "ifas-fuxing"],
    series: ["nasdaq-investing", "hk-stock-funding"],
  },
  "hk-stock-funding": {
    articles: ["us-stock-platform-comparison", "wise-register", "IBKR"],
    series: ["us-stock-funding", "nasdaq-investing"],
  },
  "crypto-basics": {
    articles: ["biance-guide", "okx-guide", "bitget-exchange"],
    series: ["crypto-tools", "exchange-referral"],
  },
  binance: {
    articles: ["binance-referral", "okx-guide", "bitget-exchange"],
    series: ["exchange-referral", "crypto-tools"],
  },
  "exchange-referral": {
    articles: ["biance-guide", "bitget-exchange", "okx-guide"],
    series: ["crypto-tools", "binance"],
  },
  "crypto-tools": {
    articles: ["binance-referral", "bitget-referral", "giffgaff-guide"],
    series: ["exchange-referral", "overseas"],
  },
  overseas: {
    articles: ["immersive-translate-guide", "gamsgo-guide", "bitget-vcard"],
    series: ["ai-reading", "crypto-tools"],
  },
  "ai-reading": {
    articles: ["AppleID", "giffgaff-guide", "xesim-guide"],
    series: ["overseas", "crypto-tools"],
  },
};

function memberIds(series: ArticleSeries): string[] {
  return [...new Set([
    ...series.chapters.flatMap(chapter => chapter.articleId ? [chapter.articleId] : []),
    ...(series.existingArticleId ? [series.existingArticleId] : []),
  ])];
}

/** Only list metadata is returned, so recommendations cannot serialize article bodies. */
export function getSeriesRecommendations(
  currentSeries: ArticleSeries,
  publishedArticles: readonly ArticleListItem[],
): { articles: SeriesRecommendedArticle[]; series: RelatedSeriesRecommendation[] } {
  const plan = Object.hasOwn(plans, currentSeries.id) ? plans[currentSeries.id] : undefined;
  if (!plan) return { articles: [], series: [] };

  const byId = new Map<string, ArticleListItem>();
  for (const article of publishedArticles) {
    if (article.id && article.title && article.categoryId && !byId.has(article.id)) byId.set(article.id, article);
  }
  const excludedIds = new Set(memberIds(currentSeries));
  const related = plan.series.flatMap(id => {
    const series = articleSeries.find(candidate => candidate.id === id && id !== currentSeries.id);
    if (!series) return [];
    const publishedCount = memberIds(series).filter(articleId => byId.has(articleId)).length;
    return publishedCount ? [{ series, publishedCount }] : [];
  });
  const candidateIds = new Set([
    ...plan.articles,
    ...related.flatMap(({ series }) => memberIds(series)),
  ]);
  const articles: SeriesRecommendedArticle[] = [];
  for (const id of candidateIds) {
    const article = byId.get(id);
    if (!article || excludedIds.has(id)) continue;
    const { title, summary, categoryId, date, readTime, coverImage } = article;
    articles.push({ id, title, summary, categoryId, date, readTime, coverImage, href: `/articles/${categoryId}/${genUid(id)}` });
    if (articles.length === 3) break;
  }

  return {
    articles,
    series: related.slice(0, 2).map(({ series, publishedCount }) => {
      const { id, title, description, artwork, kind } = series;
      return { id, title, description, artwork, kind, publishedCount, href: getSeriesOverviewHref(id) };
    }),
  };
}
