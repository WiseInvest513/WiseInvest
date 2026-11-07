import { articleSeries, type ArticleSeries } from "./article-library";
import { genUid } from "./article-uid";

export type SeriesArticle = { id: string; categoryId: string };

/** URL context is untrusted; a return target must match a configured parent resource. */
export type SeriesReturnContext = { fromSeries?: unknown; fromStage?: unknown; stage?: unknown; fromRoute?: unknown };
export type SeriesReturnTarget = {
  seriesId: string;
  title: string;
  stageId: string;
  stageTitle: string;
  href: string;
  routeId?: string;
  targetSeriesId: string;
};

export type SeriesResource = {
  kind: "series" | "article" | "book" | "tool" | "resource";
  label: string;
  href: string;
  series?: ArticleSeries;
};

function internalUrl(href: string) {
  if (!href.startsWith("/") && !/^https?:\/\//i.test(href)) return undefined;
  if (href.startsWith("//")) return undefined;
  try {
    const url = new URL(href, "https://www.wise-invest.org");
    if (!["wise-invest.org", "www.wise-invest.org", "localhost", "127.0.0.1"].includes(url.hostname)) return undefined;
    if (url.username || url.password) return undefined;
    return url;
  } catch {
    return undefined;
  }
}

function localHref(url: URL) {
  return `${url.pathname}${url.search}${url.hash}`;
}

function resourceSeries(href: string) {
  const url = internalUrl(href);
  const id = url?.pathname.match(/^\/articles\/series\/([^/]+)\/?$/)?.[1];
  return id ? getArticleSeries(id) : undefined;
}

function getReturnTarget(series: ArticleSeries, context?: SeriesReturnContext): SeriesReturnTarget | undefined {
  const parent = getArticleSeries(context?.fromSeries);
  if (!parent || parent.id === series.id || typeof context?.fromStage !== "string") return undefined;
  const stage = parent.stages?.find(item => item.id === context.fromStage);
  if (!stage?.resources?.some(resource => resourceSeries(resource.href)?.id === series.id)) return undefined;
  const routeId = resolveMapRoute(parent, context.fromRoute);
  const url = new URL(getSeriesOverviewHref(parent.id, routeId), "https://www.wise-invest.org");
  url.searchParams.set("stage", stage.id);
  url.hash = `stage-${stage.id}`;
  return { seriesId: parent.id, title: parent.title, stageId: stage.id, stageTitle: stage.title, href: localHref(url), routeId, targetSeriesId: series.id };
}

/** Retain one validated parent while reading its child series; unrelated links stay untouched. */
export function addSeriesReturnContext(href: string, returnTo?: SeriesReturnTarget) {
  if (!returnTo) return href;
  const url = internalUrl(href);
  if (!url) return href;
  const isOverview = resourceSeries(href)?.id === returnTo.targetSeriesId;
  const isArticle = /^\/articles\/[^/]+\/[a-zA-Z0-9]{8}$/.test(url.pathname)
    && url.searchParams.get("series") === returnTo.targetSeriesId;
  if (!isOverview && !isArticle) return href;
  url.searchParams.set("fromSeries", returnTo.seriesId);
  url.searchParams.set("fromStage", returnTo.stageId);
  if (returnTo.routeId) url.searchParams.set("fromRoute", returnTo.routeId);
  else url.searchParams.delete("fromRoute");
  return localHref(url);
}

/** Classify a configured resource and keep its original query/hash when opening a child series. */
export function resolveSeriesResource(href: string, parentSeries: ArticleSeries, stageId?: string, routeId?: unknown): SeriesResource {
  const url = internalUrl(href);
  const series = resourceSeries(href);
  if (series && url) {
    const returnTo = getReturnTarget(series, { fromSeries: parentSeries.id, fromStage: stageId, fromRoute: routeId });
    const stage = series.stages?.find(item => item.id === url.searchParams.get("stage"))
      ?? series.stages?.find(item => `#stage-${item.id}` === url.hash);
    if (stage) url.searchParams.set("stage", stage.id);
    return { kind: "series", label: "系列教程", href: addSeriesReturnContext(localHref(url), returnTo), series };
  }
  if (url && /^\/articles\/[^/]+\/[a-zA-Z0-9]{8}$/.test(url.pathname)) return { kind: "article", label: "学习文章", href };
  if (url && /^\/book(?:\/|$)/.test(url.pathname)) return { kind: "book", label: "电子书", href };
  if ((url && /^\/(?:tools|roadmap)(?:\/|$)/.test(url.pathname)) || /^https:\/\/(?:www\.)?wise-etf\.com(?:\/|$)/i.test(href)) return { kind: "tool", label: "查询工具", href };
  return { kind: "resource", label: "参考资料", href };
}

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

export function getSeriesReadingState(series: ArticleSeries, articles: SeriesArticle[], articleId?: string, routeId?: unknown, context?: SeriesReturnContext) {
  const byId = new Map(articles.map(article => [article.id, article]));
  const returnTo = getReturnTarget(series, context);
  const chapters = series.chapters.map((chapter, index) => {
    const article = chapter.articleId ? byId.get(chapter.articleId) : undefined;
    return { ...chapter, index, href: article ? addSeriesReturnContext(getSeriesArticleHref(series.id, article, routeId), returnTo) : undefined };
  });
  const currentIndex = chapters.findIndex(chapter => chapter.articleId === articleId && chapter.href);
  const published = chapters.filter(chapter => chapter.href);
  const existing = series.existingArticleId ? byId.get(series.existingArticleId) : undefined;
  const stages = (series.stages ?? []).map(stage => ({
    ...stage,
    resources: stage.resources?.map(resource => ({ ...resource, ...resolveSeriesResource(resource.href, series, stage.id, routeId) })),
    chapters: chapters.filter(chapter => chapter.stageId === stage.id),
  }));
  const currentStageIndex = currentIndex < 0
    ? !articleId && typeof context?.stage === "string" ? stages.findIndex(stage => stage.id === context.stage) : -1
    : stages.findIndex(stage => stage.id === chapters[currentIndex].stageId);
  const mapRoute = resolveMapRoute(series, routeId);
  const overviewUrl = new URL(getSeriesOverviewHref(series.id, routeId), "https://www.wise-invest.org");
  if (typeof context?.stage === "string" && stages.some(stage => stage.id === context.stage)) overviewUrl.searchParams.set("stage", context.stage);
  return {
    chapters,
    currentIndex,
    publishedCount: published.length,
    first: published[0],
    previous: currentIndex < 0 ? undefined : published.filter(chapter => chapter.index < currentIndex).at(-1),
    next: currentIndex < 0 ? undefined : published.find(chapter => chapter.index > currentIndex),
    existingHref: existing ? addSeriesReturnContext(getSeriesArticleHref(series.id, existing, routeId), returnTo) : undefined,
    overviewHref: addSeriesReturnContext(localHref(overviewUrl), returnTo),
    mapHref: series.kind === "path" ? `/roadmap${mapRoute ? `?route=${encodeURIComponent(mapRoute)}` : ""}` : undefined,
    stages,
    currentStageIndex,
    returnTo,
  };
}

export type SeriesReadingState = ReturnType<typeof getSeriesReadingState>;

/** Existing comprehensive guides are readable, but are not standalone chapters. */
export function getSeriesAvailabilityLabel(series: ArticleSeries, reading: Pick<SeriesReadingState, "publishedCount" | "existingHref">) {
  if (reading.existingHref && reading.publishedCount === 0) return "综合教程已可读 · 独立章节筹备";
  if (reading.publishedCount > 0) return `${reading.publishedCount} 篇已发布 · ${series.chapters.length} ${series.kind === "topic" ? "篇内容" : "个章节"}`;
  return series.kind === "topic" ? `内容筹备中 · ${series.chapters.length} 篇规划` : `独立章节筹备中 · ${series.chapters.length} 个规划章节`;
}
