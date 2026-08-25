"use client";

import { useMemo, useState, useEffect, useRef, type KeyboardEvent } from "react";
import {
  Calculator,
  TrendingUp,
  Coins,
  BarChart3,
  PieChart,
  Percent,
  Zap,
  Search as SearchIcon,
  FileText,
  Home,
  BookOpen,
  Gift,
  CreditCard,
  Building2,
  Landmark,
  Radio,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { virtualCardProducts } from "@/app/card/data";
import { perkSections } from "@/app/perk/data";
import { tools, type Tool } from "@/lib/data";
import type { Article } from "@/lib/articles-data";
import { genUid } from "@/lib/article-renderer";
import { quickAnswerItems, starterPaths } from "@/lib/get-started";
import { getSafeExternalUrl } from "@/lib/security/external-links";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Calculator,
  TrendingUp,
  Coins,
  BarChart3,
  PieChart,
  Percent,
  Zap,
  Search: SearchIcon,
};

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToolSelect?: (tool: Tool) => void;
}

type SearchGroup = "常用入口" | "新手问题" | "文章教程" | "福利产品" | "虚拟 U 卡" | "工具";

type SearchItem = {
  id: string;
  label: string;
  href: string;
  description: string;
  group: SearchGroup;
  icon: LucideIcon;
  searchText: string;
  priority: number;
};

const toolRoutes: Record<string, string> = {
  "dca-zone": "/DCA",
  "compound-calc": "/tools/compound-calculator",
  "roi-calculator": "/tools/roi-calculator",
  "first-million": "/tools/first-million",
  "values-corrector": "/tools/values-corrector",
  "fear-greed": "/tools/fear-greed",
  "impermanent-loss": "/tools/impermanent-loss",
  "apy-calculator": "/tools/apy-calculator",
  "average-down": "/tools/average-down",
  "contract-calculator": "/tools/contract-calculator",
  "position-calculator": "/tools/position-calculator",
  "price-tester": "/tools/price-tester",
};

const quickItems: SearchItem[] = [
  {
    id: "quick-home",
    label: "首页",
    href: "/",
    description: "回到 Wise Invest 总入口",
    group: "常用入口",
    icon: Home,
    searchText: "首页 Wise Invest home",
    priority: 100,
  },
  {
    id: "quick-start",
    label: "投资路线图",
    href: "/start",
    description: "不知道先看什么，按问题选择交易所、U 卡、券商、银行和定投路径",
    group: "常用入口",
    icon: BookOpen,
    searchText: "新手 入门 start 开始 学习路线 不知道先看什么 教程",
    priority: 98,
  },
  {
    id: "quick-get",
    label: "产品福利入口",
    href: "/get",
    description: "注册、领取、开卡、开户、定投和工具入口",
    group: "常用入口",
    icon: Gift,
    searchText: "get 行动 领取 注册 链接 邀请码 福利 开卡 开户",
    priority: 97,
  },
  {
    id: "quick-vcard",
    label: "虚拟 U 卡资料库",
    href: "/card",
    description: "对比 MPCard、Bitget Wallet、SafePal、BenPay 等卡片",
    group: "常用入口",
    icon: CreditCard,
    searchText: "虚拟 U 卡 MPCard Apple Pay 支付宝 微信 AI 订阅",
    priority: 95,
  },
  {
    id: "quick-crypto",
    label: "交易所注册入金",
    href: "/perk/crypto",
    description: "Binance、OKX、Bybit、Bitget 注册入口和返佣福利",
    group: "常用入口",
    icon: Gift,
    searchText: "币安 Binance OKX 欧易 Bybit Bitget 注册 入金 KYC C2C 邀请码",
    priority: 94,
  },
  {
    id: "quick-broker",
    label: "港美股券商开户",
    href: "/perk/broker",
    description: "盈透、嘉信、长桥、复星等券商入口",
    group: "常用入口",
    icon: Building2,
    searchText: "盈透 IBKR 嘉信 Schwab 港美股 券商 开户 入金",
    priority: 92,
  },
  {
    id: "quick-bank",
    label: "境外银行开户",
    href: "/perk/bank",
    description: "Wise、香港银行、新加坡银行和见证开户",
    group: "常用入口",
    icon: Landmark,
    searchText: "境外银行 Wise 香港银行 新加坡银行 见证开户 美元 港币",
    priority: 91,
  },
  {
    id: "quick-dca",
    label: "BTC / ETH 定投实盘",
    href: "/practice/dca-investment",
    description: "查看 Wise 定投成本、收益曲线和明细",
    group: "常用入口",
    icon: TrendingUp,
    searchText: "BTC ETH 定投 实盘 收益 曲线 明细 DCA",
    priority: 90,
  },
];

const aliases: Record<string, string[]> = {
  币安: ["binance", "biance", "bnb", "wisebnb1"],
  binance: ["币安", "biance", "bnb", "wisebnb1"],
  biance: ["币安", "binance", "bnb", "wisebnb1"],
  欧易: ["okx", "ouyi", "wise6666"],
  okx: ["欧易", "ouyi", "wise6666"],
  bybit: ["bybit card", "jjkzwa4", "wise6666"],
  bitget: ["bitget wallet", "bgb", "wise5130", "wise6666"],
  mp: ["mpcard", "mp card", "wiseinvest", "虚拟卡"],
  mpcard: ["mp", "mp card", "虚拟 u 卡", "apple pay"],
  ibkr: ["盈透", "interactive brokers", "美股券商"],
  盈透: ["ibkr", "interactive brokers", "美股券商"],
  schwab: ["嘉信", "charles schwab", "美股券商"],
  嘉信: ["schwab", "charles schwab", "美股券商"],
  wise: ["美元账户", "跨境收款", "境外银行"],
  dca: ["定投", "btc", "eth", "qqq"],
  定投: ["dca", "btc", "eth", "qqq"],
};

function expandQuery(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const tokens = normalized.split(/\s+/).filter(Boolean);
  return Array.from(new Set([
    normalized,
    ...tokens,
    ...tokens.flatMap((token) => aliases[token] ?? []),
    ...(aliases[normalized] ?? []),
  ])).map((item) => item.toLowerCase());
}

function getMatchScore(item: SearchItem, terms: string[]) {
  if (terms.length === 0) return item.priority;
  const haystack = `${item.label} ${item.description} ${item.searchText}`.toLowerCase();
  const matches = terms.filter((term) => haystack.includes(term));
  if (matches.length === 0) return -1;
  const titleBoost = terms.some((term) => item.label.toLowerCase().includes(term)) ? 50 : 0;
  return item.priority + titleBoost + matches.length * 12;
}

function isExternalUrl(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlightedText(text: string, terms: string[], className: string) {
  const activeTerms = Array.from(new Set(terms.filter((term) => term.length >= 2)))
    .sort((a, b) => b.length - a.length)
    .slice(0, 8);

  if (activeTerms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const pattern = new RegExp(`(${activeTerms.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = activeTerms.some((term) => part.toLowerCase() === term.toLowerCase());
        return isMatch ? (
          <mark
            key={`${part}-${index}`}
            className="rounded bg-amber-200/80 px-0.5 text-slate-950 dark:bg-amber-400/80 dark:text-slate-950"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        );
      })}
    </span>
  );
}

export function SearchCommand({
  open,
  onOpenChange,
  onToolSelect,
}: SearchCommandProps) {
  const pathname = usePathname();
  const lastPathnameRef = useRef(pathname);
  const [search, setSearch] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (lastPathnameRef.current === pathname) return;
    lastPathnameRef.current = pathname;
    if (!open) return;
    onOpenChange(false);
    setSearch("");
  }, [onOpenChange, open, pathname]);

  useEffect(() => {
    if (!open || articles.length > 0) return;
    fetch("/api/articles-fs")
      .then((response) => response.json())
      .then((data: Article[]) => setArticles(Array.isArray(data) ? data : []))
      .catch(() => setArticles([]));
  }, [articles.length, open]);

  const searchItems = useMemo<SearchItem[]>(() => {
    const starterItems = starterPaths.map((path) => ({
      id: `starter-${path.id}`,
      label: path.title,
      href: path.href,
      description: path.question,
      group: "新手问题" as const,
      icon: path.icon,
      searchText: `${path.title} ${path.question} ${path.description} ${path.keywords.join(" ")} ${path.steps.join(" ")}`,
      priority: 88,
    }));

    const answerItems = quickAnswerItems.map((item) => ({
      id: `answer-${item.question}`,
      label: item.question,
      href: item.href,
      description: item.answer,
      group: "新手问题" as const,
      icon: item.icon,
      searchText: `${item.question} ${item.answer}`,
      priority: 86,
    }));

    const articleItems = articles.slice(0, 80).map((article) => ({
      id: `article-${article.id}`,
      label: article.title,
      href: `/articles/${article.categoryId}/${genUid(article.id)}`,
      description: article.summary || "查看完整教程",
      group: "文章教程" as const,
      icon: FileText,
      searchText: `${article.title} ${article.summary} ${article.categoryId}`,
      priority: 70,
    }));

    const cardItems = virtualCardProducts.map((card) => ({
      id: `card-${card.id}`,
      label: card.name,
      href: card.tutorialLink ?? card.registerLink ?? "/card",
      description: `${card.status} · ${card.ai.label} · ${card.bestFor.join(" / ")}`,
      group: "虚拟 U 卡" as const,
      icon: CreditCard,
      searchText: `${card.name} ${card.issuer} ${card.inviteCode ?? ""} ${card.ai.detail} ${card.payment.detail} ${card.bestFor.join(" ")}`,
      priority: 80,
    }));

    const perkItems = perkSections.flatMap((section) =>
      section.subcategories.flatMap((subcategory) =>
        (subcategory.products ?? []).map((product) => ({
          id: `perk-${section.slug}-${product.id}`,
          label: product.title,
          href: product.tutorialLink ?? product.registerLink ?? `/perk/${section.slug}`,
          description: `${section.title} · ${product.benefit}`,
          group: "福利产品" as const,
          icon: Gift,
          searchText: `${section.title} ${subcategory.title} ${product.title} ${product.description} ${product.benefit} ${product.code ?? ""}`,
          priority: 78,
        }))
      )
    );

    const toolItems = tools.map((tool) => ({
      id: `tool-${tool.id}`,
      label: tool.name,
      href: toolRoutes[tool.id] ?? "/tools",
      description: tool.description,
      group: "工具" as const,
      icon: iconMap[tool.icon] ?? Calculator,
      searchText: `${tool.name} ${tool.description} ${tool.category}`,
      priority: 72,
    }));

    return [...quickItems, ...starterItems, ...answerItems, ...cardItems, ...perkItems, ...toolItems, ...articleItems];
  }, [articles]);

  const filteredItems = useMemo(() => {
    const terms = expandQuery(search);
    if (terms.length === 0) return searchItems.slice(0, 48);
    return searchItems
      .map((item) => ({ item, score: getMatchScore(item, terms) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item)
      .slice(0, 60);
  }, [search, searchItems]);
  const highlightTerms = useMemo(() => expandQuery(search), [search]);

  const itemsByGroup = useMemo(() => {
    const groups: Record<SearchGroup, SearchItem[]> = {
      常用入口: [],
      新手问题: [],
      文章教程: [],
      福利产品: [],
      "虚拟 U 卡": [],
      工具: [],
    };
    filteredItems.forEach((item) => groups[item.group].push(item));
    return groups;
  }, [filteredItems]);

  const handleToolSelect = (tool: Tool) => {
    if (tool.status === "Available" && onToolSelect) {
      onToolSelect(tool);
      onOpenChange(false);
      setSearch("");
    }
  };

  const handleItemSelect = (item: SearchItem, navigate = true) => {
    if (item.group === "工具" && item.href === "/tools" && onToolSelect) {
      const tool = tools.find((candidate) => `tool-${candidate.id}` === item.id);
      if (tool) {
        handleToolSelect(tool);
        return;
      }
    }

    if (navigate) {
      if (isExternalUrl(item.href)) {
        window.open(getSafeExternalUrl(item.href), "_blank", "noopener,noreferrer");
      } else {
        window.location.assign(item.href);
      }
    }
    onOpenChange(false);
    setSearch("");
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    const firstItem = filteredItems[0];
    if (!firstItem) return;
    event.preventDefault();
    handleItemSelect(firstItem);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="搜索文章、福利、虚拟卡、工具..."
        value={search}
        onValueChange={setSearch}
        onKeyDown={handleInputKeyDown}
      />
      <CommandList>
        <CommandEmpty>
          <div className="px-3 py-6 text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              没有直接结果
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              可以先从这些入口继续找答案
            </p>
            <div className="mt-4 grid gap-2">
              {quickItems.slice(1, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemSelect(item)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:border-amber-300 hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-amber-700 dark:hover:bg-amber-950/30"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </CommandEmpty>

        {(Object.entries(itemsByGroup) as [SearchGroup, SearchItem[]][]).map(([group, items]) => (
          items.length > 0 && (
            <CommandGroup key={group} heading={group}>
              {items.map((item) => {
                const Icon = item.icon;
                const content = (
                  <>
                    <Icon className="mr-2 h-4 w-4" />
                    <div className="min-w-0 flex-1">
                      {renderHighlightedText(item.label, highlightTerms, "block truncate text-sm font-medium")}
                      {renderHighlightedText(item.description, highlightTerms, "block truncate text-xs text-slate-500")}
                    </div>
                    {isExternalUrl(item.href) && (
                      <CommandShortcut>
                        <Radio className="h-3 w-3" />
                      </CommandShortcut>
                    )}
                  </>
                );
                return (
                <button
                  key={item.id}
                  type="button"
                  data-search-result={item.id}
                  onClick={() => handleItemSelect(item)}
                  className="relative flex w-full min-w-0 cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-yellow-400 hover:text-black focus-visible:bg-yellow-400 focus-visible:text-black"
                >
                  {content}
                </button>
                );
              })}
            </CommandGroup>
          )
        ))}
      </CommandList>
    </CommandDialog>
  );
}
