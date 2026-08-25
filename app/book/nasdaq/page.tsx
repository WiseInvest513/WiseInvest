import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Download, ExternalLink, FileText, Github, ListTree, ShieldCheck } from "lucide-react";
import { getNasdaqBook, type BookNavigationTarget } from "@/lib/book-loader";
import { siteConfig } from "@/lib/config";
import "./book.css";

export const revalidate = 86400;

const pageTitle = "纳指 / 标普投资蓝皮书";
const pageDescription =
  "WiseInvest 纳指 / 标普投资蓝皮书在线阅读版，系统理解纳斯达克 100、标普 500、ETF、定投、回撤和长期投资计划。";

export const metadata: Metadata = {
  title: `${pageTitle} - Wise Invest`,
  description: pageDescription,
  keywords: [
    "纳指投资蓝皮书",
    "标普500投资",
    "纳斯达克100",
    "QQQ",
    "指数基金",
    "ETF定投",
    "长期投资",
    "WiseInvest",
  ],
  alternates: {
    canonical: siteConfig.url("/book/nasdaq"),
  },
  openGraph: {
    title: `${pageTitle} - Wise Invest`,
    description: pageDescription,
    url: siteConfig.url("/book/nasdaq"),
    siteName: siteConfig.name,
    locale: "zh_CN",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} - Wise Invest`,
    description: pageDescription,
  },
};

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function getTargetsByPart(targets: BookNavigationTarget[]) {
  const front = targets.filter((target) => target.kind === "front");
  const chapters = targets.filter((target) => target.kind === "chapter" && target.part);
  const byPart = new Map<number, BookNavigationTarget[]>();

  chapters.forEach((target) => {
    if (!target.part) return;
    const current = byPart.get(target.part) ?? [];
    current.push(target);
    byPart.set(target.part, current);
  });

  return { front, byPart };
}

function BookUnavailable() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          <BookOpen className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-black text-slate-950 dark:text-white">书籍暂时无法加载</h1>
        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
          书籍正文托管在 WiseInvest 的公开书库。当前网络没有成功读取固定版本内容，稍后刷新即可重试。
        </p>
        <a
          href="https://github.com/WiseInvest513/book"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          打开书库
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </main>
  );
}

export default async function NasdaqBookPage() {
  let data;
  try {
    data = await getNasdaqBook();
  } catch (error) {
    console.error("Failed to load Nasdaq book", error);
    return <BookUnavailable />;
  }

  const { manifest, navigation, html } = data;
  const { front, byPart } = getTargetsByPart(navigation.targets);
  const bookJsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: manifest.title,
    alternateName: manifest.subtitle,
    author: {
      "@type": "Person",
      name: manifest.author,
    },
    publisher: {
      "@type": "Organization",
      name: "WiseInvest",
      url: siteConfig.baseUrl,
    },
    inLanguage: "zh-CN",
    datePublished: manifest.published_at,
    version: manifest.version,
    url: siteConfig.url("/book/nasdaq"),
    workExample: {
      "@type": "DigitalDocument",
      encodingFormat: "application/pdf",
      url: manifest.downloads.pdf.url,
    },
  };

  return (
    <main className="book-page min-h-screen bg-[#f3f7fb] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }}
      />

      <section className="border-b border-slate-200/80 bg-white/92 px-4 py-8 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/92 md:px-6">
        <div className="mx-auto grid max-w-[1480px] gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Link
              href="/"
              className="mb-5 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-500 transition-colors hover:border-amber-300 hover:text-amber-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-amber-700 dark:hover:text-amber-300"
            >
              Wise Invest Book
            </Link>
            <h1 className="max-w-4xl text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">
              {manifest.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
              {manifest.subtitle} 从认识指数、理解收益、面对回撤、选择产品，到写下一份真正能够长期执行的个人计划。
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950">
                {manifest.edition}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950">
                {manifest.stats.chapters} 章
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950">
                PDF {manifest.stats.pdf_pages} 页
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950">
                核验至 2026-08-25
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <a
              href={manifest.downloads.pdf.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
            >
              <Download className="h-4 w-4" />
              下载 PDF
              <span className="text-xs opacity-70">{formatBytes(manifest.downloads.pdf.bytes)}</span>
            </a>
            <a
              href={manifest.links.release}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition-colors hover:border-amber-300 hover:text-amber-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-amber-700 dark:hover:text-amber-300"
            >
              <Github className="h-4 w-4" />
              GitHub Release
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1480px] gap-5 px-4 py-6 md:px-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="book-toc-panel lg:sticky lg:top-20 lg:max-h-[calc(100vh-96px)] lg:overflow-y-auto">
          <div className="mb-4 flex items-center gap-2">
            <ListTree className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-black text-slate-950 dark:text-white">目录</h2>
          </div>

          <nav className="space-y-5" aria-label="纳指 / 标普投资蓝皮书目录">
            <div className="space-y-1.5">
              {front.map((target) => (
                <a key={target.id} href={`#${target.id}`} className="book-toc-link">
                  {target.label}
                </a>
              ))}
            </div>

            {navigation.parts.map((part) => {
              const chapters = byPart.get(part.number) ?? [];
              return (
                <div key={part.number}>
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase text-slate-400">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 font-mono text-[10px] text-amber-300 dark:bg-amber-400 dark:text-slate-950">
                      {String(part.number).padStart(2, "0")}
                    </span>
                    {part.title}
                  </div>
                  <div className="space-y-1.5">
                    {chapters.map((chapter) => (
                      <a key={chapter.id} href={`#${chapter.id}`} className="book-toc-link">
                        {chapter.label}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        <article className="book-reading-shell">
          <div className="mb-5 grid gap-3 rounded-xl border border-blue-100 bg-blue-50/80 p-4 text-sm leading-7 text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-100 md:grid-cols-[auto_1fr]">
            <ShieldCheck className="mt-1 h-5 w-5 text-blue-700 dark:text-blue-300" />
            <p>
              正文由 WiseInvest 公开书库固定版本加载，并在服务器侧缓存。PDF 下载走 GitHub Release，不进入主站仓库。
            </p>
          </div>

          <div
            className="book-document"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
              <FileText className="h-4 w-4 text-amber-600" />
              {manifest.title} · {manifest.edition}
            </div>
            <a
              href={manifest.downloads.pdf.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-black text-slate-950 transition-colors hover:bg-amber-400"
            >
              下载 PDF
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </article>
      </section>
    </main>
  );
}
