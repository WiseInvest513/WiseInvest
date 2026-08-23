export type CardAiTone = "strong" | "stable" | "usable" | "watch" | "pending";
export type CardPaymentSupport = "yes" | "no" | "partial" | "unknown";

export interface CardFeeItem {
  label: string;
  value: string;
  note?: string;
}

export interface CardFeeSource {
  label: string;
  url: string;
}

export interface VirtualCardProduct {
  id: string;
  name: string;
  issuer: string;
  issuerUrl: string;
  iconUrl?: string;
  inviteCode: string | null;
  registerLink: string | null;
  tutorialLink: string | null;
  score?: number;
  ratingLabel: string;
  ai: {
    label: string;
    tone: CardAiTone;
    detail: string;
  };
  payment: {
    applePay: CardPaymentSupport;
    googlePay: CardPaymentSupport;
    detail: string;
  };
  status: string;
  usage: string;
  bestFor: string[];
  feeSummary: string;
  feeItems: CardFeeItem[];
  feeCheckedAt?: string;
  feeSources?: CardFeeSource[];
}

const feeCheckedAt = "2026-08-23";

export const virtualCardProducts: VirtualCardProduct[] = [
  {
    id: "bitget-wallet-card",
    name: "Bitget Wallet Card",
    issuer: "Bitget Wallet",
    issuerUrl: "https://web3.bitget.com",
    iconUrl: "/images/perks/bitget-wallet-card.jpeg",
    inviteCode: "Wise6666",
    registerLink:
      "https://web3.bitget.com/invite/card/Wise6666?channel=Copylink&utm_source=newInviteRebate&inviteCode=Wise6666",
    tutorialLink: "/articles/vcard/WK8p1cCV",
    score: 5,
    ratingLabel: "日常最佳",
    ai: {
      label: "AI 订阅可用",
      tone: "stable",
      detail: "可作为 ChatGPT、Claude、Vercel 等订阅备选，日常消费和支付宝识别体验更突出。",
    },
    payment: {
      applePay: "yes",
      googlePay: "yes",
      detail: "官方卡片说明支持 Apple Pay、Google Pay、支付宝和微信，实际绑定仍看卡 BIN 与风控。",
    },
    status: "主力使用",
    usage:
      "日常使用最佳，稳定渠道认可度高，支付宝识别友好；也是 GiffGaff 付款和日常小额消费的主力卡。",
    bestFor: ["支付宝", "GiffGaff", "日常消费", "Web3 支付"],
    feeSummary:
      "Bitget Wallet Card 对大陆用户的关键点是：需要中国护照 + 境外地址证明，钱包内至少 10 USD；开卡、年费和刷卡消费费为 0，充值 1%，加密资产换汇损耗约 1%。",
    feeItems: [
      {
        label: "申请 / KYC",
        value: "中国护照 + 境外地址证明",
        note: "教程实测大陆用户需要护照、人脸、手机号、邮箱和地址证明；不是只用中国身份证即可完成。",
      },
      {
        label: "开卡成本",
        value: "开卡 / 年费 0；需 10 USD 余额",
        note: "10 USD 是申请门槛资金，不是单独开卡手续费。",
      },
      {
        label: "充值 / 入金",
        value: "充值 1%",
        note: "用加密资产入金时还要看链上网络费和交易所提现费。",
      },
      {
        label: "消费 / 换汇",
        value: "刷卡消费 0；换汇约 1%",
        note: "支付宝 / 微信单笔超过 200 元时，支付平台可能加收约 3%，不属于卡片本身消费费。",
      },
      {
        label: "消费优惠 / 减免",
        value: "部分手续费先收后返",
        note: "活动通常有月度额度和到账周期；不要理解为所有消费都额外补贴。",
      },
    ],
    feeCheckedAt,
    feeSources: [
      { label: "中国大陆费用", url: "https://web3.bitget.com/zh/helpCenter/241" },
      { label: "中国大陆申请条件", url: "https://web3.bitget.com/zh/helpCenter/235" },
      { label: "手续费返还规则", url: "https://web3.bitget.com/zh/helpCenter/488" },
    ],
  },
  {
    id: "safepal-card",
    name: "SafePal Card",
    issuer: "SafePal",
    issuerUrl: "https://www.safepal.com",
    iconUrl: "/images/perks/safepal-card.jpeg",
    inviteCode: "884823",
    registerLink: "https://www.safepal.com/bank/register?referral=884823",
    tutorialLink: "/articles/vcard/E4lD5AIn",
    score: 5,
    ratingLabel: "出入金友好",
    ai: {
      label: "AI 订阅可用",
      tone: "usable",
      detail: "可用于 Vercel、网站产品和部分 AI 订阅；更强的场景是 IBKR / 嘉信汇款。",
    },
    payment: {
      applePay: "yes",
      googlePay: "yes",
      detail: "Fiat24 / SafePal 卡可添加到 Apple Pay 和 Google Pay，国内支付以支付宝 / 微信实测为准。",
    },
    status: "主力备选",
    usage:
      "界面流程没有 Bitget Wallet 那么顺，但用于盈透 / 嘉信汇款更简单，也适合订阅 Vercel 等网站产品。",
    bestFor: ["盈透入金", "嘉信入金", "Vercel", "资金流转"],
    feeSummary:
      "SafePal / Fiat24 联名入口适合大陆用户做资金流转：教程实测可用中国身份证 NFC 完成认证，开户和管理费为 0，当前入金长期减免；非 EUR 结算按官方费率表为 1%。",
    feeItems: [
      {
        label: "申请 / KYC",
        value: "中国身份证 NFC + Fiat24 KYC",
        note: "教程实测需要 NFC 读取身份证、人脸和基础资料；不需要另备境外地址证明。",
      },
      { label: "开户 / 管理", value: "0", note: "无账户开立费、管理费及额外固定费用。" },
      {
        label: "充值 / 入金",
        value: "长期减免期为 0",
        note: "这是 SafePal 联名入口当前权益；链上 Gas 仍需自付，不能套用 Fiat24 独立账户的标准价格。",
      },
      {
        label: "加密资产兑换",
        value: "USDC ≤ 2,000 免；超出 0.2%–1%",
        note: "其他支持币种约 0.1%–0.5%，具体按资产和账户等级显示。",
      },
      {
        label: "消费 / 换汇",
        value: "非 EUR 结算 1%",
        note: "费率表如此列示；另一份官方启用指南提到已启用币种零换汇，两者适用边界以 App 预览为准。",
      },
      {
        label: "IBAN 转账",
        value: "内部 / 外部均 0",
        note: "SafePal 与 Fiat24 不收转账费，但中间行或收款行可能另行收费。",
      },
      {
        label: "消费优惠 / 减免",
        value: "无稳定全场消费补贴",
        note: "合作活动可能另有权益，但不要当作所有刷卡消费都固定减免。",
      },
    ],
    feeCheckedAt,
    feeSources: [
      {
        label: "官方费率",
        url: "https://safepalsupport.zendesk.com/hc/en-us/articles/22647224575643-Fee-Rates-for-the-SafePal-Banking-Gateway-and-Mastercard",
      },
      {
        label: "KYC 与限额 FAQ",
        url: "https://safepalsupport.zendesk.com/hc/en-us/articles/22646856800027-FAQs-about-the-SafePal-Banking-Gateway-and-Mastercard",
      },
      {
        label: "账户等级与减免",
        url: "https://safepalsupport.zendesk.com/hc/en-us/articles/22646881975195-Introducing-the-Account-Tiers-Points-and-Privileges-of-the-SafePal-Banking-Services",
      },
      {
        label: "卡片启用说明",
        url: "https://safepalsupport.zendesk.com/hc/en-us/articles/22558153923739-How-to-obtain-and-activate-Fiat24-bank-card",
      },
    ],
  },
  {
    id: "bybit-card",
    name: "Bybit Card",
    issuer: "Bybit",
    issuerUrl: "https://www.bybit.com",
    iconUrl: "/images/perks/bybit-card.jpeg",
    inviteCode: "JJKZWA4",
    registerLink: "https://www.bybit.com/en/card/",
    tutorialLink: "/articles/vcard/wYKRLDvK",
    score: 5,
    ratingLabel: "AI 订阅",
    ai: {
      label: "AI 订阅强",
      tone: "strong",
      detail: "用于 Claude Code 等 AI 订阅时稳定性较好，不需要额外下载独立 App。",
    },
    payment: {
      applePay: "partial",
      googlePay: "yes",
      detail: "Google Pay 可作为主线；Apple Pay 受发卡地区影响，不能按所有 Bybit Card 统一写支持。",
    },
    status: "订阅常用",
    usage:
      "日常使用频率不算最高，但在 AI 会员订阅上表现比较稳；账户风控仍需要自己控制。",
    bestFor: ["Claude Code", "AI 订阅", "交易所账户", "Apple Pay"],
    feeSummary:
      "Bybit Card 对大陆用户的现实路径通常是先完成 Bybit 账号 KYC，再按支持地区申请虚拟卡；教程使用境外居住地区和地址填写。虚拟卡开卡通常为 0，年费为 0；加密兑换约 0.5%–0.9%，外汇费依地区约 1%–7%。",
    feeItems: [
      {
        label: "申请 / KYC",
        value: "Bybit KYC + 支持地区地址",
        note: "教程路径不是单纯中国身份证直开卡，需要通过 Eligibility Check，并填写卡片账单地址、手机号等资料。",
      },
      {
        label: "开卡 / 持有",
        value: "虚拟卡通常 0；年费 0",
        note: "实体卡费用和可申请地区不作为大陆用户主线信息，申请页显示为准。",
      },
      {
        label: "加密资产兑换",
        value: "通常 0.5%–0.9%",
        note: "若使用同币种法币余额不触发该费用；USDT 等资产自动换汇时需要看交易确认页。",
      },
      {
        label: "外汇 / 跨境",
        value: "约 1%–7%，依地区",
        note: "按 Mastercard 汇率结算，具体费率跟发卡地区和卡 BIN 相关。",
      },
      {
        label: "消费优惠 / 减免",
        value: "2%–10%，月上限 5–600 USD",
        note: "消费补贴等级、任务门槛、合格 MCC 和每月上限依地区及活动规则变化；教程里提到 100U 入金后解锁高比例优惠。",
      },
    ],
    feeCheckedAt,
    feeSources: [
      {
        label: "官方费用与限额",
        url: "https://www.bybit.com/en/help-center/article/Fees-and-Spending-Limits-Bybit-Card/",
      },
      {
        label: "官方申请指南",
        url: "https://www.bybit.com/en/help-center/article/How-to-Apply-for-Bybit-Card",
      },
      {
        label: "官方消费优惠规则",
        url: "https://www.bybit.com/en/help-center/article/Introduction-to-Bybit-Card-Rewards",
      },
    ],
  },
  {
    id: "uu-wallet-card",
    name: "UU Wallet",
    issuer: "UU Wallet",
    issuerUrl: "https://app.uuwallet.com",
    iconUrl: "/images/perks/uu-wallet.jpg",
    inviteCode: "d1wvsq",
    registerLink: "/articles/vcard/aQ7pEkbH",
    tutorialLink: "/articles/vcard/aQ7pEkbH",
    score: 5,
    ratingLabel: "转账安全",
    ai: {
      label: "AI 订阅待实测",
      tone: "watch",
      detail: "更偏转账和 U 卡基础能力，AI 订阅稳定性后续补实测结果。",
    },
    payment: {
      applePay: "yes",
      googlePay: "yes",
      detail: "你的教程截图口径显示支持 Google Pay、Apple Pay、支付宝、微信，仍需以后续实测补充稳定性。",
    },
    status: "持续观察",
    usage:
      "专注转账和安全，带地址检测能力，支持币种更多；实体卡已申请，后续等到卡后补充实测。",
    bestFor: ["转账", "地址检测", "多币种", "实体卡"],
    feeSummary:
      "UU Wallet 对大陆用户较友好：你的教程写明用中国护照即可完成 KYC，不需要复杂地址证明；虚拟卡默认开卡 10U，通过渠道可返还开卡费。公开页未稳定披露消费和换汇费率，需在 App 下单页确认。",
    feeItems: [
      {
        label: "申请 / KYC",
        value: "中国护照 KYC",
        note: "教程实测选择中国、证件类型用护照即可认证；没有写需要境外地址证明。",
      },
      {
        label: "开卡 / 持有",
        value: "虚拟卡 10U；渠道可返还",
        note: "实体卡费用较高，不作为大陆用户日常虚拟卡主线；最终以 App 下单页和活动表单为准。",
      },
      {
        label: "充值 / 入金",
        value: "官方公开页未披露",
        note: "不同资产、网络和卡 BIN 可能采用不同费率，需在 App 报价页核对。",
      },
      {
        label: "消费 / 换汇",
        value: "官方公开页未披露",
        note: "消费费、跨境费和汇率加价暂不引用第三方数字。",
      },
      {
        label: "支付绑定",
        value: "Apple / Google / 支付宝 / 微信",
        note: "这是教程截图中的产品口径；订阅和国内支付通过率仍需后续实测补充。",
      },
      {
        label: "消费优惠 / 减免",
        value: "渠道开卡费返还",
        note: "重点是开卡费用返还，不写成所有消费都固定补贴。",
      },
    ],
    feeCheckedAt,
    feeSources: [
      { label: "官网与卡片说明", url: "https://www.uuwallet.com/" },
      { label: "钱包提现费率", url: "https://www.uuwallet.com/faq/details?from=h5&id=34" },
      { label: "官方 App", url: "https://app.uuwallet.com" },
    ],
  },
  {
    id: "benpay-delta-card",
    name: "BenPay Delta Card",
    issuer: "BenPay",
    issuerUrl: "https://benpay.com",
    iconUrl: "/images/perks/benpay-card.jpg",
    inviteCode: "9WJVG9",
    registerLink: "https://benpay.com/card?invite_code=9WJVG9",
    tutorialLink: "/articles/vcard/oCyhotvX",
    score: 5,
    ratingLabel: "轻量开卡",
    ai: {
      label: "AI 订阅友好",
      tone: "strong",
      detail: "Delta Card 门槛低，后续 AI 订阅专门卡如果上线，可作为重点观察对象。",
    },
    payment: {
      applePay: "yes",
      googlePay: "yes",
      detail: "教程与官方介绍均写明兼容 Apple Pay、Google Pay、Alipay，适合 AI 订阅和小额消费。",
    },
    status: "轻量开卡",
    usage:
      "开卡流程相对轻量，适合 AI 订阅和小额消费；是否需要补充资料以当前开卡页为准，50U 保证金属于冻结资金，满足规则后可退。",
    bestFor: ["AI 订阅", "轻量开卡", "随用随开", "保证金可退"],
    feeSummary:
      "Delta Card 适合大陆用户做 AI 订阅小额卡：教程路径偏轻量开卡，开卡费 9.9U，另冻结 50U 可退保证金；充值费 0.5%，每笔消费收 0.35 USD + 1%，跨境交易再加 1%；无月费和年费。",
    feeItems: [
      {
        label: "申请 / 审核",
        value: "轻量开卡；以当前页面为准",
        note: "教程旧口径为无需传统 KYC；若当前页面要求补充资料，应以实时开卡页为准。",
      },
      {
        label: "开卡 / 持有",
        value: "9.9U + 冻结 50U",
        note: "50U 为可退安全保证金，不是开卡手续费；退回需满足官方分阶段解冻和账户条件。月费、年费均为 0。",
      },
      {
        label: "充值 / 入金",
        value: "0.5%",
        note: "首次充值最低 10 BUSD，之后最低 1 BUSD；实际支持资产以充值页为准。",
      },
      {
        label: "消费",
        value: "0.35 USD + 1% / 笔",
        note: "费率总表列跨境交易另收 1%，另一篇官方帮助页写 0.5%，存在冲突，实际以下单页为准。",
      },
      {
        label: "提现 / 换汇",
        value: "不支持",
        note: "Delta Card 当前官方费率页列示不支持卡内提现与币种兑换。",
      },
      {
        label: "消费限额",
        value: "每日 100,000 USD",
        note: "高额消费仍可能触发商户、发卡方或风控限制。",
      },
    ],
    feeCheckedAt,
    feeSources: [
      { label: "官方申请指南", url: "https://support.benpay.com/zh/docs/l0Z30tCA" },
      { label: "Delta 费率与限额", url: "https://support.benpay.com/eng/docs/Rate-and-limit-issues" },
      {
        label: "保证金规则",
        url: "https://support.benpay.com/eng/docs/BenPay-Card-Security-Deposit-Guide",
      },
      { label: "充值规则", url: "https://support.benpay.com/eng/docs/Recharge-FAQs" },
      {
        label: "跨境费冲突页",
        url: "https://support.benpay.com/eng/docs/What-if-the-card-becomes-invalid-unusable",
      },
    ],
  },
  {
    id: "biyapay-card",
    name: "BiyaPay",
    issuer: "BiyaPay",
    issuerUrl: "https://www.biyapay.com",
    iconUrl: "/images/perks/biyapay-card.jpeg",
    inviteCode: "53443445",
    registerLink: "https://www.biyapay.com/en/virtualcard/apply",
    tutorialLink: "/articles/onchain/KewUM4Og",
    score: 5,
    ratingLabel: "法币通道",
    ai: {
      label: "AI 订阅可尝试",
      tone: "usable",
      detail: "优势在国内外资金流通，对没有加密货币的用户更友好，订阅场景后续补细节。",
    },
    payment: {
      applePay: "unknown",
      googlePay: "unknown",
      detail: "公开帮助页主要写线上支付和卡号消费，钱包绑定支持未找到稳定官方口径，先标待核。",
    },
    status: "完整教程",
    usage:
      "适合做国内外资金流通，能降低没有加密资产用户使用虚拟卡订阅海外服务的门槛。",
    bestFor: ["国内外流通", "无加密用户", "订阅付款", "资金中转"],
    feeSummary:
      "BiyaPay 速易卡当前公开口径：开卡 2 USD、充值 1.8%、每笔消费 0.5 USD、退款 2%，无年费；部分额度说明的新旧页面有差异，下单时需以 App 为准。",
    feeItems: [
      {
        label: "申请 / 激活",
        value: "选 BIN、填写卡名并首次充值",
        note: "官方激活指南未在同页明确承诺免实名；身份认证与地区资格应以账户页面实际提示为准。",
      },
      { label: "开卡 / 年费", value: "2 USD / 0", note: "虚拟卡发行费 2 USD，不收年费。" },
      {
        label: "充值 / 入金",
        value: "1.8%",
        note: "当前充值指南列单笔 5–2,000 USD；较旧开卡页仍写 10–1,000 USD，实际以充值页为准。",
      },
      { label: "消费", value: "0.5 USD / 笔", note: "按每笔成功交易收取固定手续费。" },
      { label: "退款", value: "2%", note: "退款处理按金额比例收费。" },
      {
        label: "地区限制",
        value: "覆盖 190+ 地区；中国大陆受限",
        note: "官方页面提示中国大陆使用存在限制，具体可申请与可消费范围以实时风控为准。",
      },
      {
        label: "支付绑定",
        value: "待核验",
        note: "公开帮助页主要覆盖卡号支付、充值和消费，Apple Pay / Google Pay 未找到稳定口径。",
      },
    ],
    feeCheckedAt,
    feeSources: [
      {
        label: "速易卡费用",
        url: "https://www.biyapay.com/zh/help/409-biya-easycard/1830-what-are-the-fees-for-biyapay-speed-card",
      },
      {
        label: "激活指南",
        url: "https://www.biyapay.com/zh/help/144-easycard/567-how-do-i-activate-a-biyapay-virtual-card",
      },
      {
        label: "当前充值指南",
        url: "https://www.biyapay.com/zh/help/409-biya-easycard/1833-how-to-top-up-biyapay-speed-card",
      },
      {
        label: "地区与使用范围",
        url: "https://www.biyapay.com/zh/help/409-biya-easycard/1827-what-functions-does-biyapay-speed-card-have",
      },
    ],
  },
  {
    id: "plasma-one-card",
    name: "Plasma One Card",
    issuer: "Plasma One",
    issuerUrl: "https://www.plasma.org",
    iconUrl: "/images/perks/plasma-one-card.jpg",
    inviteCode: null,
    registerLink: "https://www.plasma.org/personal",
    tutorialLink: "https://www.youtube.com/watch?v=qKe-YS38Vdw",
    score: 5,
    ratingLabel: "权益观察",
    ai: {
      label: "AI 订阅观察",
      tone: "watch",
      detail: "权益吸引力强，但大陆用户申请可用性和 AI 订阅稳定性需要继续实测。",
    },
    payment: {
      applePay: "yes",
      googlePay: "yes",
      detail: "公开资料和社区整理均指向 Apple Pay / Google Pay 可用，申请地区仍会影响实际绑定。",
    },
    status: "热门观察",
    usage:
      "最近比较热门，权益更有吸引力；但大陆用户能否顺利申请、是否需要额外材料，还要以实际申请流程为准。",
    bestFor: ["权益", "热门新卡", "U 卡体验", "待实测"],
    feeSummary:
      "Plasma One 更适合先作为观察卡：Lite 为 0，Core 为 199 USD / 年或锁定 20,000 XPL，Platinum 需锁定 100,000 XPL；国际卡非 USD 外汇费最高 1%，跨境费为 0。",
    feeItems: [
      {
        label: "申请 / KYC",
        value: "年满 18 岁 + 支持地区 + 身份验证",
        note: "通过审核后获得虚拟卡；支持地区与最终资格以申请流程为准。",
      },
      {
        label: "开卡 / 等级",
        value: "Lite 0；Core 199 USD / 年",
        note: "Core 也可锁定 20,000 XPL 12 个月；Platinum 只能锁定 100,000 XPL 12 个月。",
      },
      {
        label: "充值 / 转账",
        value: "Plasma 路径 USD₮ 转账 0",
        note: "第三方、跨链、入金和银行通道费用可能另收；公开页面未列统一充值费。",
      },
      {
        label: "消费 / 换汇",
        value: "国际卡非 USD 最高 1%；跨境费 0",
        note: "实际口径取决于发卡项目和申请地区，确认前先看开卡页显示。",
      },
      {
        label: "消费优惠 / 减免",
        value: "Lite 2%；Core 最高 3%；Platinum 最高 4%",
        note: "按月消费档位递减并以 XPL 发放；AI、航旅等分类权益可更高，但受额度、商户和排除规则限制。",
      },
    ],
    feeCheckedAt,
    feeSources: [
      { label: "产品与等级", url: "https://www.plasma.org/personal" },
      { label: "完整权益规则", url: "https://www.plasma.org/plasma-one-rewards" },
      { label: "国际卡条款", url: "https://www.plasma.org/plasma-one-international-card-terms" },
      { label: "地区与 KYC", url: "https://www.plasma.org/terms-of-service" },
    ],
  },
  {
    id: "starryblu-card",
    name: "StarryBlu Card",
    issuer: "StarryBlu",
    issuerUrl: "https://www.starryblu.com",
    iconUrl: "/images/perks/starryblu-card.jpeg",
    inviteCode: "MPFK00F",
    registerLink: "/articles/vcard/uQfN0J0j",
    tutorialLink: "/articles/vcard/uQfN0J0j",
    score: 5,
    ratingLabel: "跨境消费",
    ai: {
      label: "AI 订阅观察",
      tone: "watch",
      detail: "主要优势是跨境收付款、国内消费和资金中转，AI 订阅后续补实测。",
    },
    payment: {
      applePay: "partial",
      googlePay: "partial",
      detail: "卡片主线是跨境消费和微信/国内付款；Apple Pay / Google Pay 需按 App 卡种显示确认。",
    },
    status: "实测推荐",
    usage:
      "可以转账给银行、付款到国内，也能做中转；更适合看跨境付款和国内消费能力，实体卡实测待补。",
    bestFor: ["港卡资金", "微信消费", "跨境付款", "实体卡"],
    feeSummary:
      "StarryBlu 官网公开了账户方案价格，并宣传卡消费交易费 0、无额外境外交易费；但大陆用户申请材料、开卡、充值和地区可用状态没有统一公开数字，仍需在 App 核验。",
    feeItems: [
      {
        label: "申请 / KYC",
        value: "身份验证 + 支持地区",
        note: "卡片可用状态受地区和监管审批影响，官网不同地区版本可能显示不同进度。",
      },
      {
        label: "账户方案",
        value: "0 / 9.99 / 19.99 USD 月费",
        note: "依次为 Starry、Starry Plus、Planet；Deity 为 999.99 USD / 年。方案价格不等同于全部卡片成本。",
      },
      {
        label: "交易手续费",
        value: "0（官网产品口径）",
        note: "第三方、网络、汇率或商户费用可能另计，官网未给出完整卡片价目表。",
      },
      {
        label: "全球转账",
        value: "按线路 / 活动",
        note: "官网既有活动免手续费口径，也有部分线路最低 1.99 SGD 的说明；以汇款确认页为准。",
      },
      {
        label: "消费优惠 / 减免",
        value: "活动口径不统一",
        note: "官网不同语言页的权益数字不一致，不能当作统一固定补贴；大陆用户先看基础费率和可申请性。",
      },
    ],
    feeCheckedAt,
    feeSources: [
      { label: "官网方案与权益", url: "https://www.starryblu.com/en" },
      { label: "StarryBlu Card", url: "https://www.starryblu.com/en/starrycard" },
      { label: "中文地区状态", url: "https://www.starryblu.com/zh" },
      {
        label: "官方 Card 介绍",
        url: "https://blog.starryblu.com/starryblu-card-spend-globally-without-extra-fees/",
      },
    ],
  },
  {
    id: "gate-card",
    name: "Gate Card",
    issuer: "Gate",
    issuerUrl: "https://www.gate.com",
    iconUrl: "/images/perks/gate-card.jpg",
    inviteCode: "WISEGATE",
    registerLink: "/articles/vcard/GUhygjYV",
    tutorialLink: "/articles/vcard/GUhygjYV",
    ratingLabel: "实测开卡",
    ai: {
      label: "教程已接入",
      tone: "usable",
      detail: "已补充 Gate 注册、Gate Card 申请和基础消费测试流程。",
    },
    payment: {
      applePay: "yes",
      googlePay: "yes",
      detail: "Gate 已发布 Apple Pay 和 Google Pay 绑定说明；你实测支付宝、美团可用，微信暂不支持。",
    },
    status: "实测推荐",
    usage: "教程覆盖 Gate 注册、100U 入金奖励、Gate Card 申请、支付宝绑定和美团消费测试；适合作为交易所账户内衔接日常消费的虚拟 U 卡。",
    bestFor: ["交易所卡", "支付宝", "美团消费", "开卡简单"],
    feeSummary:
      "Gate Card 对大陆用户的申请门槛较低：交易所注册可用中国身份证完成，卡片申请按教程填写即可。经典 / 铂金卡虚拟卡发行、年费、月费及不活跃费均为 0；加密资产兑换 0.9%，非美元换汇 0.4%。",
    feeItems: [
      {
        label: "申请 / KYC",
        value: "中国身份证完成交易所 KYC",
        note: "你的教程实测居住国和国籍选中国、证件类型选身份证；卡片申请未作为境外地址证明主线。",
      },
      {
        label: "开卡 / 持有",
        value: "发行、年费、月费、不活跃费均 0",
        note: "这里采用经典 / 铂金卡当前官方口径；Standard Card 的部分费用可能不同。",
      },
      {
        label: "加密资产兑换",
        value: "0.9%",
        note: "单笔金额低于 2 USD 时不按比例，改收固定 0.05 USD。",
      },
      {
        label: "外汇 / 跨境",
        value: "非 USD 0.4%",
        note: "由卡组织汇率结算；Standard Card 当前公开页为 1%，需先确认自己的卡种。",
      },
      {
        label: "支付绑定",
        value: "支付宝 / 美团可用；微信不支持",
        note: "这是教程实测结果；Apple Pay / Google Pay 绑定看官方钱包说明和实际卡 BIN。",
      },
      {
        label: "补卡 / 争议",
        value: "25 / 30 USD",
        note: "实体卡补发 25 USD；发起拒付 30 USD。",
      },
      {
        label: "消费优惠 / 减免",
        value: "1%–8%，月上限 5–400 USDT",
        note: "由 T0–T5 等级决定；100 积分按 1 USDT 兑换，排除项与等级规则以活动页为准。",
      },
    ],
    feeCheckedAt,
    feeSources: [
      { label: "经典 / 铂金费率", url: "https://www.gate.com/zh/help/gatecard/gcd1213/50034" },
      { label: "申请条件", url: "https://www.gate.com/zh/help/gatecard/gcd1213/50051" },
      { label: "消费优惠规则", url: "https://www.gate.com/zh/help/gatecard/benefits/49985" },
    ],
  },
  {
    id: "mexc-card",
    name: "MEXC Card",
    issuer: "MEXC",
    issuerUrl: "https://www.mexc.com",
    iconUrl: "/images/perks/mexc-card.jpg",
    inviteCode: null,
    registerLink: "https://www.mexc.com/buy-crypto/mexc-card",
    tutorialLink: null,
    ratingLabel: "地区受限",
    ai: {
      label: "AI 订阅待测试",
      tone: "pending",
      detail: "费率可整理，但大陆用户不是当前公开支持主线，AI 商户兼容性仍需实际验证。",
    },
    payment: {
      applePay: "partial",
      googlePay: "yes",
      detail: "官方重点宣传 Google Pay；Apple Wallet 口径需看当前卡片页面和实际 BIN。",
    },
    status: "待补教程",
    usage: "当前官方公开卡片支持地区有限，不适合作为大陆用户主推；先保留费率信息，个人使用体验后续再补。",
    bestFor: ["地区受限", "交易所卡", "费率已整理", "AI 订阅待测"],
    feeSummary:
      "MEXC Card 当前不作为大陆用户主线推荐：公开支持地区有限。可参考的基础费率是发卡费和年费为 0，消费费 1%，非本位币消费按 Visa 汇率且不额外加价。",
    feeItems: [
      {
        label: "申请 / KYC",
        value: "Advanced KYC；大陆用户非主线",
        note: "公开帮助中心列出支持地区有限；大陆用户不要按“可直接申请”理解。",
      },
      { label: "开卡 / 年费", value: "0 / 0", note: "公开卡片页面当前免发卡费和年费。" },
      {
        label: "充值 / 入金",
        value: "0（产品页口径）",
        note: "需先将 USDT 等资产转入 Fiat 账户；不同入金路径本身可能有网络或交易费用。",
      },
      { label: "消费", value: "1%", note: "按每笔卡片消费金额收取。" },
      {
        label: "外汇 / 跨境",
        value: "无额外加价",
        note: "采用 Visa 汇率。另有官方 Learn 页面提到不同口径，最终应以开卡后台为准。",
      },
      {
        label: "消费限额",
        value: "单笔 / 日 50,000 USDT",
        note: "年度 1,000,000 USDT；每日最多 50 笔、每年最多 1,040 笔。",
      },
      {
        label: "消费优惠 / 减免",
        value: "活动等级制",
        note: "按 M-Score / 等级活动计算，比例、上限和发放日可能随活动调整，不作为基础费率承诺。",
      },
      {
        label: "其他费用",
        value: "主帮助中心未完整披露",
        note: "官方不同页面存在口径差异，不在这里引用未经统一确认的数字，请在 App 核验。",
      },
    ],
    feeCheckedAt,
    feeSources: [
      {
        label: "申请、费用与限额",
        url: "https://www.mexc.com/support/article/how-to-apply-for-mexc-card-apac-400415248342093824",
      },
      { label: "MEXC Card 产品页", url: "https://www.mexc.com/buy-crypto/mexc-card" },
      {
        label: "消费优惠 FAQ",
        url: "https://www.mexc.com/support/article/mexc-card-apac-rewards-faq-400416193234899968",
      },
    ],
  },
  {
    id: "mp-chat-card",
    name: "MP Chat Card",
    issuer: "MP Chat",
    issuerUrl: "https://mp.net",
    iconUrl: "/images/perks/mp-chat.png",
    inviteCode: "61298139",
    registerLink: "https://mp.net/i/WiseInvest",
    tutorialLink: "/articles/vcard/ou6gFWrn",
    ratingLabel: "教程已接入",
    ai: {
      label: "AI 订阅可用",
      tone: "usable",
      detail: "教程主线覆盖 ChatGPT、Claude 等订阅场景，适合作为 AI 会员和日常线上消费备选。",
    },
    payment: {
      applePay: "partial",
      googlePay: "yes",
      detail: "Cloud / Flash 卡对 Apple Pay 支持不同，Google Pay 按官方帮助页可用，申请前看卡种。",
    },
    status: "实测推荐",
    usage: "教程已补充 MPCard 介绍、实名开卡、币安充值链路和 AI 订阅福利；云影卡偏线上消费，瞬行卡适合 Apple Pay。",
    bestFor: ["AI 订阅", "微信 / 支付宝", "Apple Pay", "线上消费"],
    feeSummary:
      "MPChat 先作为待测卡保留：虚拟卡开卡费 10 USDT，月费、年费和管理费为 0；消费费 0.8%，1 USD 及以下交易另有 0.15 USD 小额处理费，外汇费用由 Visa 透传。",
    feeItems: [
      {
        label: "申请 / KYC",
        value: "年满 18 岁；KYC1",
        note: "需政府证件和自拍活体；30+ 国家和地区不可开卡，最终以 App 审核为准。",
      },
      {
        label: "虚拟卡开卡",
        value: "10 USDT",
        note: "旧申请教程仍写 9.9 USDT，最新专门费率页已改为 10 USDT；申请费不可退，以下单页为准。",
      },
      {
        label: "持有费用",
        value: "月费 / 年费 / 管理费均 0",
        note: "销卡费当前为 3 USDT。",
      },
      {
        label: "消费 / 换汇",
        value: "0.8%；FX 透传",
        note: "卡片本位币为 USD；非美元交易的卡组织外汇费用按实际结果透传。",
      },
      {
        label: "小额交易",
        value: "≤ 1 USD：0.15 USD / 笔",
        note: "这是固定处理附加费，订阅验证和小额预授权时尤其需要留意。",
      },
      {
        label: "失败 / 争议",
        value: "争议 35 USD；交易被拒 0.8 USD",
        note: "每卡每月前两笔拒绝交易免收；高撤销率时，金额不少于 5 USD 的撤销交易收 0.8 USD。",
      },
      {
        label: "支付绑定",
        value: "Google 支持；Apple 分卡种",
        note: "Cloud / Flash 卡对 Apple Pay 支持不同，申请前看具体卡种说明。",
      },
    ],
    feeCheckedAt,
    feeSources: [
      { label: "卡片费率与限额", url: "https://help.mp.net/en/articles/12351033-mpchat-card-limits-and-fees" },
      {
        label: "当前开卡费",
        url: "https://help.mp.net/en/articles/14178557-how-much-does-it-cost-to-apply-for-a-virtual-card-u-card-what-is-the-issuance-fee",
      },
      { label: "虚拟卡申请", url: "https://help.mp.net/en/articles/12351006-how-do-i-apply-for-a-virtual-card" },
      {
        label: "KYC 等级",
        url: "https://help.mp.net/en/articles/14810990-mpchat-identity-tiers-registered-and-kyc1-and-what-each-unlocks",
      },
      {
        label: "持有费用",
        url: "https://help.mp.net/en/articles/14178582-are-there-any-monthly-annual-or-management-fees-for-your-cards",
      },
      {
        label: "不支持地区",
        url: "https://help.mp.net/en/articles/15555863-which-countries-and-regions-cannot-open-an-mpcard-unsupported-regions-list",
      },
    ],
  },
];

export const cardStats = [
  { label: "已整理卡片", value: virtualCardProducts.length },
  {
    label: "AI 订阅可用",
    value: virtualCardProducts.filter((card) => card.ai.tone === "strong" || card.ai.tone === "stable" || card.ai.tone === "usable").length,
  },
  {
    label: "待补教程",
    value: virtualCardProducts.filter((card) => !card.tutorialLink).length,
  },
];
