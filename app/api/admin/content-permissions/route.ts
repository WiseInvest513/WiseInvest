import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getContentCatalogItems } from "@/lib/content-catalog";
import type { ContentAccessLevel, ContentItemType } from "@/lib/content-access";
import { WISE_DEV_PREVIEW_COOKIE, isDevPreviewAdminCookieValue } from "@/lib/identity/dev-preview";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { checkAdminMutationLimit } from "@/lib/vip/api-guards";

export const runtime = "nodejs";

const validTypes = new Set<ContentItemType>(["ARTICLE", "ROADMAP_DETAIL", "ROADMAP_ROUTE"]);
const validAccess = new Set<ContentAccessLevel>(["PUBLIC", "MEMBER", "VIP", "VIP_PLUS"]);

type ContentPermissionPayload = {
  contentType?: ContentItemType;
  contentKey?: string;
  title?: string;
  access?: ContentAccessLevel;
  reason?: string;
};

function parsePayload(body: ContentPermissionPayload) {
  if (!body.contentType || !validTypes.has(body.contentType)) {
    throw new Error("内容类型无效");
  }
  if (!body.contentKey || typeof body.contentKey !== "string") {
    throw new Error("内容路径无效");
  }
  if (!body.title || typeof body.title !== "string") {
    throw new Error("内容标题无效");
  }
  if (!body.access || !validAccess.has(body.access)) {
    throw new Error("权限等级无效");
  }
  if (!body.reason || typeof body.reason !== "string") {
    throw new Error("请输入登录墙提示原因");
  }

  const exists = getContentCatalogItems().some(
    (item) => item.contentType === body.contentType && item.contentKey === body.contentKey
  );
  if (!exists) throw new Error("内容不在当前站点目录中");

  return {
    contentType: body.contentType,
    contentKey: body.contentKey,
    title: body.title.slice(0, 180),
    access: body.access,
    reason: body.reason.slice(0, 500),
  };
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const isDevAdmin = isDevPreviewAdminCookieValue(request.cookies.get(WISE_DEV_PREVIEW_COOKIE)?.value);
  if ((!session?.user?.id || session.user.role !== "ADMIN") && !isDevAdmin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const adminUserId = session?.user?.id ?? "dev_admin_user";
  const limitedResponse = await checkAdminMutationLimit(request, adminUserId);
  if (limitedResponse) return limitedResponse;

  try {
    const payload = parsePayload((await request.json()) as ContentPermissionPayload);

    if (isDevAdmin && !isDatabaseConfigured()) {
      return NextResponse.json({ ok: true, preview: true, permission: payload });
    }

    const prisma = getPrisma();
    const permission = await prisma.contentPermission.upsert({
      where: {
        contentType_contentKey: {
          contentType: payload.contentType,
          contentKey: payload.contentKey,
        },
      },
      create: {
        ...payload,
        updatedById: adminUserId,
      },
      update: {
        title: payload.title,
        access: payload.access,
        reason: payload.reason,
        updatedById: adminUserId,
      },
      select: {
        id: true,
        contentType: true,
        contentKey: true,
        access: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: adminUserId,
        action: "CONTENT_PERMISSION_UPDATED",
        metadata: permission,
      },
    });

    return NextResponse.json({ ok: true, permission });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存内容权限失败";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
