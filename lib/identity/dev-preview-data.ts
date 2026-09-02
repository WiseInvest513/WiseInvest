import { defaultWiseVipPartners } from "@/lib/vip/partners";

const now = new Date("2026-08-28T10:00:00.000Z");

export const devPreviewPartnerAccounts = [
  {
    id: "dev_review_001",
    externalIdentifier: "UID-88990011",
    status: "PENDING" as const,
    userNote: "通过 WiseInvest 邀请码注册，已完成 100U 入金和一笔小额交易。",
    reviewNote: null,
    submittedAt: now,
    user: {
      email: "member.pending@wise-invest.local",
      wiseUserId: "YPENDING001",
      membershipTier: "MEMBER" as const,
    },
    partner: {
      name: "Binance 币安",
      slug: "binance",
      type: "EXCHANGE" as const,
      vipEligible: true,
      vipPlusEligible: true,
    },
  },
  {
    id: "dev_review_002",
    externalIdentifier: "GALAXY-A-2026",
    status: "NEEDS_REVIEW" as const,
    userNote: "银河证券 A 股打新入口，需要人工确认开户渠道。",
    reviewNote: "请用户补充开户时间截图。",
    submittedAt: now,
    user: {
      email: "member.review@wise-invest.local",
      wiseUserId: "YREVIEW002",
      membershipTier: "MEMBER" as const,
    },
    partner: {
      name: "银河证券 A 股打新",
      slug: "galaxy-securities",
      type: "BROKERAGE" as const,
      vipEligible: true,
      vipPlusEligible: false,
    },
  },
];

export const devPreviewUsers = [
  {
    id: "dev_admin_user",
    wiseUserId: "YADMINPREVIEW",
    email: "admin@wise-invest.local",
    name: "Wise 后台预览管理员",
    wechatId: "WisePreviewAdmin",
    membershipTier: "VIP_PLUS" as const,
    role: "ADMIN" as const,
    createdAt: now,
    accounts: [{ provider: "google" }],
    _count: {
      partnerAccounts: 2,
      entitlements: 2,
    },
  },
  {
    id: "dev_plain_member_user",
    wiseUserId: "YMEMBER000",
    email: "member.new@wise-invest.local",
    name: "普通用户预览",
    wechatId: null,
    membershipTier: "MEMBER" as const,
    role: "USER" as const,
    createdAt: now,
    accounts: [{ provider: "password" }],
    _count: {
      partnerAccounts: 0,
      entitlements: 0,
    },
  },
  {
    id: "dev_member_user",
    wiseUserId: "YVIPMEMBER",
    email: "vip.member@wise-invest.local",
    name: "已通过 VIP 用户",
    wechatId: "WisePreview520",
    membershipTier: "VIP" as const,
    role: "USER" as const,
    createdAt: now,
    accounts: [{ provider: "google" }],
    _count: {
      partnerAccounts: 1,
      entitlements: 1,
    },
  },
  {
    id: "dev_vip_plus_user",
    wiseUserId: "YVIPPLUS003",
    email: "vip.plus@wise-invest.local",
    name: "Wise SVIP 用户",
    wechatId: "WiseSVIP888",
    membershipTier: "VIP_PLUS" as const,
    role: "USER" as const,
    createdAt: now,
    accounts: [{ provider: "github" }],
    _count: {
      partnerAccounts: 2,
      entitlements: 2,
    },
  },
  {
    id: "dev_pending_user",
    wiseUserId: "YPENDING001",
    email: "member.pending@wise-invest.local",
    name: "待审核用户",
    wechatId: null,
    membershipTier: "MEMBER" as const,
    role: "USER" as const,
    createdAt: now,
    accounts: [{ provider: "password" }],
    _count: {
      partnerAccounts: 1,
      entitlements: 0,
    },
  },
];

export const devPreviewPartners = defaultWiseVipPartners.map((partner) => ({
  id: `dev_partner_${partner.slug}`,
  slug: partner.slug,
  name: partner.name,
  type: partner.type,
  referralUrl: partner.referralUrl,
  referralCode: partner.referralCode,
  vipEligible: partner.vipEligible,
  vipPlusEligible: partner.vipPlusEligible,
  vipPlusVolumeThreshold: partner.vipPlusVolumeThreshold,
  enabled: true,
}));

export const devPreviewAuditLogs = [
  {
    id: "dev_audit_001",
    action: "PARTNER_ACCOUNT_SUBMITTED" as const,
    metadata: {
      partnerSlug: "binance",
      partnerAccountId: "dev_review_001",
    },
    createdAt: now,
    actorUser: {
      email: "member.pending@wise-invest.local",
      wiseUserId: "YPENDING001",
    },
    targetUser: {
      email: "member.pending@wise-invest.local",
      wiseUserId: "YPENDING001",
    },
  },
  {
    id: "dev_audit_002",
    action: "MEMBERSHIP_UPGRADED" as const,
    metadata: {
      from: "MEMBER",
      to: "VIP",
      method: "admin_manual",
    },
    createdAt: now,
    actorUser: {
      email: "admin@wise-invest.local",
      wiseUserId: "YADMINPREVIEW",
    },
    targetUser: {
      email: "vip.member@wise-invest.local",
      wiseUserId: "YVIPMEMBER",
    },
  },
];

export function getDevPreviewUserDetail(id: string) {
  const user = devPreviewUsers.find((item) => item.id === id) ?? devPreviewUsers[0];
  const isMember = user.membershipTier === "MEMBER";
  const isVipPlus = user.membershipTier === "VIP_PLUS";

  return {
    id: user.id,
    wiseUserId: user.wiseUserId,
    email: user.email,
    name: user.name,
    wechatId: isMember ? null : "WisePreview520",
    membershipTier: user.membershipTier,
    role: user.role,
    createdAt: user.createdAt,
    accounts: user.accounts,
    partnerAccounts:
      user.id === "dev_plain_member_user"
        ? []
        : [
            {
              id: "dev_user_binding_001",
              externalIdentifier: "UID-88990011",
              status: isMember ? ("PENDING" as const) : ("VERIFIED" as const),
              userNote: isMember ? "用户已提交，等待核验 Wise 合作关系。" : "本地预览记录。",
              reviewNote: isMember ? null : "已核验来自 Wise 渠道。",
              submittedAt: now,
              verifiedAt: isMember ? null : now,
              partner: {
                name: "Binance 币安",
                type: "EXCHANGE" as const,
              },
            },
            ...(isVipPlus
              ? [
                  {
                    id: "dev_user_binding_002",
                    externalIdentifier: "BITGET-WiseInvest",
                    status: "VERIFIED" as const,
                    userNote: "本地预览记录。",
                    reviewNote: "已核验支持 SVIP 资格规则的合作渠道。",
                    submittedAt: now,
                    verifiedAt: now,
                    partner: {
                      name: "Bitget",
                      type: "EXCHANGE" as const,
                    },
                  },
                ]
              : []),
          ],
    entitlements:
      user.membershipTier === "MEMBER"
        ? []
        : [
            {
              id: "dev_user_entitlement_vip",
              key: "vip_group",
              source: "admin_membership",
              startsAt: now,
              expiresAt: null,
            },
            ...(isVipPlus
              ? [
                  {
                    id: "dev_user_entitlement_vip_plus",
                    key: "vip_plus",
                    source: "admin_membership",
                    startsAt: now,
                    expiresAt: null,
                  },
                ]
              : []),
          ],
    targetAuditLogs: devPreviewAuditLogs,
  };
}
