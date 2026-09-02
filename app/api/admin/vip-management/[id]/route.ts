import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { WISE_DEV_PREVIEW_COOKIE, isDevPreviewAdminCookieValue } from "@/lib/identity/dev-preview";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { checkAdminMutationLimit } from "@/lib/vip/api-guards";
import { parseVipExchangeRecordPayload, type VipExchangeRecordPayload } from "@/lib/vip/vip-exchange-record";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

async function authorize(request: NextRequest) {
  const session = await auth();
  const isDevAdmin = isDevPreviewAdminCookieValue(request.cookies.get(WISE_DEV_PREVIEW_COOKIE)?.value);
  if ((!session?.user?.id || session.user.role !== "ADMIN") && !isDevAdmin) return null;
  return { adminUserId: session?.user?.id ?? "dev_admin_user", isDevAdmin };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authorization = await authorize(request);
  if (!authorization) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const limitedResponse = await checkAdminMutationLimit(request, authorization.adminUserId);
  if (limitedResponse) return limitedResponse;

  try {
    const [{ id }, data] = await Promise.all([
      context.params,
      request.json().then((body) => parseVipExchangeRecordPayload(body as VipExchangeRecordPayload)),
    ]);

    if (authorization.isDevAdmin && !isDatabaseConfigured()) {
      return NextResponse.json({ ok: true, preview: true, record: { id, ...data } });
    }

    const prisma = getPrisma();
    const duplicate = await prisma.vipExchangeRecord.findFirst({
      where: {
        id: { not: id },
        platform: { equals: data.platform, mode: "insensitive" },
        uid: data.uid,
      },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json({ ok: false, message: "该平台与 UID 已存在，请检查后再保存。" }, { status: 409 });
    }

    const [current, linkedUser] = await Promise.all([
      prisma.vipExchangeRecord.findUnique({ where: { id }, select: { userId: true } }),
      prisma.user.findUnique({ where: { email: data.email }, select: { id: true } }),
    ]);
    if (!current) return NextResponse.json({ ok: false, message: "记录不存在。" }, { status: 404 });

    await prisma.$transaction([
      prisma.vipExchangeRecord.update({
        where: { id },
        data: { ...data, userId: linkedUser?.id },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: authorization.adminUserId,
          targetUserId: linkedUser?.id ?? current.userId,
          action: "VIP_EXCHANGE_RECORD_UPDATED",
          metadata: { recordId: id, platform: data.platform, uid: data.uid },
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存记录失败。";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authorization = await authorize(request);
  if (!authorization) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const limitedResponse = await checkAdminMutationLimit(request, authorization.adminUserId);
  if (limitedResponse) return limitedResponse;

  const { id } = await context.params;
  if (authorization.isDevAdmin && !isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, preview: true });
  }

  try {
    const prisma = getPrisma();
    const current = await prisma.vipExchangeRecord.findUnique({
      where: { id },
      select: { userId: true, platform: true, uid: true },
    });
    if (!current) return NextResponse.json({ ok: false, message: "记录不存在。" }, { status: 404 });

    await prisma.$transaction([
      prisma.vipExchangeRecord.delete({ where: { id } }),
      prisma.auditLog.create({
        data: {
          actorUserId: authorization.adminUserId,
          targetUserId: current.userId,
          action: "VIP_EXCHANGE_RECORD_DELETED",
          metadata: { recordId: id, platform: current.platform, uid: current.uid },
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: "删除记录失败。" }, { status: 400 });
  }
}
