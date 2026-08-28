export const partnerAccountStatusLabels = {
  NOT_CONNECTED: "未绑定",
  PENDING: "待审核",
  VERIFIED: "已通过",
  REJECTED: "未通过",
  NEEDS_REVIEW: "需要补充资料",
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
