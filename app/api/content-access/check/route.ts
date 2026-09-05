import { NextResponse, type NextRequest } from "next/server";
import { getContentViewerTier } from "@/lib/identity/content-viewer";
import { buildLoginHref, canReadContentAccess, resolveContentItem } from "@/lib/content-access";
import { getResolvedContentAccessRule } from "@/lib/content-access-server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const href = request.nextUrl.searchParams.get("href") ?? "/";
  const item = resolveContentItem(href);
  const [membershipTier, rule] = await Promise.all([
    getContentViewerTier(),
    getResolvedContentAccessRule(href),
  ]);
  const allowed = canReadContentAccess(rule.access, membershipTier);

  return NextResponse.json({
    ok: true,
    allowed,
    access: rule.access,
    reason: rule.reason,
    loginHref: buildLoginHref(item.href),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
