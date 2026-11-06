import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Compass } from "lucide-react";
import { ProtectedContentLink } from "@/components/content-access-gate";
import type { ArticleListItem } from "@/lib/articles";
import type { ArticleSeries } from "@/lib/article-library";
import { getSeriesRecommendations } from "@/lib/series-recommendations";
import styles from "./series-reader.module.css";

export function SeriesRecommendations({ series, articles }: { series: ArticleSeries; articles: ArticleListItem[] }) {
  const related = getSeriesRecommendations(series, articles);
  if (!related.articles.length && !related.series.length) return null;
  return <aside className={styles.recommendations} aria-label="延伸阅读">
    {related.articles.length > 0 && <section className={styles.recommendationSection} aria-labelledby="series-recommendations-heading">
      <div className={styles.recommendationHeading}><h2 id="series-recommendations-heading"><BookOpen size={15} aria-hidden="true" />推荐阅读</h2></div>
      <p className={styles.recommendationHint}>沿着这个主题，再多了解一点。</p>
      <ul className={styles.recommendationList}>{related.articles.map(article => <li key={article.id}>
        <ProtectedContentLink href={article.href} prefetch={false} className={styles.recommendationLink}>
          <h3>{article.title}</h3>
          <p>{article.summary}</p>
          <span className={styles.recommendationMeta}><span>{article.readTime ? `${article.readTime} 分钟阅读` : "阅读全文"}</span><ArrowUpRight size={14} aria-hidden="true" /></span>
        </ProtectedContentLink>
      </li>)}</ul>
    </section>}
    {related.series.length > 0 && <section className={styles.recommendationSection} aria-labelledby="series-explore-heading">
      <div className={styles.recommendationHeading}><h2 id="series-explore-heading"><Compass size={15} aria-hidden="true" />你可能还想了解</h2></div>
      <p className={styles.recommendationHint}>选择下一条适合你的阅读路线。</p>
      <div className={styles.relatedSeriesList}>{related.series.map(item => <Link key={item.id} href={item.href} className={styles.relatedSeriesLink}>
        <Image src={item.artwork} width={32} height={32} alt="" />
        <span><strong>{item.title}</strong><small>{item.publishedCount} 篇文章<ArrowRight size={12} aria-hidden="true" className="ml-2 inline" /></small></span>
      </Link>)}</div>
      <Link href="/articles?view=series" className={styles.moreSeries}>浏览全部系列<ArrowRight size={13} aria-hidden="true" /></Link>
    </section>}
  </aside>;
}
