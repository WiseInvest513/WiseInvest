import { ArticlesContent } from "./articles-content";
import { getAllArticles, toArticleListItem } from "@/lib/articles";

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  return <ArticlesContent key={view === "all" ? "all" : "recommended"} initialArticles={getAllArticles().map(toArticleListItem)} showAllArticles={view === "all"} />;
}
