import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { partnerTypeLabels } from "@/lib/vip/status";

type PartnerLike = {
  slug: string;
  name: string;
  type: keyof typeof partnerTypeLabels;
  referralCode?: string | null;
  vipPlusEligible?: boolean;
  vipPlusVolumeThreshold?: { toString(): string } | string | null;
};

const identifierConfigByType = {
  BROKERAGE: {
    identifierLabel: "Account ID",
    identifierPlaceholder: "填写券商账户 ID 或开户链接识别信息",
  },
  EXCHANGE: {
    identifierLabel: "UID",
    identifierPlaceholder: "填写交易所后台显示的 UID",
  },
  OTHER: {
    identifierLabel: "用户标识",
    identifierPlaceholder: "填写合作服务中的用户 ID、账号或订单识别信息",
  },
} as const;

export const defaultWiseVipPartners = [
  {
    slug: "binance",
    name: "Binance 币安",
    type: "EXCHANGE" as const,
    referralUrl: "https://www.binance.com/join?ref=WISEBNB1",
    referralCode: "WISEBNB1",
    vipEligible: true,
    vipPlusEligible: true,
    vipPlusVolumeThreshold: "50000",
    verificationMode: "MANUAL" as const,
  },
  {
    slug: "bitget",
    name: "Bitget",
    type: "EXCHANGE" as const,
    referralUrl: "https://partner.bitget.cafe/bg/8ax9wf4r",
    referralCode: "wise5130",
    vipEligible: true,
    vipPlusEligible: true,
    vipPlusVolumeThreshold: "50000",
    verificationMode: "MANUAL" as const,
  },
  {
    slug: "okx",
    name: "OKX 欧易",
    type: "EXCHANGE" as const,
    referralUrl: "https://www.vmutkhamuut.com/join/WISE6666",
    referralCode: "WISE6666",
    vipEligible: true,
    vipPlusEligible: true,
    vipPlusVolumeThreshold: "50000",
    verificationMode: "MANUAL" as const,
  },
  {
    slug: "bybit",
    name: "Bybit",
    type: "EXCHANGE" as const,
    referralUrl: "https://partner.bybit.com/b/WISE6666",
    referralCode: "WISE6666",
    vipEligible: true,
    vipPlusEligible: true,
    vipPlusVolumeThreshold: "50000",
    verificationMode: "MANUAL" as const,
  },
  {
    slug: "gate",
    name: "Gate",
    type: "EXCHANGE" as const,
    referralUrl: "https://www.wise-invest.org/articles/vcard/GUhygjYV",
    referralCode: "WISEGATE",
    vipEligible: true,
    vipPlusEligible: true,
    vipPlusVolumeThreshold: "50000",
    verificationMode: "MANUAL" as const,
  },
  {
    slug: "galaxy-securities",
    name: "银河证券 A 股打新",
    type: "BROKERAGE" as const,
    referralUrl: null,
    referralCode: null,
    vipEligible: true,
    vipPlusEligible: false,
    vipPlusVolumeThreshold: null,
    verificationMode: "MANUAL" as const,
  },
  {
    slug: "mp-card",
    name: "MP 虚拟油卡",
    type: "OTHER" as const,
    referralUrl: "https://mp.net/i/WiseInvest",
    referralCode: "WiseInvest",
    vipEligible: true,
    vipPlusEligible: false,
    vipPlusVolumeThreshold: null,
    verificationMode: "MANUAL" as const,
  },
];

export async function getEnabledVipPartners() {
  if (!isDatabaseConfigured()) {
    return defaultWiseVipPartners.map((partner) => ({
      id: partner.slug,
      ...partner,
    }));
  }

  return getPrisma().partner.findMany({
    where: {
      enabled: true,
      vipEligible: true,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      type: true,
      referralUrl: true,
      referralCode: true,
      vipEligible: true,
      vipPlusEligible: true,
      vipPlusVolumeThreshold: true,
      verificationMode: true,
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

export function getPartnerDisplayConfig(partner: PartnerLike) {
  const identifierConfig = identifierConfigByType[partner.type];
  const threshold = partner.vipPlusVolumeThreshold?.toString() ?? null;

  return {
    identifierLabel: identifierConfig.identifierLabel,
    identifierPlaceholder: identifierConfig.identifierPlaceholder,
    qualificationRules: partner.vipPlusEligible
      ? {
          metricType: "有效交易量",
          threshold,
          period: "以 Partner 当前配置为准",
          supportedTradingTypes: "以 Partner 当前配置为准",
          description: `${partner.name} 支持 Wise SVIP 资格判断。交易量同步接入前，资格以 Partner 配置和后台审核结果为准。`,
        }
      : null,
  };
}
