import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { WISE_DEV_PREVIEW_COOKIE, isDevPreviewAdminCookieValue } from "@/lib/identity/dev-preview";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { checkAdminMutationLimit } from "@/lib/vip/api-guards";
import { refreshUserMembership } from "@/lib/vip/membership";

export const runtime = "nodejs";

const actionToStatus = {
  approve: "VERIFIED",
  reject: "REJECTED",
  needs_review: "NEEDS_REVIEW",
} as const;

const actionToAudit = {
  approve: "PARTNER_ACCOUNT_APPROVED",
  reject: "PARTNER_ACCOUNT_REJECTED",
  needs_review: "PARTNER_ACCOUNT_NEEDS_REVIEW",
} as const;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const isDevAdmin = isDevPreviewAdminCookieValue(request.cookies.get(WISE_DEV_PREVIEW_COOKIE)?.value);
  if ((!session?.user?.id || session.user.role !== "ADMIN") && !isDevAdmin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const adminUserId = session?.user?.id ?? "dev_admin_user";
  const limitedResponse = await checkAdminMutationLimit(request, adminUserId);
  if (limitedResponse) return limitedResponse;

  const [{ id }, body] = await Promise.all([
    context.params,
    request.json() as Promise<{ action?: keyof typeof actionToStatus; reviewNote?: string }>,
  ]);
  const reviewNote = body.reviewNote?.trim() || null;

  if (!body.action || !actionToStatus[body.action]) {
    return NextResponse.json({ ok: false, message: "Invalid review action." }, { status: 400 });
  }

  if ((body.action === "reject" || body.action === "needs_review") && !reviewNote) {
    return NextResponse.json(
      { ok: false, message: body.action === "reject" ? "拒绝审核时需要填写给用户看的驳回原因。" : "要求补充资料时需要填写具体补充内容。" },
      { status: 400 }
    );
  }

  if (isDevAdmin && !isDatabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      preview: true,
      partnerAccount: {
        id,
        userId: "dev_pending_user",
        status: actionToStatus[body.action],
      },
    });
  }

  const prisma = getPrisma();
  const reviewed = await prisma.$transaction(async (tx) => {
    const current = await tx.partnerAccount.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        partner: {
          select: {
            slug: true,
            name: true,
            vipEligible: true,
          },
        },
      },
    });

    if (!current) {
      throw new Error("Partner account not found.");
    }

    const updated = await tx.partnerAccount.update({
      where: { id },
      data: {
        status: actionToStatus[body.action!],
        reviewNote,
        verifiedAt: body.action === "approve" ? new Date() : null,
        verifiedById: adminUserId,
      },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: adminUserId,
        targetUserId: current.userId,
        action: actionToAudit[body.action!],
        metadata: {
          partnerAccountId: id,
          partnerSlug: current.partner.slug,
          partnerName: current.partner.name,
          reviewNote,
        },
      },
    });

    const nextTier = await refreshUserMembership(tx, current.userId);
    if (body.action === "approve" && nextTier === "VIP") {
      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          targetUserId: current.userId,
          action: "MEMBERSHIP_UPGRADED",
          metadata: {
            membershipTier: nextTier,
            partnerAccountId: id,
          },
        },
      });
    }

    return updated;
  });

  return NextResponse.json({ ok: true, partnerAccount: reviewed });
}
