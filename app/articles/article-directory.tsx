"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import { ChevronRight, X } from "lucide-react";
import { categories } from "@/lib/articles-data";
import { articleCategoryIcons, articleLibraryIcons } from "@/lib/article-icons";
import styles from "./article-directory.module.css";
import { SeriesNavigation, type SeriesReaderContext } from "./series-reader";

export const articleTopicGroups = [
  { id: "market", name: "投资与市场", categoryIds: ["domestic", "index", "strategy"] },
  { id: "crypto", name: "加密与 Web3", categoryIds: ["crypto", "predict", "onchain"] },
  { id: "accounts", name: "开户与资金", categoryIds: ["broker", "bank", "vcard", "transfers"] },
  { id: "tools", name: "工具与出海", categoryIds: ["simcard", "ai", "outside"] },
  { id: "wise", name: "Wise 指南", categoryIds: ["web", "VIP"] },
] as const;

type TopicGroupId = (typeof articleTopicGroups)[number]["id"];

export interface ArticleDirectoryProps {
  seriesContext?: SeriesReaderContext;
  articleToc?: {
    title: string;
    items: { id: string; text: string; level: number }[];
    activeId: string;
    activeChapterId?: string;
    isPreview?: boolean;
  };
  categoryCounts: Record<string, number>;
  activeView: "recommended" | "series" | "all" | null;
  activeCategoryId?: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const directoryViews = [
  { id: "recommended", name: "推荐阅读", href: "/articles" },
  { id: "series", name: "系列内容", href: "/articles?view=series" },
  { id: "all", name: "全部文章", href: "/articles?view=all" },
] as const;

const groupIcons = {
  market: articleCategoryIcons.index,
  crypto: articleCategoryIcons.crypto,
  accounts: articleCategoryIcons.bank,
  tools: articleCategoryIcons.ai,
  wise: articleCategoryIcons.web,
} satisfies Record<TopicGroupId, string>;

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
        {directoryViews.map(({ id, name, href }) => (
          <Link
            key={id}
            href={href}
            onClick={onNavigate}
            aria-current={activeView === id && !activeCategoryId ? "page" : undefined}
            className={styles.navigationLink}
          >
            <Image src={articleLibraryIcons[id]} alt="" width={28} height={28} className={styles.artwork} unoptimized draggable={false} />
            <span>{name}</span>
          </Link>
        ))}
      </div>

      <div className={styles.topics}>
        <p className={styles.sectionLabel}>按主题浏览</p>
        {articleTopicGroups.map((group) => {
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
                  <Image src={groupIcons[group.id]} alt="" width={28} height={28} className={styles.artwork} unoptimized draggable={false} />
                </span>
                <span>{group.name}</span>
                <span className={styles.chevron} data-expanded={expanded}>
                  <ChevronRight className={styles.icon} aria-hidden="true" strokeWidth={1.5} />
                </span>
              </button>
              <ul id={panelId} hidden={!expanded} className={styles.categoryList}>
                {group.categoryIds.map((categoryId) => {
                  const category = categoriesById.get(categoryId);
                  if (!category) return null;

                  return (
                    <li key={category.id}>
                      <Link
                        href={`/articles/${category.id}`}
                        className={styles.categoryLink}
                        aria-current={activeCategoryId === category.id ? "page" : undefined}
                        onClick={onNavigate}
                      >
                        <Image src={articleCategoryIcons[categoryId]} alt="" width={26} height={26} className={styles.categoryIcon} unoptimized draggable={false} />
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
          <Image src={articleLibraryIcons.recommended} alt="" width={28} height={28} className={styles.artwork} unoptimized draggable={false} />
          <span>经典文集</span>
        </a>
      </div>
    </nav>
  );
}

export function ArticleDirectory({
  seriesContext,
  articleToc,
  categoryCounts,
  activeView,
  activeCategoryId,
  mobileOpen,
  onMobileClose,
}: ArticleDirectoryProps) {
  const desktopRef = useRef<HTMLElement>(null);
  const pendingHeadingRef = useRef<string | null>(null);
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
              const headingId = pendingHeadingRef.current;
              pendingHeadingRef.current = null;
              if (headingId) {
                event.preventDefault();
                // Radix has released its scroll lock before moving into the body.
                requestAnimationFrame(() => {
                  const heading = document.getElementById(headingId);
                  if (!heading) return;
                  heading.setAttribute("tabindex", "-1");
                  heading.focus({ preventScroll: true });
                  const bar = document.getElementById("article-directory-trigger")?.closest<HTMLElement>("[data-reading-chrome]");
                  const top = Math.max(112, bar?.getBoundingClientRect().bottom ?? 0) + 16;
                  window.scrollBy({ top: heading.getBoundingClientRect().top - top, behavior: "instant" });
                  window.history.replaceState(window.history.state, "", `#${headingId}`);
                });
                return;
              }
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
              <Dialog.Title className={styles.title}>{articleToc ? "阅读导航" : seriesContext ? seriesContext.series.kind === "topic" ? "系列内容" : "系列章节" : "文章目录"}</Dialog.Title>
              <Dialog.Close className={styles.closeButton} aria-label="关闭文章目录">
                <X className={styles.icon} aria-hidden="true" strokeWidth={1.5} />
              </Dialog.Close>
            </div>
            {articleToc ? (
              <Tabs.Root defaultValue="article" className={styles.readingNavigation}>
                <Tabs.List className={styles.tabs} aria-label="选择阅读目录">
                  <Tabs.Trigger className={styles.tab} value="article">本篇目录</Tabs.Trigger>
                  <Tabs.Trigger className={styles.tab} value="collection">{seriesContext ? "系列章节" : "文章分类"}</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="article" className={styles.tabPanel}>
                  <p className={styles.articleTitle}>{articleToc.title}</p>
                  {articleToc.isPreview && <p className={styles.previewNote}>仅显示当前可阅读的章节</p>}
                  <nav aria-label="本篇目录" className={styles.articleToc}>
                    {articleToc.items.length ? articleToc.items.map(item => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        data-level={item.level}
                        data-active-chapter={articleToc.activeChapterId === item.id}
                        aria-current={articleToc.activeId === item.id ? "location" : undefined}
                        onClick={event => {
                          event.preventDefault();
                          pendingHeadingRef.current = item.id;
                          onMobileClose();
                        }}
                      >{item.text}</a>
                    )) : <p className={styles.previewNote}>{articleToc.isPreview ? "当前预览暂无可跳转章节，可继续阅读开头内容。" : "本文暂无章节目录。"}</p>}
                  </nav>
                </Tabs.Content>
                <Tabs.Content value="collection" className={styles.tabPanel}>
                  {seriesContext ? <SeriesNavigation {...seriesContext} onNavigate={onMobileClose} /> : <DirectoryNavigation {...navigationProps} onNavigate={onMobileClose} />}
                </Tabs.Content>
              </Tabs.Root>
            ) : seriesContext ? <SeriesNavigation {...seriesContext} onNavigate={onMobileClose} /> : <DirectoryNavigation {...navigationProps} onNavigate={onMobileClose} />}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
