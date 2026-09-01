import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { WISE_DEV_PREVIEW_COOKIE, getDevPreviewRole, getDevPreviewTier } from "@/lib/identity/dev-preview";

function createDevPreviewUser(membershipTier: "MEMBER" | "VIP" | "VIP_PLUS") {
  const now = new Date();
  const isMember = membershipTier === "MEMBER";
  const isVipPlus = membershipTier === "VIP_PLUS";

  return {
    id: "dev_mock_user",
    wiseUserId: "YDEVPREVIEW",
    email: "preview@wise-invest.local",
    emailVerified: now,
    image: null,
    wechatId: membershipTier === "MEMBER" ? null : "WisePreview520",
    name: "Wise 本地预览用户",
    membershipTier,
    role: "USER" as const,
    accounts: [
      {
        provider: "password",
      },
    ],
    partnerAccounts: isMember
      ? [
          {
            id: "dev_binding_pending",
            externalIdentifier: "UID-22334455",
            status: "PENDING" as const,
            reviewNote: null,
            submittedAt: now,
            verifiedAt: null,
            partner: {
              slug: "binance",
              name: "Binance 币安",
              type: "EXCHANGE" as const,
            },
          },
          {
            id: "dev_binding_needs_review",
            externalIdentifier: "OKX-66778899",
            status: "NEEDS_REVIEW" as const,
            reviewNote: "请补充注册时间或 Wise 邀请渠道说明。",
            submittedAt: now,
            verifiedAt: null,
            partner: {
              slug: "okx",
              name: "OKX 欧易",
              type: "EXCHANGE" as const,
            },
          },
          {
            id: "dev_binding_rejected",
            externalIdentifier: "GALAXY-2026",
            status: "REJECTED" as const,
            reviewNote: "未找到对应 Wise Referral 关系。",
            submittedAt: now,
            verifiedAt: null,
            partner: {
              slug: "galaxy-securities",
              name: "银河证券 A 股打新",
              type: "BROKERAGE" as const,
            },
          },
        ]
      : [
          {
            id: "dev_binding_binance",
            externalIdentifier: "UID-123456789",
            status: "VERIFIED" as const,
            reviewNote: "本地预览：已审核通过，用于查看 Wise VIP 状态。",
            submittedAt: now,
            verifiedAt: now,
            partner: {
              slug: "binance",
              name: "Binance 币安",
              type: "EXCHANGE" as const,
            },
          },
          {
            id: "dev_binding_bitget",
            externalIdentifier: "BITGET-WiseInvest",
            status: "PENDING" as const,
            reviewNote: null,
            submittedAt: now,
            verifiedAt: null,
            partner: {
              slug: "bitget",
              name: "Bitget",
              type: "EXCHANGE" as const,
            },
          },
        ],
    entitlements: isMember
      ? []
      : [
          {
            id: "dev_entitlement_vip_group",
            key: "vip_group",
            startsAt: now,
            expiresAt: null,
          },
          ...(isVipPlus
            ? [
                {
                  id: "dev_entitlement_vip_plus",
                  key: "vip_plus",
                  startsAt: now,
                  expiresAt: null,
                },
              ]
            : []),
        ],
  };
}

export async function getCurrentWiseUser() {
  const session = await auth();
  const cookieStore = await cookies();
  const devPreviewCookie = cookieStore.get(WISE_DEV_PREVIEW_COOKIE)?.value;
  const devPreviewRole = getDevPreviewRole(devPreviewCookie);
  const devPreviewTier = getDevPreviewTier(devPreviewCookie);

  if (!session?.user?.id && devPreviewRole) {
    return {
      ...createDevPreviewUser(devPreviewTier ?? "VIP"),
      role: devPreviewRole,
      wiseUserId: devPreviewRole === "ADMIN" ? "YADMINPREVIEW" : "YDEVPREVIEW",
      email: devPreviewRole === "ADMIN" ? "admin@wise-invest.local" : "preview@wise-invest.local",
      name: devPreviewRole === "ADMIN" ? "Wise 后台预览管理员" : "Wise 本地预览用户",
      membershipTier: devPreviewRole === "ADMIN" ? ("VIP_PLUS" as const) : (devPreviewTier ?? "VIP"),
    };
  }

  if (!session?.user?.id) return null;

  return getPrisma().user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      wiseUserId: true,
      email: true,
      emailVerified: true,
      image: true,
      wechatId: true,
      name: true,
      membershipTier: true,
      role: true,
      accounts: {
        select: {
          provider: true,
        },
      },
      partnerAccounts: {
        select: {
          id: true,
          externalIdentifier: true,
          status: true,
          reviewNote: true,
          submittedAt: true,
          verifiedAt: true,
          partner: {
            select: {
              slug: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: {
          submittedAt: "desc",
        },
      },
      entitlements: {
        select: {
          id: true,
          key: true,
          startsAt: true,
          expiresAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export async function requireWiseUser() {
  const user = await getCurrentWiseUser();
  if (!user) redirect("/login?callbackUrl=/account");
  return user;
}

export async function requireAdminUser() {
  const user = await requireWiseUser();
  if (user.role !== "ADMIN") redirect("/account");
  return user;
}
