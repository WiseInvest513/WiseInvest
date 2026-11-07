import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlesContent } from "../../articles-content";
import { getAllArticles, toArticleListItem } from "@/lib/articles";
import { getArticleSeries } from "@/lib/article-series";
import { siteConfig } from "@/lib/config";

type SeriesPageProps = { params: Promise<{ seriesId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

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
  const query = (await searchParams) ?? {};
  return <ArticlesContent key={`${series.id}:${query.stage ?? ""}:${query.fromSeries ?? ""}:${query.fromStage ?? ""}`} initialArticles={articles} initialSeriesId={series.id} initialSeriesContext={{ fromSeries: query.fromSeries, fromStage: query.fromStage, fromRoute: query.fromRoute, stage: query.stage }} initialMapRouteId={typeof query?.route === "string" ? query.route : undefined} />;
}
