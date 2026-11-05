import { articleSeries, type ArticleSeries } from "./article-library";
import { genUid } from "./article-uid";

export type SeriesArticle = { id: string; categoryId: string };

export function getArticleSeries(seriesId: unknown, articleId?: string) {
  if (typeof seriesId !== "string") return undefined;
  return articleSeries.find(series => series.id === seriesId && (!articleId
    || series.chapters.some(chapter => chapter.articleId === articleId)
    || series.existingArticleId === articleId));
}

/** Article presentation follows membership even on its canonical URL without ?series=. */
export function isTopicSeriesArticle(articleId: unknown) {
  return typeof articleId === "string" && articleSeries.some(series => series.kind === "topic"
    && (series.chapters.some(chapter => chapter.articleId === articleId)
      || series.existingArticleId === articleId));
}

export function getArticleLearningPaths(articleId: string) {
  return articleSeries.filter(series => series.kind === "path" && series.chapters.some(chapter => chapter.articleId === articleId));
}

export function getMapArticleSeries(routeId: string) {
  return articleSeries.find(series => series.mapRouteIds?.includes(routeId));
}

function resolveMapRoute(series: ArticleSeries | undefined, routeId: unknown) {
  return typeof routeId === "string" && series?.mapRouteIds?.includes(routeId)
    ? routeId : series?.mapRouteIds?.[0];
}

export function getSeriesOverviewHref(seriesId: string, routeId?: unknown) {
  const route = resolveMapRoute(getArticleSeries(seriesId), routeId);
  return `/articles/series/${seriesId}${route ? `?route=${encodeURIComponent(route)}` : ""}`;
}

export function getSeriesArticleHref(seriesId: string, article: SeriesArticle, routeId?: unknown) {
  const route = resolveMapRoute(getArticleSeries(seriesId), routeId);
  return `/articles/${article.categoryId}/${genUid(article.id)}?series=${encodeURIComponent(seriesId)}${route ? `&route=${encodeURIComponent(route)}` : ""}`;
}

export function getSeriesReadingState(series: ArticleSeries, articles: SeriesArticle[], articleId?: string, routeId?: unknown) {
  const byId = new Map(articles.map(article => [article.id, article]));
  const chapters = series.chapters.map((chapter, index) => {
    const article = chapter.articleId ? byId.get(chapter.articleId) : undefined;
    return { ...chapter, index, href: article ? getSeriesArticleHref(series.id, article, routeId) : undefined };
  });
  const currentIndex = chapters.findIndex(chapter => chapter.articleId === articleId && chapter.href);
  const published = chapters.filter(chapter => chapter.href);
  const existing = series.existingArticleId ? byId.get(series.existingArticleId) : undefined;
  const stages = (series.stages ?? []).map(stage => ({
    ...stage,
    chapters: chapters.filter(chapter => chapter.stageId === stage.id),
  }));
  const currentStageIndex = stages.findIndex(stage => stage.chapters.some(chapter => chapter.articleId === articleId));
  const mapRoute = resolveMapRoute(series, routeId);
  return {
    chapters,
    currentIndex,
    publishedCount: published.length,
    first: published[0],
    previous: currentIndex < 0 ? undefined : published.filter(chapter => chapter.index < currentIndex).at(-1),
    next: currentIndex < 0 ? undefined : published.find(chapter => chapter.index > currentIndex),
    existingHref: existing ? getSeriesArticleHref(series.id, existing, routeId) : undefined,
    overviewHref: getSeriesOverviewHref(series.id, routeId),
    mapHref: series.kind === "path" ? `/roadmap${mapRoute ? `?route=${encodeURIComponent(mapRoute)}` : ""}` : undefined,
    stages,
    currentStageIndex,
  };
}

export type SeriesReadingState = ReturnType<typeof getSeriesReadingState>;
