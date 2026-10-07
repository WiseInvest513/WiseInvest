import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { isAdminAssistantRole, isAdminStaffRole } from "@/lib/auth/admin-roles";
import { WISE_DEV_PREVIEW_COOKIE, isDevPreviewAdminCookieValue } from "@/lib/identity/dev-preview";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { checkAdminMutationLimit } from "@/lib/vip/api-guards";
import { setUserMembership } from "@/lib/vip/membership";

export const runtime = "nodejs";

const membershipOrder = {
  MEMBER: 0,
  VIP: 1,
  VIP_PLUS: 2,
} as const;

type MembershipTier = keyof typeof membershipOrder;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isMembershipTier(value: string): value is MembershipTier {
  return value in membershipOrder;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const isDevAdmin = isDevPreviewAdminCookieValue(request.cookies.get(WISE_DEV_PREVIEW_COOKIE)?.value);
  if ((!session?.user?.id || !isAdminStaffRole(session.user.role)) && !isDevAdmin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  const isAssistant = isAdminAssistantRole(session?.user?.role);

  const adminUserId = session?.user?.id ?? "dev_admin_user";
  const limitedResponse = await checkAdminMutationLimit(request, adminUserId);
  if (limitedResponse) return limitedResponse;

  const [{ id }, body] = await Promise.all([
    context.params,
    request.json() as Promise<{ membershipTier?: string; note?: string }>,
  ]);
  const membershipTier = body.membershipTier;

  if (!membershipTier || !isMembershipTier(membershipTier)) {
    return NextResponse.json({ ok: false, message: "Invalid membership tier." }, { status: 400 });
  }

  if (isAssistant && membershipTier !== "VIP") {
    return NextResponse.json({ ok: false, message: "管理员助理只能把用户升级为 Wise VIP。" }, { status: 403 });
  }

  if (isDevAdmin && !isDatabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      preview: true,
      user: {
        id,
        membershipTier,
      },
    });
  }

  const prisma = getPrisma();
  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.user.findUnique({
      where: { id },
      select: {
        id: true,
        membershipTier: true,
      },
    });

    if (!current) {
      throw new Error("User not found.");
    }

    if (isAssistant && current.membershipTier === "VIP_PLUS") {
      throw new Error("管理员助理不能调整 Wise SVIP 用户。");
    }

    await setUserMembership(tx, id, membershipTier);

    if (current.membershipTier !== membershipTier) {
      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          targetUserId: id,
          action:
            membershipOrder[membershipTier] > membershipOrder[current.membershipTier]
              ? "MEMBERSHIP_UPGRADED"
              : "MEMBERSHIP_DOWNGRADED",
          metadata: {
            from: current.membershipTier,
            to: membershipTier,
            note: body.note?.trim() || null,
            method: "admin_manual",
          },
        },
      });
    }

    return tx.user.findUnique({
      where: { id },
      select: {
        id: true,
        membershipTier: true,
      },
    });
  });

  return NextResponse.json({ ok: true, user: updated });
}
