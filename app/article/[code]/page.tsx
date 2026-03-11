"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";

type TocItem = { id: string; text: string; level: number };

function useActiveHeading(headers: TocItem[]) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headers.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0;
        let mostVisibleId = "";
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            mostVisibleId = entry.target.id;
          }
        });
        if (mostVisibleId) setActiveId(mostVisibleId);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: [0, 0.25, 0.5, 0.75, 1.0] }
    );

    headers.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    if (headers[0] && !activeId) setActiveId(headers[0].id);

    return () => observer.disconnect();
  }, [headers]);

  return activeId;
}

export default function ArticlePage() {
  const params = useParams();
  const code = params.code as string;
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const activeId = useActiveHeading(toc);

  useEffect(() => {
    if (!code || code.length !== 4) {
      setError("无效的文章码");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const codeRes = await fetch(`/api/article/${code}`);
        const codeData = await codeRes.json();
        if (!codeRes.ok || !codeData.documentId) {
          setError(codeData.error || "文章不存在或已失效");
          setLoading(false);
          return;
        }
        const docId = codeData.documentId;
        setDocumentId(docId);

        const res = await fetch(`/api/feishu/docs/${encodeURIComponent(docId)}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "加载失败");
          setLoading(false);
          return;
        }

        setTitle(data.title ?? "文章");
        // API 已返回 linkify 后的 html
        setHtml(data.html ?? "");
      } catch (e) {
        setError("加载失败");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [code]);

  useEffect(() => {
    if (!html || !contentRef.current) return;
    const el = contentRef.current;
    const headings = el.querySelectorAll("h1, h2, h3");
    const items: TocItem[] = [];
    headings.forEach((h) => {
      const id = h.id || undefined;
      const text = h.textContent?.trim() || "";
      const level = parseInt(h.tagName[1], 10);
      if (id && text) items.push({ id, text, level });
    });
    setToc(items);
  }, [html]);

  const handleContentClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const img = target.closest(".doc-image") as HTMLImageElement | null;
    if (img?.src) {
      e.preventDefault();
      window.open(img.src, "_blank");
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (error || !html) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-yellow-600 dark:text-yellow-500 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* 文章主体 - 占满左侧 */}
        <main className="flex-1 min-w-0">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 leading-tight">
                  {title}
                </h1>
              </div>
              <div
                ref={contentRef}
                className="doc-content prose prose-slate dark:prose-invert prose-yellow max-w-none prose-headings:font-nunito prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-img:rounded-lg [&_.doc-heading]:scroll-mt-24 [&_.doc-image]:cursor-pointer [&_.doc-link]:text-blue-600 [&_.doc-link]:hover:text-blue-700 [&_.doc-link]:underline [&_.doc-link]:underline-offset-2 dark:[&_.doc-link]:text-blue-400 dark:[&_.doc-link]:hover:text-blue-300"
                dangerouslySetInnerHTML={{ __html: html }}
                onClick={handleContentClick}
              />
            </div>
          </div>
        </main>

        {/* 右侧本页目录 */}
        {toc.length > 0 && (
          <aside className="w-full lg:w-48 shrink-0">
            <nav className="sticky top-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 p-4">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                本页目录
              </h3>
              <ul className="flex flex-col gap-0.5 text-sm max-h-[calc(100vh-220px)] overflow-y-auto">
                {toc.map((item) => {
                  const displayText = item.text.length > 14 ? item.text.slice(0, 14) + "…" : item.text;
                  const isActive = activeId === item.id;
                  return (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={`block py-1.5 transition-colors truncate ${
                          item.level === 1 ? "font-medium pl-0" : item.level === 2 ? "pl-3" : "pl-5"
                        } ${
                          isActive
                            ? "text-blue-600 dark:text-blue-400 font-medium"
                            : "text-slate-600 dark:text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-400"
                        }`}
                        title={item.text}
                      >
                        {displayText}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>
        )}
      </div>
    </div>
  );
}
