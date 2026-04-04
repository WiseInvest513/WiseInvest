import { loadFsArticles } from "@/lib/articles-fs";
import { articles as hardcodedArticles } from "@/lib/articles-data";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { genUid } from "@/lib/article-uid";
import ArticlesPage from "@/app/articles/page";

function getAllArticles() {
  const fsArticles = loadFsArticles();
  const fsIds = new Set(fsArticles.map(a => a.id));
  return [...hardcodedArticles.filter(a => !fsIds.has(a.id)), ...fsArticles];
}

export async function generateStaticParams() {
  return getAllArticles().map(a => ({ categoryId: a.categoryId, uid: genUid(a.id) }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ categoryId: string; uid: string }> }
): Promise<Metadata> {
  const { categoryId, uid } = await params;
  const article = getAllArticles().find(a => a.categoryId === categoryId && genUid(a.id) === uid);
  if (!article) return {};
  return {
    title: `${article.title} - ${siteConfig.name}`,
    description: article.summary,
    openGraph: { title: article.title, description: article.summary },
    alternates: { canonical: `${siteConfig.baseUrl}/articles/${categoryId}/${uid}` },
  };
}

export default async function ArticleUidPage(
  { params }: { params: Promise<{ categoryId: string; uid: string }> }
) {
  const { categoryId, uid } = await params;
  const article = getAllArticles().find(a => a.categoryId === categoryId && genUid(a.id) === uid);
  if (!article) redirect("/articles");
  // Renders the full interactive articles page; it auto-selects the article from URL on mount
  return <ArticlesPage />;
}
