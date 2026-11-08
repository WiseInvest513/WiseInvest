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
  const url = siteConfig.url(`/articles/series/${series.id}`);
  const imagePath = series.cover || series.cardArtwork || series.artwork || siteConfig.defaultOgImage;
  const imageUrl = imagePath.startsWith("http") ? imagePath : siteConfig.url(imagePath);
  const images = [{ url: imageUrl, alt: series.title }];
  return {
    title: `${series.title} - ${siteConfig.name}`,
    description: series.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: series.title,
      description: series.description,
      url,
      siteName: siteConfig.name,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: series.title,
      description: series.description,
      images: [imageUrl],
    },
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
