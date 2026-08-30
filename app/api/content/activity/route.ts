import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { resolveContentItem, type ContentItemType } from "@/lib/content-access";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";

export const runtime = "nodejs";

type ContentActivityPayload = {
  eventType?: "VIEW" | "PREVIEW_LOCKED" | "LOGIN_PROMPT" | "FAVORITE_ADD" | "FAVORITE_REMOVE";
  href?: string;
  title?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
};

function normalizePayload(body: ContentActivityPayload) {
  const href = typeof body.href === "string" && body.href.trim() ? body.href : "/";
  const item = resolveContentItem(href);
  const eventType = body.eventType ?? "VIEW";

  return {
    eventType,
    contentType: item.contentType as ContentItemType,
    contentKey: item.contentKey,
    href: item.href,
    title: typeof body.title === "string" ? body.title.slice(0, 180) : null,
    summary: typeof body.summary === "string" ? body.summary.slice(0, 500) : null,
    metadata: body.metadata ? (JSON.parse(JSON.stringify(body.metadata)) as Prisma.InputJsonValue) : undefined,
  };
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ContentActivityPayload;
  const payload = normalizePayload(body);
  const session = await auth();
  const userId = session?.user?.id;

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, preview: true });
  }

  const prisma = getPrisma();

  if (!userId && payload.eventType !== "PREVIEW_LOCKED" && payload.eventType !== "LOGIN_PROMPT") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  if (userId && payload.eventType === "VIEW") {
    await Promise.all([
      prisma.userContentItem.upsert({
        where: {
          userId_contentType_contentKey: {
            userId,
            contentType: payload.contentType,
            contentKey: payload.contentKey,
          },
        },
        create: {
          userId,
          contentType: payload.contentType,
          contentKey: payload.contentKey,
          href: payload.href,
          title: payload.title ?? payload.href,
          summary: payload.summary,
          viewCount: 1,
          lastViewedAt: new Date(),
        },
        update: {
          href: payload.href,
          title: payload.title ?? payload.href,
          summary: payload.summary,
          viewCount: { increment: 1 },
          lastViewedAt: new Date(),
        },
      }),
      prisma.contentEvent.create({
        data: {
          userId,
          eventType: "VIEW",
          contentType: payload.contentType,
          contentKey: payload.contentKey,
          href: payload.href,
          title: payload.title,
          metadata: payload.metadata,
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  }

  if (userId && (payload.eventType === "FAVORITE_ADD" || payload.eventType === "FAVORITE_REMOVE")) {
    const favoritedAt = payload.eventType === "FAVORITE_ADD" ? new Date() : null;
    await Promise.all([
      prisma.userContentItem.upsert({
        where: {
          userId_contentType_contentKey: {
            userId,
            contentType: payload.contentType,
            contentKey: payload.contentKey,
          },
        },
        create: {
          userId,
          contentType: payload.contentType,
          contentKey: payload.contentKey,
          href: payload.href,
          title: payload.title ?? payload.href,
          summary: payload.summary,
          favoritedAt,
        },
        update: {
          href: payload.href,
          title: payload.title ?? payload.href,
          summary: payload.summary,
          favoritedAt,
        },
      }),
      prisma.contentEvent.create({
        data: {
          userId,
          eventType: payload.eventType,
          contentType: payload.contentType,
          contentKey: payload.contentKey,
          href: payload.href,
          title: payload.title,
          metadata: payload.metadata,
        },
      }),
    ]);

    return NextResponse.json({ ok: true, favorited: Boolean(favoritedAt) });
  }

  await prisma.contentEvent.create({
    data: {
      userId: userId ?? null,
      eventType: payload.eventType,
      contentType: payload.contentType,
      contentKey: payload.contentKey,
      href: payload.href,
      title: payload.title,
      metadata: payload.metadata,
    },
  });

  return NextResponse.json({ ok: true });
}
