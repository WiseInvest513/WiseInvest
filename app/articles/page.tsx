import { ArticlesContent } from "./articles-content";
import { getAllArticles, toArticleListItem } from "@/lib/articles";

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const libraryView = view === "all" || view === "series" ? view : "recommended";
  return (
    <ArticlesContent
      key={libraryView}
      initialArticles={getAllArticles().map(toArticleListItem)}
      showAllArticles={view === "all"}
      showSeries={view === "series"}
    />
  );
}
