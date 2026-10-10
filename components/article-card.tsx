"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, BookOpen, Calendar, Clock } from "lucide-react";
import { ProtectedContentLink } from "@/components/content-access-gate";
import { articleCovers } from "@/lib/article-covers";
import { genUid } from "@/lib/article-uid";
import { categories, subcategories } from "@/lib/articles-data";
import type { ArticleListItem } from "@/lib/articles";

export function ArticleCard({ article, priority = false }: { article: ArticleListItem; priority?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const cover = articleCovers[article.id];
  const image = cover?.src ?? article.coverImage;
  const isLocalCover = image?.startsWith("/images/") || image?.startsWith("/content/articles/");
  const category = categories.find((item) => item.id === article.categoryId);
  const subcategory = subcategories.find((item) => item.id === article.subcategoryId);

  return (
    <ProtectedContentLink
      href={`/articles/${article.categoryId}/${genUid(article.id)}`}
      prefetch={false}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.025)] transition-[border-color,box-shadow] hover:border-amber-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-700"
      aria-label={`阅读：${article.title}`}
    >
      <div className="relative aspect-video shrink-0 overflow-hidden border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
        {image && !imageFailed && isLocalCover ? (
          <Image
            src={image}
            alt={cover?.alt ?? article.title}
            width={1672}
            height={940}
            sizes="(min-width: 1248px) 436px, (min-width: 1024px) calc((100vw - 376px) / 2), (min-width: 768px) calc(100vw - 352px), calc(100vw - 32px)"
            priority={priority}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : image && !imageFailed ? (
          // Article images can include existing external sources as well as local covers.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={cover?.alt ?? article.title}
            width={1672}
            height={940}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-600">
            <BookOpen className="h-10 w-10" strokeWidth={1.25} />
            <span className="text-sm">{subcategory?.name ?? category?.name}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /><time dateTime={article.date}>{article.date}</time></span>
          <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{article.readTime} 分钟阅读</span>
        </div>
        <h2 className="mt-3 line-clamp-3 break-words text-base font-bold leading-6 text-slate-900 [text-wrap:balance] transition-colors group-hover:text-amber-800 dark:text-slate-100 dark:group-hover:text-amber-300">{article.title}</h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{article.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(cover?.topics ?? [subcategory?.name ?? category?.name ?? "文章"]).map((topic) => (
            <span key={topic} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">{topic}</span>
          ))}
        </div>
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm font-medium text-amber-800 dark:border-slate-800 dark:text-amber-300">
            阅读教程<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </ProtectedContentLink>
  );
}
