"use client";

import { useState, type ReactNode } from "react";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { ProtectedContentLink } from "@/components/content-access-gate";
import styles from "./article-link-card.module.css";

/** Public list metadata only; an embedded card never needs the target article body. */
export type ArticleLinkMetadata = {
  id: string;
  categoryId: string;
  title: string;
  summary: string;
  readTime: number;
  coverImage?: string;
};

export type ArticleSeriesLinkMetadata = {
  kind: "series";
  id: string;
  title: string;
  summary: string;
  articleCount: number;
  coverImage?: string;
};

export function ArticleLinkCardGroup({ children }: { children: ReactNode }) {
  return <div className={styles.group} data-article-link-group><div className={styles.grid}>{children}</div></div>;
}

export function ArticleLinkCard({ article, href }: { article: ArticleLinkMetadata | ArticleSeriesLinkMetadata; href: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const localCover = article.coverImage?.startsWith("/images/") ? article.coverImage : undefined;
  const series = "kind" in article && article.kind === "series";
  const action = series ? "查看路线" : "阅读文章";
  const metadata = "articleCount" in article ? `${article.articleCount} 篇文章` : `${article.readTime} 分钟阅读`;

  return (
    <ProtectedContentLink
      href={href}
      prefetch={false}
      className={styles.card}
      aria-label={`${action}：${article.title}`}
      data-article-link-card
      data-link-kind={series ? "series" : "article"}
    >
      <span className={styles.media} aria-hidden="true">
        {localCover && !imageFailed ? (
          // Existing small WebP list cover; do not fetch the target article's images.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={localCover} alt="" width={640} height={360} loading="lazy" decoding="async" onError={() => setImageFailed(true)} />
        ) : <BookOpen size={28} strokeWidth={1.25} />}
      </span>
      <span className={styles.content}>
        <span className={styles.meta}>
          <span>{metadata}</span>
          <span className={styles.typeBadge}>{series ? "系列教程" : "学习文章"}</span>
        </span>
        <strong className={styles.title}>{article.title}</strong>
        <span className={styles.summary}>{article.summary}</span>
        <span className={styles.action}>{action}<ArrowUpRight size={14} aria-hidden="true" /></span>
      </span>
      <span className={styles.arrow} aria-hidden="true"><ArrowUpRight size={19} strokeWidth={1.5} /></span>
    </ProtectedContentLink>
  );
}
