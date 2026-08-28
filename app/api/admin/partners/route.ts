import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { WISE_DEV_PREVIEW_COOKIE, isDevPreviewAdminCookieValue } from "@/lib/identity/dev-preview";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { checkAdminMutationLimit } from "@/lib/vip/api-guards";
import { parsePartnerPayload, type PartnerPayload } from "@/lib/vip/partner-payload";

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
    const body = (await request.json()) as PartnerPayload;
    const data = parsePartnerPayload(body);

    if (isDevAdmin && !isDatabaseConfigured()) {
      return NextResponse.json({
        ok: true,
        preview: true,
        partner: {
          id: `dev_partner_${data.slug}`,
          slug: data.slug,
          name: data.name,
        },
      });
    }

    const prisma = getPrisma();

    const partner = await prisma.partner.create({
      data,
      select: {
        id: true,
        slug: true,
        name: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: adminUserId,
        action: "PARTNER_CREATED",
        metadata: {
          partnerId: partner.id,
          slug: partner.slug,
          name: partner.name,
        },
      },
    });

    return NextResponse.json({ ok: true, partner });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create partner.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
