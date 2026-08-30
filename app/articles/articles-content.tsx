"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown, ChevronRight, BookOpen, Clock, Calendar,
  Library, ArrowRight, Search, Menu, CheckCircle2, ExternalLink, MessageCircle, ShieldCheck, LockKeyhole,
  Bookmark, BookmarkCheck,
} from "lucide-react";
import { articles as hardcodedArticles, categories, subcategories, type Article } from "@/lib/articles-data";
import type { ArticleFaqItem, ArticleListItem } from "@/lib/articles";
import { cn } from "@/lib/utils";
import { extractToc, renderMarkdown, genUid } from "@/lib/article-renderer";
import { ArticleExportButton } from "@/components/article-export-button";
import { CommunityDialog } from "@/components/community-dialog";
import { ProtectedContentLink, useContentAccessGate } from "@/components/content-access-gate";

type ArticleItem = ArticleListItem & { content?: string };
type ArticleGuideProfile = {
  audience: string[];
  outcomes: string[];
  prepare: string;
  status: string;
};

interface ArticlesPageProps {
  initialArticles?: ArticleItem[];
  initialArticle?: ArticleItem & { content: string };
  initialArticleId?: string;
  initialCategoryId?: string;
  initialFaqs?: ArticleFaqItem[];
  lockedContent?: {
    reason: string;
    loginHref: string;
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
      { href: "/practice/dca-investment", title: "BTC / ETH 定投实盘", description: "参考真实定投节奏、收益曲线和明细记录。" },
      { href: "/DCA", title: "定投击球区", description: "用估值和回撤区间辅助判断定投力度。" },
      { href: "/tools/compound-calculator", title: "复利计算器", description: "测算长期定投金额、年化收益和最终资产。" },
    ],
  };

  return topicMap[article.categoryId] ?? [
    { href: "/articles", title: "精选文章", description: "继续阅读 Wise Invest 的投资、出海和 Web3 教程。" },
    { href: "/tools", title: "投资工具箱", description: "使用复利、仓位、回撤、收益率等实用计算工具。" },
    { href: "/perk", title: "福利中心", description: "查看开户、交易所、虚拟卡和出海工具福利。" },
  ];
}

const articleGuideProfiles: Record<string, ArticleGuideProfile> = {
  vcard: {
    audience: ["需要 AI 订阅、海外网站付款或日常小额消费的人", "想比较虚拟 U 卡开卡门槛、费率和支付绑定的人"],
    outcomes: ["判断这张卡是否适合自己", "找到教程、邀请码、注册链接和替代卡片"],
    prepare: "先准备邮箱、手机号、常用交易所或钱包账户；涉及 KYC 的卡片再按页面要求准备证件和地址材料。",
    status: "卡片规则、费率和支付绑定会变化，申请前以 App 或官方页面显示为准。",
  },
  crypto: {
    audience: ["第一次注册 Binance、OKX、Bybit、Bitget 等交易所的人", "需要完成 KYC、C2C 入金、买币和返佣绑定的人"],
    outcomes: ["完成开户注册和基础安全设置", "理解入金、买币、理财和手续费返佣入口"],
    prepare: "先准备邮箱、手机号、身份证件和常用收付款方式；大额操作前先小额测试。",
    status: "交易所活动、返佣和入金通道可能调整，操作前以交易所页面和账户提示为准。",
  },
  broker: {
    audience: ["准备开通港美股券商账户的人", "需要比较盈透、嘉信、港资券商和入金路径的人"],
    outcomes: ["明确开户材料和账户选择", "找到后续入金、交易和仓位管理工具"],
    prepare: "先准备身份证件、地址证明、税务信息和可用于入金的银行账户。",
    status: "券商开户政策和入金路径会变化，提交资料前以券商页面和邮件通知为准。",
  },
  bank: {
    audience: ["需要境外银行、多币种账户或跨境收付款的人", "想规划券商入金、美元账户和资金流转的人"],
    outcomes: ["判断账户适合的使用场景", "准备开户材料并找到相关教程或对接入口"],
    prepare: "先准备身份证件、地址证明、手机号、邮箱和资金用途说明；见证开户还要预留线下办理时间。",
    status: "银行开户门槛、费用和审核要求变化较快，办理前需要再次核对最新材料清单。",
  },
  index: {
    audience: ["准备长期定投指数、BTC、ETH 或 QQQ 的人", "想用真实记录校准仓位和执行节奏的人"],
    outcomes: ["理解定投逻辑和工具使用方式", "跳转到定投实盘、击球区和复利测算"],
    prepare: "先明确月现金流、投资周期和可承受回撤，再用工具测算投入节奏。",
    status: "文章用于学习和记录，不构成买卖建议；市场价格和估值区间会持续变化。",
  },
};

const defaultGuideProfile: ArticleGuideProfile = {
  audience: ["第一次接触这个主题，想快速建立全局理解的人", "已经有具体问题，需要找到教程、工具或入口的人"],
  outcomes: ["把文章里的关键信息转成可执行步骤", "继续跳转到相关教程、工具或福利入口"],
  prepare: "先看完摘要和目录，再按自己的场景选择是否继续操作。",
  status: "内容会持续维护，涉及价格、费率、活动和规则的部分以官方页面为准。",
};

function getArticleGuideProfile(article: ArticleItem | null) {
  if (!article) return defaultGuideProfile;
  return articleGuideProfiles[article.categoryId] ?? defaultGuideProfile;
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
function useActiveToc(toc: { id: string }[]) {
  const [activeId, setActiveId] = useState("");
  useEffect(() => {
    if (!toc.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        let best = { id: "", ratio: 0 };
        entries.forEach(e => { if (e.isIntersecting && e.intersectionRatio > best.ratio) best = { id: e.target.id, ratio: e.intersectionRatio }; });
        if (best.id) setActiveId(best.id);
      },
      { rootMargin: "-15% 0px -60% 0px", threshold: [0, 0.5, 1] }
    );
    toc.forEach(({ id }) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [toc]);
  return activeId;
}

// ─── Main Component ────────────────────────────────────────
export function ArticlesContent({
  initialArticles,
  initialArticle,
  initialArticleId,
  initialCategoryId,
  initialFaqs,
  lockedContent,
}: ArticlesPageProps = {}) {
  const pathname = usePathname();
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set([
    "web",
    initialCategoryId ?? "",
    "broker:us-broker", "broker:hk-broker",
    "bank:physical-bank", "bank:virtual-bank", "bank:digital-bank", "bank:jianzheng",
  ].filter(Boolean)));
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(initialArticleId ?? null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [favoriteHrefs, setFavoriteHrefs] = useState<Set<string>>(() => new Set());
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const { guardHref, dialog: contentGateDialog } = useContentAccessGate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [allArticles, setAllArticles] = useState<ArticleItem[]>(() => {
    if (!initialArticles) return hardcodedArticles;
    if (!initialArticle) return initialArticles;

    const byId = new Map(initialArticles.map((article) => [article.id, article]));
    byId.set(initialArticle.id, initialArticle);
    return Array.from(byId.values());
  });

  // Detect URL article target on first paint — show skeleton instead of empty state
  const [isLoadingArticle, setIsLoadingArticle] = useState(() =>
    !initialArticle && /^\/articles\/[^/]+\/[a-zA-Z0-9]{8}$/.test(pathname)
  );

  useEffect(() => {
    if (lockedContent) {
      setIsLoadingArticle(false);
      return;
    }

    // Parse URL once; resolve article in the same batch as setAllArticles
    const urlMatch = window.location.pathname.match(/^\/articles\/([^/]+)\/([a-zA-Z0-9]{8})$/);

    fetch("/api/articles-fs")
      .then(r => r.json())
      .then((fsArticles: Article[]) => {
        const fsIds = new Set(fsArticles.map(a => a.id));
        const merged = [...hardcodedArticles.filter(a => !fsIds.has(a.id)), ...fsArticles];

        if (urlMatch) {
          const [, catId, uid] = urlMatch;
          const found = merged.find(a => a.categoryId === catId && genUid(a.id) === uid);
          if (found) {
            // All in one batch — React 18 automatic batching, single re-render
            setAllArticles(merged);
            setSelectedArticleId(found.id);
            setOpenCategories(prev => new Set([...prev, catId]));
            setIsLoadingArticle(false);
            return;
          }
        }
        setAllArticles(merged);
        setIsLoadingArticle(false);
      })
      .catch(() => setIsLoadingArticle(false));
  }, [lockedContent]);

  const selectedArticle = useMemo(() => allArticles.find(a => a.id === selectedArticleId) ?? null, [selectedArticleId, allArticles]);
  const selectedArticleHref = useMemo(
    () => selectedArticle ? getArticleHref(selectedArticle) : "",
    [selectedArticle]
  );
  const selectedContent = selectedArticle?.content ?? "";
  const toc = useMemo(() => selectedContent ? extractToc(selectedContent) : [], [selectedContent]);
  const activeId = useActiveToc(toc);
  const relatedArticles = useMemo(() => {
    if (!selectedArticle) return [];

    return allArticles
      .filter(a => a.id !== selectedArticle.id && a.categoryId === selectedArticle.categoryId)
      .slice(0, 4);
  }, [allArticles, selectedArticle]);
  const topicLinks = useMemo(
    () => selectedArticle ? getTopicLinks(selectedArticle) : [],
    [selectedArticle]
  );
  const guideProfile = useMemo(
    () => getArticleGuideProfile(selectedArticle),
    [selectedArticle]
  );
  const visibleFaqs = useMemo(
    () => getVisibleArticleFaqs(selectedArticle, selectedArticle?.id === initialArticleId ? initialFaqs : undefined),
    [initialArticleId, initialFaqs, selectedArticle]
  );

  const featuredArticles = useMemo(() => {
    const guide = allArticles.find(a => a.id === "web-guide");
    const rest = allArticles.filter(a => a.id !== "web-guide");
    return guide ? [guide, ...rest].slice(0, 5) : allArticles.slice(0, 4);
  }, [allArticles]);

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return allArticles;
    const q = searchQuery.toLowerCase();
    return allArticles.filter(a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q));
  }, [searchQuery, allArticles]);

  const articlesByCategory = useMemo(() => {
    const map = new Map<string, ArticleItem[]>();
    filteredArticles.forEach(a => { if (!map.has(a.categoryId)) map.set(a.categoryId, []); map.get(a.categoryId)!.push(a); });
    return map;
  }, [filteredArticles]);

  useEffect(() => {
    if (!selectedArticle || !selectedArticleHref) return;

    void fetch("/api/content/activity", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventType: lockedContent ? "PREVIEW_LOCKED" : "VIEW",
        href: selectedArticleHref,
        title: selectedArticle.title,
        summary: selectedArticle.summary,
        metadata: {
          categoryId: selectedArticle.categoryId,
          locked: Boolean(lockedContent),
        },
      }),
      keepalive: true,
    }).catch(() => {});
  }, [lockedContent, selectedArticle, selectedArticleHref]);

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

  const toggleCategory = (id: string) => {
    setOpenCategories(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const selectArticle = async (id: string, catId: string) => {
    const href = `/articles/${catId}/${genUid(id)}`;
    const allowed = await guardHref(href);
    if (!allowed) return;

    setSelectedArticleId(id);
    setOpenCategories(prev => new Set([...prev, catId]));
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.history.pushState(null, "", href);
    setSidebarOpen(false);
  };

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

  useEffect(() => { contentRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [selectedArticleId]);

  const renderedContent = useMemo(
    () => selectedContent ? renderMarkdown(selectedContent, toc, selectedArticle?.imageLayout) : null,
    [selectedArticle?.imageLayout, selectedContent, toc]
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <CommunityDialog open={communityOpen} onOpenChange={setCommunityOpen} />
      {contentGateDialog}

      <div className="w-full flex h-[calc(100vh-64px)]">

        {/* ══ LEFT SIDEBAR ═══════════════════════════════ */}
        <aside className={cn(
          "shrink-0 flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900",
          "fixed md:relative top-[64px] md:top-auto left-0 bottom-0 md:bottom-auto z-50 md:z-auto",
          "w-[280px] md:w-72 transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          <div className="px-5 pt-6 pb-4">
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-4">文章</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索文章..."
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div className="mx-5 h-px bg-slate-100 dark:bg-slate-800" />
          <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
            {categories.map(cat => {
              const catArticles = articlesByCategory.get(cat.id) ?? [];
              const isOpen = openCategories.has(cat.id);
              const hasSelected = catArticles.some(a => a.id === selectedArticleId);
              const catSubcategories = subcategories.filter(s => s.categoryId === cat.id);

              // Split articles: those in a subcategory vs standalone
              const subArticleIds = new Set(
                catArticles.filter(a => (a as Article & { subcategoryId?: string }).subcategoryId).map(a => a.id)
              );
              const standaloneArticles = catArticles.filter(a => !subArticleIds.has(a.id));

              return (
                <div key={cat.id} className="mb-0.5">
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors",
                      hasSelected
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <span className="text-base leading-none">{cat.emoji}</span>
                    <span className="flex-1 text-left">{cat.name}</span>
                    {catArticles.length > 0 && (
                      <span className={cn(
                        "text-[11px] font-medium tabular-nums px-1.5 py-0.5 rounded-full",
                        hasSelected
                          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                      )}>{catArticles.length}</span>
                    )}
                    <span className="text-slate-400 dark:text-slate-600">
                      {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="mb-1">
                      {/* Subcategory groups */}
                      {catSubcategories.map(sub => {
                        const subArticles = catArticles.filter(
                          a => (a as Article & { subcategoryId?: string }).subcategoryId === sub.id
                        );
                        // always show subcategory even if empty
                        const isSubOpen = openCategories.has(`${cat.id}:${sub.id}`);
                        const subHasSelected = subArticles.some(a => a.id === selectedArticleId);
                        return (
                          <div key={sub.id}>
                            <button
                              onClick={() => toggleCategory(`${cat.id}:${sub.id}`)}
                              className={cn(
                                "w-full flex items-center gap-2 px-5 pl-[3.25rem] py-2 text-xs font-semibold transition-colors",
                                subHasSelected
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                              )}
                            >
                              <span className="flex-1 text-left">{sub.name}</span>
                              {subArticles.length > 0 && (
                                <span className={cn(
                                  "tabular-nums px-1.5 py-0.5 rounded-full text-[10px]",
                                  subHasSelected
                                    ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                )}>{subArticles.length}</span>
                              )}
                              {isSubOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>
                            {isSubOpen && (
                              <div className="ml-[3.5rem] border-l border-slate-200 dark:border-slate-700/60 mb-1">
                                {subArticles.length === 0 && (
                                  <p className="pl-4 py-2 text-xs text-slate-400 dark:text-slate-600 italic">暂无文章</p>
                                )}
                                {subArticles.map(art => {
                                  const isActive = selectedArticleId === art.id;
                                  return (
                                    <button
                                      key={art.id}
                                      onClick={() => void selectArticle(art.id, cat.id)}
                                      className={cn(
                                        "w-full text-left pl-4 pr-4 py-2.5 text-sm transition-all duration-150 relative",
                                        isActive
                                          ? "text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/15 font-medium"
                                          : "text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                      )}
                                    >
                                      {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-amber-400 rounded-r-full" />}
                                      <span className="line-clamp-2 leading-snug">{art.title}</span>
                                      <span className="flex items-center gap-1 mt-1 text-[11px] text-slate-400 dark:text-slate-600">
                                        <Clock className="w-2.5 h-2.5" />{art.readTime} 分钟
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {/* Standalone articles (not in any subcategory) */}
                      {standaloneArticles.map(art => {
                        const isActive = selectedArticleId === art.id;
                        return (
                          <button
                            key={art.id}
                            onClick={() => void selectArticle(art.id, cat.id)}
                            className={cn(
                              "w-full text-left px-5 pl-[3.25rem] py-2.5 text-sm transition-all duration-150 relative",
                              isActive
                                ? "text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/15 font-medium"
                                : "text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                            )}
                          >
                            {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-amber-400 rounded-r-full" />}
                            <span className="line-clamp-2 leading-snug">{art.title}</span>
                            <span className="flex items-center gap-1 mt-1 text-[11px] text-slate-400 dark:text-slate-600">
                              <Clock className="w-2.5 h-2.5" />{art.readTime} 分钟
                            </span>
                          </button>
                        );
                      })}
                      {catArticles.length === 0 && (
                        <p className="pl-[3.25rem] py-2 text-xs text-slate-400 italic">暂无匹配</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="px-4 mt-4 mb-2">
              <div className="h-px bg-slate-100 dark:bg-slate-800 mb-4" />
              <a
                href="https://www.wise-hold.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50 to-indigo-50/30 dark:from-indigo-950/40 dark:to-slate-900 text-indigo-700 dark:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:from-indigo-100 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center shrink-0">
                  <Library className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold leading-tight">经典文集</div>
                  <div className="text-[11px] text-indigo-500/70 dark:text-indigo-500 mt-0.5 truncate">段永平 · 查理芒格 · 巴菲特</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all" />
              </a>
            </div>
          </nav>
        </aside>

        {/* ══ CENTER CONTENT ═════════════════════════════ */}
        <main ref={contentRef} className="flex-1 min-w-0 overflow-y-auto" style={{ backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.25) 1.5px, transparent 1.5px)", backgroundSize: "22px 22px" }}>
          {/* Mobile top bar */}
          <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-12 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate flex-1">
              {selectedArticle ? selectedArticle.title : "文章"}
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
          ) : selectedArticle ? (
            <article key={selectedArticleId} className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-12">
              <div className="flex items-center justify-between gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400">
                  {categories.find(c => c.id === selectedArticle.categoryId)?.emoji}
                  {categories.find(c => c.id === selectedArticle.categoryId)?.name}
                </span>
                {!lockedContent && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleFavorite()}
                      disabled={favoriteBusy}
                      className={cn(
                        "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-black transition-colors",
                        favoriteHrefs.has(selectedArticleHref)
                          ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                          : "border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:text-amber-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-amber-800"
                      )}
                    >
                      {favoriteHrefs.has(selectedArticleHref) ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                      {favoriteHrefs.has(selectedArticleHref) ? "已收藏" : "收藏"}
                    </button>
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
                  </div>
                )}
              </div>
              <h1 className="text-xl md:text-[28px] font-bold text-slate-900 dark:text-white leading-snug mb-3 md:mb-4 tracking-tight">
                {selectedArticle.title}
              </h1>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed mb-4 md:mb-5 border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                {selectedArticle.summary}
              </p>
              <div className="flex items-center gap-5 text-xs text-slate-400 pb-5 md:pb-7 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{selectedArticle.date}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />约 {selectedArticle.readTime} 分钟阅读</span>
                <span className="hidden items-center gap-1.5 md:flex"><ShieldCheck className="w-3.5 h-3.5" />持续维护</span>
              </div>

              <section className="mt-6 grid gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 md:grid-cols-[1fr_1fr_0.9fr]">
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
                    最后更新：{selectedArticle.date || "持续更新"}。{guideProfile.status}
                  </p>
                </div>
              </section>

              <div className={cn("mt-6 md:mt-8", lockedContent && "relative max-h-[720px] overflow-hidden")}>
                {renderedContent}
                {lockedContent && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent dark:from-slate-950 dark:via-slate-950/90" />
                )}
              </div>

              {lockedContent && (
                <section className="mt-8 overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white p-5 shadow-sm dark:border-amber-900/60 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-950 md:p-6">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-white text-amber-700 dark:border-amber-800 dark:bg-slate-950 dark:text-amber-300">
                        <LockKeyhole className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Wise ID</p>
                        <h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">登录后继续阅读完整内容</h2>
                        <p className="mt-2 text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300">
                          {lockedContent.reason}。登录或注册后会自动回到这篇文章。
                        </p>
                      </div>
                    </div>
                    <Link
                      href={lockedContent.loginHref}
                      className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-amber-300 transition-colors hover:bg-amber-400 hover:text-slate-950 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
                    >
                      登录阅读全文
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </section>
              )}

              {!lockedContent && visibleFaqs.length > 0 && (
                <section className="mt-12 border-t border-slate-100 pt-8 dark:border-slate-800">
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

              {(relatedArticles.length > 0 || topicLinks.length > 0) && (
                <section className="mt-12 border-t border-slate-100 pt-8 dark:border-slate-800">
                  {relatedArticles.length > 0 && (
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        相关阅读
                      </h2>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {relatedArticles.map(article => (
                          <ProtectedContentLink
                            key={article.id}
                            href={getArticleHref(article)}
                            className="group rounded-2xl border border-slate-200/80 bg-white/90 p-4 transition-all hover:border-amber-300 hover:bg-amber-50/60 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-amber-700 dark:hover:bg-amber-900/10"
                          >
                            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                              <Clock className="h-3 w-3" />
                              约 {article.readTime} 分钟阅读
                            </div>
                            <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-slate-800 transition-colors group-hover:text-amber-700 dark:text-slate-100 dark:group-hover:text-amber-300">
                              {article.title}
                            </h3>
                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                              {article.summary}
                            </p>
                          </ProtectedContentLink>
                        ))}
                      </div>
                    </div>
                  )}

                  {topicLinks.length > 0 && (
                    <div className={relatedArticles.length > 0 ? "mt-8" : ""}>
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

                  <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          内容反馈和群聊
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                          如果链接失效、费率变了，或者开户 / 入金 / 用卡过程中遇到问题，可以通过邀请链接进入群聊。
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCommunityOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-amber-300 transition-colors hover:bg-amber-400 hover:text-slate-950 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
                      >
                        <MessageCircle className="h-4 w-4" />
                        加入群聊提问
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </article>
          ) : (
            <div className="h-full flex flex-col items-center justify-center px-4 md:px-8 py-10 md:py-16">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center mb-4 md:mb-6 shadow-lg shadow-amber-200 dark:shadow-amber-900/30">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 tracking-tight">推荐阅读</h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm text-center leading-relaxed mb-8 md:mb-12">
                第一次来到 Wise，可以先从网站合集开始，快速知道每个工具应该在什么场景使用。
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl mb-6">
                {featuredArticles.map(art => {
                  const cat = categories.find(c => c.id === art.categoryId);
                  const isGuide = art.id === "web-guide";
                  return (
                    <button
                      key={art.id}
                      onClick={() => void selectArticle(art.id, art.categoryId)}
                      className={cn(
                        "text-left p-5 rounded-2xl border bg-white dark:bg-slate-900 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md hover:shadow-amber-100/50 dark:hover:shadow-amber-900/20 transition-all duration-200 group",
                        isGuide
                          ? "sm:col-span-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900"
                          : "border-slate-200 dark:border-slate-700/80"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-2xl">{cat?.emoji}</div>
                        {isGuide && (
                          <span className="rounded-full border border-amber-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:border-amber-700/70 dark:bg-amber-950/50 dark:text-amber-300">
                            先读这篇
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors leading-snug mb-2">{art.title}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-600 flex items-center gap-1"><Clock className="w-3 h-3" />{art.readTime} 分钟</div>
                    </button>
                  );
                })}
              </div>
              <a
                href="https://www.wise-hold.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 w-full max-w-xl p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-950/30 dark:to-slate-900 hover:border-indigo-400 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center shrink-0">
                  <Library className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-0.5">经典文集</div>
                  <div className="text-xs text-indigo-500/80 dark:text-indigo-500">段永平 · 查理芒格 · 巴菲特 · 经典演讲与著作</div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          )}
        </main>

        {/* ══ RIGHT TOC ══════════════════════════════════ */}
        <aside className="w-72 shrink-0 border-l border-slate-200/80 dark:border-slate-800 hidden lg:flex flex-col bg-white dark:bg-slate-900">
          <div className="px-5 pt-6 pb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-900 dark:text-slate-100">本页目录</p>
          </div>
          <nav className="flex-1 overflow-y-auto pb-8 scrollbar-hide">
            {toc.length > 0 ? (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />
                {toc.map(item => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={e => { e.preventDefault(); document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" }); }}
                    className={cn(
                      "relative flex items-start pl-8 pr-4 py-1.5 text-sm leading-snug transition-all duration-150",
                      item.level >= 3 && "pl-12",
                      activeId === item.id
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
        </aside>

      </div>
    </div>
  );
}
