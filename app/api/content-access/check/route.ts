import { NextResponse, type NextRequest } from "next/server";
import { getContentViewerTier } from "@/lib/identity/content-viewer";
import { buildLoginHref, canReadContentAccess, resolveContentItem, isPublicArticleHref } from "@/lib/content-access";
import { requiresReadingRegistration } from "@/lib/article-reading-meter-server";
import { getResolvedContentAccessRule } from "@/lib/content-access-server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const href = request.nextUrl.searchParams.get("href") ?? "/";
  const item = resolveContentItem(href);
  if (isPublicArticleHref(href) && !href.includes("/articles/series/") && await requiresReadingRegistration()) {
    return NextResponse.json({ ok: true, allowed: false, access: "MEMBER", reason: "最近 30 天已阅读 15 篇文章，免费注册后继续阅读全文", loginHref: buildLoginHref(item.href) }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const rule = await getResolvedContentAccessRule(href);
  const membershipTier = rule.access === "PUBLIC" ? null : await getContentViewerTier();
  const allowed = canReadContentAccess(rule.access, membershipTier);

  return NextResponse.json({
    ok: true,
    allowed,
    access: rule.access,
    reason: rule.reason,
    loginHref: buildLoginHref(item.href),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
