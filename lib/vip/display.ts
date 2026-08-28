import { membershipTierLabels, partnerAccountStatusLabels } from "@/lib/vip/status";

export type PublicMembershipTier = "MEMBER" | "VIP" | "VIP_PLUS";

const tierOrder: PublicMembershipTier[] = ["MEMBER", "VIP", "VIP_PLUS"];

export const membershipJourneyCopy: Record<
  PublicMembershipTier,
  {
    label: string;
    short: string;
    description: string;
  }
> = {
  MEMBER: {
    label: membershipTierLabels.MEMBER,
    short: "已注册 Wise ID",
    description: "可以正常使用网站公开内容、学习路线和公开工具。",
  },
  VIP: {
    label: membershipTierLabels.VIP,
    short: "合作账户通过验证",
    description: "绑定至少一个符合资格的 Wise Partner Account，并通过验证后升级。",
  },
  VIP_PLUS: {
    label: membershipTierLabels.VIP_PLUS,
    short: "更高等级资格",
    description: "基于支持统计的合作交易所有效交易量和配置规则判断。",
  },
};

export function getTierIndex(tier: string) {
  return tierOrder.indexOf(tier as PublicMembershipTier);
}

export function getNextTier(tier: string) {
  const index = getTierIndex(tier);
  if (index < 0 || index >= tierOrder.length - 1) return null;
  return tierOrder[index + 1];
}

export function getPublicTierLabel(tier: string) {
  return membershipTierLabels[tier as keyof typeof membershipTierLabels] ?? tier;
}

export function maskIdentifier(value: string) {
  const clean = value.trim();
  if (clean.length <= 4) return "****";
  if (clean.length <= 8) return `${clean.slice(0, 2)}****${clean.slice(-2)}`;
  return `${clean.slice(0, 4)}****${clean.slice(-4)}`;
}

export function getPartnerAccountStatusLabel(status: string) {
  return partnerAccountStatusLabels[status as keyof typeof partnerAccountStatusLabels] ?? status;
}

export function getEntitlementDisplay(key: string) {
  const displays: Record<
    string,
    {
      title: string;
      description: string;
    }
  > = {
    vip_group: {
      title: "VIP 专属社群",
      description: "你已经满足 Wise VIP 社群资格。",
    },
    vip_plus: {
      title: "Wise SVIP 权益",
      description: "你已经获得 Wise SVIP 等级对应权益。",
    },
  };

  return (
    displays[key] ?? {
      title: key,
      description: "该权益已经记录到你的 Wise 账户。",
    }
  );
}

export function getEntitlementBenefitDisplays(tier: string, entitlementKeys: string[]) {
  if (tier === "MEMBER") return [];

  const benefits = [
    {
      title: "Wise VIP 身份",
      description: "你的 Wise Account 已获得 Wise VIP 身份。后续支持 Wise VIP 的 Wise 产品可以识别当前会员状态。",
    },
  ];

  if (entitlementKeys.includes("vip_group")) {
    benefits.push({
      title: "VIP 专属社群",
      description: "你已经满足 Wise VIP 社群资格。",
    });
  }

  benefits.push({
    title: "权益自动同步",
    description: "后续新增符合当前等级的 Wise VIP 权益时，无需重新进行 Partner Account 资格验证。",
  });

  if (tier === "VIP_PLUS" && entitlementKeys.includes("vip_plus")) {
    benefits.push({
      title: "Wise SVIP 身份",
      description: "你的 Wise Account 已获得 Wise SVIP 身份。",
    });
  }

  return benefits;
}
