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
      applePay: "partial",
      googlePay: "partial",
      detail: "APAC 官方列 Apple Pay、Google Pay 支持；作者既有卡有支付宝使用记录，其他版本和微信需分别核对。",
    },
    status: "主力使用",
    usage:
      "日常使用最佳，稳定渠道认可度高，支付宝识别友好；也是 GiffGaff 付款和日常小额消费的主力卡。",
    bestFor: ["支付宝", "GiffGaff", "日常消费", "Web3 支付"],
    feeSummary:
      "Bitget Wallet 卡按版本收费：APAC 充值费 0，消费时兑换费 0.05%–0.2%，非 USD 再加 1.7%；旧 Fiat24 卡充值费为 1%。APAC 申请地区名单与旧大陆入口不同，不能把旧教程当作当前统一资格。",
    feeItems: [
      {
        label: "申请 / KYC / 版本",
        value: "先区分 APAC 与旧 Fiat24",
        note: "APAC 当前名单未列中国大陆；按真实身份、居住地和材料申请，不把境外地址当通用开卡办法。",
      },
      {
        label: "开卡 / 持有",
        value: "APAC 发行价看申请页；月费、年费 0",
        note: "APAC 费表未为所有入口单列统一发行价；旧 Fiat24 为开卡费、年费 0。余额要求另看申请页。",
      },
      {
        label: "APAC 充值 / 消费",
        value: "充值 0；兑换 0.05%–0.2%",
        note: "链上费用另计；美元消费不加 FX，非美元另加 1.7%。",
      },
      {
        label: "旧 Fiat24 卡",
        value: "充值 1%；换汇差价约 1%",
        note: "同币种购买无额外消费费；不得套用到 APAC。",
      },
      {
        label: "消费奖励",
        value: "Assetback 基础 2%，达标 3%",
        note: "有月合格消费额度、商户排除项；旧零手续费权益于 2026 年 7 月底结束，不能重复叠加。",
      },
    ],
    feeCheckedAt: "2026-11-17",
    feeSources: [
      {
        label: "APAC 费率",
        url: "https://web3.bitget.com/helpCenter/431",
      },
      {
        label: "APAC 申请地区",
        url: "https://web3.bitget.com/helpCenter/425",
      },
      {
        label: "旧 Fiat24 费用",
        url: "https://web3.bitget.com/helpCenter/241",
      },
      {
        label: "Assetback 奖励",
        url: "https://web3.bitget.com/helpCenter/article/867",
      },
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
      "SafePal × Fiat24 联名入口开户、管理和充值费为 0；链上 Gas、换币费用另算。当前官方费表列非 USD 结算加收 1%，退款按原币种收费；不是旧资料中的“非 EUR”。",
    feeItems: [
      {
        label: "申请 / KYC",
        value: "钱包、Fiat24 账户与卡片分开",
        note: "按本人真实资料通过账户及卡片审核，教程保留 NFC 认证步骤。",
      },
      {
        label: "开卡 / 管理",
        value: "0",
        note: "适用于 SafePal 联名入口。",
      },
      {
        label: "充值",
        value: "0",
        note: "链上 Gas、兑换其他资产为 USDC 的费用另计。",
      },
      {
        label: "消费 / 换汇",
        value: "非 USD 结算 1%",
        note: "美元消费未另列费用；不套用其他 Fiat24 联名或独立账户费率。",
      },
      {
        label: "退款",
        value: "1 USD / 1 EUR / 1 CHF / 7 CNH",
        note: "按原付款币种收取。",
      },
      {
        label: "IBAN 转账",
        value: "内部 / 外部均 0",
        note: "SafePal 与 Fiat24 不收该项费用，中间行和收款行可能另收。",
      },
      {
        label: "奖励",
        value: "未确认固定全场消费返现",
        note: "冷钱包礼品或活动任务与消费返现分开。",
      },
    ],
    feeCheckedAt: "2026-11-17",
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
      "以 APAC 美元虚拟卡为例：当前发行费、年费为 0；用加密余额支付收 0.9% 兑换费，非 USD 再加 2% FX。Base 奖励为 2%、月上限等值 5 USD；法币余额支付不参与这套奖励。",
    feeItems: [
      {
        label: "申请 / KYC / 地区",
        value: "卡片资格与交易所账户分开",
        note: "真实居住地需符合对应 Card Program；APAC 规则不套给 AIFC 等地区。",
      },
      {
        label: "APAC 虚拟卡开卡",
        value: "当前发行、年费 0",
        note: "实体卡与其他地区费用另查。",
      },
      {
        label: "充值 / 资金来源",
        value: "从资金账户等可用余额支付",
        note: "没有独立卡钱包，入金通道和链上费用另算。",
      },
      {
        label: "加密余额支付",
        value: "0.9%",
        note: "在 One-Click Sell 报价上加收；资金来自 Funding Account 等可用资金，不是独立卡钱包。",
      },
      {
        label: "APAC 外汇",
        value: "非 USD 2%",
        note: "AIFC 的 2% 为国际交易费，跨境 USD 交易也可能触发。",
      },
      {
        label: "Base 消费奖励",
        value: "2%；月上限 5 USD 等值",
        note: "只计合格加密资产付款；月消费 500 USD 可升 Beta，比例仍 2%，上限升至 50 USD。",
      },
      {
        label: "支付绑定",
        value: "APAC：Google 支持，Apple 不支持",
        note: "其他地区按官方 FAQ 逐项核对。",
      },
    ],
    feeCheckedAt: "2026-11-17",
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
      detail: "Delta 官方列 Apple Pay、Google Pay、Alipay；Apple 每笔另加 0.15%，Google 0.10%，3DS 0.38 USD；不借用 Alpha 的微信支持结果。",
    },
    status: "轻量开卡",
    usage:
      "开卡流程相对轻量，适合 AI 订阅和小额消费；是否需要补充资料以当前开卡页为准，50U 保证金属于冻结资金，满足规则后可退。",
    bestFor: ["AI 订阅", "轻量开卡", "随用随开", "保证金可退"],
    feeSummary:
      "Delta 当前公开费表：开卡 9.9U，另冻结 50U 保证金，月费 1U；充值 0.5%。USD 订单授权费 0.05 USD；非 USD 为 0.40 USD 加 1.5% 跨境费，支付工具和 3DS 可能另收费。",
    feeItems: [
      {
        label: "申请 / KYC",
        value: "按当前 Delta 规则提交资料",
        note: "旧教程的简化认证不能作为永久免验证承诺。",
      },
      {
        label: "开卡 / 保证金",
        value: "9.9U + 冻结 50U；月费 1U",
        note: "保证金不是消费余额；符合销卡条件后，30 天与 60 天分别退 50%。",
      },
      {
        label: "持有费用",
        value: "月费 1U；年费 0",
        note: "已按当前官方费表纠正旧“无月费”说明。",
      },
      {
        label: "充值",
        value: "0.5%，最低 0.01 USD",
        note: "首次最低 10 BUSD，之后最低 1 BUSD；链上费用另计。",
      },
      {
        label: "USD 消费",
        value: "每笔授权费 0.05 USD",
        note: "未含充值、月费及特殊验证费。",
      },
      {
        label: "非 USD 消费",
        value: "0.40 USD / 笔 + 1.5%",
        note: "1.5% 是同一跨境费用，不因费表两个栏目出现就重复算两次。",
      },
      {
        label: "支付工具附加费",
        value: "Apple 0.15%；Google 0.10%",
        note: "Delta 的 3DS 验证另收 0.38 USD，按订单触发项目计入。",
      },
    ],
    feeCheckedAt: "2026-11-17",
    feeSources: [
      {
        label: "Delta 费率与限额",
        url: "https://support.benpay.com/eng/docs/Rate-and-limit-issues",
      },
      {
        label: "保证金规则",
        url: "https://support.benpay.com/eng/docs/BenPay-Card-Security-Deposit-Guide",
      },
      {
        label: "充值规则",
        url: "https://support.benpay.com/eng/docs/Recharge-FAQs",
      },
      {
        label: "分卡种支付支持与附加费",
        url: "https://support.benpay.com/eng/docs/Which-platform-merchants-and-online-payment-platforms-does-BenPay-Card-support",
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
    inviteCode: "WISEGGGG",
    registerLink: "/articles/vcard/GUhygjYV",
    tutorialLink: "/articles/vcard/GUhygjYV",
    ratingLabel: "实测开卡",
    ai: {
      label: "教程已接入",
      tone: "usable",
      detail: "已补充 Gate 注册、Gate Card 申请和基础消费测试流程。",
    },
    payment: {
      applePay: "partial",
      googlePay: "yes",
      detail: "Google Pay 有官方支持；Apple Pay 官方要求先确认卡种。作者实测支付宝、美团可用，微信当时未成功。",
    },
    status: "实测推荐",
    usage: "教程覆盖 Gate 注册与平台充值奖励、入金 1000U 并完成 10000U 合约交易后申请 Wise VIP、Gate Card 申请、支付宝绑定和美团消费测试；适合作为交易所账户内衔接日常消费的虚拟 U 卡。",
    bestFor: ["交易所卡", "支付宝", "美团消费", "开卡简单"],
    feeSummary:
      "Gate 按卡种拆开：经典 / 铂金消费兑换 0.9%、非 USD 0.4%；Blue / AI 常规充值 0.9%，非 USD 分别 1.7% / 1.5%。T0 常规奖励 1%，月上限 5U、单笔上限 2U；交易所奖励另算。",
    feeItems: [
      {
        label: "申请 / KYC",
        value: "交易所与卡片分别审核",
        note: "不能把完成交易所 KYC 当成所有卡种的申请资格。",
      },
      {
        label: "经典 / 铂金开卡",
        value: "经典 / 铂金发行与月费 0；Blue / AI 发行限免",
        note: "消费兑换费 0.9%；单笔低于 2 USD 时改收 0.05 USD。",
      },
      {
        label: "经典 / 铂金 FX",
        value: "非 USD 0.4%",
        note: "不套用到 Blue / AI Card。",
      },
      {
        label: "Blue / AI 开卡",
        value: "虚拟发行限时免费；月费 0",
        note: "首次 10 USDT 为可消费余额，首笔充值免手续费，申请失败退回。",
      },
      {
        label: "Blue / AI 充值",
        value: "Blue / AI 充值 0.9%；经典 / 铂金消费兑换 0.9%",
        note: "非 USD：Blue 1.7%，AI 1.5%；退款 2%，撤销 1 USD。",
      },
      {
        label: "消费奖励",
        value: "T0：1%，月最多 5U，单笔最多 2U",
        note: "100 积分 = 1 USDT；高等级有消费 / VIP 条件，按消费升级次月生效。",
      },
      {
        label: "AI 卡专属",
        value: "T1 起：首笔合格 AI 订阅 50%",
        note: "每自然月上限 10 USDT，以现金券发放；不是所有卡的通用权益。",
      },
    ],
    feeCheckedAt: "2026-11-17",
    feeSources: [
      {
        label: "经典 / 铂金费率",
        url: "https://www.gate.com/help/gatecard/gcd1213/50034",
      },
      {
        label: "Blue / AI 费率",
        url: "https://www.gate.com/help/gatecard/gc7/100745/gate-card-fee-rates-limits",
      },
      {
        label: "消费积分规则",
        url: "https://www.gate.com/help/gatecard/benefits/49985",
      },
      {
        label: "AI 卡权益",
        url: "https://www.gate.com/help/gatecard/benefits/102560/ai-elite-card-exclusive-benefits",
      },
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
      applePay: "yes",
      googlePay: "yes",
      detail: "云影和无界均支持 Apple Pay、Google Pay、支付宝、微信；瞬行已退役，不能继续按旧卡种建议申请。",
    },
    status: "实测推荐",
    usage: "当前虚拟卡选择云影，实体卡选择无界；瞬行已退役并迁移到云影。两种现行卡均有 Apple Pay、Google Pay、支付宝和微信支持说明。",
    bestFor: ["AI 订阅", "微信 / 支付宝", "Apple Pay", "线上消费"],
    feeSummary:
      "云影发行费 10 USDT，月费、年费和管理费 0。消费费 0.8%，兑换报价和非美元 FX 另计；≤1 USD 交易另加 0.10 USD。瞬行已退役，云影与无界从 2026-11-12 起均支持 Apple Pay。",
    feeItems: [
      {
        label: "申请 / KYC",
        value: "年满 18 岁；KYC1",
        note: "按实际居住地、证件和官方支持地区申请。",
      },
      {
        label: "云影开卡",
        value: "10 USDT",
        note: "官方邀请计划中，被邀请用户成功申请首卡可获 5 USDT 奖励；任务条件另核。",
      },
      {
        label: "固定持有",
        value: "月费 / 年费 / 管理费 0",
        note: "无界实体卡发行 100 USDT；旧瞬行已退役。",
      },
      {
        label: "兑换 / 消费",
        value: "消费 0.8%；非 USD FX 透传",
        note: "官方兑换示例为 1 USDT 约得 0.993–0.998 USD，不能把 0.8% 当总成本。",
      },
      {
        label: "充值通道",
        value: "Binance Pay 1%；链上费用另看",
        note: "两种路径分别核算，不同时叠加；到账需满足最低入金额要求。",
      },
      {
        label: "小额 / 验证",
        value: "≤1 USD 加 0.10 USD；3DS 0.03 USD",
        note: "特殊费用按交易触发；普通账号验证前 10 次 / 月免费，超出每次 1 USD。",
      },
      {
        label: "交易被拒",
        value: "每月前 5 笔免费，其后 0.80 USD / 笔",
        note: "按账户计算；余额不足或输错资料后先查原因，不反复重试。",
      },
      {
        label: "支付绑定",
        value: "Apple / Google / 支付宝 / 微信",
        note: "Cloud 和 Boundless 均支持，商户受理和地区限制仍单独适用。",
      },
    ],
    feeCheckedAt: "2026-11-17",
    feeSources: [
      {
        label: "最新费率与支付支持",
        url: "https://help.mp.net/en/articles/12351033-mpchat-card-limits-and-fees",
      },
      {
        label: "开卡费与首卡奖励",
        url: "https://help.mp.net/en/articles/14178557-how-much-does-it-cost-to-apply-for-a-virtual-card-u-card-what-is-the-issuance-fee",
      },
      {
        label: "瞬行退役与余额迁移",
        url: "https://help.mp.net/en/articles/17013713-flash-card-permanently-retired-on-30-september-2026-issued-cards-converted-to-cloud-cards-balances-moved-to-total-assets",
      },
      {
        label: "Binance Pay 费用",
        url: "https://help.mp.net/en/articles/12352662-how-do-i-use-binance-pay-to-top-up-my-mpchat-account",
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
