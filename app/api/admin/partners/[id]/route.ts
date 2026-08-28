import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { WISE_DEV_PREVIEW_COOKIE, isDevPreviewAdminCookieValue } from "@/lib/identity/dev-preview";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { checkAdminMutationLimit } from "@/lib/vip/api-guards";
import { parsePartnerPayload, type PartnerPayload } from "@/lib/vip/partner-payload";

export const runtime = "nodejs";

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

  try {
    const [{ id }, body] = await Promise.all([
      context.params,
      request.json() as Promise<PartnerPayload>,
    ]);
    const data = parsePartnerPayload(body);

    if (isDevAdmin && !isDatabaseConfigured()) {
      return NextResponse.json({
        ok: true,
        preview: true,
        partner: {
          id,
          slug: data.slug,
          name: data.name,
        },
      });
    }

    const prisma = getPrisma();

    const partner = await prisma.partner.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        referralUrl: data.referralUrl,
        referralCode: data.referralCode,
        vipEligible: data.vipEligible,
        vipPlusEligible: data.vipPlusEligible,
        vipPlusVolumeThreshold: data.vipPlusVolumeThreshold,
        verificationMode: data.verificationMode,
        enabled: data.enabled,
      },
      select: {
        id: true,
        slug: true,
        name: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: adminUserId,
        action: "PARTNER_UPDATED",
        metadata: {
          partnerId: partner.id,
          slug: partner.slug,
          name: partner.name,
        },
      },
    });

    return NextResponse.json({ ok: true, partner });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update partner.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
