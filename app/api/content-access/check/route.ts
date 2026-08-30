import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { buildLoginHref, canReadContentAccess, resolveContentItem } from "@/lib/content-access";
import { getResolvedContentAccessRule } from "@/lib/content-access-server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const href = request.nextUrl.searchParams.get("href") ?? "/";
  const item = resolveContentItem(href);
  const [session, rule] = await Promise.all([
    auth(),
    getResolvedContentAccessRule(href),
  ]);
  const allowed = canReadContentAccess(rule.access, session?.user?.membershipTier);

  return NextResponse.json({
    ok: true,
    allowed,
    access: rule.access,
    reason: rule.reason,
    loginHref: buildLoginHref(item.href),
  });
}
