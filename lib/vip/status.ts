export const partnerAccountStatusLabels = {
  NOT_CONNECTED: "未绑定",
  PENDING: "未审核",
  VERIFIED: "审核通过",
  REJECTED: "审核驳回",
  NEEDS_REVIEW: "待补充",
} as const;

export const partnerTypeLabels = {
  BROKERAGE: "券商",
  EXCHANGE: "交易所",
  OTHER: "其他",
} as const;

export const membershipTierLabels = {
  MEMBER: "普通用户",
  VIP: "Wise VIP",
  VIP_PLUS: "Wise SVIP",
} as const;
