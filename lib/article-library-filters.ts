export type ArticleLibrarySort = "" | "newest" | "shortest" | "longest";
export type ArticleLibraryFilters = { topic: string; sort: ArticleLibrarySort };

export function readArticleLibraryFilters(search: string, validCategoryIds: readonly string[]) {
  const params = new URLSearchParams(search);
  const topic = params.get("topic") ?? "";
  const sort = params.get("sort") ?? "";
  return {
    q: params.get("q") ?? "",
    topic: validCategoryIds.includes(topic) ? topic : "",
    sort: (["newest", "shortest", "longest"].includes(sort) ? sort : "") as ArticleLibrarySort,
  };
}

/** Only edit library-owned parameters; keep route, subcategory and other context. */
export function updateArticleLibrarySearch(search: string, patch: Partial<{ q: string; topic: string; sort: ArticleLibrarySort }>) {
  const params = new URLSearchParams(search);
  for (const key of ["q", "topic", "sort"] as const) {
    const value = patch[key];
    if (value === undefined) continue;
    if (value.trim()) params.set(key, value);
    else params.delete(key);
  }
  return params.toString();
}

type FilterableArticle = { id: string; title: string; summary: string; categoryId: string; subcategoryId?: string; date?: string; readTime?: number };
type FilterOptions = {
  query?: string;
  topic?: string;
  categoryId?: string;
  subcategoryId?: string;
  sort?: ArticleLibrarySort;
  categoryNames?: Readonly<Record<string, string>>;
  defaultOrder?: readonly string[];
};

export function filterArticleLibrary<T extends FilterableArticle>(articles: readonly T[], options: FilterOptions): T[] {
  const query = options.query?.trim().toLowerCase() ?? "";
  // Searching is site-wide; a topic filter explicitly narrows those results.
  const categoryId = query ? options.topic : options.categoryId || options.topic;
  const filtered = articles.filter(article => (!categoryId || article.categoryId === categoryId)
    && (query || !options.subcategoryId || article.subcategoryId === options.subcategoryId)
    && (!query || `${article.title} ${article.summary} ${options.categoryNames?.[article.categoryId] ?? ""}`.toLowerCase().includes(query)));
  const date = (article: T) => {
    const value = Date.parse(article.date ?? "");
    return Number.isFinite(value) ? value : -Infinity;
  };
  if (options.sort === "newest") return filtered.sort((a, b) => date(b) - date(a));
  if (options.sort === "shortest" || options.sort === "longest") {
    const direction = options.sort === "shortest" ? 1 : -1;
    return filtered.sort((a, b) => {
      const aKnown = Boolean(a.readTime && a.readTime > 0), bKnown = Boolean(b.readTime && b.readTime > 0);
      if (aKnown !== bKnown) return aKnown ? -1 : 1;
      return aKnown && bKnown ? direction * (a.readTime! - b.readTime!) : 0;
    });
  }
  if (!query && options.defaultOrder?.length) {
    const order = new Map(options.defaultOrder.map((id, index) => [id, index]));
    return filtered.sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity));
  }
  return filtered;
}

export function getSeriesAvailability(series: { chapters: readonly { articleId?: string }[]; existingArticleId?: string }, availableIds: ReadonlySet<string>) {
  const chapterIds = new Set(series.chapters.flatMap(chapter => chapter.articleId && availableIds.has(chapter.articleId) ? [chapter.articleId] : []));
  const hasExisting = Boolean(series.existingArticleId && availableIds.has(series.existingArticleId));
  const readableIds = new Set(chapterIds);
  if (hasExisting) readableIds.add(series.existingArticleId!);
  return { readableCount: readableIds.size, chapterCount: chapterIds.size, hasExisting };
}
