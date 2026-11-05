import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlesContent } from "../../articles-content";
import { getAllArticles, toArticleListItem } from "@/lib/articles";
import { getArticleSeries } from "@/lib/article-series";
import { siteConfig } from "@/lib/config";

type SeriesPageProps = { params: Promise<{ seriesId: string }>; searchParams: Promise<{ route?: string | string[] }> };

export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
  const { seriesId } = await params;
  const series = getArticleSeries(seriesId);
  if (!series) return {};
  return {
    title: `${series.title} - ${siteConfig.name}`,
    description: series.description,
    alternates: { canonical: siteConfig.url(`/articles/series/${series.id}`) },
  };
}

export default async function SeriesPage({ params, searchParams }: SeriesPageProps) {
  const { seriesId } = await params;
  const series = getArticleSeries(seriesId);
  if (!series) notFound();
  const articles = getAllArticles().map(toArticleListItem);
  const query = await searchParams;
  return <ArticlesContent key={series.id} initialArticles={articles} initialSeriesId={series.id} initialMapRouteId={typeof query?.route === "string" ? query.route : undefined} />;
}
