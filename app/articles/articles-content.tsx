"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen, Clock, Calendar,
  ArrowRight, Menu, CheckCircle2, ShieldCheck, LockKeyhole,
  Bookmark, BookmarkCheck,
  ArrowUpRight, Compass,
} from "lucide-react";
import { articles as hardcodedArticles, categories, subcategories, type Article } from "@/lib/articles-data";
import type { ArticleFaqItem, ArticleListItem } from "@/lib/articles";
import { cn } from "@/lib/utils";
import { extractToc, renderMarkdown, genUid } from "@/lib/article-renderer";
import { ArticleExportButton } from "@/components/article-export-button";
import { ArticleShareButton } from "@/components/article-share-button";
import { ArticleReadingModeButton } from "@/components/article-reading-mode-button";
import { ArticleMoreActions } from "@/components/article-more-actions";
import { useArticleLibraryNavigation } from "@/components/use-article-library-navigation";
import { getArticleReadingRecommendations, getArticleReadingNextStep } from "@/lib/article-reading-recommendations";
import { ArticleNextStep } from "./article-next-step";
import mobileReadingStyles from "@/components/article-more-actions.module.css";
import immersiveStyles from "@/components/article-reading-mode.module.css";
import { ProtectedContentLink, useContentAccessGate } from "@/components/content-access-gate";
import { ArticleVipInvitation } from "@/components/article-vip-invitation";
import { getArticleVipInvitation } from "@/lib/article-vip-invitation";
import { ArticleReleaseCountdown, type ArticleLimitedRelease } from "@/components/article-release-countdown";
import { ArticleDirectory } from "./article-directory";
import { ArticleLibrary, type ArticleLibraryView } from "./article-library";
import styles from "./article-library.module.css";
import readingStyles from "./article-reading.module.css";
import { getArticleSeries, getSeriesReadingState, resolveSeriesResource, addSeriesReturnContext, type SeriesReturnContext } from "@/lib/article-series";
import { articleSeries } from "@/lib/article-library";
import { LearningPathLinks, SeriesOverview, SeriesPagination } from "./series-reader";

type ArticleItem = ArticleListItem & { content?: string };

interface ArticlesPageProps {
  initialSeriesId?: string;
  initialMapRouteId?: string;
  initialSeriesContext?: SeriesReturnContext;
  initialArticles?: ArticleItem[];
  initialArticle?: ArticleItem & { content: string };
  initialArticleId?: string;
  initialCategoryId?: string;
  initialSubcategoryId?: string;
  showAllArticles?: boolean;
  showSeries?: boolean;
  initialFaqs?: ArticleFaqItem[];
  limitedRelease?: ArticleLimitedRelease;
  lockedContent?: {
    reason: string;
    loginHref: string;
    previewPercentage?: number;
  };
}

function getArticleHref(article: Pick<ArticleItem, "id" | "categoryId">) {
  return `/articles/${article.categoryId}/${genUid(article.id)}`;
}

function getTopicLinks(article: ArticleItem) {
  const topicMap: Record<string, { href: string; title: string; description: string }[]> = {
    vcard: [
      { href: "/card", title: "虚拟 U 卡资料库", description: "对比 MPCard、Bitget Wallet、SafePal、BenPay 等卡片场景。" },
      { href: "/perk/crypto", title: "加密交易所福利", description: "查看交易所注册、返佣、红包和教程入口。" },
      { href: "/articles", title: "更多出海金融教程", description: "继续阅读银行卡、券商、交易所和海外账号教程。" },
    ],
    crypto: [
      { href: "/perk/crypto", title: "CEX 交易所福利", description: "整理 Binance、OKX、Bybit、Bitget 等交易所入口。" },
      { href: "/card", title: "虚拟 U 卡资料库", description: "把加密资产连接到日常消费和 AI 订阅场景。" },
      { href: "/practice/dca-investment", title: "BTC / ETH 定投实盘", description: "查看 Wise 的长期定投记录、成本和收益曲线。" },
    ],
    broker: [
      { href: "/perk/broker", title: "美股券商福利", description: "集中查看盈透、嘉信、复星等券商开户入口。" },
      { href: "/articles", title: "港美股开户教程", description: "继续阅读开户、入金、资金流转和账户选择文章。" },
      { href: "/tools/position-calculator", title: "仓位管理工具", description: "开户之后，用工具计算单笔风险和仓位大小。" },
    ],
    bank: [
      { href: "/perk/bank", title: "境外银行福利", description: "查看 Wise、香港银行、新加坡银行和见证开户方案。" },
      { href: "/perk/global-access", title: "出海账号与通信", description: "补齐海外手机号、网络、账号和收款工具。" },
      { href: "/articles", title: "跨境金融教程", description: "继续阅读港卡、海外银行、券商入金和资金流转路径。" },
    ],
    index: [
      { href: "https://www.wise-etf.com/today/qdii-limits", title: "WiseETF · 今日额度", description: "按基金代码核对申购额度、开放状态与数据日期。" },
      { href: "https://www.wise-etf.com/today/etf-premium", title: "WiseETF · 场内溢价", description: "对照报价、参考净值和时点，继续检查实际产品。" },
      { href: "/perk", title: "开户福利与服务", description: "选定购买路径后，按需了解券商和交易所的现有福利。" },
    ],
  };

  return topicMap[article.categoryId] ?? [
    { href: "/articles", title: "精选文章", description: "继续阅读 Wise Invest 的投资、出海和 Web3 教程。" },
    { href: "/tools", title: "投资工具箱", description: "使用复利、仓位、回撤、收益率等实用计算工具。" },
    { href: "/perk", title: "福利中心", description: "查看开户、交易所、虚拟卡和出海工具福利。" },
  ];
}

function getVisibleArticleFaqs(article: ArticleItem | null, initialFaqs?: ArticleFaqItem[]) {
  if (!article) return [];
  if (initialFaqs?.length && initialFaqs.some((item) => item.question.includes(article.title) || article.categoryId !== "index")) {
    return initialFaqs;
  }

  const categoryFaqs: Record<string, ArticleFaqItem[]> = {
    vcard: [
      { question: "虚拟 U 卡能不能绑定 Apple Pay、支付宝或 AI 订阅？", answer: "不同卡片支持的支付场景不一样，重点看发卡地区、卡组织、KYC 要求和商户风控。操作前应以 App 内页面和官方说明为准。" },
      { question: "虚拟 U 卡使用前最应该先确认什么？", answer: "先确认开卡费、充值费、消费手续费、退款规则和风控限制，再用小额消费测试是否适合自己的订阅或支付场景。" },
    ],
    crypto: [
      { question: "大陆用户注册交易所前要先看什么？", answer: "先看平台当前注册地区、KYC、入金方式和账户安全要求。活动、返佣和可用通道会变化，注册前需要再次核对官方页面。" },
      { question: "C2C 入金和买币最需要注意什么？", answer: "优先小额测试，核对商家信誉、付款信息、到账时间和平台风控提示，不要脱离平台聊天或线下转账。" },
    ],
    broker: [
      { question: "港美股券商开户通常需要准备什么？", answer: "通常需要身份证件、地址证明、税务信息、邮箱手机号和入金账户。不同券商审核口径不同，提交前以券商页面为准。" },
      { question: "开户之后下一步应该做什么？", answer: "先完成安全设置和小额入金测试，再确认交易权限、换汇成本、佣金和税务表格，不建议一开始就做大额操作。" },
    ],
    bank: [
      { question: "境外银行开户前最应该确认什么？", answer: "重点确认开户资格、材料清单、账户管理费、转账费用、入金路径和资金用途说明，银行审核政策可能随时调整。" },
      { question: "Wise 或多币种账户可以替代银行账户吗？", answer: "它更适合跨境收付款和多币种周转，但是否能用于券商入金、收款或长期存放资金，要看目标平台的具体要求。" },
    ],
    index: [
      { question: "定投文章能不能直接当作买卖建议？", answer: "不能。定投记录和工具用于学习执行节奏、成本变化和回撤压力，具体买卖仍要结合自己的现金流、周期和风险承受能力。" },
      { question: "长期定投最应该关注哪些变量？", answer: "重点关注投入频率、现金流稳定性、最大回撤承受能力、标的质量和持有周期，而不是只看短期涨跌。" },
    ],
  };

  return categoryFaqs[article.categoryId] ?? [
    { question: `这篇《${article.title}》适合先读吗？`, answer: "适合先用来建立整体认知，再根据自己的具体场景跳转到相关教程、工具或福利入口。" },
    { question: "文章里的费率、活动和规则需要再次确认吗？", answer: "需要。涉及价格、费率、注册、开户、KYC 和地区限制的内容都会变化，实际操作前应以官方页面和账户内提示为准。" },
  ];
}

// ─── Active TOC hook ───────────────────────────────────────
function useActiveToc(toc: { id: string }[], enabled: boolean, contentRef: { current: HTMLElement | null }) {
  const [activeId, setActiveId] = useState("");
  useEffect(() => {
    if (!enabled || !toc.length) {
      setActiveId("");
      return;
    }
    const headings = toc.flatMap(({ id }) => {
      const element = document.getElementById(id);
      return element ? [element] : [];
    });
    const content = contentRef.current;
    let frame = 0;
    const update = () => {
      const threshold = Math.max(0, content?.getBoundingClientRect().top ?? 0) + 128;
      let currentId = headings[0]?.id ?? "";
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top > threshold) break;
        currentId = heading.id;
      }
      setActiveId(currentId);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); });
    };
    // Read positions after every scroll, including jumps that skip an observer band.
    update();
    content?.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const article = content?.querySelector("article");
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    if (article) resizeObserver?.observe(article);
    return () => {
      cancelAnimationFrame(frame);
      content?.removeEventListener("scroll", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      resizeObserver?.disconnect();
    };
  }, [toc, enabled, contentRef]);
  return activeId;
}

// ─── Main Component ────────────────────────────────────────
export function ArticlesContent({
  initialSeriesId,
  initialMapRouteId,
  initialSeriesContext,
  initialArticles,
  initialArticle,
  initialArticleId,
  initialCategoryId,
  initialSubcategoryId,
  showAllArticles = false,
  showSeries = false,
  initialFaqs,
  lockedContent,
  limitedRelease,
}: ArticlesPageProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(initialArticleId ?? null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [favoriteHrefs, setFavoriteHrefs] = useState<Set<string>>(() => new Set());
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [expiredReleaseKey, setExpiredReleaseKey] = useState<string | null>(null);
  const { guardHref, dialog: contentGateDialog } = useContentAccessGate();
  const contentRef = useRef<HTMLDivElement>(null);
  const { searchQuery, setSearchQuery, filterTopic, sortOrder, onFiltersChange } = useArticleLibraryNavigation(
    pathname, contentRef, !initialArticleId && !initialSeriesId,
  );
  const [allArticles, setAllArticles] = useState<ArticleItem[]>(() => {
    if (!initialArticles) return hardcodedArticles;
    if (!initialArticle) return initialArticles;

    const byId = new Map(initialArticles.map((article) => [article.id, article]));
    byId.set(initialArticle.id, initialArticle);
    return Array.from(byId.values());
  });
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const article of allArticles) {
      counts[article.categoryId] = (counts[article.categoryId] ?? 0) + 1;
    }
    return counts;
  }, [allArticles]);
  const activeSeries = getArticleSeries(initialSeriesId, initialArticleId);
  const seriesContext = useMemo(() => activeSeries ? {
    series: activeSeries,
    reading: getSeriesReadingState(activeSeries, allArticles, selectedArticleId ?? undefined, initialMapRouteId, initialSeriesContext),
    articleId: selectedArticleId ?? undefined,
  } : undefined, [activeSeries, allArticles, selectedArticleId, initialMapRouteId, initialSeriesContext]);

  // Detect URL article target on first paint — show skeleton instead of empty state
  const [isLoadingArticle, setIsLoadingArticle] = useState(() =>
    !initialArticle && !initialSeriesId && /^\/articles\/[^/]+\/[a-zA-Z0-9]{8}$/.test(pathname)
  );

  const activeLimitedRelease = selectedArticleId === initialArticleId ? limitedRelease : undefined;
  const releaseKey = activeLimitedRelease ? `${initialArticleId}:${activeLimitedRelease.endsAt}` : null;
  const releaseExpired = Boolean(activeLimitedRelease && (
    expiredReleaseKey === releaseKey || activeLimitedRelease.serverNow >= Date.parse(activeLimitedRelease.endsAt)
  ));
  const effectiveLockedContent = useMemo(() => {
    if (activeLimitedRelease && releaseExpired && !activeLimitedRelease.canReadAfterExpiry) {
      return {
        reason: "剩余内容仅限 Wise VIP 阅读",
        loginHref: "/vip",
        previewPercentage: 30,
      };
    }
    return lockedContent;
  }, [activeLimitedRelease, lockedContent, releaseExpired]);

  const handleReleaseExpire = useCallback(() => {
    if (!releaseKey) return;
    // Immediately close the current view; the server refresh is a resync, not
    // the mechanism that hides content already loaded during the public period.
    setExpiredReleaseKey(releaseKey);
    if (limitedRelease && !limitedRelease.canReadAfterExpiry) {
      setAllArticles((articles) => articles.map((article) => article.id === initialArticleId
        ? { ...article, content: limitedRelease.previewContent }
        : article));
    }
    router.refresh();
  }, [initialArticleId, limitedRelease, releaseKey, router]);

  const handleReleaseResume = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    // Series navigation uses the access-checked server payload for one chapter.
    if (initialSeriesId && initialArticle) {
      setIsLoadingArticle(false);
      return;
    }
    // Category pages need only public metadata, never every article's body.
    if (initialArticles && !initialArticleId) {
      setIsLoadingArticle(false);
      return;
    }
    if (effectiveLockedContent || activeLimitedRelease) {
      setIsLoadingArticle(false);
      return;
    }

    // Parse URL once; resolve article in the same batch as setAllArticles
    const urlMatch = window.location.pathname.match(/^\/articles\/([^/]+)\/([a-zA-Z0-9]{8})$/);

    fetch("/api/articles-fs")
      .then(r => r.json())
      .then((fsArticles: Article[]) => {
        const fsIds = new Set(fsArticles.map(a => a.id));
        const coverById = new Map(initialArticles?.map(article => [article.id, article.coverImage]));
        const merged = [...hardcodedArticles.filter(a => !fsIds.has(a.id)), ...fsArticles]
          .map(article => ({ ...article, coverImage: coverById.get(article.id) }));

        if (urlMatch) {
          const [, catId, uid] = urlMatch;
          const found = merged.find(a => a.categoryId === catId && genUid(a.id) === uid);
          if (found) {
            // All in one batch — React 18 automatic batching, single re-render
            setAllArticles(merged);
            setSelectedArticleId(found.id);
            setIsLoadingArticle(false);
            return;
          }
        }
        setAllArticles(merged);
        setIsLoadingArticle(false);
      })
      .catch(() => setIsLoadingArticle(false));
  }, [activeLimitedRelease, effectiveLockedContent, initialArticles, initialArticleId, initialSeriesId, initialArticle]);

  const selectedArticle = useMemo(() => {
    // This article's server payload can change at the timed access boundary.
    // Do not retain its pre-refresh body in the initial useState cache.
    if ((activeLimitedRelease || initialSeriesId) && initialArticle?.id === selectedArticleId) return initialArticle;
    return allArticles.find(a => a.id === selectedArticleId) ?? null;
  }, [activeLimitedRelease, allArticles, initialArticle, selectedArticleId, initialSeriesId]);
  const selectedArticleHref = useMemo(
    () => selectedArticle ? getArticleHref(selectedArticle) : "",
    [selectedArticle]
  );
  const selectedContent = activeLimitedRelease && releaseExpired && !activeLimitedRelease.canReadAfterExpiry
    ? activeLimitedRelease.previewContent
    : selectedArticle?.content ?? "";
  const toc = useMemo(() => selectedContent ? extractToc(selectedContent) : [], [selectedContent]);
  // Keep every heading in `toc` for stable body anchors; only navigation is condensed.
  const navigationToc = useMemo(() => {
    const depth = selectedArticle?.tocDepth;
    return depth ? toc.filter(item => item.level <= depth) : toc;
  }, [selectedArticle?.tocDepth, toc]);
  // Search belongs to the library; an old q parameter must not replace a reader.
  const isSearching = !selectedArticle && Boolean(searchQuery.trim());
  const activeId = useActiveToc(navigationToc, Boolean(selectedArticle) && !isSearching, contentRef);
  const activeChapterId = useMemo(() => {
    const activeIndex = Math.max(0, navigationToc.findIndex(item => item.id === activeId));
    for (let index = activeIndex; index >= 0; index--) {
      if (navigationToc[index]?.level <= 2) return navigationToc[index].id;
    }
    return navigationToc[0]?.id;
  }, [activeId, navigationToc]);
  const visibleNavigationToc = useMemo(() => {
    // Older articles without H1/H2 chapters still need a usable navigation list.
    if (!navigationToc.some(item => item.level <= 2)) return navigationToc;
    let chapterId: string | undefined;
    return navigationToc.filter(item => {
      if (item.level <= 2) {
        chapterId = item.id;
        return true;
      }
      return chapterId === activeChapterId;
    });
  }, [activeChapterId, navigationToc]);
  const isClippedPreview = Boolean(effectiveLockedContent && !effectiveLockedContent.previewPercentage);
  const [mobilePreviewTocIds, setMobilePreviewTocIds] = useState<string[]>([]);
  useEffect(() => {
    if (!isClippedPreview || !sidebarOpen) return;
    const body = contentRef.current?.querySelector<HTMLElement>("[data-reading-body]");
    if (!body) return;
    const update = () => {
      const fade = body.querySelector<HTMLElement>("[data-reading-fade]");
      const readableBottom = body.getBoundingClientRect().bottom - (fade?.getBoundingClientRect().height ?? 0);
      const ids = visibleNavigationToc.filter(item => {
        const heading = document.getElementById(item.id);
        return heading && body.contains(heading) && heading.getBoundingClientRect().bottom <= readableBottom;
      }).map(item => item.id);
      setMobilePreviewTocIds(current => current.join(",") === ids.join(",") ? current : ids);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(body);
    window.addEventListener("resize", update);
    return () => { observer.disconnect(); window.removeEventListener("resize", update); };
  }, [isClippedPreview, sidebarOpen, visibleNavigationToc]);
  const readingRecommendations = useMemo(() => selectedArticle
    ? getArticleReadingRecommendations(selectedArticle, allArticles, initialSeriesId, initialMapRouteId)
    : { introduction: "", articles: [] }, [selectedArticle, allArticles, initialSeriesId, initialMapRouteId]);
  const readingNextStep = useMemo(() => selectedArticle
    ? getArticleReadingNextStep(selectedArticle, allArticles, initialSeriesId, initialMapRouteId)
    : null, [selectedArticle, allArticles, initialSeriesId, initialMapRouteId]);
  const relatedArticles = readingRecommendations.articles;
  const vipInvitation = effectiveLockedContent ? null : getArticleVipInvitation(selectedArticle);
  // One end-of-article story: next-step owns "what to read next"; related grid only when that block is absent.
  const showNextStep = Boolean(readingNextStep && !vipInvitation);
  const showRelatedArticles = relatedArticles.length > 0 && !vipInvitation && !showNextStep;
  const sidebarRecommendations = useMemo(() => {
    return relatedArticles.slice(0, 2);
  }, [relatedArticles]);
  const topicLinks = useMemo(
    () => selectedArticle ? getTopicLinks(selectedArticle) : [],
    [selectedArticle]
  );
  const showTopicLinks = topicLinks.length > 0;
  const guideProfile = selectedArticle?.guideProfile;
  const visibleFaqs = useMemo(
    () => getVisibleArticleFaqs(selectedArticle, selectedArticle?.id === initialArticleId ? initialFaqs : undefined),
    [initialArticleId, initialFaqs, selectedArticle]
  );

  const activeCategoryId = initialCategoryId ?? selectedArticle?.categoryId;
  const activeCategory = categories.find((category) => category.id === activeCategoryId);
  const activeSubcategoryId = initialSubcategoryId ?? selectedArticle?.subcategoryId;
  const activeSubcategory = subcategories.find((subcategory) => subcategory.id === activeSubcategoryId);
  const libraryView: ArticleLibraryView = showSeries ? "series" : showAllArticles ? "all" : "recommended";
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    if (!selectedArticle || !selectedArticleHref) return;

    void fetch("/api/content/activity", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventType: effectiveLockedContent ? "PREVIEW_LOCKED" : "VIEW",
        href: selectedArticleHref,
        title: selectedArticle.title,
        summary: selectedArticle.summary,
        metadata: {
          categoryId: selectedArticle.categoryId,
          locked: Boolean(effectiveLockedContent),
        },
      }),
      keepalive: true,
    }).catch(() => {});
  }, [effectiveLockedContent, selectedArticle, selectedArticleHref]);

  useEffect(() => {
    if (!selectedArticleHref) return;

    fetch("/api/account/content-library", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (!payload?.favorites) return;
        setFavoriteHrefs(new Set(payload.favorites.map((item: { href: string }) => item.href)));
      })
      .catch(() => {});
  }, [selectedArticleHref]);

  const toggleFavorite = async () => {
    if (!selectedArticle || !selectedArticleHref || favoriteBusy) return;

    const favorited = favoriteHrefs.has(selectedArticleHref);
    setFavoriteBusy(true);
    try {
      const response = await fetch("/api/content/activity", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          eventType: favorited ? "FAVORITE_REMOVE" : "FAVORITE_ADD",
          href: selectedArticleHref,
          title: selectedArticle.title,
          summary: selectedArticle.summary,
          metadata: { categoryId: selectedArticle.categoryId },
        }),
      });

      if (response.status === 401) {
        await guardHref(selectedArticleHref);
        return;
      }

      if (!response.ok) return;
      setFavoriteHrefs((prev) => {
        const next = new Set(prev);
        if (favorited) next.delete(selectedArticleHref);
        else next.add(selectedArticleHref);
        return next;
      });
    } finally {
      setFavoriteBusy(false);
    }
  };

  useEffect(() => {
    const anchorId = window.location.hash.slice(1);
    const anchor = anchorId ? document.getElementById(anchorId) : null;
    // Section links should open at their target instead of being reset to the article top.
    if (anchor && contentRef.current?.contains(anchor)) {
      anchor.scrollIntoView({ block: "start", behavior: "instant" });
    } else {
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      if (initialSeriesId && window.matchMedia("(max-width: 767px)").matches) window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [selectedArticleId, selectedContent, initialSeriesId]);

  const linkedSeries = useMemo(() => articleSeries.map(series => {
    const reading = getSeriesReadingState(series, allArticles);
    return {
      kind: "series" as const,
      id: series.id,
      title: series.title,
      summary: series.description,
      articleCount: reading.publishedCount || (reading.existingHref ? 1 : 0),
      coverImage: series.cardArtwork ?? series.cover ?? series.artwork,
    };
  }), [allArticles]);
  const mapSeriesLink = useCallback((href: string) => {
    if (!seriesContext) return href;
    const { series, reading } = seriesContext;
    const stageId = reading.stages[reading.currentStageIndex]?.id;
    return addSeriesReturnContext(resolveSeriesResource(href, series, stageId, initialMapRouteId).href, reading.returnTo);
  }, [seriesContext, initialMapRouteId]);
  const renderedContent = useMemo(
    () => selectedContent ? renderMarkdown(selectedContent, toc, selectedArticle?.imageLayout, allArticles, linkedSeries, mapSeriesLink) : null,
    [selectedArticle?.imageLayout, selectedContent, toc, allArticles, linkedSeries, mapSeriesLink]
  );

  return (
    <div className={cn(styles.shell, immersiveStyles.reader)} data-article-reader>
      {contentGateDialog}

      <div className={cn(styles.frame, immersiveStyles.frame, seriesContext && !selectedArticle && !isSearching && styles.seriesFrame)}>
        <ArticleDirectory
          seriesContext={seriesContext}
          articleToc={selectedArticle && !isSearching ? {
            title: selectedArticle.title,
            items: isClippedPreview ? visibleNavigationToc.filter(item => mobilePreviewTocIds.includes(item.id)) : visibleNavigationToc,
            activeId,
            activeChapterId,
            isPreview: Boolean(effectiveLockedContent),
          } : undefined}
          categoryCounts={categoryCounts}
          activeView={activeCategoryId || initialArticleId ? null : libraryView}
          activeCategoryId={activeCategoryId}
          mobileOpen={sidebarOpen}
          onMobileClose={closeSidebar}
        />

        <section
          ref={contentRef}
          className={cn(styles.content, immersiveStyles.pane, selectedArticle && !isSearching && readingStyles.pane)}
          aria-label="文章内容"
        >
          <div data-reading-chrome className={cn(styles.mobileBar, activeSeries && styles.seriesMobileBar, selectedArticle && !isSearching && mobileReadingStyles.readingBar)}>
            <button
              id="article-directory-trigger"
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={selectedArticle && !isSearching ? "打开阅读目录" : activeSeries ? activeSeries.kind === "topic" ? "打开系列内容" : "打开系列章节" : "打开文章目录"}
              aria-haspopup="dialog"
              aria-expanded={sidebarOpen}
              aria-controls="article-directory-drawer"
            >
              <Menu className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              <span>{selectedArticle && !isSearching ? "目录" : activeSeries ? activeSeries.kind === "topic" ? "内容" : "章节" : "目录"}</span>
            </button>
            <span className="min-w-0 flex-1 truncate">
              {selectedArticle && !isSearching
                ? selectedArticle.title
                : activeSeries?.title ?? activeSubcategory?.name ?? activeCategory?.name ?? (showSeries ? "系列内容" : showAllArticles ? "全部文章" : "文章中心")}
            </span>
          </div>

          {isLoadingArticle && !selectedArticle ? (
            /* ── Article skeleton shown while fetch is in-flight ── */
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-12 animate-pulse">
              <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-800 mb-5" />
              <div className="h-8 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-800 mb-3" />
              <div className="h-8 w-1/2 rounded-lg bg-slate-200 dark:bg-slate-800 mb-5" />
              <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800/60 mb-2" />
              <div className="h-4 w-5/6 rounded bg-slate-100 dark:bg-slate-800/60 mb-7" />
              <div className="flex gap-4 pb-7 border-b border-slate-100 dark:border-slate-800">
                <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800/60" />
                <div className="h-3 w-28 rounded bg-slate-100 dark:bg-slate-800/60" />
              </div>
              <div className="mt-8 space-y-3">
                {[100, 90, 95, 70, 85, 60, 92, 75].map((w, i) => (
                  <div key={i} className={`h-4 rounded bg-slate-100 dark:bg-slate-800/60`} style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          ) : selectedArticle && !isSearching ? (
            <article key={selectedArticleId} className={cn("max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8", immersiveStyles.article)}>
              <div data-reading-chrome>{seriesContext ? <SeriesPagination {...seriesContext} compact /> : <LearningPathLinks articleId={selectedArticle.id} />}</div>
              <div className={cn("flex items-center justify-between gap-2 mb-5", immersiveStyles.toolbar, mobileReadingStyles.toolbar)}>
                <Link data-reading-chrome href={seriesContext ? `${seriesContext.reading.overviewHref}${seriesContext.reading.stages[seriesContext.reading.currentStageIndex] ? `#stage-${seriesContext.reading.stages[seriesContext.reading.currentStageIndex].id}` : ""}` : `/articles/${selectedArticle.categoryId}`} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400">
                  <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                  {activeSeries ? "返回本系列" : <>{categories.find(c => c.id === selectedArticle.categoryId)?.emoji}{categories.find(c => c.id === selectedArticle.categoryId)?.name}</>}
                </Link>
                <div className={cn("flex items-center gap-2", immersiveStyles.actions, mobileReadingStyles.actions)}>
                  <ArticleReadingModeButton />
                  {!effectiveLockedContent && (
                    <button
                      type="button"
                      onClick={() => void toggleFavorite()}
                      disabled={favoriteBusy}
                      className={cn(
                        mobileReadingStyles.favorite,
                        "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-black transition-colors",
                        favoriteHrefs.has(selectedArticleHref)
                          ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                          : "border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:text-amber-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-amber-800"
                      )}
                    >
                      {favoriteHrefs.has(selectedArticleHref) ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                      {favoriteHrefs.has(selectedArticleHref) ? "已收藏" : "收藏"}
                    </button>
                  )}
                  <ArticleMoreActions>
                    <ArticleShareButton uid={genUid(selectedArticle.id)} />
                    {!effectiveLockedContent && <span>
                    <ArticleExportButton
                      articleId={selectedArticle.id}
                      categoryId={selectedArticle.categoryId}
                      uid={genUid(selectedArticle.id)}
                      title={selectedArticle.title}
                      summary={selectedArticle.summary}
                      date={selectedArticle.date}
                      readTime={selectedArticle.readTime}
                      categoryName={categories.find(c => c.id === selectedArticle.categoryId)?.name ?? ""}
                      categoryEmoji={categories.find(c => c.id === selectedArticle.categoryId)?.emoji ?? ""}
                      content={selectedContent}
                    />
                    </span>}
                  </ArticleMoreActions>
                </div>
              </div>
              <header className={readingStyles.header}>
                <h1 className="text-xl md:text-[28px] font-bold text-slate-900 dark:text-white leading-snug mb-3 md:mb-4 tracking-tight">
                  {selectedArticle.title}
                </h1>
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed mb-4 md:mb-5 border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                  {selectedArticle.summary}
                </p>
                <div data-reading-chrome className="flex items-center gap-5 text-xs text-slate-400 pb-5 md:pb-7 border-b border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{selectedArticle.date}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />约 {selectedArticle.readTime} 分钟阅读</span>
                  <span className="hidden items-center gap-1.5 md:flex"><ShieldCheck className="w-3.5 h-3.5" />持续维护</span>
                </div>
              </header>

              {activeLimitedRelease && (
                <ArticleReleaseCountdown
                  key={`${releaseKey}:${activeLimitedRelease.serverNow}`}
                  endsAt={activeLimitedRelease.endsAt}
                  serverNow={activeLimitedRelease.serverNow}
                  canReadAfterExpiry={activeLimitedRelease.canReadAfterExpiry}
                  expired={releaseExpired}
                  onExpire={handleReleaseExpire}
                  onResume={handleReleaseResume}
                />
              )}

              {guideProfile && (
                <section data-reading-chrome data-article-guide={selectedArticle.id} aria-label="本文阅读导读" className="mt-6 grid gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 md:grid-cols-[1fr_1fr_0.9fr]">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                      <CheckCircle2 className="h-4 w-4 text-amber-500" />
                      本文适合谁
                    </div>
                    <div className="space-y-1.5">
                      {guideProfile.audience.map((item) => (
                        <p key={item} className="text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                      <BookOpen className="h-4 w-4 text-amber-500" />
                      你会得到什么
                    </div>
                    <div className="space-y-1.5">
                      {guideProfile.outcomes.map((item) => (
                        <p key={item} className="text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                    <div className="text-xs font-black text-amber-700 dark:text-amber-300">准备和状态</div>
                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
                      {guideProfile.prepare}
                    </p>
                    <p className="mt-2 border-t border-amber-200/70 pt-2 text-[11px] font-semibold leading-5 text-slate-500 dark:border-amber-800/60 dark:text-slate-400">
                      {guideProfile.status}
                    </p>
                  </div>
                </section>
              )}

              <div data-reading-body className={cn("mt-6 md:mt-8", immersiveStyles.body, readingStyles.body, effectiveLockedContent && !effectiveLockedContent.previewPercentage && "relative max-h-[720px] overflow-hidden")}>
                {renderedContent}
                {effectiveLockedContent && !effectiveLockedContent.previewPercentage && (
                  <div data-reading-fade className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-44", readingStyles.fade)} />
                )}
              </div>

              {effectiveLockedContent && (
                <section className="mt-8 overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white p-5 shadow-sm dark:border-amber-900/60 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-950 md:p-6">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-white text-amber-700 dark:border-amber-800 dark:bg-slate-950 dark:text-amber-300">
                        <LockKeyhole className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Wise ID</p>
                        <h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">{effectiveLockedContent.previewPercentage ? "剩余内容仅限 Wise VIP 阅读" : "登录后继续阅读完整内容"}</h2>
                        <p className="mt-2 text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300">
                          {effectiveLockedContent.previewPercentage
                            ? `已展示本文约 ${effectiveLockedContent.previewPercentage}% 的内容，成为 Wise VIP 后可继续阅读余下全文。`
                            : `${effectiveLockedContent.reason}。登录或注册后会自动回到这篇文章。`}
                        </p>
                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                          {(effectiveLockedContent.previewPercentage ? ["完整市场手记", "VIP 社群交流", "查看加入方式"] : ["保留当前预览", "登录回到原文", "可收藏和继续学习"]).map((item) => (
                            <span key={item} className="rounded-xl border border-amber-100 bg-white px-3 py-2 text-xs font-black text-slate-600 dark:border-amber-900/40 dark:bg-slate-950 dark:text-slate-300">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={effectiveLockedContent.previewPercentage ? "/vip" : effectiveLockedContent.loginHref}
                      className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-amber-300 transition-colors hover:bg-amber-400 hover:text-slate-950 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
                    >
                      {effectiveLockedContent.previewPercentage ? "了解 VIP，继续阅读" : "登录阅读全文"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </section>
              )}

              {seriesContext && !showNextStep && (
                <div data-reading-chrome><SeriesPagination {...seriesContext} /></div>
              )}

              {showNextStep && readingNextStep && (
                <ArticleNextStep step={readingNextStep} mapHref={mapSeriesLink} />
              )}

              {!effectiveLockedContent && visibleFaqs.length > 0 && (
                <section data-reading-chrome className="mt-12 border-t border-slate-100 pt-8 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-500" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      常见问题
                    </h2>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {visibleFaqs.map((item) => (
                      <div
                        key={item.question}
                        className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/90"
                      >
                        <h3 className="text-sm font-black leading-6 text-slate-900 dark:text-white">
                          {item.question}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">
                          {item.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {(showRelatedArticles || showTopicLinks) && (
                <section data-reading-chrome className="mt-12 border-t border-slate-100 pt-8 dark:border-slate-800">
                  {showRelatedArticles && (
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        相关阅读
                      </h2>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {relatedArticles.map(article => (
                          <ProtectedContentLink
                            key={article.id}
                            href={mapSeriesLink(article.href)}
                            className="group rounded-2xl border border-slate-200/80 bg-white/90 p-4 transition-all hover:border-amber-300 hover:bg-amber-50/60 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-amber-700 dark:hover:bg-amber-900/10"
                          >
                            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                              <Clock className="h-3 w-3" />
                              {article.label} · 约 {article.readTime} 分钟阅读
                            </div>
                            <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-slate-800 transition-colors group-hover:text-amber-700 dark:text-slate-100 dark:group-hover:text-amber-300">
                              {article.title}
                            </h3>
                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                              {article.reason}
                            </p>
                          </ProtectedContentLink>
                        ))}
                      </div>
                    </div>
                  )}

                  {showTopicLinks && (
                    <div className={showRelatedArticles ? "mt-8" : ""}>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        下一步操作
                      </h2>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {topicLinks.map(link => (
                          <ProtectedContentLink
                            key={link.href}
                            href={link.href}
                            className="group rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 transition-all hover:border-amber-400 hover:bg-amber-100/70 dark:border-amber-900/60 dark:bg-amber-950/20 dark:hover:border-amber-700"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="text-sm font-black text-amber-800 dark:text-amber-300">
                                {link.title}
                              </h3>
                              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-500 transition-transform group-hover:translate-x-0.5" />
                            </div>
                            <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
                              {link.description}
                            </p>
                          </ProtectedContentLink>
                        ))}
                      </div>
                    </div>
                  )}

                </section>
              )}
              <div data-reading-chrome><ArticleVipInvitation invitation={vipInvitation} /></div>
            </article>
          ) : seriesContext && !isSearching ? <SeriesOverview {...seriesContext} articles={allArticles} /> : (
            <ArticleLibrary
              articles={allArticles}
              view={libraryView}
              categoryId={activeCategoryId}
              subcategoryId={activeSubcategoryId}
              searchQuery={searchQuery}
              filterTopic={filterTopic}
              sortOrder={sortOrder}
              onFiltersChange={onFiltersChange}
              onSearchChange={setSearchQuery}
            />
          )}
        </section>

        {/* ══ RIGHT TOC ══════════════════════════════════ */}
        {selectedArticle && !isSearching && <aside className="w-72 shrink-0 overflow-y-auto border-l border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 hidden lg:block scrollbar-hide">
          <div className="px-5 pt-6 pb-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">阅读导航</p>
            <p className="mt-1 text-sm font-black text-slate-900 dark:text-slate-100">本页目录</p>
          </div>
          <nav aria-label="本页目录" className={cn("pb-5", readingStyles.toc)}>
            {navigationToc.length > 0 ? (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />
                {visibleNavigationToc.map(item => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    data-level={item.level}
                    aria-current={activeId === item.id ? "location" : undefined}
                    onClick={e => { e.preventDefault(); document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" }); }}
                    className={cn(
                      "relative flex items-start pl-8 pr-4 py-1.5 text-sm leading-snug transition-all duration-150",
                      item.level >= 3 && "pl-12",
                      activeId === item.id || activeChapterId === item.id
                        ? "text-amber-600 dark:text-amber-400 font-semibold"
                        : "text-slate-900 dark:text-slate-100 hover:text-amber-600 dark:hover:text-amber-400"
                    )}
                  >
                    {activeId === item.id && (
                      <span className="absolute left-[17px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-slate-900" />
                    )}
                    {item.text}
                  </a>
                ))}
              </div>
            ) : (
              <p className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">
                {selectedArticle ? "暂无目录" : "选择文章后显示目录"}
              </p>
            )}
          </nav>
          {(sidebarRecommendations.length > 0 || topicLinks.length > 0) && (
            <div className="mx-4 mb-7 border-t border-slate-100 pt-5 dark:border-slate-800">
              <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 p-4 dark:border-amber-900/60 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <Compass className="h-4 w-4" />
                  <p className="text-xs font-black">接着读什么</p>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{readingRecommendations.introduction}</p>
                <div className="mt-3 space-y-2">
                  {sidebarRecommendations.map((article) => (
                    <ProtectedContentLink
                      key={article.id}
                      href={mapSeriesLink(article.href)}
                      className="group flex items-start gap-2 rounded-xl border border-white/80 bg-white/80 px-3 py-2.5 transition-colors hover:border-amber-300 hover:bg-white dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-amber-800"
                    >
                      <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      <span className="min-w-0"><small className="block text-[10px] font-medium leading-4 text-amber-700 dark:text-amber-300">{article.label}</small><span className="mt-1 line-clamp-2 block text-xs font-bold leading-5 text-slate-700 dark:text-slate-200">{article.title}</span><span className="mt-1 block text-[11px] leading-4 text-slate-500 dark:text-slate-400">{article.reason}</span></span>
                    </ProtectedContentLink>
                  ))}
                </div>
                <div className="mt-4 border-t border-amber-200/70 pt-3 dark:border-amber-900/50">
                  <p className="text-[11px] font-black text-amber-700 dark:text-amber-300">相关工具与入口</p>
                  <div className="mt-2 space-y-1">
                    {topicLinks.slice(0, 2).map((link) => (
                      <ProtectedContentLink key={link.href} href={link.href} className="group flex items-center justify-between gap-2 py-1 text-xs font-semibold text-slate-600 hover:text-amber-700 dark:text-slate-300 dark:hover:text-amber-300">
                        <span>{link.title}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-amber-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </ProtectedContentLink>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>}

      </div>
    </div>
  );
}
