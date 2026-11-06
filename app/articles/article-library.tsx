"use client";

import { useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import type { ArticleListItem } from "@/lib/articles";
import { categories, subcategories } from "@/lib/articles-data";
import { genUid } from "@/lib/article-uid";
import { getCategoryGuide } from "@/lib/article-category-guides";
import { articleLibraryIcons as libraryArtwork } from "@/lib/article-icons";
import { getSeriesArticleHref, getSeriesReadingState } from "@/lib/article-series";
import { articleSeries, getRecommendedArticles, searchArticleSeries, type ArticleSeries } from "@/lib/article-library";
import { filterArticleLibrary, getSeriesAvailability, type ArticleLibraryFilters, type ArticleLibrarySort } from "@/lib/article-library-filters";
import { ProtectedContentLink } from "@/components/content-access-gate";
import { ArticleCard } from "@/components/article-card";
import styles from "./article-library.module.css";

export type ArticleLibraryView = "recommended" | "series" | "all";

const learningIcons = [SlidersHorizontal, CheckCircle2, RefreshCw];
const indexLearningPath = articleSeries.find(series => series.id === "nasdaq-investing");
const featuredPathIds = ["investment-foundations", "nasdaq-investing", "us-stock-funding"];
const categoryNames = Object.fromEntries(categories.map(category => [category.id, category.name]));
const libraryIntroductions = {
  recommended: "这里汇集投资基础、加密资产、境外开户与出海工具的入门知识和实操教程。帮你理解产品之间的区别，理清准备材料、开通流程与使用风险，把零散的信息变成更清楚的判断。",
  series: "围绕加密货币、交易所与出海工具，将基础概念、操作步骤和常见问题整理成系列教程与专题。通过已发布的内容，逐步建立对一个主题的完整认识，弄清每一步怎么做、哪些地方需要注意。",
  all: "这里收录各主题下已发布的教程、产品介绍与专题文章，涵盖投资与市场、加密与 Web3、开户与资金、工具与出海及 Wise 指南。帮助你比较不同方案，了解具体操作与适用条件，补齐当前问题所需的知识。",
};

interface ArticleLibraryProps {
  articles: ArticleListItem[];
  view: ArticleLibraryView;
  categoryId?: string;
  subcategoryId?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  showSearch?: boolean;
  filterTopic?: string;
  sortOrder?: ArticleLibrarySort;
  onFiltersChange?: (next: ArticleLibraryFilters) => void;
}

function articleHref(article: Pick<ArticleListItem, "id" | "categoryId">) {
  return `/articles/${article.categoryId}/${genUid(article.id)}`;
}

function SeriesTile({ series, availability, priority }: { series: ArticleSeries; availability: ReturnType<typeof getSeriesAvailability>; priority: boolean }) {
  const { readableCount, chapterCount, hasExisting } = availability;
  const existingOnly = hasExisting && chapterCount === 0;
  return (
    <Link href={`/articles/series/${series.id}`} className={styles.seriesTile} data-series={series.id} data-kind={series.kind} aria-label={`进入${series.title}`}>
      <span className={styles.seriesVisual}>
        <Image src={series.cardArtwork ?? series.artwork} alt="" fill priority={priority} sizes="(min-width: 1700px) 410px, (min-width: 1280px) 350px, (min-width: 768px) 400px, calc(100vw - 44px)" className={styles.seriesArtwork} />
      </span>
      <span className={styles.seriesCopy}>
        <span className={styles.seriesStatus} data-published={readableCount > 0}>{existingOnly ? "综合教程已可读 · 分篇筹备" : series.kind === "path" ? "学习路线" : readableCount ? "持续更新" : "筹备中"}</span>
        <span className={styles.seriesTitle}>{series.title}</span>
        <span className={styles.seriesDescription}>{series.description}</span>
      </span>
      <span className={styles.seriesFooter}>
        <span className={styles.seriesMeta}>{series.kind === "path" ? `${series.stages?.length ?? 0} 个阶段` : `${series.chapters.length} ${series.kind === "topic" ? "篇内容" : "个章节"}`}{readableCount > 0 ? ` · ${readableCount} 篇可读` : " · 整理中"}</span>
        <span className={styles.seriesAction}>{existingOnly ? "查看教程" : readableCount ? "开始阅读" : "查看规划"}<ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.5} /></span>
      </span>
    </Link>
  );
}

export function ArticleLibrary({ articles, view, categoryId, subcategoryId, searchQuery, onSearchChange, showSearch = true, filterTopic = "", sortOrder = "", onFiltersChange }: ArticleLibraryProps) {
  const searchInput = useRef<HTMLInputElement | null>(null);
  const category = categories.find(item => item.id === categoryId);
  const subcategory = subcategories.find(item => item.id === subcategoryId && item.categoryId === categoryId);
  const query = searchQuery.trim().toLowerCase();
  const isSearching = query.length > 0;
  const isHome = view === "recommended" && !categoryId && !isSearching;
  const guide = !isSearching ? getCategoryGuide(categoryId, subcategory?.id) : undefined;
  const headingArtwork = !isSearching && !categoryId ? libraryArtwork[view] : undefined;
  const availableIds = useMemo(() => new Set(articles.map(article => article.id)), [articles]);
  const series = useMemo(() => {
    const matches = isSearching ? searchArticleSeries(query) : articleSeries;
    const topicArticles = new Set(articles.filter(article => article.categoryId === filterTopic).map(article => article.id));
    return [...matches].filter(item => !isSearching || !filterTopic || getSeriesAvailability(item, topicArticles).readableCount > 0)
      .sort((a, b) => Number(b.kind === "path") - Number(a.kind === "path"));
  }, [articles, isSearching, query, filterTopic]);
  const readableSeries = series.filter(item => getSeriesAvailability(item, availableIds).readableCount > 0);
  const plannedSeries = series.filter(item => getSeriesAvailability(item, availableIds).readableCount === 0);
  const featuredSeries = featuredPathIds.flatMap(id => {
    const item = readableSeries.find(series => series.id === id);
    return item ? [item] : [];
  });
  const recommended = useMemo(() => getRecommendedArticles(articles), [articles]);
  const latest = useMemo(() => filterArticleLibrary(articles, { sort: "newest" }).slice(0, 4), [articles]);
  const indexReading = categoryId === "index" && !isSearching && indexLearningPath
    ? getSeriesReadingState(indexLearningPath, articles) : undefined;
  const results = useMemo(() => filterArticleLibrary(articles, {
    query, topic: isSearching || !categoryId ? filterTopic : "", categoryId, subcategoryId,
    sort: sortOrder || (view === "all" && !categoryId && !isSearching ? "newest" : ""), categoryNames,
    defaultOrder: categoryId === "index" ? indexLearningPath?.chapters.flatMap(chapter => chapter.articleId ? [chapter.articleId] : [])
      : categoryId === "crypto" ? ["biance-guide", "okx-guide"] : undefined,
  }), [articles, categoryId, subcategoryId, query, isSearching, filterTopic, sortOrder, view]);
  const title = isSearching ? "搜索结果" : category ? subcategory?.name ?? category.name : view === "series" ? "系列内容" : view === "all" ? "全部文章" : "文章中心";
  const description = isHome ? "找到你需要的内容，也可以从一个系列开始。"
    : isSearching ? `找到 ${results.length} 篇文章、${series.length} 个系列`
    : view === "series" && !category ? "教程与专题集中阅读，按自己的问题选择内容。"
    : `${results.length} 篇文章，按自己的需要选择阅读。`;
  const showSeries = isHome || (view === "series" && !category) || (isSearching && series.length > 0);
  const showArticles = isHome || isSearching || view !== "series" || Boolean(category);
  const showFilters = showArticles && !isHome;
  const showTopicFilter = showFilters && (isSearching || !categoryId);
  const hasFilters = Boolean((showTopicFilter && filterTopic) || sortOrder || isSearching);
  const clearSearch = () => {
    onSearchChange("");
    searchInput.current?.focus({ preventScroll: true });
  };
  const clearFilters = () => {
    onFiltersChange?.({ topic: "", sort: "" });
    onSearchChange("");
  };

  return (
    <div className={styles.library}>
      <header className={`${styles.pageHeader} ${guide || headingArtwork ? styles.categoryHeader : ""}`}>
        {guide ? <div className={styles.categoryIntro}>
          <div className={styles.categoryIdentity}>
            <Image src={guide.artwork} alt="" width={112} height={112} priority className={styles.categoryIcon} />
            <div>
              <p className={styles.categoryEyebrow}>{guide.group} <span aria-hidden="true">/</span> {guide.label}</p>
              <h1 className={styles.categoryTitle}>{title}</h1>
              <p className={styles.categoryTagline}>{guide.tagline}</p>
            </div>
          </div>
          <p className={styles.categoryDescription}>
            <span className={styles.introEmoji} aria-hidden="true">📚</span>
            <span>{guide.description}</span>
          </p>
        </div> : <div className={headingArtwork ? styles.categoryIntro : undefined}>
          <div className={headingArtwork ? styles.libraryIdentity : undefined}>
            {headingArtwork && <Image src={headingArtwork} alt="" width={92} height={92} priority className={styles.libraryIcon} />}
            <div>
              <h1 className={styles.pageTitle}>{title}</h1>
              <p className={styles.pageDescription} aria-live="polite">{description}</p>
            </div>
          </div>
          {headingArtwork && <p className={styles.categoryDescription} data-library-introduction>
            <span className={styles.introEmoji} aria-hidden="true">📚</span>
            <span>{libraryIntroductions[view]}</span>
          </p>}
        </div>}
        {showSearch && <div className={styles.search} role="search">
          <Search size={17} strokeWidth={1.5} aria-hidden="true" />
          <input ref={searchInput} type="search" value={searchQuery} onChange={event => onSearchChange(event.target.value)} aria-label="搜索文章、产品或系列" placeholder="搜索文章、产品或系列…" />
          {searchQuery && <button type="button" onClick={clearSearch} aria-label="清除搜索"><X size={15} /></button>}
        </div>}
      </header>

      {guide && <section className={styles.categoryLearning} aria-labelledby="category-learning-heading">
        <h2 id="category-learning-heading">{results.length > 0 ? "在这里，你可以学会" : "计划整理的学习方向"}</h2>
        <ul className={styles.categoryOutcomes}>
          {guide.outcomes.map(([heading, detail], index) => {
            const Icon = learningIcons[index];
            return <li key={heading}><Icon size={19} strokeWidth={1.6} aria-hidden="true" /><div><h3>{heading}</h3><p>{detail}</p></div></li>;
          })}
        </ul>
      </section>}

      {indexReading && indexLearningPath && indexReading.publishedCount > 0 && (
        <section className={styles.indexLearning} aria-labelledby="index-learning-heading">
          <div className={styles.indexLearningHeader}>
            <div>
              <p className={styles.indexLearningEyebrow}>推荐学习顺序 · {indexReading.stages.length} 个阶段 · {indexReading.publishedCount} 篇文章</p>
              <h2 id="index-learning-heading">第一次来，沿着这条路线学</h2>
            </div>
            <div className={styles.indexLearningActions}>
              {indexReading.first?.articleId && <Link href={getSeriesArticleHref(indexLearningPath.id, { id: indexReading.first.articleId, categoryId: "index" })}>从第一课开始 <ArrowRight size={15} aria-hidden="true" /></Link>}
              <Link href="/book/nasdaq">阅读蓝皮书 <BookOpen size={15} aria-hidden="true" /></Link>
            </div>
          </div>
          <ol className={styles.indexLearningSteps}>
            {indexReading.stages.map((stage, index) => (
              <li key={stage.id}>
                <Link href={`${indexReading.overviewHref}#stage-${stage.id}`}>
                  <span className={styles.indexStepNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <span><strong>{stage.title}</strong><small>{stage.chapters.filter(chapter => chapter.href).length} 篇文章 · 查看本阶段</small></span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
          <Link href={indexReading.overviewHref} className={styles.indexLearningOverview}>查看完整学习路线与每课目标 <ArrowRight size={14} aria-hidden="true" /></Link>
        </section>
      )}

      {showFilters && <section className={styles.filterBar} aria-label="筛选文章">
        <div className={styles.filterControls}>
          {showTopicFilter && <label className={styles.filterField}>
            <span>主题</span>
            <select aria-label="按主题筛选" value={filterTopic} onChange={event => onFiltersChange?.({ topic: event.target.value, sort: sortOrder })}>
              <option value="">全部主题</option>
              {categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>}
          <label className={styles.filterField}>
            <span>排序</span>
            <select aria-label="文章排序" value={sortOrder} onChange={event => onFiltersChange?.({ topic: filterTopic, sort: event.target.value as ArticleLibrarySort })}>
              <option value="">{categoryId === "index" && !isSearching ? "学习顺序" : categoryId === "crypto" && !isSearching ? "推荐顺序" : "默认顺序"}</option>
              <option value="newest">最近发布</option>
              <option value="shortest">阅读时间从短到长</option>
              <option value="longest">阅读时间从长到短</option>
            </select>
          </label>
        </div>
        <div className={styles.filterSummary}>
          <span role="status">{results.length} 篇文章{isSearching && series.length > 0 ? ` · ${series.length} 个系列` : ""}</span>
          {hasFilters && <button type="button" onClick={clearFilters}><X size={13} aria-hidden="true" />清除筛选</button>}
        </div>
      </section>}

      {showSeries && (
        <section className={styles.seriesSection} aria-labelledby="article-series-heading">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="article-series-heading" className={styles.illustratedHeading}><Image src={libraryArtwork.series} alt="" width={36} height={36} className={styles.sectionIcon} />{isHome ? "精选学习路线" : isSearching ? "相关系列" : "可读系列"}</h2>
              {!isSearching && <p>{isHome ? "从投资基础、指数投资或美股账户准备开始。" : "已发布的教程与专题，可以直接开始阅读。"}</p>}
            </div>
            {isHome && <Link href="/articles?view=series" className={styles.quietLink}>全部系列 <ArrowRight size={16} strokeWidth={1.4} aria-hidden="true" /></Link>}
          </div>
          <div className={styles.seriesGrid}>
            {(isHome ? featuredSeries : readableSeries).map((item, index) => <SeriesTile key={item.id} series={item} priority={index === 0} availability={getSeriesAvailability(item, availableIds)} />)}
          </div>
          {!isHome && plannedSeries.length > 0 && <details className={styles.plannedSeries} open={isSearching || undefined}>
            <summary>筹备中 <span>{plannedSeries.length} 个系列 · 查看内容规划</span></summary>
            <div className={styles.plannedList}>{plannedSeries.map(item => <Link key={item.id} href={`/articles/series/${item.id}`} data-series={item.id}>
              <span><strong>{item.title}</strong><small>{item.description}</small></span>
              <span>{item.chapters.length} 个章节规划<ArrowUpRight size={15} aria-hidden="true" /></span>
            </Link>)}</div>
          </details>}
          {isSearching && series.length === 0 && <p className={styles.empty}>没有找到匹配的系列。</p>}
        </section>
      )}

      {showArticles && (
        <section className={styles.articlesSection} aria-label={isHome ? "推荐阅读" : "文章列表"}>
          {isHome ? (
            <>
              <div className={styles.sectionHeading}>
                <h2 className={styles.illustratedHeading}><Image src={libraryArtwork.recommended} alt="" width={36} height={36} className={styles.sectionIcon} />推荐阅读</h2>
                <Link href="/articles?view=all" className={styles.quietLink}>查看全部文章 <ArrowRight size={16} strokeWidth={1.4} aria-hidden="true" /></Link>
              </div>
              <div className={styles.recommendations}>
                {recommended.map(article => (
                  <ProtectedContentLink key={article.id} href={articleHref(article)} className={styles.articleRow}>
                    <div className={styles.articleRowCopy}>
                      <span className={styles.articleCategory}>{categories.find(item => item.id === article.categoryId)?.name}</span>
                      <h3>{article.displayTitle}</h3>
                      <p>{article.displaySummary}</p>
                    </div>
                    <ArrowRight size={18} strokeWidth={1.3} aria-hidden="true" />
                  </ProtectedContentLink>
                ))}
              </div>
            </>
          ) : (
            <>
              {guide && <div className={styles.categoryArticleHeading}><h2><BookOpen size={19} strokeWidth={1.6} aria-hidden="true" />{categoryId === "simcard" ? "全部教程" : "分类文章"} <span>({results.length})</span></h2><span>{results.length > 0 ? categoryId === "index" ? "按学习顺序排列 · 也可按问题查阅" : "了解主题 · 阅读文章 · 深入学习" : "内容筹备中"}</span></div>}
              {category && !isSearching && subcategories.some(item => item.categoryId === categoryId) && (
                <nav className={styles.subcategories} aria-label={`${category.name}分类`}>
                  <Link href={`/articles/${categoryId}`} aria-current={!subcategory ? "page" : undefined}>全部</Link>
                  {subcategories.filter(item => item.categoryId === categoryId).map(item => <Link key={item.id} href={`/articles/${categoryId}?subcategory=${item.id}`} aria-current={subcategory?.id === item.id ? "page" : undefined}>{item.name}</Link>)}
                </nav>
              )}
              {isSearching && results.length > 0 && <div className={styles.sectionHeading}><h2>相关文章</h2></div>}
              {results.length > 0 ? (
                <div className={styles.articleGrid}>{results.map((article, index) => <ArticleCard key={article.id} article={article} priority={index < 2} variant="compact" />)}</div>
              ) : (
                <div className={styles.empty}>
                  <p>{hasFilters ? "没有符合当前条件的文章，可以更换主题或清除筛选。" : guide ? "内容筹备中，暂时没有已发布文章。" : "这个分类暂时还没有文章。"}</p>
                  {hasFilters ? <button type="button" onClick={clearFilters}>清除筛选</button> : <Link href="/articles">返回推荐阅读 <ArrowRight size={15} /></Link>}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {isHome && latest.length > 0 && <section className={styles.articlesSection} aria-labelledby="latest-articles-heading" data-home-latest>
        <div className={styles.sectionHeading}>
          <div><h2 id="latest-articles-heading">最近发布</h2><p>按文章发布日期排列。</p></div>
          <Link href="/articles?view=all&sort=newest" className={styles.quietLink}>全部文章 <ArrowRight size={16} strokeWidth={1.4} aria-hidden="true" /></Link>
        </div>
        <div className={styles.articleGrid}>{latest.map(article => <ArticleCard key={article.id} article={article} variant="compact" />)}</div>
      </section>}

    </div>
  );
}
