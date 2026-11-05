"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {
  BookOpen,
  Building2,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  Compass,
  CreditCard,
  Coins,
  Crown,
  FileText,
  Globe2,
  Landmark,
  Layers2,
  Link2,
  Network,
  Plane,
  ScanLine,
  Smartphone,
  Sparkles,
  TrendingUp,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { categories } from "@/lib/articles-data";
import styles from "./article-directory.module.css";
import { SeriesNavigation, type SeriesReaderContext } from "./series-reader";

export const articleTopicGroups = [
  { id: "market", name: "投资与市场", categoryIds: ["domestic", "index", "strategy"] },
  { id: "crypto", name: "加密与 Web3", categoryIds: ["crypto", "predict", "onchain"] },
  { id: "accounts", name: "开户与资金", categoryIds: ["broker", "bank", "vcard"] },
  { id: "tools", name: "工具与出海", categoryIds: ["simcard", "ai", "outside"] },
  { id: "wise", name: "Wise 指南", categoryIds: ["web", "VIP"] },
] as const;

type TopicGroupId = (typeof articleTopicGroups)[number]["id"];

export interface ArticleDirectoryProps {
  seriesContext?: SeriesReaderContext;
  categoryCounts: Record<string, number>;
  activeView: "recommended" | "series" | "all" | null;
  activeCategoryId?: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const directoryViews = [
  { id: "recommended", name: "推荐阅读", href: "/articles", icon: BookOpen },
  { id: "series", name: "系列内容", href: "/articles?view=series", icon: Layers2 },
  { id: "all", name: "全部文章", href: "/articles?view=all", icon: FileText },
] as const;

const groupIcons = {
  market: ChartNoAxesColumnIncreasing,
  crypto: Network,
  accounts: Wallet,
  tools: Wrench,
  wise: Compass,
} satisfies Record<TopicGroupId, typeof BookOpen>;

const categoryIcons = {
  domestic: Wallet,
  index: TrendingUp,
  strategy: Compass,
  crypto: Coins,
  predict: ScanLine,
  onchain: Link2,
  broker: Building2,
  bank: Landmark,
  vcard: CreditCard,
  simcard: Smartphone,
  ai: Sparkles,
  outside: Plane,
  web: Globe2,
  VIP: Crown,
} satisfies Record<(typeof articleTopicGroups)[number]["categoryIds"][number], typeof BookOpen>;

const categoriesById = new Map(categories.map((category) => [category.id, category]));

interface DirectoryNavigationProps {
  categoryCounts: ArticleDirectoryProps["categoryCounts"];
  activeView: ArticleDirectoryProps["activeView"];
  activeCategoryId?: string;
  expandedGroups: TopicGroupId[];
  onToggleGroup: (groupId: TopicGroupId) => void;
  onNavigate?: () => void;
}

function DirectoryNavigation({
  categoryCounts,
  activeView,
  activeCategoryId,
  expandedGroups,
  onToggleGroup,
  onNavigate,
}: DirectoryNavigationProps) {
  const navigationId = useId();

  return (
    <nav aria-label="文章目录" className={styles.navigation}>
      <div className={styles.primaryLinks}>
        {directoryViews.map(({ id, name, href, icon: Icon }) => (
          <Link
            key={id}
            href={href}
            onClick={onNavigate}
            aria-current={activeView === id && !activeCategoryId ? "page" : undefined}
            className={styles.navigationLink}
          >
            <Icon className={styles.icon} aria-hidden="true" strokeWidth={1.5} />
            <span>{name}</span>
          </Link>
        ))}
      </div>

      <div className={styles.topics}>
        <p className={styles.sectionLabel}>按主题浏览</p>
        {articleTopicGroups.map((group) => {
          const Icon = groupIcons[group.id];
          const expanded = expandedGroups.includes(group.id);
          const panelId = `${navigationId}-${group.id}`;

          return (
            <div key={group.id} className={styles.topicGroup} data-topic={group.id}>
              <button
                type="button"
                className={styles.groupButton}
                data-active={group.categoryIds.some((categoryId) => categoryId === activeCategoryId)}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => onToggleGroup(group.id)}
              >
                <span className={styles.groupIcon} aria-hidden="true">
                  <Icon className={styles.icon} strokeWidth={1.7} />
                </span>
                <span>{group.name}</span>
                <span className={styles.chevron} data-expanded={expanded}>
                  <ChevronRight className={styles.icon} aria-hidden="true" strokeWidth={1.5} />
                </span>
              </button>
              <ul id={panelId} hidden={!expanded} className={styles.categoryList}>
                {group.categoryIds.map((categoryId) => {
                  const category = categoriesById.get(categoryId);
                  const CategoryIcon = categoryIcons[categoryId];
                  if (!category) return null;

                  return (
                    <li key={category.id}>
                      <Link
                        href={`/articles/${category.id}`}
                        className={styles.categoryLink}
                        aria-current={activeCategoryId === category.id ? "page" : undefined}
                        onClick={onNavigate}
                      >
                        <CategoryIcon className={styles.categoryIcon} aria-hidden="true" strokeWidth={1.6} />
                        <span>
                          {category.name}
                          <span className={styles.categoryCount}>（{categoryCounts[category.id] ?? 0}）</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className={styles.classics}>
        <a
          href="https://www.wise-hold.com/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
          className={styles.navigationLink}
        >
          <BookOpen className={styles.icon} aria-hidden="true" strokeWidth={1.5} />
          <span>经典文集</span>
        </a>
      </div>
    </nav>
  );
}

export function ArticleDirectory({
  seriesContext,
  categoryCounts,
  activeView,
  activeCategoryId,
  mobileOpen,
  onMobileClose,
}: ArticleDirectoryProps) {
  const desktopRef = useRef<HTMLElement>(null);
  const activeGroupId = articleTopicGroups.find((group) =>
    group.categoryIds.some((categoryId) => categoryId === activeCategoryId),
  )?.id;
  const [expandedGroups, setExpandedGroups] = useState<TopicGroupId[]>(() =>
    activeGroupId && activeGroupId !== "crypto" ? ["crypto", activeGroupId] : ["crypto"],
  );

  useEffect(() => {
    if (!activeGroupId) return;
    setExpandedGroups((current) =>
      current.includes(activeGroupId) ? current : [...current, activeGroupId],
    );
  }, [activeCategoryId, activeGroupId]);

  useEffect(() => {
    if (!mobileOpen) return;
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (desktopQuery.matches) onMobileClose();
    };
    closeOnDesktop();
    desktopQuery.addEventListener("change", closeOnDesktop);
    return () => desktopQuery.removeEventListener("change", closeOnDesktop);
  }, [mobileOpen, onMobileClose]);

  const toggleGroup = (groupId: TopicGroupId) => {
    setExpandedGroups((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId],
    );
  };

  const navigationProps = {
    categoryCounts,
    activeView,
    activeCategoryId,
    expandedGroups,
    onToggleGroup: toggleGroup,
  };

  return (
    <>
      <aside ref={desktopRef} className={styles.desktop} aria-label="文章导航">
        {!seriesContext && <h2 className={styles.title}>文章目录</h2>}
        {seriesContext ? <SeriesNavigation {...seriesContext} /> : <DirectoryNavigation {...navigationProps} />}
      </aside>

      <Dialog.Root open={mobileOpen} onOpenChange={(open) => { if (!open) onMobileClose(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content
            id="article-directory-drawer"
            className={styles.drawer}
            aria-describedby={undefined}
            onCloseAutoFocus={(event) => {
              const trigger = document.getElementById("article-directory-trigger");
              const currentLink = desktopRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
              const firstLink = desktopRef.current?.querySelector<HTMLElement>("a");
              // The mobile trigger disappears when a resize closes the drawer.
              // Return keyboard focus to a visible desktop entry in that case.
              const focusTarget = [trigger, currentLink, firstLink].find(
                (element) => element && element.getClientRects().length > 0,
              );
              if (focusTarget) {
                event.preventDefault();
                focusTarget.focus({ preventScroll: true });
              }
            }}
          >
            <div className={styles.drawerHeader}>
              <Dialog.Title className={styles.title}>{seriesContext ? seriesContext.series.kind === "topic" ? "系列内容" : "系列章节" : "文章目录"}</Dialog.Title>
              <Dialog.Close className={styles.closeButton} aria-label="关闭文章目录">
                <X className={styles.icon} aria-hidden="true" strokeWidth={1.5} />
              </Dialog.Close>
            </div>
            {seriesContext ? <SeriesNavigation {...seriesContext} onNavigate={onMobileClose} /> : <DirectoryNavigation {...navigationProps} onNavigate={onMobileClose} />}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
