import { genUid } from "@/lib/article-uid";

type ReleaseArticle = { id: string; categoryId: string };

export type ArticleRelease = {
  endsAt: string;
  previewPercentage: number;
};

// Sunday 24:00 in Beijing, not the deployment server's local timezone.
const vip002Release: Readonly<ArticleRelease> = Object.freeze({
  endsAt: "2026-09-14T00:00:00+08:00",
  previewPercentage: 30,
});
const vip002Path = `/articles/VIP/${genUid("VIP002")}`;

export function getArticleRelease(article: ReleaseArticle): Readonly<ArticleRelease> | undefined {
  return article.id === "VIP002" && article.categoryId === "VIP" ? vip002Release : undefined;
}

export function getArticleReleaseForPath(pathname: string): Readonly<ArticleRelease> | undefined {
  return pathname === vip002Path ? vip002Release : undefined;
}

/** Evaluate on each request: the release is public strictly before its deadline. */
export function getArticleReleaseAccessRule(pathname: string, now = Date.now()) {
  const release = getArticleReleaseForPath(pathname);
  if (!release) return undefined;

  return now < Date.parse(release.endsAt)
    ? { access: "PUBLIC" as const, reason: "本周末限时公开阅读" }
    : { access: "VIP" as const, reason: "限时公开阅读已结束，完整文章仅限 Wise VIP 会员阅读" };
}
