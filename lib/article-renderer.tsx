"use client";
import React from "react";
import { ArticleImage } from "@/components/article-image";
import { ArticleRegistrationCard } from "@/components/article-registration-card";
import { ArticleLinkCard, ArticleLinkCardGroup, type ArticleLinkMetadata, type ArticleSeriesLinkMetadata } from "@/components/article-link-card";
import { parseRegistrationCallout } from "@/lib/article-registration";
import { genUid } from "@/lib/article-uid";

// ─── UID generation ────────────────────────────────────────
export { genUid } from "@/lib/article-uid";

// ─── TOC 提取 ──────────────────────────────────────────────
export function extractToc(content: string) {
  const toc: { id: string; text: string; level: number }[] = [];
  let idx = 0;
  content.split("\n").forEach((line) => {
    const m = line.match(/^(#{1,4})\s+(.+)/);
    if (m) toc.push({ id: `h-${idx++}`, text: m[2].replace(/\*\*/g, ""), level: m[1].length });
  });
  return toc;
}

// ─── Inline markdown (bold / code / link) ─────────────────
export function renderInline(text: string, allowLinks = true): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|`(.+?)`|(https?:\/\/[^\s<>\]\)"']+[^\s<>,;.)\]"'])/g;
  let lastIdx = 0; let key = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(<span key={key++}>{text.slice(lastIdx, match.index)}</span>);
    // Link labels can contain formatting or a URL, but never another anchor.
    if (match[1] != null) parts.push(allowLinks
      ? <a key={key++} href={match[2]} target="_blank" rel="noopener noreferrer" className="[overflow-wrap:anywhere] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">{renderInline(match[1], false)}</a>
      : <span key={key++}>{renderInline(match[1], false)}</span>);
    else if (match[3] != null) parts.push(<strong key={key++} className="font-semibold">{match[3]}</strong>);
    else if (match[4] != null) parts.push(<code key={key++} className="[overflow-wrap:anywhere] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono text-amber-700 dark:text-amber-400">{match[4]}</code>);
    else if (match[5] != null && !allowLinks) parts.push(<span key={key++}>{match[5]}</span>);
    else if (match[5] != null) {
      const href = match[5];
      parts.push(
        <a
          key={key++}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="[overflow-wrap:anywhere] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
        >
          {href}
        </a>
      );
    }
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) parts.push(<span key={key++}>{text.slice(lastIdx)}</span>);
  return <>{parts}</>;
}

// ─── Markdown Renderer ─────────────────────────────────────
export function renderMarkdown(content: string, toc: { id: string; text: string; level: number }[], imageLayout?: string, linkedArticles: readonly ArticleLinkMetadata[] = [], linkedSeries: readonly ArticleSeriesLinkMetadata[] = []) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  const articlesByPath = new Map<string, ArticleLinkMetadata | ArticleSeriesLinkMetadata>(linkedArticles.map(({ id, categoryId, title, summary, readTime, coverImage }) => [
    `/articles/${categoryId}/${genUid(id)}`,
    { id, categoryId, title, summary, readTime, coverImage },
  ]));
  for (const { id, title, summary, articleCount, coverImage } of linkedSeries) {
    articlesByPath.set(`/articles/series/${id}`, { kind: "series", id, title, summary, articleCount, coverImage });
  }
  const cardPattern = /^\[([^\]]+)\]\(([^)]+)\)\{card\}$/;
  let tocIdx = 0; let i = 0; let k = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // heading
    const hm = trimmed.match(/^(#{1,4})\s+(.+)/);
    if (hm) {
      const level = hm[1].length;
      const text = hm[2].replace(/\*\*/g, "");
      const id = toc[tocIdx]?.id ?? `h-${tocIdx}`; tocIdx++;
      const cls = {
        1: "text-2xl font-bold text-slate-900 dark:text-white mt-10 mb-4 scroll-mt-24",
        2: "text-xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-3 scroll-mt-24",
        3: "text-lg font-semibold text-slate-700 dark:text-slate-300 mt-6 mb-2 scroll-mt-24",
        4: "text-base font-semibold text-slate-600 dark:text-slate-400 mt-4 mb-2 scroll-mt-24",
      }[level] ?? "";
      const Tag = `h${level}` as "h1"|"h2"|"h3"|"h4";
      elements.push(<Tag key={k++} id={id} className={cls}>{text}</Tag>);
      i++; continue;
    }

    // hr
    if (trimmed === "---") {
      // Chapter headings already draw their separator; keep in-section rules.
      let next = i + 1;
      while (next < lines.length && !lines[next].trim()) next++;
      if (!/^#{1,2}\s+/.test(lines[next]?.trim() ?? "")) {
        elements.push(<hr key={k++} className="my-8 border-slate-100 dark:border-slate-800" />);
      }
      i++; continue;
    }

    // code block
    if (trimmed.startsWith("```")) {
      const block: string[] = []; i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) { block.push(lines[i]); i++; }
      elements.push(
        <pre key={k++} className="my-5 rounded-xl bg-slate-900 dark:bg-slate-950 p-5 overflow-x-auto border border-slate-800">
          <code className="text-[13px] font-mono text-slate-300 leading-7">{block.join("\n")}</code>
        </pre>
      );
      i++; continue;
    }

    // Cards are an explicit author choice on a standalone line, never an
    // automatic replacement for inline links, citations, or referral callouts.
    const articleLink = trimmed.match(cardPattern);
    if (articleLink) {
      const cards: React.ReactNode[] = [];
      let match: RegExpMatchArray | null = articleLink;
      while (match) {
        const [, label, rawHref] = match;
        let href: string | undefined;
        try {
          const url = new URL(rawHref, "https://www.wise-invest.org");
          if (url.origin === "https://www.wise-invest.org" && !url.username && !url.password) {
            href = `${url.pathname}${url.search}${url.hash}`;
          }
        } catch { /* Invalid or unavailable targets keep a visible text fallback. */ }
        const article = href ? articlesByPath.get(href.split(/[?#]/)[0]) : undefined;
        if (article && href) {
          cards.push(<ArticleLinkCard key={k++} article={article} href={href} />);
        } else {
          cards.push(<p key={k++} className="my-4 text-[16px] leading-8 text-slate-700 dark:text-slate-300">{renderInline(`[${label}](${rawHref})`)}</p>);
        }
        i++;
        let next = i;
        while (next < lines.length && !lines[next].trim()) next++;
        match = lines[next]?.trim().match(cardPattern) ?? null;
        if (match) i = next;
      }
      elements.push(cards.length > 1 ? <ArticleLinkCardGroup key={k++}>{cards}</ArticleLinkCardGroup> : cards[0]);
      continue;
    }

    // blockquote
    if (trimmed.startsWith("> ")) {
      const registration = parseRegistrationCallout(trimmed);
      if (registration) {
        elements.push(
          <ArticleRegistrationCard key={k++} {...registration} />
        );
        i++; continue;
      }
      elements.push(
        <blockquote key={k++} className="my-5 pl-5 border-l-4 border-amber-400 bg-amber-50/50 dark:bg-amber-900/10 py-3 pr-4 rounded-r-lg text-slate-600 dark:text-slate-400 italic">
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
      i++; continue;
    }

    // iframe
    if (trimmed.startsWith("<iframe")) {
      const srcMatch = trimmed.match(/src="([^"]+)"/);
      const heightMatch = trimmed.match(/height="([^"]+)"/);
      if (srcMatch) {
        const src = srcMatch[1];
        const height = heightMatch ? heightMatch[1] : "500";
        elements.push(
          <div key={k++} className="my-6 rounded-2xl overflow-hidden aspect-video">
            <iframe
              src={src}
              width="100%"
              height={height}
              className="w-full rounded-xl"
              frameBorder={0}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        );
        // 跳过多行 iframe 直到结束
        while (i < lines.length && !lines[i].includes("/>") && !lines[i].includes("</iframe>")) i++;
        i++; continue;
      }
    }

    // Keep grouped steps together; mobile readers swipe through readable cards.
    const allImgMatches = [...trimmed.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
    if (allImgMatches.length > 1) {
      elements.push(
        <div key={k++} data-article-image-gallery className="my-6 min-w-0 max-w-full">
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400 sm:hidden">左右滑动查看步骤图 · 点击图片可放大</p>
          <div
            data-article-image-strip
            role="region"
            aria-label={`步骤配图，共 ${allImgMatches.length} 张，可横向滑动`}
            tabIndex={0}
            className="flex w-full min-w-0 max-w-full items-start gap-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory pb-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 sm:overflow-visible sm:snap-none sm:pb-0"
          >
            {allImgMatches.map(([, alt, src], idx) => (
              <figure key={idx} className="m-0 min-w-0 shrink-0 basis-[85%] snap-start sm:flex-1">
                <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-2">
                  <ArticleImage key={src} src={src} alt={alt.replace(/^portrait:\s*/, "")} />
                </div>
                {alt && <figcaption className="mt-1 text-center text-xs text-slate-400 dark:text-slate-500">{alt.replace(/^portrait:\s*/, "")}</figcaption>}
              </figure>
            ))}
          </div>
        </div>
      );
      i++; continue;
    }

    // image (single)
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      const [, alt, src] = imgMatch;
      const isPortrait = imageLayout === "portrait" || alt.startsWith("portrait:");
      const caption = alt.replace(/^portrait:\s*/, "");
      // Explicit width keeps grid sizing independent of the folded image height.
      if (imageLayout === "guide") {
        elements.push(<figure key={k++} className="my-7 mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <ArticleImage key={src} src={src} alt={caption} guide />
          {caption && <figcaption className="border-t border-slate-100 px-4 py-3 text-center text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">{caption}</figcaption>}
        </figure>);
        i++; continue;
      }
      elements.push(
        <figure key={k++} className={isPortrait ? "my-6 mx-auto w-fit" : "my-6 w-full max-w-4xl mx-auto"}>
          <div className={isPortrait ? "rounded-2xl bg-slate-100 dark:bg-slate-800 p-2 w-[260px]" : "rounded-2xl bg-slate-100 dark:bg-slate-800 p-3"}>
            <ArticleImage key={src} src={src} alt={caption} />
          </div>
          {caption && <figcaption className={`mt-1.5 text-center text-xs text-slate-400 dark:text-slate-500${isPortrait ? " w-[260px]" : ""}`}>{caption}</figcaption>}
        </figure>
      );
      i++; continue;
    }

    // table
    if (trimmed.startsWith("|") && i + 1 < lines.length && lines[i+1].trim().match(/^\|[-| :]+\|$/)) {
      const headerCells = trimmed.split("|").filter(Boolean).map(c => c.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(lines[i].trim().split("|").filter(Boolean).map(c => c.trim())); i++;
      }
      const wideGuideTable = headerCells.length >= 3;
      elements.push(
        <div key={k++} className="my-5">
          {wideGuideTable ? <p className="mb-2 text-xs text-slate-500 dark:text-slate-400 sm:hidden">左右滑动查看完整表格</p> : null}
          <div role={wideGuideTable ? "region" : undefined} aria-label={wideGuideTable ? "可横向滑动的对比表" : undefined} tabIndex={wideGuideTable ? 0 : undefined} className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500">
          <table className={`w-full text-sm ${wideGuideTable ? "min-w-[640px]" : ""}`}>
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr>{headerCells.map((h,j) => <th key={j} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  {row.map((cell, ci) => <td key={ci} className="px-5 py-3 text-slate-700 dark:text-slate-300">{renderInline(cell)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      );
      continue;
    }

    // unordered list
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) { items.push(lines[i].trim().slice(2)); i++; }
      elements.push(
        <ul key={k++} className="my-4 space-y-2 pl-5">
          {items.map((it, j) => <li key={j} className="text-slate-700 dark:text-slate-300 text-[16px] leading-8 list-disc marker:text-amber-400">{renderInline(it)}</li>)}
        </ul>
      );
      continue;
    }

    // ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s/, "")); i++; }
      elements.push(
        <div key={k++} className="my-4 space-y-3">
          {items.map((it, j) => (
            <div key={j} className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-amber-400 text-white text-xs font-bold flex items-center justify-center mt-0.5">{j + 1}</span>
              <span className="text-slate-700 dark:text-slate-300 text-[16px] leading-8 flex-1">{renderInline(it)}</span>
            </div>
          ))}
        </div>
      );
      continue;
    }

    if (!trimmed) { elements.push(<div key={k++} data-markdown-spacer className="h-2" />); i++; continue; }

    elements.push(
      <p key={k++} className="my-3 text-[16px] text-slate-600 dark:text-slate-400 leading-8">{renderInline(trimmed)}</p>
    );
    i++;
  }
  return elements;
}
