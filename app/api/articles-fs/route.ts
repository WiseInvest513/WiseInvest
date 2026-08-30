import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { loadFsArticles } from "@/lib/articles-fs";
import { getArticleRoute } from "@/lib/articles";
import { canReadContentAccess, createContentPreview, getContentAccessRule } from "@/lib/content-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const membershipTier = session?.user?.membershipTier;
  const articles = loadFsArticles();
  const visibleArticles = articles.map((article) => {
    const rule = getContentAccessRule(getArticleRoute(article));
    if (canReadContentAccess(rule.access, membershipTier)) return article;

    return {
      ...article,
      content: createContentPreview(article.content),
    };
  });

  return NextResponse.json(visibleArticles, {
    headers: { "Cache-Control": "no-store" },
  });
}
