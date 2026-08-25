import {
  Banknote,
  BookOpen,
  Building2,
  CreditCard,
  Gift,
  Landmark,
  Search,
  Target,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type StarterPath = {
  id: string;
  title: string;
  question: string;
  description: string;
  href: string;
  primaryAction: string;
  icon: LucideIcon;
  keywords: string[];
  steps: string[];
  tools: Array<{ label: string; href: string }>;
};

export const starterPaths: StarterPath[] = [
  {
    id: "vcard",
    title: "申请虚拟 U 卡",
    question: "我想订阅 ChatGPT、Claude，或者绑定 Apple Pay / 支付宝，应该看哪里？",
    description: "先从虚拟 U 卡资料库开始，对比 MPCard、Bitget Wallet、SafePal、BenPay、Bybit Card 的开卡门槛、邀请码、费率和支付绑定。",
    href: "/card",
    primaryAction: "查看 U 卡资料库",
    icon: CreditCard,
    keywords: ["虚拟 U 卡", "MPCard", "Apple Pay", "支付宝", "微信", "AI 订阅"],
    steps: ["确认用途：AI 订阅、日常消费还是资金流转", "比较是否需要 KYC、地址证明和开卡成本", "进入教程，按步骤完成注册、充值和绑定"],
    tools: [
      { label: "虚拟 U 卡教程合集", href: "/articles/vcard" },
      { label: "加密交易所入口", href: "/perk/crypto" },
    ],
  },
  {
    id: "crypto",
    title: "注册交易所并入金",
    question: "我想买 BTC / ETH / USDT，应该先注册哪个交易所？",
    description: "从 Binance、OKX、Bybit、Bitget 的注册、KYC、C2C 入金和返佣入口开始，先小额测试，再逐步使用现货、理财和链上钱包。",
    href: "/perk/crypto",
    primaryAction: "查看交易所入口",
    icon: Gift,
    keywords: ["Binance", "币安", "OKX", "欧易", "Bybit", "Bitget", "C2C 入金", "KYC"],
    steps: ["选择一个主交易所并完成注册", "完成 KYC 和安全设置", "先小额入金、买币、提现或转账测试"],
    tools: [
      { label: "交易所注册教程", href: "/articles/crypto" },
      { label: "BTC / ETH 定投实盘", href: "/practice/dca-investment" },
    ],
  },
  {
    id: "broker",
    title: "开港美股券商",
    question: "我想买美股、ETF 或港股，应该先开哪个券商？",
    description: "先看盈透、嘉信、复星、长桥等券商入口，再根据证件、入金方式、交易市场和长期持有需求选择账户。",
    href: "/perk/broker",
    primaryAction: "查看券商入口",
    icon: Building2,
    keywords: ["盈透", "IBKR", "嘉信", "Schwab", "港美股", "美股券商", "券商开户"],
    steps: ["确定要买美股、港股还是 ETF", "准备身份证件、地址证明和税务资料", "开户后先解决入金路径，再开始交易"],
    tools: [
      { label: "港美股券商教程", href: "/articles/broker" },
      { label: "仓位管理工具", href: "/tools/position-calculator" },
    ],
  },
  {
    id: "bank",
    title: "准备境外银行账户",
    question: "我想收美元、港币，或者给券商入金，银行账户怎么准备？",
    description: "先从 Wise、香港银行、新加坡银行和见证开户路径看起，重点判断开户门槛、转账能力、账户用途和后续入金链路。",
    href: "/perk/bank",
    primaryAction: "查看银行入口",
    icon: Landmark,
    keywords: ["Wise", "境外银行", "香港银行", "新加坡银行", "见证开户", "美元账户", "港币账户"],
    steps: ["明确用途：收款、消费、券商入金或资金中转", "准备证件、地址证明和手机号邮箱", "优先选择自己能稳定维护的账户组合"],
    tools: [
      { label: "境外银行教程", href: "/articles/bank" },
      { label: "国际互联入口", href: "/perk/global-access" },
    ],
  },
  {
    id: "dca",
    title: "开始长期定投",
    question: "我想长期定投 BTC、ETH、QQQ，应该怎么跟踪成本？",
    description: "从 Wise 的 BTC / ETH 定投实盘开始，看真实执行价格、收益曲线和明细，再用 DCA 击球区和复利工具辅助判断节奏。",
    href: "/practice/dca-investment",
    primaryAction: "查看定投实盘",
    icon: Target,
    keywords: ["BTC 定投", "ETH 定投", "QQQ 定投", "DCA", "收益曲线", "定投明细"],
    steps: ["先明确每月可投入现金流", "用实盘记录理解长期执行节奏", "用工具评估回撤、收益率和复利结果"],
    tools: [
      { label: "DCA 击球区", href: "/DCA" },
      { label: "复利计算器", href: "/tools/compound-calculator" },
    ],
  },
  {
    id: "tools",
    title: "使用投资工具",
    question: "我已经知道要做什么了，哪里能直接算？",
    description: "工具箱覆盖复利、仓位、补仓、合约、无常损失、Gas、资产增长和收益率回测，适合把模糊判断变成具体数字。",
    href: "/tools",
    primaryAction: "打开工具箱",
    icon: Wrench,
    keywords: ["复利计算器", "补仓计算器", "合约计算器", "仓位管理", "Gas", "投资工具"],
    steps: ["先选和当前问题最接近的工具", "填入真实成本、仓位或投入金额", "把结果用于风控和计划，而不是替代判断"],
    tools: [
      { label: "补仓计算器", href: "/tools/average-down" },
      { label: "合约计算器", href: "/tools/contract-calculator" },
    ],
  },
];

export const quickAnswerItems = [
  { question: "大陆用户怎么注册币安？", href: "/articles/crypto/GaM38JYk", answer: "从币安教程进入，先完成注册、KYC、安全设置，再小额 C2C 入金测试。", icon: Banknote },
  { question: "MPCard 邀请链接在哪里？", href: "/articles/vcard/ou6gFWrn", answer: "MPCard 教程里保留了产品专属邀请链接、邀请码和 MP 产品群入口。", icon: CreditCard },
  { question: "哪张 U 卡适合 AI 订阅？", href: "/card", answer: "进入虚拟 U 卡资料库，用 AI 订阅筛选，再查看每张卡的教程和费率。", icon: CreditCard },
  { question: "我想买美股先看什么？", href: "/perk/broker", answer: "先看券商入口，再根据盈透、嘉信、港资券商的材料和入金路径选择。", icon: Building2 },
  { question: "定投 BTC / ETH 看哪里？", href: "/practice/dca-investment", answer: "查看 Wise 的定投实盘、收益曲线和定投明细，再结合 DCA 工具。", icon: Target },
  { question: "找不到内容怎么办？", href: "/get", answer: "进入领取和行动入口页，或者使用导航栏搜索直接搜产品名和问题。", icon: Search },
];

export const starterSeoKeywords = Array.from(
  new Set(starterPaths.flatMap((path) => [path.title, ...path.keywords]))
);

export function getStarterPath(id: string) {
  return starterPaths.find((path) => path.id === id);
}
