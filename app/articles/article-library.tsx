"use client";

import { useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import type { ArticleListItem } from "@/lib/articles";
import { categories, subcategories } from "@/lib/articles-data";
import { genUid } from "@/lib/article-uid";
import { getCategoryGuide } from "@/lib/article-category-guides";
import { articleSeries, getRecommendedArticles, searchArticleSeries, type ArticleSeries } from "@/lib/article-library";
import { ProtectedContentLink } from "@/components/content-access-gate";
import { ArticleCard } from "@/components/article-card";
import styles from "./article-library.module.css";

export type ArticleLibraryView = "recommended" | "series" | "all";

const learningIcons = [SlidersHorizontal, CheckCircle2, RefreshCw];
const libraryArtwork = {
  recommended: "/images/articles/category-icons/reading-ivory.webp",
  series: "/images/articles/category-icons/series-ivory.webp",
  all: "/images/articles/category-icons/all-ivory.webp",
};
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
}

function articleHref(article: Pick<ArticleListItem, "id" | "categoryId">) {
  return `/articles/${article.categoryId}/${genUid(article.id)}`;
}

function SeriesTile({ series, readableCount, priority }: { series: ArticleSeries; readableCount: number; priority: boolean }) {
  return (
    <Link href={`/articles/series/${series.id}`} className={styles.seriesTile} data-series={series.id} data-kind={series.kind} aria-label={`进入${series.title}`}>
      <span className={styles.seriesVisual}>
        <Image src={series.artwork} alt="" fill priority={priority} sizes="(min-width: 1700px) 410px, (min-width: 1280px) 350px, (min-width: 768px) 400px, calc(100vw - 44px)" className={styles.seriesArtwork} />
      </span>
      <span className={styles.seriesCopy}>
        <span className={styles.seriesStatus} data-published={series.status === "updating"}>{series.kind === "path" ? "学习路线" : series.status === "planned" ? "系列规划" : "持续更新"}</span>
        <span className={styles.seriesTitle}>{series.title}</span>
        <span className={styles.seriesDescription}>{series.description}</span>
      </span>
      <span className={styles.seriesFooter}>
        <span className={styles.seriesMeta}>{series.kind === "path" ? `${series.stages?.length ?? 0} 个阶段` : `${series.chapters.length} ${series.kind === "topic" ? "篇内容" : "个章节"}`}{readableCount > 0 ? ` · ${readableCount} 篇可读` : " · 整理中"}</span>
        <span className={styles.seriesAction}>{series.status === "planned" ? "查看规划" : "开始阅读"}<ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.5} /></span>
      </span>
    </Link>
  );
}

export function ArticleLibrary({ articles, view, categoryId, subcategoryId, searchQuery, onSearchChange, showSearch = true }: ArticleLibraryProps) {
  const searchInput = useRef<HTMLInputElement | null>(null);
  const category = categories.find(item => item.id === categoryId);
  const subcategory = subcategories.find(item => item.id === subcategoryId && item.categoryId === categoryId);
  const query = searchQuery.trim().toLowerCase();
  const isSearching = query.length > 0;
  const isHome = view === "recommended" && !categoryId && !isSearching;
  const guide = !isSearching ? getCategoryGuide(categoryId, subcategory?.id) : undefined;
  const headingArtwork = !isSearching && !categoryId ? libraryArtwork[view] : undefined;
  const series = [...(isSearching ? searchArticleSeries(query) : articleSeries)].sort((a, b) => Number(b.kind === "path") - Number(a.kind === "path"));
  const recommended = useMemo(() => getRecommendedArticles(articles), [articles]);
  const results = useMemo(() => {
    // A single search covers the public library, even when started in a category.
    if (query) return articles.filter(article => {
      const categoryName = categories.find(item => item.id === article.categoryId)?.name ?? "";
      return `${article.title} ${article.summary} ${categoryName}`.toLowerCase().includes(query);
    });
    const scoped = articles.filter(article => (!categoryId || article.categoryId === categoryId)
      && (!subcategoryId || article.subcategoryId === subcategoryId));
    if (categoryId !== "crypto") return scoped;
    const priority = ["biance-guide", "okx-guide"];
    const rank = (id: string) => priority.includes(id) ? priority.indexOf(id) : priority.length;
    return [...scoped].sort((a, b) => rank(a.id) - rank(b.id));
  }, [articles, categoryId, subcategoryId, query]);
  const title = isSearching ? "搜索结果" : category ? subcategory?.name ?? category.name : view === "series" ? "系列内容" : view === "all" ? "全部文章" : "文章中心";
  const description = isHome ? "找到你需要的内容，也可以从一个系列开始。"
    : isSearching ? `找到 ${results.length} 篇文章、${series.length} 个系列`
    : view === "series" && !category ? "教程与专题集中阅读，按自己的问题选择内容。"
    : `${results.length} 篇文章，按自己的需要选择阅读。`;
  const showSeries = isHome || (view === "series" && !category) || (isSearching && series.length > 0);
  const showArticles = isHome || isSearching || view !== "series" || Boolean(category);
  const clearSearch = () => {
    onSearchChange("");
    searchInput.current?.focus({ preventScroll: true });
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
          <p className={styles.categoryDescription}>{guide.description}</p>
        </div> : <div className={headingArtwork ? styles.categoryIntro : undefined}>
          <div className={headingArtwork ? styles.libraryIdentity : undefined}>
            {headingArtwork && <Image src={headingArtwork} alt="" width={92} height={92} priority className={styles.libraryIcon} />}
            <div>
              <h1 className={styles.pageTitle}>{title}</h1>
              <p className={styles.pageDescription} aria-live="polite">{description}</p>
            </div>
          </div>
          {headingArtwork && <p className={styles.categoryDescription} data-library-introduction>{libraryIntroductions[view]}</p>}
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

      {showSeries && (
        <section className={styles.seriesSection} aria-labelledby="article-series-heading">
          {view !== "series" || isSearching || category ? (
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="article-series-heading" className={styles.illustratedHeading}><Image src={libraryArtwork.series} alt="" width={36} height={36} className={styles.sectionIcon} />系列内容</h2>
                {!isSearching && <p>把相关教程与专题放在一起，找到自己的阅读路径。</p>}
              </div>
              {isHome && <Link href="/articles?view=series" className={styles.quietLink}>查看全部 <ArrowRight size={16} strokeWidth={1.4} aria-hidden="true" /></Link>}
            </div>
          ) : <h2 className="sr-only" id="article-series-heading">学习路线与系列内容</h2>}
          <div className={styles.seriesGrid}>
            {series.map((item, index) => <SeriesTile key={item.id} series={item} priority={index === 0} readableCount={item.chapters.filter(chapter => articles.some(article => article.id === chapter.articleId)).length} />)}
          </div>
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
              {guide && <div className={styles.categoryArticleHeading}><h2><BookOpen size={19} strokeWidth={1.6} aria-hidden="true" />{categoryId === "simcard" ? "全部教程" : "分类文章"} <span>({results.length})</span></h2><span>{results.length > 0 ? "了解主题 · 阅读文章 · 深入学习" : "内容筹备中"}</span></div>}
              {category && !isSearching && subcategories.some(item => item.categoryId === categoryId) && (
                <nav className={styles.subcategories} aria-label={`${category.name}分类`}>
                  <Link href={`/articles/${categoryId}`} aria-current={!subcategory ? "page" : undefined}>全部</Link>
                  {subcategories.filter(item => item.categoryId === categoryId).map(item => <Link key={item.id} href={`/articles/${categoryId}?subcategory=${item.id}`} aria-current={subcategory?.id === item.id ? "page" : undefined}>{item.name}</Link>)}
                </nav>
              )}
              {isSearching && results.length > 0 && <div className={styles.sectionHeading}><h2>相关文章</h2></div>}
              {results.length > 0 ? (
                <div className={styles.articleGrid}>{results.map((article, index) => <ArticleCard key={article.id} article={article} priority={index < 2} />)}</div>
              ) : (
                <div className={styles.empty}>
                  <p>{isSearching ? "没有找到匹配的文章，试试其他关键词。" : guide ? "内容筹备中，暂时没有已发布文章。" : "这个分类暂时还没有文章。"}</p>
                  {isSearching ? <button type="button" onClick={clearSearch}>清除搜索</button> : <Link href="/articles">返回推荐阅读 <ArrowRight size={15} /></Link>}
                </div>
              )}
            </>
          )}
        </section>
      )}

    </div>
  );
}
