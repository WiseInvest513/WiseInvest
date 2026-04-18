// ─────────────────────────────────────────────────────────────────────────────
// 信息中心 — 静态叙事数据（价格等动态数据由 /api/market/* 提供）
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════
// BTC 四年减半周期
// ══════════════════════════════════════════════════════════════════

export interface BTCCycle {
  cycleNum: number;
  halvingDate: string;
  halvingPrice: number;
  bullTopDate: string;
  bullTopPrice: number;
  bearBottomDate: string;
  bearBottomPrice: number;
  rewardBefore: number;
  rewardAfter: number;
  bullDays: number;
  bearDays: number;
  gainFromBottom: string;
}

export const btcCycles: BTCCycle[] = [
  {
    cycleNum: 1,
    halvingDate: "2012-11-28",
    halvingPrice: 12,
    bullTopDate: "2013-11-30",
    bullTopPrice: 1242,
    bearBottomDate: "2015-01-14",
    bearBottomPrice: 170,
    rewardBefore: 50,
    rewardAfter: 25,
    bullDays: 367,
    bearDays: 411,
    gainFromBottom: "103x",
  },
  {
    cycleNum: 2,
    halvingDate: "2016-07-09",
    halvingPrice: 650,
    bullTopDate: "2017-12-17",
    bullTopPrice: 19783,
    bearBottomDate: "2018-12-15",
    bearBottomPrice: 3191,
    rewardBefore: 25,
    rewardAfter: 12.5,
    bullDays: 526,
    bearDays: 363,
    gainFromBottom: "117x",
  },
  {
    cycleNum: 3,
    halvingDate: "2020-05-11",
    halvingPrice: 8600,
    bullTopDate: "2021-11-10",
    bullTopPrice: 69044,
    bearBottomDate: "2022-11-21",
    bearBottomPrice: 15476,
    rewardBefore: 12.5,
    rewardAfter: 6.25,
    bullDays: 548,
    bearDays: 376,
    gainFromBottom: "20x",
  },
  {
    cycleNum: 4,
    halvingDate: "2024-04-20",
    halvingPrice: 63000,
    bullTopDate: "2025-09-29",   // 实际周期最高点（Yahoo Finance 周K）
    bullTopPrice: 123513,
    bearBottomDate: "",
    bearBottomPrice: 0,
    rewardBefore: 6.25,
    rewardAfter: 3.125,
    bullDays: 527,               // 2024-04-20 → 2025-09-29（WolfyXBT预测534天，实际527天）
    bearDays: 0,
    gainFromBottom: "进行中",
  },
];

export const CYCLE4 = {
  halvingDate: new Date("2024-04-20"),
  // 实际周期高点：2025-09-29 $123,513（Yahoo Finance 数据）
  // WolfyXBT 预测 534天/$126k，实际527天/$123.5k，误差<3%，预测极准
  knownTopDate: new Date("2025-09-29"),
  knownTopPrice: 123513,
  nextHalvingEst: new Date("2028-03-15"),
  cycleDays: 1460,
};

// ══════════════════════════════════════════════════════════════════
// BTC 价格里程碑
// ══════════════════════════════════════════════════════════════════

export interface BTCMilestone {
  date: string;
  price: string;
  title: string;
  why: string;
  type: "genesis" | "first" | "bull" | "bear" | "ath";
}

export const btcMilestones: BTCMilestone[] = [
  {
    date: "2009-01-03",
    price: "$0",
    title: "创世区块诞生",
    why: "中本聪挖出第一个区块，嵌入英国银行救助头条，比特币正式诞生",
    type: "genesis",
  },
  {
    date: "2010-05-22",
    price: "$0.003",
    title: "Pizza Day 首次定价",
    why: "10,000 BTC 换两块披萨，隐含单价约 $0.003，人类历史上最贵的外卖",
    type: "first",
  },
  {
    date: "2011-02",
    price: "$1",
    title: "首次与美元等值",
    why: "媒体开始报道，加密货币概念首次进入公众视野",
    type: "bull",
  },
  {
    date: "2013-11-30",
    price: "$1,242",
    title: "第一个四位数",
    why: "塞浦路斯银行危机引发避险需求，中国散户涌入，年内涨幅 8000%",
    type: "ath",
  },
  {
    date: "2017-12-17",
    price: "$19,783",
    title: "第一次全球狂热",
    why: "ICO 热潮加散户 FOMO，全球加密市值首破 $8,000 亿",
    type: "ath",
  },
  {
    date: "2018-12-15",
    price: "$3,191",
    title: "ICO 泡沫底部",
    why: "监管收紧，项目归零，流动性耗尽，较高点跌 84%",
    type: "bear",
  },
  {
    date: "2020-03-12",
    price: "$3,800",
    title: "新冠黑色星期四",
    why: "全球市场恐慌，24 小时内腰斩，衍生品市场爆仓超 $10 亿",
    type: "bear",
  },
  {
    date: "2021-11-10",
    price: "$69,044",
    title: "当时历史最高",
    why: "机构入场加 DeFi/NFT 爆发，第三次减半效应，全市值破 $3 万亿",
    type: "ath",
  },
  {
    date: "2022-11-21",
    price: "$15,476",
    title: "FTX 崩溃熊市底",
    why: "LUNA 归零加三箭破产加 FTX 欺诈，行业信任跌入历史谷底",
    type: "bear",
  },
  {
    date: "2024-01-10",
    price: "$46,000",
    title: "现货 ETF 获批",
    why: "SEC 批准贝莱德等 11 只 BTC 现货 ETF，机构资金通道正式打开",
    type: "bull",
  },
  {
    date: "2024-12-17",
    price: "$108,364",
    title: "首破 10 万美元",
    why: "ETF 资金持续流入 + 第四次减半供应减少 + 特朗普亲加密政策，市场极度乐观，但尚非周期顶",
    type: "ath",
  },
  {
    date: "2025-01-20",
    price: "$102,682",
    title: "特朗普就职日高点",
    why: "特朗普就职典礼当日，BTC 冲至约 $102k，随后利好兑现开始回调，1月底回落至$97k",
    type: "bull",
  },
  {
    date: "2025-03-31",
    price: "$78,214",
    title: "关税战回调低点",
    why: "特朗普宣布全面对等关税，全球市场恐慌，BTC 从 $102k 回调至 $78k，周期内最大回调约23%",
    type: "bear",
  },
  {
    date: "2025-07-07",
    price: "$119,116",
    title: "突破前高至 $119k",
    why: "关税暂停协议+美联储降息预期+机构持续买入，BTC 从 $78k 反弹突破 $119k 历史新高",
    type: "ath",
  },
  {
    date: "2025-09-29",
    price: "$123,513",
    title: "第4周期实际顶部",
    why: "减半后第 527 天，BTC 触及本轮牛市最高点 $123,513。WolfyXBT 预测 534天/$126k，实际误差不到 3%，预测极为准确",
    type: "ath",
  },
];

// ══════════════════════════════════════════════════════════════════
// BTC 重大事件
// ══════════════════════════════════════════════════════════════════

export type EventType = "bull" | "bear" | "hack" | "regulation" | "macro" | "milestone";

export interface BTCEvent {
  date: string;
  title: string;
  impact: string;
  reason: string;
  type: EventType;
}

export const btcEvents: BTCEvent[] = [
  {
    date: "2013-03",
    title: "塞浦路斯银行危机",
    impact: "$30 → $260",
    reason: "政府对银行存款征税，民众把比特币当避险工具",
    type: "bull",
  },
  {
    date: "2014-02",
    title: "Mt.Gox 崩溃",
    impact: "$867 → $340",
    reason: "全球最大交易所被盗 85 万 BTC，行业信任归零",
    type: "hack",
  },
  {
    date: "2017-12",
    title: "ICO 全球狂热顶峰",
    impact: "$1k → $19,783",
    reason: "以太坊智能合约让任何人发代币圈钱，散户 FOMO 达到极值",
    type: "bull",
  },
  {
    date: "2018",
    title: "ICO 泡沫破裂",
    impact: "$19,783 → $3,191，跌 84%",
    reason: "监管收紧加项目大规模归零加市场流动性耗尽",
    type: "bear",
  },
  {
    date: "2020-03-12",
    title: "新冠黑色星期四",
    impact: "$7,900 → $3,800，单日 -50%",
    reason: "全球金融市场恐慌性抛售，衍生品市场爆仓超 $10 亿",
    type: "macro",
  },
  {
    date: "2020-05-11",
    title: "第三次减半",
    impact: "减半时 $8,600，12 个月后 $60,000",
    reason: "供应减半叠加美联储无限 QE，机构开始把 BTC 视为抗通胀资产",
    type: "milestone",
  },
  {
    date: "2021-05-19",
    title: "中国禁矿 + 马斯克反水",
    impact: "$58,000 → $30,000，单周 -40%",
    reason: "中国全面禁止挖矿，特斯拉暂停 BTC 支付，全市场连锁爆仓",
    type: "regulation",
  },
  {
    date: "2022-05",
    title: "LUNA/UST 死亡螺旋",
    impact: "LUNA $80 → 近零，市值蒸发 $400 亿",
    reason: "算法稳定币脱锚引发死亡螺旋，多米诺推倒三箭/Celsius/Voyager",
    type: "bear",
  },
  {
    date: "2022-11",
    title: "FTX 欺诈崩溃",
    impact: "$21,000 → $15,500",
    reason: "全球第二大交易所挪用用户资产被曝光，SBF 72 小时内宣布破产",
    type: "hack",
  },
  {
    date: "2024-01-10",
    title: "比特币现货 ETF 通过",
    impact: "当月突破 $48,000",
    reason: "SEC 批准贝莱德 IBIT 等 11 只 ETF，机构增量资金正式入场",
    type: "regulation",
  },
  {
    date: "2024-04-20",
    title: "第四次减半",
    impact: "减半时 $63,000",
    reason: "区块奖励降至 3.125 BTC，叠加 ETF 资金流入，供需矛盾加剧",
    type: "milestone",
  },
  {
    date: "2024-11",
    title: "特朗普赢得大选",
    impact: "$70,000 → $108,364",
    reason: "亲加密政策加国家比特币战略储备提议，极度乐观情绪推动突破 10 万",
    type: "bull",
  },
  {
    date: "2025-01-20",
    title: "特朗普就职 + 数字资产战略储备令",
    impact: "$94k → $102k（随后回调至$78k）",
    reason: "特朗普上台首日签署行政令成立数字资产专案组，推进比特币战略储备提案，短期利好兑现后市场转向关税担忧",
    type: "regulation",
  },
  {
    date: "2025-03-31",
    title: "全球关税战引发 BTC 回调",
    impact: "$102k → $78k，最大回调约 -23%",
    reason: "特朗普宣布对 90+ 国征收对等关税，全球股市暴跌，BTC 与纳指联动下跌至本周期最低点 $78k",
    type: "macro",
  },
  {
    date: "2025-05-05",
    title: "关税暂停协议 + 反弹至 $104k",
    impact: "$78k → $104k，单月反弹 +33%",
    reason: "中美达成 90 天关税暂停协议，美元走弱，机构持续买入，BTC 强力反弹突破 $100k",
    type: "bull",
  },
  {
    date: "2025-07-07",
    title: "BTC 突破历史高位至 $119k",
    impact: "$104k → $119k，新 ATH",
    reason: "美联储降息预期升温 + 机构 ETF 资金持续流入 + 供应持续减少，BTC 突破 2024 年 12 月高点创新高",
    type: "bull",
  },
  {
    date: "2025-09-29",
    title: "第4周期高点 $123,513（减半后 527 天）",
    impact: "WolfyXBT 预测 534天/$126k，实际误差 <3%",
    reason: "BTC 触及本轮牛市高点 $123,513，与 WolfyXBT 四年周期预测（2025-10-06/$126k）极为吻合，随后开始下行",
    type: "milestone",
  },
  {
    date: "2025-11",
    title: "周期顶后熊市确认，BTC 跌破 $90k",
    impact: "$123k → $86k，两个月下跌 -30%",
    reason: "周期高点后获利回吐 + 美联储政策收紧预期 + 宏观流动性收缩，BTC 开始系统性下行",
    type: "bear",
  },
];

// ══════════════════════════════════════════════════════════════════
// 美股七巨头静态描述
// ══════════════════════════════════════════════════════════════════

export interface Mag7Info {
  ticker: string;
  name: string;
  emoji: string;
  sector: string;
  coreNarrative: string;
  moat: string;
  risk: string;
}

export const mag7Info: Mag7Info[] = [
  {
    ticker: "AAPL",
    name: "Apple",
    emoji: "🍎",
    sector: "消费科技",
    coreNarrative: "全球最赚钱的消费电子公司，iOS 生态锁定超 10 亿用户，服务业务年收入超 $1,000 亿",
    moat: "品牌溢价 + iOS 生态闭环 + 极高用户粘性与换机成本",
    risk: "AI 功能落后竞争对手 + 中国市场份额流失 + iPhone 创新放缓",
  },
  {
    ticker: "MSFT",
    name: "Microsoft",
    emoji: "🪟",
    sector: "企业软件/云",
    coreNarrative: "Azure 是全球第二大云平台，OpenAI 最大股东，企业 AI 转型最大受益者",
    moat: "Office + Windows 企业绑定 + Azure 高速增长 + OpenAI 独家合作",
    risk: "AI 竞争激烈 + 高估值 + 监管反垄断审查",
  },
  {
    ticker: "NVDA",
    name: "NVIDIA",
    emoji: "🟢",
    sector: "半导体/AI",
    coreNarrative: "AI 时代的铲子卖家，H100/H200 GPU 是训练大模型的核心硬件，毛利率超 70%",
    moat: "CUDA 软件生态 10 年积累，竞争对手无法快速复制",
    risk: "AI 资本开支周期回落 + 美国对华出口管制 + AMD 追赶",
  },
  {
    ticker: "GOOGL",
    name: "Alphabet",
    emoji: "🔍",
    sector: "广告/云/AI",
    coreNarrative: "全球搜索广告垄断者，YouTube 是全球第二大搜索引擎，GCP 云平台高速增长",
    moat: "搜索市场 90%+ 份额 + YouTube 内容壁垒 + 数据优势",
    risk: "AI 搜索冲击广告模式 + 反垄断诉讼 + Gemini 竞争压力",
  },
  {
    ticker: "AMZN",
    name: "Amazon",
    emoji: "📦",
    sector: "电商/云/广告",
    coreNarrative: "AWS 是全球第一大云平台撑起整个公司利润，电商广告业务爆发增长",
    moat: "AWS 先发优势 + Prime 会员体系 + 物流基础设施",
    risk: "AWS 增速放缓 + 电商竞争（Temu/Shein）+ 高资本开支",
  },
  {
    ticker: "META",
    name: "Meta",
    emoji: "👓",
    sector: "社交/广告/AI",
    coreNarrative: "全球最大社交广告平台，3 个月活超 30 亿 App（FB/IG/WhatsApp），AI 广告精准投放利润极高",
    moat: "社交网络效应 + 3 个超级 App + 广告算法护城河",
    risk: "用户老龄化 + 元宇宙高投入低回报 + TikTok 竞争 + 监管",
  },
  {
    ticker: "TSLA",
    name: "Tesla",
    emoji: "⚡",
    sector: "电动车/AI/能源",
    coreNarrative: "全球电动车龙头，FSD 自动驾驶 + Optimus 机器人是未来估值核心",
    moat: "直销模式 + 超级工厂 + OTA 软件升级 + 充电桩网络",
    risk: "中国竞争对手价格战 + 交付量增速放缓 + 马斯克精力分散",
  },
];

// ══════════════════════════════════════════════════════════════════
// ETF 参考手册
// ══════════════════════════════════════════════════════════════════

export interface ETFReference {
  ticker: string;
  name: string;
  tracks: string;
  provider: string;
  expenseRatio: string;
  category: string;
  annualReturn10y: string;
  description: string;
}

export const etfReferences: ETFReference[] = [
  {
    ticker: "VOO",
    name: "Vanguard S&P 500 ETF",
    tracks: "S&P 500",
    provider: "Vanguard",
    expenseRatio: "0.03%",
    category: "美股大盘",
    annualReturn10y: "约 13%",
    description: "巴菲特多次推荐，追踪标普 500，费率最低之一，适合长期定投核心仓位",
  },
  {
    ticker: "QQQ",
    name: "Invesco NASDAQ-100 ETF",
    tracks: "NASDAQ-100",
    provider: "Invesco",
    expenseRatio: "0.20%",
    category: "科技成长",
    annualReturn10y: "约 18%",
    description: "高度集中科技七巨头，牛市涨幅远超大盘，熊市跌幅也更大，进攻型配置首选",
  },
  {
    ticker: "VTI",
    name: "Vanguard Total Stock Market ETF",
    tracks: "全美股市",
    provider: "Vanguard",
    expenseRatio: "0.03%",
    category: "全市场",
    annualReturn10y: "约 12%",
    description: "覆盖 3,700+ 只美股，比 VOO 更分散，长期回报接近，可替代 VOO 作为底仓",
  },
  {
    ticker: "SCHD",
    name: "Schwab US Dividend Equity ETF",
    tracks: "股息精选 100",
    provider: "Schwab",
    expenseRatio: "0.06%",
    category: "高股息",
    annualReturn10y: "约 11%",
    description: "筛选连续分红且盈利稳定的 100 家公司，股息率 3.5%+，熊市抗跌，适合稳定现金流",
  },
  {
    ticker: "BND",
    name: "Vanguard Total Bond Market ETF",
    tracks: "美国债券全市场",
    provider: "Vanguard",
    expenseRatio: "0.03%",
    category: "债券",
    annualReturn10y: "约 1-3%",
    description: "60/40 股债组合中债券部分的经典选择，用于降低整体波动，利率下行周期价格上涨",
  },
  {
    ticker: "GLD",
    name: "SPDR Gold Shares",
    tracks: "黄金现货",
    provider: "State Street",
    expenseRatio: "0.40%",
    category: "黄金/商品",
    annualReturn10y: "约 8%",
    description: "实物黄金 ETF，高通胀/地缘风险/美元走弱时表现良好，建议作为 5-10% 对冲仓位",
  },
  {
    ticker: "VEA",
    name: "Vanguard FTSE Developed Markets ETF",
    tracks: "美国以外发达市场",
    provider: "Vanguard",
    expenseRatio: "0.05%",
    category: "国际发达",
    annualReturn10y: "约 5-6%",
    description: "日本/欧洲/加拿大等 24 个发达国家，股息率约 3%，美元走弱周期相对占优",
  },
  {
    ticker: "VWO",
    name: "Vanguard FTSE Emerging Markets ETF",
    tracks: "新兴市场",
    provider: "Vanguard",
    expenseRatio: "0.08%",
    category: "新兴市场",
    annualReturn10y: "约 2-4%",
    description: "中国/印度/台湾/巴西等，受美元汇率和地缘政治影响大，高风险高潜力",
  },
];

export interface ValuationSignal {
  name: string;
  description: string;
  currentReading: string;
  historicalAvg: string;
  signal: "green" | "yellow" | "red";
  signalText: string;
  note: string;
}

export const valuationSignals: ValuationSignal[] = [
  {
    name: "席勒 PE（CAPE）",
    description: "用过去 10 年通胀调整后平均盈利计算的市盈率，消除单年盈利波动干扰",
    currentReading: "约 34-38 倍",
    historicalAvg: "约 16-17 倍（1881年至今）",
    signal: "red",
    signalText: "偏贵",
    note: "当前读数约是历史均值的 2 倍，科技公司盈利结构变化可能支撑更高估值",
  },
  {
    name: "巴菲特指标（总市值/GDP）",
    description: "美国股市总市值除以 GDP，巴菲特称其为衡量股市估值最好的单一指标",
    currentReading: "约 185-200%",
    historicalAvg: "约 80-100%",
    signal: "red",
    signalText: "历史极高位",
    note: "互联网泡沫高点约 190%，2021 年约 220%，当前仍处历史高位区间",
  },
  {
    name: "标普 500 远期 PE",
    description: "基于未来 12 个月盈利预测的市盈率，反映市场对增长的预期定价",
    currentReading: "约 20-24 倍",
    historicalAvg: "约 15-17 倍",
    signal: "yellow",
    signalText: "中性偏贵",
    note: "科技股权重上升拉高整体估值，非科技板块估值相对合理",
  },
  {
    name: "沪深 300 PE 分位",
    description: "当前 PE 在历史所有时间点中的百分位，比绝对值更有参考意义",
    currentReading: "约 12-13 倍，历史 35% 分位",
    historicalAvg: "历史均值约 13-15 倍",
    signal: "green",
    signalText: "相对低估",
    note: "A 股估值处于历史中低位，具备长期配置价值，需关注宏观政策和经济复苏",
  },
];

// ══════════════════════════════════════════════════════════════════
// BTC 历史价格数据（月度，用于图表）
// ══════════════════════════════════════════════════════════════════

export interface BTCPricePoint {
  d: string;   // YYYY-MM-DD
  p: number;   // price USD
}

// 关键价格节点，覆盖 2012-2026
export const btcPriceHistory: BTCPricePoint[] = [
  // 2012
  { d: "2012-01-01", p: 7 }, { d: "2012-06-01", p: 7 }, { d: "2012-11-28", p: 12 }, { d: "2012-12-01", p: 13 },
  // 2013
  { d: "2013-01-01", p: 20 }, { d: "2013-02-01", p: 30 }, { d: "2013-03-01", p: 90 },
  { d: "2013-04-01", p: 150 }, { d: "2013-06-01", p: 100 }, { d: "2013-08-01", p: 120 },
  { d: "2013-10-01", p: 200 }, { d: "2013-11-30", p: 1100 }, { d: "2013-12-01", p: 700 },
  // 2014
  { d: "2014-01-01", p: 800 }, { d: "2014-02-07", p: 580 }, { d: "2014-04-01", p: 450 },
  { d: "2014-07-01", p: 590 }, { d: "2014-10-01", p: 340 }, { d: "2014-12-01", p: 310 },
  // 2015
  { d: "2015-01-14", p: 170 }, { d: "2015-04-01", p: 240 }, { d: "2015-08-01", p: 280 },
  { d: "2015-11-01", p: 370 }, { d: "2015-12-01", p: 430 },
  // 2016
  { d: "2016-01-01", p: 370 }, { d: "2016-04-01", p: 450 }, { d: "2016-07-09", p: 650 },
  { d: "2016-09-01", p: 620 }, { d: "2016-11-01", p: 730 }, { d: "2016-12-01", p: 970 },
  // 2017
  { d: "2017-01-01", p: 1000 }, { d: "2017-03-01", p: 1200 }, { d: "2017-05-01", p: 2300 },
  { d: "2017-06-01", p: 2800 }, { d: "2017-08-01", p: 4400 }, { d: "2017-09-01", p: 4200 },
  { d: "2017-10-01", p: 5500 }, { d: "2017-11-01", p: 9000 }, { d: "2017-12-17", p: 19783 },
  // 2018
  { d: "2018-01-01", p: 13000 }, { d: "2018-02-01", p: 8500 }, { d: "2018-04-01", p: 9000 },
  { d: "2018-06-01", p: 6200 }, { d: "2018-08-01", p: 6700 }, { d: "2018-10-01", p: 6400 },
  { d: "2018-11-01", p: 5500 }, { d: "2018-12-15", p: 3191 },
  // 2019
  { d: "2019-01-01", p: 3400 }, { d: "2019-03-01", p: 4000 }, { d: "2019-05-01", p: 8000 },
  { d: "2019-06-26", p: 10700 }, { d: "2019-08-01", p: 10300 }, { d: "2019-10-01", p: 9200 },
  { d: "2019-12-01", p: 7200 },
  // 2020
  { d: "2020-01-01", p: 8000 }, { d: "2020-02-01", p: 9500 }, { d: "2020-03-12", p: 3800 },
  { d: "2020-04-01", p: 7200 }, { d: "2020-05-11", p: 8600 }, { d: "2020-07-01", p: 9300 },
  { d: "2020-09-01", p: 10800 }, { d: "2020-10-01", p: 13700 }, { d: "2020-11-01", p: 19000 },
  { d: "2020-12-01", p: 29000 },
  // 2021
  { d: "2021-01-01", p: 33000 }, { d: "2021-02-01", p: 44000 }, { d: "2021-03-01", p: 55000 },
  { d: "2021-04-14", p: 64895 }, { d: "2021-05-19", p: 37000 }, { d: "2021-06-01", p: 35000 },
  { d: "2021-07-01", p: 40000 }, { d: "2021-08-01", p: 47000 }, { d: "2021-09-01", p: 44000 },
  { d: "2021-10-01", p: 60000 }, { d: "2021-11-10", p: 69044 }, { d: "2021-12-01", p: 46000 },
  // 2022
  { d: "2022-01-01", p: 36000 }, { d: "2022-03-01", p: 45000 }, { d: "2022-04-01", p: 40000 },
  { d: "2022-05-09", p: 27000 }, { d: "2022-06-01", p: 19000 }, { d: "2022-08-01", p: 20000 },
  { d: "2022-10-01", p: 19000 }, { d: "2022-11-08", p: 15800 }, { d: "2022-11-21", p: 15476 },
  { d: "2022-12-01", p: 17000 },
  // 2023
  { d: "2023-01-01", p: 23000 }, { d: "2023-03-01", p: 28000 }, { d: "2023-04-01", p: 29000 },
  { d: "2023-06-01", p: 30000 }, { d: "2023-08-01", p: 26000 }, { d: "2023-10-01", p: 34000 },
  { d: "2023-11-01", p: 38000 }, { d: "2023-12-01", p: 43000 },
  // 2024
  { d: "2024-01-01", p: 43000 }, { d: "2024-01-10", p: 46000 }, { d: "2024-02-01", p: 55000 },
  { d: "2024-03-14", p: 73000 }, { d: "2024-04-20", p: 63000 }, { d: "2024-06-01", p: 63000 },
  { d: "2024-07-01", p: 63000 }, { d: "2024-09-01", p: 58000 }, { d: "2024-10-01", p: 68000 },
  { d: "2024-11-01", p: 90000 }, { d: "2024-12-17", p: 108364 }, { d: "2024-12-31", p: 93000 },
  // 2025 Q1 — 就职日冲高后回调，3月大跌，关税战打压
  { d: "2025-01-06", p: 94488 }, { d: "2025-01-13", p: 101090 },
  { d: "2025-01-20", p: 102682 }, { d: "2025-01-27", p: 97689 },
  { d: "2025-02-10", p: 96175 }, { d: "2025-02-24", p: 94248 },
  { d: "2025-03-03", p: 80601 }, { d: "2025-03-17", p: 86054 },
  { d: "2025-03-31", p: 78214 }, { d: "2025-04-07", p: 83685 },
  // 2025 Q2-Q3 — 关税暂停反弹，6-7月破历史高位 $119k
  { d: "2025-04-21", p: 93755 }, { d: "2025-05-05", p: 104106 },
  { d: "2025-05-19", p: 109035 }, { d: "2025-06-02", p: 105794 },
  { d: "2025-06-23", p: 108386 }, { d: "2025-06-30", p: 109232 },
  { d: "2025-07-07", p: 119116 }, { d: "2025-07-21", p: 119448 }, // 新高突破
  { d: "2025-08-04", p: 119307 }, { d: "2025-08-18", p: 113458 },
  { d: "2025-09-01", p: 111168 }, { d: "2025-09-15", p: 115306 },
  { d: "2025-09-29", p: 123513 }, // 周期最高点（WolfyXBT预测$126k，实际$123k，误差<3%）
  // 2025 Q4 — 周期顶后熊市开始
  { d: "2025-10-06", p: 115170 }, { d: "2025-10-20", p: 114472 },
  { d: "2025-11-03", p: 104720 }, { d: "2025-11-17", p: 86805 },
  { d: "2025-12-01", p: 90406 }, { d: "2025-12-15", p: 88622 },
  { d: "2025-12-29", p: 91413 },
  // 2026 Q1-Q2 — 熊市持续下行（当前约 $76k）
  { d: "2026-01-12", p: 93634 }, { d: "2026-01-26", p: 76974 },
  { d: "2026-02-09", p: 68788 }, { d: "2026-02-23", p: 65738 },
  { d: "2026-03-09", p: 72790 }, { d: "2026-03-23", p: 65955 },
  { d: "2026-04-06", p: 70753 }, { d: "2026-04-13", p: 77127 },
];

// 牛熊阶段定义（基于 WolfyXBT 四年周期框架）
export const btcPhases = [
  { x1: "2013-01-01", x2: "2013-11-30", type: "bull" as const, label: "牛市" },
  { x1: "2013-11-30", x2: "2015-01-14", type: "bear" as const, label: "熊市" },
  { x1: "2015-01-14", x2: "2017-12-17", type: "bull" as const, label: "牛市" },
  { x1: "2017-12-17", x2: "2018-12-15", type: "bear" as const, label: "熊市" },
  { x1: "2019-01-01", x2: "2019-07-01", type: "bull" as const, label: "反弹" },
  { x1: "2020-03-12", x2: "2021-11-10", type: "bull" as const, label: "牛市" },
  { x1: "2021-11-10", x2: "2022-11-21", type: "bear" as const, label: "熊市" },
  { x1: "2023-01-01", x2: "2024-12-17", type: "bull" as const, label: "牛市" },
  { x1: "2024-12-17", x2: "2025-03-31", type: "bear" as const, label: "调整" },  // 高点后回调至$78k
  { x1: "2025-03-31", x2: "2025-09-29", type: "bull" as const, label: "牛市" },  // 反弹至$123k周期顶
  { x1: "2025-09-29", x2: "2026-04-13", type: "bear" as const, label: "熊市" },  // 周期顶后下行至$65-76k
];

// 减半标记
export const btcHalvings = [
  { date: "2012-11-28", label: "1st减半", reward: "50→25 BTC" },
  { date: "2016-07-09", label: "2nd减半", reward: "25→12.5 BTC" },
  { date: "2020-05-11", label: "3rd减半", reward: "12.5→6.25 BTC" },
  { date: "2024-04-20", label: "4th减半", reward: "6.25→3.125 BTC" },
];
