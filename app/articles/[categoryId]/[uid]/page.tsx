import { loadFsArticles } from "@/lib/articles-fs";
import { articles as hardcodedArticles } from "@/lib/articles-data";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { genUid } from "@/lib/article-uid";
import ArticlesPage from "@/app/articles/page";

// 所有文章均在构建时静态生成，不存在的路径返回 404
// Serverless Function 运行时不再读取文件系统
export const dynamicParams = false;

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

// dynamicParams=false 保证此组件只在构建时被调用（SSG）
// 运行时所有已知路径均从 CDN 直接返回静态 HTML，未知路径返回 404
export default function ArticleUidPage() {
  return <ArticlesPage />;
}
