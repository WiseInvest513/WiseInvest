import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { articleSeries } from "@/lib/article-library";
import { getMapArticleSeries, getSeriesOverviewHref, getSeriesReadingState, type SeriesArticle } from "@/lib/article-series";

const articleLinkClass = "group flex min-h-10 items-center gap-2 rounded-md px-2 py-2 text-xs leading-5 text-slate-700 transition-colors hover:bg-amber-50 hover:text-amber-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 dark:text-slate-200 dark:hover:bg-slate-800";

export function RoadmapLearning({ routeId, articles, relatedArticles }: {
  routeId: string;
  articles: SeriesArticle[];
  relatedArticles: { title: string; href: string }[];
}) {
  const series = getMapArticleSeries(routeId);
  if (routeId === "overview") return (
    <nav aria-label="按目标学习" className="mt-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white"><BookOpen size={16} className="text-amber-600" aria-hidden="true" />按目标学习</h2>
      <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
        {articleSeries.filter(item => item.kind === "path").map(item => {
          const count = getSeriesReadingState(item, articles).publishedCount;
          return <Link key={item.id} href={getSeriesOverviewHref(item.id)} className="group flex items-center gap-2 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">
            <Image src={item.artwork} width={44} height={44} alt="" className="h-11 w-11 shrink-0 object-contain" />
            <span className="min-w-0 flex-1"><span className="block text-[13px] font-bold leading-5 text-slate-900 group-hover:text-amber-700 dark:text-slate-100">{item.title}</span><span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">{item.stages?.length} 个阶段 · {count} 篇文章</span></span>
            <ArrowRight size={14} className="shrink-0 text-slate-400 group-hover:text-amber-700" aria-hidden="true" />
          </Link>;
        })}
      </div>
      <Link href="/articles?view=series" className="mt-3 flex min-h-10 items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-300">全部系列与专题<ArrowRight size={14} aria-hidden="true" /></Link>
    </nav>
  );

  if (!series) return relatedArticles.length > 0 ? <nav aria-label="路线相关文章" className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800"><h3 className="mb-2 text-sm font-bold text-slate-950 dark:text-white">已有相关文章</h3>{relatedArticles.map(article => <Link key={article.href} href={article.href} className={articleLinkClass}><BookOpen size={14} className="shrink-0" aria-hidden="true" /><span className="min-w-0 flex-1">{article.title}</span><ArrowUpRight size={13} className="shrink-0" aria-hidden="true" /></Link>)}</nav> : null;

  const reading = getSeriesReadingState(series, articles, undefined, routeId);
  return <nav aria-label="路线配套教程" className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
    <h3 className="flex items-center justify-between text-sm font-bold text-slate-950 dark:text-white">配套教程<span className="text-[11px] font-normal text-slate-500">{reading.publishedCount} 篇文章</span></h3>
    <Link href={reading.overviewHref} className="my-3 flex items-center gap-2 text-xs font-semibold leading-5 text-amber-700 dark:text-amber-300"><span className="min-w-0 flex-1">{series.title}</span><ArrowUpRight size={15} className="shrink-0" aria-hidden="true" /></Link>
    {reading.stages.map((stage, index) => <div key={stage.id} className="mt-4">
      <h4 className="mb-1 flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400"><span className="font-mono text-amber-700 dark:text-amber-300">{String(index + 1).padStart(2, "0")}</span>{stage.title}</h4>
      {stage.chapters.filter(chapter => chapter.href).map(chapter => <Link key={chapter.articleId} href={chapter.href!} className={articleLinkClass}><BookOpen size={14} className="shrink-0 text-slate-400" aria-hidden="true" /><span className="min-w-0 flex-1">{chapter.title}</span><ArrowRight size={13} className="shrink-0 text-slate-400" aria-hidden="true" /></Link>)}
    </div>)}
  </nav>;
}
