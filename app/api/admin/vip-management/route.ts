import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { WISE_DEV_PREVIEW_COOKIE, isDevPreviewAdminCookieValue } from "@/lib/identity/dev-preview";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { checkAdminMutationLimit } from "@/lib/vip/api-guards";
import { parseVipExchangeRecordPayload, type VipExchangeRecordPayload } from "@/lib/vip/vip-exchange-record";

export const runtime = "nodejs";

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
    const data = parseVipExchangeRecordPayload((await request.json()) as VipExchangeRecordPayload);

    if (isDevAdmin && !isDatabaseConfigured()) {
      return NextResponse.json({ ok: true, preview: true, record: { id: `dev_${Date.now()}`, ...data, source: "MANUAL" } });
    }

    const prisma = getPrisma();
    const duplicate = await prisma.vipExchangeRecord.findFirst({
      where: {
        platform: { equals: data.platform, mode: "insensitive" },
        uid: data.uid,
      },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json({ ok: false, message: "该平台与 UID 已存在，请直接编辑原记录。" }, { status: 409 });
    }

    const linkedUser = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.vipExchangeRecord.create({
        data: {
          ...data,
          userId: linkedUser?.id,
          source: "MANUAL",
        },
        select: { id: true },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          targetUserId: linkedUser?.id,
          action: "VIP_EXCHANGE_RECORD_CREATED",
          metadata: { recordId: created.id, platform: data.platform, uid: data.uid },
        },
      });

      return created;
    });

    return NextResponse.json({ ok: true, record });
  } catch (error) {
    const message = error instanceof Error ? error.message : "新增记录失败。";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
