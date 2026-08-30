import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
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
