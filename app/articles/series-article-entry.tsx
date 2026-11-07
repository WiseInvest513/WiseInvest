import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import type { ArticleListItem } from "@/lib/articles";
import { articleCovers } from "@/lib/article-covers";
import type { SeriesReadingState } from "@/lib/article-series";
import styles from "./series-reader.module.css";

export function SeriesArticleEntry({ chapter, article, read = false }: {
  chapter: SeriesReadingState["chapters"][number];
  article?: ArticleListItem;
  read?: boolean;
}) {
  const cover = chapter.articleId ? articleCovers[chapter.articleId] : undefined;
  const summary = chapter.summary ?? article?.summary;
  const content = <>
    <span className={styles.articleThumbnail}>
      {cover ? <Image src={cover.src} alt="" width={640} height={360} sizes="180px" unoptimized /> : <BookOpen size={28} strokeWidth={1.4} aria-hidden="true" />}
    </span>
    <div className={styles.articleCopy}>
      <div className={styles.articleTitleRow}><h3>{chapter.title}</h3><span className={styles.typeBadge} data-content-type="article">学习文章</span></div>
      {summary && <span className={styles.articleSummary}>{summary}</span>}
      <span className={styles.articleFooter}>
        <span className={styles.articleMeta}><span>文章 {String(chapter.index + 1).padStart(2, "0")}</span>{article?.readTime ? <span><Clock size={12} aria-hidden="true" />{article.readTime} 分钟阅读</span> : null}</span>
        <span className={styles.articleAction}>{chapter.href ? <>{read ? "已读 · 再看一遍" : "阅读文章"}<ArrowRight size={14} aria-hidden="true" /></> : "待更新"}</span>
      </span>
    </div>
  </>;
  return <li>{chapter.href ? <Link href={chapter.href} className={styles.articleEntry} data-read={read || undefined} aria-label={`阅读：${chapter.title}`}>{content}</Link> : <div className={styles.articleEntry} aria-disabled="true">{content}</div>}</li>;
}
