import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { isWiseInvestHref, resolveContentItem } from "@/lib/content-access";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const href = new URL(request.url).searchParams.get("href");
  if (href !== null) {
    if (!href.trim() || href.startsWith("//") || !isWiseInvestHref(href)) {
      return NextResponse.json({ ok: false, message: "Invalid content link" }, { status: 400 });
    }
    const item = resolveContentItem(href);
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ ok: true, href: item.href, favorited: false, preview: true });
    }
    // Query the saved item directly; the account's eight-item preview is not a complete favorite index.
    const saved = await getPrisma().userContentItem.findUnique({
      where: {
        userId_contentType_contentKey: {
          userId: session.user.id,
          contentType: item.contentType,
          contentKey: item.contentKey,
        },
      },
      select: { favoritedAt: true },
    });
    return NextResponse.json({ ok: true, href: item.href, favorited: Boolean(saved?.favoritedAt) });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, favorites: [], recent: [], preview: true });
  }

  const prisma = getPrisma();
  const [favorites, recent] = await Promise.all([
    prisma.userContentItem.findMany({
      where: {
        userId: session.user.id,
        favoritedAt: { not: null },
      },
      orderBy: { favoritedAt: "desc" },
      take: 8,
      select: {
        id: true,
        href: true,
        title: true,
        summary: true,
        contentType: true,
        favoritedAt: true,
        lastViewedAt: true,
        viewCount: true,
      },
    }),
    prisma.userContentItem.findMany({
      where: {
        userId: session.user.id,
        lastViewedAt: { not: null },
      },
      orderBy: { lastViewedAt: "desc" },
      take: 8,
      select: {
        id: true,
        href: true,
        title: true,
        summary: true,
        contentType: true,
        favoritedAt: true,
        lastViewedAt: true,
        viewCount: true,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, favorites, recent });
}
