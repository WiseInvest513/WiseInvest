import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { WISE_DEV_PREVIEW_COOKIE, isDevPreviewCookieValue } from "@/lib/identity/dev-preview";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { checkVipBindingSubmitLimit } from "@/lib/vip/api-guards";

export const runtime = "nodejs";

function cleanIdentifier(value: string) {
  return value.trim().replace(/\s+/g, "");
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const isDevPreview = isDevPreviewCookieValue(request.cookies.get(WISE_DEV_PREVIEW_COOKIE)?.value);
  const userId = session?.user?.id ?? (isDevPreview ? "dev_mock_user" : null);

  if (!userId) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const limitedResponse = await checkVipBindingSubmitLimit(request, userId);
  if (limitedResponse) return limitedResponse;

  const body = (await request.json()) as {
    partnerSlug?: string;
    externalIdentifier?: string;
    userNote?: string;
  };

  const partnerSlug = body.partnerSlug?.trim();
  const externalIdentifier = cleanIdentifier(body.externalIdentifier ?? "");
  const userNote = body.userNote?.trim() || null;

  if (!partnerSlug || !externalIdentifier) {
    return NextResponse.json(
      { ok: false, message: "请选择合作方并填写 UID / 账户标识。" },
      { status: 400 }
    );
  }

  if (externalIdentifier.length < 3 || externalIdentifier.length > 80) {
    return NextResponse.json(
      { ok: false, message: "UID / 账户标识长度需要在 3 到 80 个字符之间。" },
      { status: 400 }
    );
  }

  if (isDevPreview && !isDatabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      partnerAccount: {
        id: "dev_binding_submitted",
        status: "PENDING",
      },
      preview: true,
    });
  }

  const prisma = getPrisma();
  const partner = await prisma.partner.findUnique({
    where: { slug: partnerSlug },
    select: {
      id: true,
      enabled: true,
      vipEligible: true,
    },
  });

  if (!partner?.enabled || !partner.vipEligible) {
    return NextResponse.json(
      { ok: false, message: "该合作方当前不可提交 VIP 核验。" },
      { status: 400 }
    );
  }

  const existing = await prisma.partnerAccount.findUnique({
    where: {
      userId_partnerId_externalIdentifier: {
        userId,
        partnerId: partner.id,
        externalIdentifier,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (existing) {
    return NextResponse.json(
      { ok: false, message: `这条绑定已经提交过，当前状态：${existing.status}` },
      { status: 409 }
    );
  }

  const partnerAccount = await prisma.partnerAccount.create({
    data: {
      userId,
      partnerId: partner.id,
      externalIdentifier,
      userNote,
      status: "PENDING",
    },
    select: {
      id: true,
      status: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: userId,
      targetUserId: userId,
      action: "PARTNER_ACCOUNT_SUBMITTED",
      metadata: {
        partnerSlug,
        partnerAccountId: partnerAccount.id,
      },
    },
  });

  return NextResponse.json({ ok: true, partnerAccount });
}
