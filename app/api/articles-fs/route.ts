import { NextResponse } from "next/server";
import { getContentViewerTier } from "@/lib/identity/content-viewer";
import { loadFsArticles } from "@/lib/articles-fs";
import { getArticleRoute } from "@/lib/articles";
import { canReadContentAccess } from "@/lib/content-access";
import { createArticlePreview } from "@/lib/article-preview";
import { getResolvedContentAccessRules } from "@/lib/content-access-server";
import { getArticleReleaseAccessRule } from "@/lib/article-release";

export const dynamic = "force-dynamic";

export async function GET() {
  const articles = loadFsArticles();
  const [membershipTier, rules] = await Promise.all([
    getContentViewerTier(),
    getResolvedContentAccessRules(articles.map(getArticleRoute)),
  ]);
  const now = Date.now();
  const visibleArticles = articles.map((article) => {
    const route = getArticleRoute(article);
    const rule = getArticleReleaseAccessRule(route, now) ?? rules.get(route)!;
    if (canReadContentAccess(rule.access, membershipTier)) return article;

    return {
      ...article,
      content: createArticlePreview(article),
    };
  });

  return NextResponse.json(visibleArticles, {
    headers: { "Cache-Control": "no-store" },
  });
}
