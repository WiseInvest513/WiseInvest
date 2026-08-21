export type CardAiTone = "strong" | "stable" | "usable" | "watch" | "pending";

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
  status: string;
  usage: string;
  bestFor: string[];
  feeSummary: string;
  feeItems: CardFeeItem[];
  feeCheckedAt?: string;
  feeSources?: CardFeeSource[];
}

const feeCheckedAt = "2026-08-15";

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
    status: "主力使用",
    usage:
      "日常使用最佳，稳定渠道认可度高，支付宝识别友好；也是 GiffGaff 付款和日常小额消费的主力卡。",
    bestFor: ["支付宝", "GiffGaff", "日常消费", "Web3 支付"],
    feeSummary:
      "Bitget Wallet Card 必须按发卡地区区分：中国大陆卡开卡、年费和消费费为 0，充值 1%、兑换损耗约 1%；欧非拉卡激活 0.1 / 10 USD，亚太实体卡 49 USD，两者非 USD 消费费均为 1.7%。",
    feeItems: [
      {
        label: "申请 / KYC",
        value: "支持地区 + KYC",
        note: "中国大陆流程要求大陆现居、中国护照、NFC 手机，仅支持助记词或 MPC 钱包，且钱包资产不少于 10 USD。",
      },
      {
        label: "中国大陆卡",
        value: "开卡 / 年费 / 消费 0",
        note: "充值费 1%，加密资产换汇损耗约 1%；该口径不能套用到其他地区卡片。",
      },
      {
        label: "欧 / 非 / 拉卡",
        value: "激活 0.1 / 10 USD；非 USD 1.7%",
        note: "KYC 通过 72 小时内激活为 0.1 USD，超过 72 小时为 10 USD。",
      },
      {
        label: "亚太实体卡",
        value: "49 USD；非 USD 1.7%",
        note: "充值为 0、加密兑换约 0.5%；ATM 提现 1%，最低 5 USD，另可能叠加换汇费用。",
      },
      {
        label: "中国大陆转账",
        value: "成功 0；失败退回 10 EUR / CHF",
        note: "这是 Fiat24 转账口径；中间行或收款行仍可能收费。",
      },
      {
        label: "支付宝 / 微信",
        value: "单笔 > ¥200：平台收 3%",
        note: "该费用由支付平台收取，不是 Bitget Wallet 或发卡方加收。",
      },
      {
        label: "零手续费活动",
        value: "先收后返，标准月额度 400 USD",
        note: "通常 T+1 至 T+3 返还，部分卡片或活动额度为 600 USD；这不是所有地区常驻的额外现金返现。",
      },
    ],
    feeCheckedAt,
    feeSources: [
      { label: "中国大陆费用", url: "https://web3.bitget.com/zh/helpCenter/241" },
      { label: "中国大陆申请条件", url: "https://web3.bitget.com/zh/helpCenter/235" },
      { label: "亚太卡费用", url: "https://web3.bitget.com/zh/helpCenter/431" },
      { label: "欧非拉卡费用", url: "https://web3.bitget.com/zh-CN/helpCenter/283" },
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
    status: "主力备选",
    usage:
      "界面流程没有 Bitget Wallet 那么顺，但用于盈透 / 嘉信汇款更简单，也适合订阅 Vercel 等网站产品。",
    bestFor: ["盈透入金", "嘉信入金", "Vercel", "资金流转"],
    feeSummary:
      "SafePal / Fiat24 联名入口当前开户、管理和 IBAN 转账为 0，入金处于长期减免期；非 EUR 结算收 1%。官方“启用币种零换汇”说明与费率表有边界差异，交易前应看 App 预览。",
    feeItems: [
      {
        label: "申请 / KYC",
        value: "Fiat24 KYC + 国籍 / 居住地均受支持",
        note: "需完成护照、地址定位等身份与合规审核；无信用检查，也不强制质押资产。",
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
        label: "ATM / 返现",
        value: "ATM 未披露；无全场常驻返现",
        note: "当前为虚拟 Mastercard。酒店等合作活动可能另有权益，但不等同于所有刷卡消费返现。",
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
    status: "订阅常用",
    usage:
      "日常使用频率不算最高，但在 AI 会员订阅上表现比较稳；账户风控仍需要自己控制。",
    bestFor: ["Claude Code", "AI 订阅", "交易所账户", "Apple Pay"],
    feeSummary:
      "Bybit Card 按发卡地区计费：虚拟卡当前为 0，实体卡约 0–29.99 USD / USDT，年费、不活跃费和注销费为 0；加密兑换 0.5%–0.9%，外汇费 1%–7%。",
    feeItems: [
      {
        label: "申请 / KYC",
        value: "身份认证 + 支持地区",
        note: "需通过 Eligibility Check；部分地区还需填写账单地址、手机号等卡片独立资料。",
      },
      {
        label: "开卡 / 持有",
        value: "虚拟卡 0；实体卡 0–29.99 USD / USDT",
        note: "亚太实体卡当前通常为 5 USDT；地区和 VIP 等级会影响费用。年费、不活跃费、注销费均为 0。",
      },
      {
        label: "加密资产兑换",
        value: "通常 0.5%–0.9%",
        note: "亚太卡当前为 0.9%，叠加 Bybit 一键卖币汇率；使用同币种法币余额则不触发该费用。",
      },
      {
        label: "外汇 / 跨境",
        value: "约 1%–7%，依地区",
        note: "亚太卡当前表格口径为 2%；按 Mastercard 汇率结算，部分卡还会有授权汇率缓冲。",
      },
      {
        label: "ATM 提现",
        value: "超出月度免费额后 2%",
        note: "仅实体卡；多数地区每月前 100 USD 等值免 Bybit 提现费，ATM 运营方仍可能另收费。",
      },
      {
        label: "消费返现",
        value: "2%–10%，月上限 5–600 USD",
        note: "返现等级、任务门槛、合格 MCC 和每月上限依地区及活动规则变化。",
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
        label: "官方返现规则",
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
    status: "持续观察",
    usage:
      "专注转账和安全，带地址检测能力，支持币种更多；实体卡已申请，后续等到卡后补充实测。",
    bestFor: ["转账", "地址检测", "多币种", "实体卡"],
    feeSummary:
      "UU Wallet 官网确认开卡需 KYC、服务覆盖 160+ 国家和地区，但未公开卡片开卡费、保证金、年费、消费、外汇、ATM 或返现费率，仍需在 App 下单页逐项确认。",
    feeItems: [
      {
        label: "申请 / KYC",
        value: "需 KYC；覆盖 160+ 国家和地区",
        note: "官网未公布具体可发行地区、年龄和证件清单，最终资格以 App 审核为准。",
      },
      {
        label: "开卡 / 持有",
        value: "官方公开页未披露",
        note: "请在选择虚拟卡或实体卡后，以提交订单前显示的币种和金额为准。",
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
        label: "钱包外部提现",
        value: "TRC 1U；ERC 2U / 笔",
        note: "这是 UU Wallet 钱包外部 USDT 提现费，不是卡片提现或 ATM 费用。",
      },
      {
        label: "实体卡",
        value: "下单页核验",
        note: "发行、物流、激活和 ATM 费用尚无可公开核验的统一表格。",
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
    ratingLabel: "资料审核",
    ai: {
      label: "AI 订阅友好",
      tone: "strong",
      detail: "Delta Card 门槛低，后续 AI 订阅专门卡如果上线，可作为重点观察对象。",
    },
    status: "轻量开卡",
    usage:
      "开卡流程相对轻量，但当前官方流程要求提交资料并通过审核，不能再标注为免 KYC；50U 保证金属于冻结资金，满足规则后可退。",
    bestFor: ["AI 订阅", "轻量开卡", "随用随开", "保证金可退"],
    feeSummary:
      "Delta Card 开卡费 9.9U，另冻结 50U 可退保证金；充值费 0.5%，每笔消费收 0.35 USD + 1%，跨境交易再加 1%；无月费和年费。",
    feeItems: [
      {
        label: "申请 / 审核",
        value: "提交资料并通过审核",
        note: "官方申请流程会要求提交材料；具体证件和地区资格以当前开卡页为准，不再按“无 KYC”宣传。",
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
        label: "ATM / 提现",
        value: "不支持 ATM；提现费未公开",
        note: "可提回 BiyaPay 资金账户，但公开操作指南没有列出具体手续费。",
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
    tutorialLink: null,
    score: 5,
    ratingLabel: "返现权益",
    ai: {
      label: "AI 订阅观察",
      tone: "watch",
      detail: "更像权益和返现型 U 卡，AI 订阅稳定性需要继续实测。",
    },
    status: "热门观察",
    usage:
      "最近比较热门，权益和返现更有吸引力；开卡难度可能上升，适合能开就先研究。",
    bestFor: ["返现", "权益", "热门新卡", "U 卡体验"],
    feeSummary:
      "Plasma One 新版分 Lite、Core、Platinum：Lite 为 0，Core 为 199 USD / 年或锁定 20,000 XPL，Platinum 需锁定 100,000 XPL；国际卡非 USD 外汇费最高 1%，跨境费为 0。",
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
        note: "美国卡条款为国际交易费 1%；实际口径取决于发卡项目和申请地区。",
      },
      {
        label: "ATM / 银行提现",
        value: "合作方费用，确认前展示",
        note: "美国卡条款列现金预支费为 0，但 ATM 运营商或银行合作方仍可能另行收费。",
      },
      {
        label: "消费返现",
        value: "Lite 2%；Core 最高 3%；Platinum 最高 4%",
        note: "返现按月消费档位递减并以 XPL 发放；AI、航旅等分类权益可更高，但受额度、商户和排除规则限制。",
      },
    ],
    feeCheckedAt,
    feeSources: [
      { label: "产品与等级", url: "https://www.plasma.org/personal" },
      { label: "完整返现规则", url: "https://www.plasma.org/plasma-one-rewards" },
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
    status: "实测推荐",
    usage:
      "可以转账给银行、付款到国内，也能做中转；支持消费返现和定制卡号后几位，实体卡实测待补。",
    bestFor: ["港卡资金", "微信消费", "跨境付款", "实体卡"],
    feeSummary:
      "StarryBlu 官网公开了账户方案价格，并宣传卡消费交易费 0、无额外境外交易费；但开卡、充值、ATM 免费额度、超额费和地区可用状态没有统一公开数字，仍需在 App 核验。",
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
        label: "ATM 提现",
        value: "有月度免费额度，数值未公开",
        note: "不同方案额度不同；超额费率与 ATM 运营方费用需在 App 核对。",
      },
      {
        label: "消费返现",
        value: "随地区和活动变化",
        note: "英文官网宣传合格消费最高 100%，部分语言页则出现 1.3% 等口径，不能当作统一固定返现。",
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
    status: "实测推荐",
    usage: "教程覆盖 Gate 注册、100U 入金奖励、Gate Card 申请、支付宝绑定和美团消费测试；适合作为交易所账户内衔接日常消费的虚拟 U 卡。",
    bestFor: ["交易所卡", "支付宝", "美团消费", "返现"],
    feeSummary:
      "Gate Card 经典 / 铂金卡：虚拟卡和实体卡发行、年费、月费及不活跃费均为 0；加密资产兑换 0.9%，非美元换汇 0.4%，ATM 提现 2%。",
    feeItems: [
      {
        label: "申请 / KYC",
        value: "Level 2 KYC；地区实时判断",
        note: "需绑定邮箱和手机号，证件须与 Gate 认证一致；部分卡需提交三个月内地址证明。",
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
      { label: "ATM 提现", value: "2%", note: "ATM 运营方可能另收费用。" },
      {
        label: "补卡 / 拒付",
        value: "25 / 30 USD",
        note: "实体卡补发 25 USD；发起拒付 30 USD。",
      },
      {
        label: "消费返现",
        value: "1%–8%，月上限 5–400 USDT",
        note: "由 T0–T5 等级决定；100 积分按 1 USDT 兑换，排除项与等级规则以活动页为准。",
      },
    ],
    feeCheckedAt,
    feeSources: [
      { label: "经典 / 铂金费率", url: "https://www.gate.com/zh/help/gatecard/gcd1213/50034" },
      { label: "申请条件", url: "https://www.gate.com/zh/help/gatecard/gcd1213/50051" },
      { label: "返现规则", url: "https://www.gate.com/zh/help/gatecard/benefits/49985" },
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
    ratingLabel: "APAC 卡",
    ai: {
      label: "AI 订阅待测试",
      tone: "pending",
      detail: "APAC 卡费率已整理，AI 商户兼容性仍需实际订阅验证。",
    },
    status: "待补教程",
    usage: "当前官方公开的是 APAC 卡口径，发行和年费为 0、消费费 1%；支持地区有限，个人使用体验后续再补。",
    bestFor: ["APAC 地区", "交易所卡", "消费返现", "AI 订阅待测"],
    feeSummary:
      "MEXC Card APAC：发卡费和年费为 0，消费费 1%，非本位币消费按 Visa 汇率且不额外加价；需完成 Advanced KYC，目前公开支持台、菲、泰、越。",
    feeItems: [
      {
        label: "申请 / KYC",
        value: "Advanced KYC",
        note: "部分用户还需补充人脸识别和地址证明；当前帮助中心列出的地区为台湾、菲律宾、泰国和越南。",
      },
      { label: "开卡 / 年费", value: "0 / 0", note: "APAC 虚拟卡当前免发卡费和年费。" },
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
        label: "返现",
        value: "4%–10%，月上限 100–800 USDT",
        note: "按 M-Score / 等级活动计算；返现比例、上限和发放日可能随活动调整。",
      },
      {
        label: "不活跃 / ATM / 转账",
        value: "主帮助中心未完整披露",
        note: "官方不同页面存在口径差异，不在这里引用未经统一确认的数字，请在 App 核验。",
      },
    ],
    feeCheckedAt,
    feeSources: [
      {
        label: "APAC 申请、费用与限额",
        url: "https://www.mexc.com/support/article/how-to-apply-for-mexc-card-apac-400415248342093824",
      },
      { label: "MEXC Card 产品页", url: "https://www.mexc.com/buy-crypto/mexc-card" },
      {
        label: "APAC 返现 FAQ",
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
    inviteCode: null,
    registerLink: "https://mp.net",
    tutorialLink: null,
    ratingLabel: "费率已核验",
    ai: {
      label: "AI 订阅待测试",
      tone: "pending",
      detail: "虚拟卡定位适合订阅，但 AI 商户通过率和长期稳定性仍需实际测试。",
    },
    status: "待补教程",
    usage: "公开费率颗粒度较完整，虚拟卡支持订阅和国内支付绑定；个人实测、教程与风控体验后续再补。",
    bestFor: ["虚拟卡", "AI 订阅待测", "微信 / 支付宝", "高限额"],
    feeSummary:
      "MPChat Cloud / Flash 虚拟卡最新专门费率页列开卡费 10 USDT，月费、年费和管理费为 0；消费费 0.8%，1 USD 及以下交易另有 0.15 USD 小额处理费，外汇费用由 Visa 透传。",
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
        label: "提现",
        value: "线上 2.1 USDT / 笔；ATM 2%",
        note: "同日线上提现超 5,000 USDT 的部分另收 0.1%；ATM 仅实体卡，最低 1 USD。",
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
