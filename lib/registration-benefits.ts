export type RegistrationBenefits = {
  kind?: "invitation";
  summaryText?: string;
  title: string;
  period?: string;
  items: { value: string; label: string; condition: string }[];
  note?: string;
  detailsHref?: string;
};

// User-confirmed presentation for invitations without a specified reward.
// This is invitation copy, not evidence of a discount or cash reward.
export const exclusiveInvitationBenefits: RegistrationBenefits = {
  kind: "invitation",
  title: "独家福利",
  items: [{ value: "", label: "专属邀请入口", condition: "注册并绑定邀请关系，关注平台活动与权益更新。" }],
};

// Extracted from the current tutorials. Keep the reward's basis and conditions;
// a purchase discount, fee refund or voucher is not a trading commission rebate.
export const articleRegistrationBenefits: Record<string, RegistrationBenefits> = {
  // Updated from the user's explicit channel confirmation on 2026-11-05.
  Predict: {
    title: "交易手续费减免",
    items: [{ value: "10%", label: "交易费折扣", condition: "通过邀请链接注册并填写 05JQU，可享交易手续费减免。" }],
  },
  GamsGo: exclusiveInvitationBenefits,
  SGB: exclusiveInvitationBenefits,
  Wise: exclusiveInvitationBenefits,
  "汇立银行": exclusiveInvitationBenefits,
  "盈透证券": {
    title: "开户支持",
    items: [{ value: "快速通过", label: "协助完成开户审核", condition: "提交完整资料；审核结果与处理时间由券商决定。" }],
  },
  "腾达证券": {
    title: "Wise 开户权益",
    items: [
      { value: "免佣", label: "港美股交易", condition: "填写 XDG74RHG，入金等值 HK$10,000。" },
      { value: "最高 HK$300", label: "股票现金卡", condition: "净入资满 HK$20,000，达标、留存 30 天及 60 天各解锁 HK$100。" },
    ],
    note: "平台费另计；使用现金卡后须维持达标资格满 60 天。",
  },
  "致富证券": {
    title: "Wise 开户权益",
    items: [
      { value: "免佣", label: "美股交易", condition: "填写 HN7787，入金等值 HK$10,000。" },
      { value: "HK$300", label: "交易券及股票奖励", condition: "开户 7 天内入金 HK$10,000，留存 60 天并完成一笔港股或美股交易。" },
    ],
    note: "奖励由 HK$100 美股交易券与 HK$200 英伟达股票组成。",
  },
  "蚂蚁银行澳门": {
    title: "邀请入资礼",
    items: [
      { value: "2 股", label: "阿里巴巴港股", condition: "入金等值 HK$3,000；维持资产至奖励到账。" },
      { value: "iPhone 17 Pro", label: "256G 高档入资礼", condition: "入金等值 HK$1,000,000，留存 90 天并完成 90 笔交易。" },
    ],
    note: "按对应入资档位领取；股票市值随行情变动。",
  },
  // Original article excerpts retained in docs/reviews/article-referral-review.json.
  // Restored at the user's request to display the article's stated figures.
  StableStock: {
    title: "邀请返现",
    items: [{ value: "20%", label: "原文返现比例", condition: "填写 WISE666 注册；返还基数、适用交易与领取方式待补充。" }],
    note: "原文未说明返还基数，不代表交易本金返还 20%。",
  },
  StockCoin: {
    title: "邀请交易返佣",
    items: [{ value: "35%", label: "现货与合约返佣", condition: "使用 OQTACJ 注册；返佣有效期及适用地区待补充。" }],
  },
  // content/articles/OnChain/Biyapay/stablestock.md:69–71
  BiyaPay: {
    title: "邀请专属福利",
    items: [
      { value: "10U", label: "入金返现", condition: "通过邀请码注册，30 日内完成入金。" },
      { value: "2U", label: "交易奖励", condition: "注册一周内首次入金，三个月内完成两笔美股整股交易。" },
      { value: "8 折", label: "美港股交易费用", condition: "完成首笔美股或港股交易后，享美股交易费及港股佣金优惠。" },
    ],
  },
  // content/articles/vcard/Bybit/bybit.md:30,69,89
  "Bybit Card": {
    title: "消费返现",
    items: [{ value: "10%", label: "卡片消费返现", condition: "充值至少 100U 解锁；原文单次返现上限为 75U。" }],
  },
  // content/articles/vcard/Bitget/bitget.md:81–89
  "Bitget Wallet": {
    title: "卡片消费权益",
    items: [{ value: "自选资产", label: "返现可选 BTC 等", condition: "完成开卡后选择返现资产；正文未写明具体返现比例。" }],
  },
  // content/articles/vcard/Gate/Gate.md:90–91
  "Gate Card": {
    title: "卡片消费权益",
    items: [{ value: "积分返还", label: "消费可获积分", condition: "消费后返还对应积分；正文未写明积分比例与兑换规则。" }],
  },
  // content/articles/vcard/MP/MP.md:174–178,239; the August giveaway has ended.
  MPCard: {
    title: "Wise 开卡奖励",
    items: [{ value: "5U", label: "原文现金奖励", condition: "通过邀请入口并填写 61298139；按开卡页面规则领取。" }],
  },
  // content/articles/vcard/BenPay/BenPay.md:123–125
  BenPay: {
    title: "Wise 消费奖励",
    items: [{ value: "2U", label: "消费返现", condition: "绑定邀请码 9WJVG9，消费满 50U 后领取。" }],
  },
  // content/articles/vcard/SafePal/safepal.md:82,162–168
  SafePal: {
    title: "Wise 开户礼",
    items: [{ value: "X1 冷钱包", label: "免费领取", condition: "填写 884823 并完成开户激活，到礼品页领取；约 ¥35 邮费自付。" }],
  },
  // content/articles/vcard/StarryBlu/StarryBlu.md:71–75,191
  StarryBlu: {
    title: "Wise 新户优惠券",
    items: [{ value: "20 SGD", label: "含邀请额外 10 SGD", condition: "两张 10 SGD 券，用于转账或消费随机抵扣，非现金。" }],
  },
  // content/articles/vcard/UUWallet/BenPay.md:60,102–104,120
  "UU Wallet": {
    title: "Wise 开卡费返还",
    items: [
      { value: "100%", label: "虚拟卡开卡费", condition: "原开卡费 10U；渠道开卡后回传表单领取。" },
      { value: "50%", label: "实体卡开卡费", condition: "适用塑料卡和金属卡；填写 d1wvsq 并回传表单。" },
    ],
    note: "返还基数为开卡费，不是消费金额。",
  },
  // content/articles/bank/ifast/Ifast.md:69
  iFAST: {
    title: "邀请入金奖励",
    items: [{ value: "£5", label: "现金奖励", condition: "通过邀请入口开户，存入 £500 并持有超过三个月；双方各得 £5。" }],
  },
  // content/articles/bank/众安介绍/zhongan.md: general card benefits, not the expired invitation bundle.
  "众安银行": {
    title: "账户消费权益",
    items: [{ value: "1.5%", label: "StockBack 股票回赠", condition: "ZA Card 选择股票回赠，按合资格消费金额计算；非邀请码专属现金奖。" }],
    note: "外币消费另有 1.95% 手续费。",
  },
  // content/articles/bank/平安数字银行/pingan.md:171; excludes the expired dual-8% deposit campaign.
  "平安数字银行": {
    title: "投资户迎新权益",
    items: [{ value: "最高 HK$2,000", label: "现金回赠券包", condition: "新开投资户并启动服务；首 60 天交易可获额外返还，非开户即到账现金。" }],
  },
  // content/articles/ai/translation/trans.md:130 retains the original offer.
  "沉浸式翻译": {
    title: "渠道购买优惠",
    items: [{ value: "9 折", label: "原稿渠道优惠", condition: "通过邀请入口购买；适用套餐和有效期在购买页核对。" }],
  },
  // content/articles/simcard/xesim/xesim.mdx:42–44
  XeSIM: {
    title: "专属购买优惠",
    items: [{ value: "9 折", label: "购买折扣", condition: "按教程购买 X2 Pro，结算时输入优惠码 WISE666。" }],
  },
};

// Missing details remain visible and are listed in the local benefits review.
export const registrationBenefitGaps: Record<string, string> = {
  StableStock: "原文列 20% 返现，返还基数、适用交易与领取方式待补充。",
  StockCoin: "原稿 OQTACJ 对应现货与合约 35% 返佣；有效期及适用地区待补充。",
  "蚂蚁银行澳门": "原稿额外 1 股的任务月份与交易频率和图片不一致；当前卡片只列入资 2 股及高档实物奖励。",
  "众安银行": "当前邀请专属奖励及 StockBack 上限待补充；旧邀请券包已于 2026 年 5 月 27 日结束。",
  "平安数字银行": "券包各档交易门槛、兑换条件、活动期限及是否需要邀请码待补充。",
  "Bitget Wallet": "消费返现比例、上限与适用条件待补充。",
  "Gate Card": "消费积分比例、兑换规则及邀请额外奖励待补充。",
  StarryBlu: "额外 10 SGD 充值奖励的统计币种和奖励形式待补充。",
  BiyaPay: "10U 入金奖最低金额、活动期限与各项奖励能否叠加待补充。",
  iFAST: "奖励发放时间及活动截止日期待补充。",
  "沉浸式翻译": "当前适用套餐及九折活动截止日期待补充。",
  XeSIM: "其他商品是否适用及优惠截止日期待补充。",
};
