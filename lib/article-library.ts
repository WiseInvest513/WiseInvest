type ArticleMetadata = {
  id: string;
  title: string;
  summary: string;
};

export type RecommendedArticle<T extends ArticleMetadata> = T & {
  displayTitle: string;
  displaySummary: string;
};

// Homepage copy is separate from the published article's identity and metadata.
const recommendations = [
  {
    id: "web-guide",
    displayTitle: "一篇带你玩转 Wise 旗下网站",
    displaySummary: "出海、投资与工具的使用入口，先从这里了解。",
  },
  {
    id: "VIP",
    displayTitle: "Wise VIP 体系介绍",
    displaySummary: "了解服务内容、研究工具与加入方式。",
  },
  {
    id: "predict",
    displayTitle: "预测市场 Predict 从 0 到 1 入门",
    displaySummary: "从基础概念开始，理解预测市场的使用方式。",
  },
  {
    id: "BBAE",
    displayTitle: "BBAE 证券开户与使用指南",
    displaySummary: "账户开通、入金与基础功能，一篇了解。",
  },
] as const;

export function getRecommendedArticles<T extends ArticleMetadata>(
  articles: T[]
): RecommendedArticle<T>[] {
  return recommendations.flatMap(({ id, displayTitle, displaySummary }) => {
    const article = articles.find((item) => item.id === id);
    return article ? [{ ...article, displayTitle, displaySummary }] : [];
  });
}

export interface ArticleSeriesChapter {
  title: string;
  articleId?: string;
  stageId?: string;
  summary?: string;
}

export interface ArticleSeries {
  id: string;
  title: string;
  description: string;
  introduction?: string;
  kind?: "tutorial" | "topic" | "path";
  artwork: string;
  cover?: string;
  status: "planned" | "updating";
  chapters: ArticleSeriesChapter[];
  existingArticleId?: string;
  stages?: { id: string; title: string; description: string; resources?: { title: string; href: string }[] }[];
  mapRouteIds?: string[];
}

// Chapter links refer only to existing articles; unlinked chapters are planned.
export const articleSeries: ArticleSeries[] = [
  {
    id: "crypto-basics",
    title: "加密货币基础入门",
    description: "从基本概念到钱包、交易所与风险认识",
    artwork: "/images/articles/series/crypto-wide-v1.webp",
    cover: "/images/articles/series/crypto-basics-wise-v2.webp",
    status: "planned",
    chapters: [
      { title: "基本概念：认识加密货币" },
      { title: "交易所：了解买卖与交易方式" },
      { title: "钱包：理解资产保管与转账" },
      { title: "风险认识：波动、安全与常见误区" },
    ],
  },
  {
    id: "binance",
    title: "币安从入门到使用",
    description: "产品介绍 · 开户 · 福利政策 · 常用产品",
    artwork: "/images/articles/series/binance-wide-v1.webp",
    cover: "/images/articles/series/binance-wise-cover-v3.webp",
    status: "planned",
    existingArticleId: "biance-guide",
    chapters: [
      { title: "币安产品介绍" },
      { title: "注册、认证与账户安全" },
      { title: "入金与买币" },
      { title: "福利政策" },
      { title: "常用产品" },
      { title: "钱包与生态" },
    ],
  },
  {
    id: "overseas",
    title: "出海教程",
    description: "海外账号、境外手机号，从准备到实际使用。",
    artwork: "/images/articles/series/overseas-wide-v1.webp",
    status: "updating",
    chapters: [
      { title: "注册 Google 账号", articleId: "google-id" },
      { title: "注册美区与港区 Apple ID", articleId: "AppleID" },
      { title: "境外手机号：giffgaff 开通与保号", articleId: "giffgaff-guide" },
      { title: "eSIM：Xesim 申请与开通", articleId: "xesim-guide" },
    ],
  },
  {
    id: "exchange-referral",
    title: "交易所邀请码补填指南",
    description: "按平台核对邀请关系与补填条件，找到适合自己账户的处理方式。",
    introduction: "这个系列分别梳理币安、OKX、Bitget、Bybit 和 Gate 的邀请码漏填问题：先检查是否已有邀请关系，再核对账户资格、官方办理入口和生效结果。各平台规则独立核实，不能把一家平台的条件直接套用到另一家。",
    kind: "topic",
    artwork: "/images/articles/series/crypto-wide-v1.webp",
    status: "updating",
    chapters: [
      { title: "币安：忘记填写邀请码怎么办", articleId: "binance-referral" },
      { title: "OKX：忘记填写邀请码怎么办" },
      { title: "Bitget：忘记填写邀请码或想换绑怎么办", articleId: "bitget-referral" },
      { title: "Bybit：忘记填写邀请码怎么办" },
      { title: "Gate：忘记填写邀请码怎么办" },
    ],
  },
  {
    id: "investment-foundations",
    title: "投资基础起步",
    description: "先认识常见资产，再理解指数与基金。",
    introduction: "从现有的资产基础文章开始，认识股票、债券、基金与指数，再了解场内外基金的区别。网站指南作为补充入口，不要求先开户或交易。",
    kind: "path", status: "updating", artwork: "/images/articles/category-icons/domestic-ivory.webp",
    stages: [
      { id: "basics", title: "认识资产", description: "先把常见的投资名词弄清楚。" },
      { id: "funds", title: "理解基金", description: "了解不同购买方式对应的产品区别。" },
      { id: "resources", title: "找到后续资料", description: "按自己的目标继续查阅。" },
    ],
    chapters: [
      { title: "股票、债券、基金与指数", articleId: "indexStock", stageId: "basics" },
      { title: "场内与场外基金的区别", articleId: "idifferentIndex", stageId: "funds" },
      { title: "Wise 网站与工具指南", articleId: "web-guide", stageId: "resources" },
    ],
  },
  {
    id: "nasdaq-investing",
    title: "从认识纳指到了解投资方式",
    description: "基础概念、路径比较、实操与常见问题。",
    introduction: "以《纳指 / 标普投资蓝皮书》作为系统阅读入口，先理解指数与风险，再比较投资方式，最后查阅对应实操。具体产品与操作条件仍需结合文章日期核对。",
    kind: "path", status: "updating", artwork: "/images/articles/category-icons/index-ivory.webp",
    stages: [
      { id: "understand", title: "先认识指数", description: "从蓝皮书导读开始，资产基础文章作为补充。", resources: [{ title: "纳指 / 标普投资蓝皮书", href: "/book/nasdaq" }, { title: "第 1 章：分清不同的纳指", href: "/book/nasdaq#chapter-01" }] },
      { id: "risk", title: "理解风险与资金条件", description: "了解历史回撤，再判断自己的资金是否适合承担波动。", resources: [{ title: "第 7 章：历史回撤与恢复时间", href: "/book/nasdaq#chapter-07" }, { title: "第 18 章：开始投资前的资金判断", href: "/book/nasdaq#chapter-18" }] },
      { id: "compare", title: "比较投资方式", description: "理解产品区别后，再选择对应路径。" },
      { id: "plan", title: "形成自己的投资计划", description: "把投入、风险与调整条件写成可以检查的计划。", resources: [{ title: "第 11 章：设计可执行的定投计划", href: "/book/nasdaq#chapter-11" }, { title: "第 22 章：汇总个人执行计划", href: "/book/nasdaq#chapter-22" }] },
      { id: "practice", title: "查阅实操与问答", description: "按自己的问题选择阅读。" },
    ],
    chapters: [
      { title: "股票、基金与纳指 / 标普基础", articleId: "indexStock", stageId: "understand" },
      { title: "投资纳斯达克的不同方式", articleId: "nasdaq-investment-guide", stageId: "compare" },
      { title: "场内与场外基金的区别", articleId: "idifferentIndex", stageId: "compare" },
      { title: "纳指 / 标普购买实操", articleId: "index-practice", stageId: "practice" },
      { title: "纳指 / 标普问答：第一期", articleId: "index-qa-1", stageId: "practice" },
      { title: "纳指 / 标普问答：第二期", articleId: "index-qa-2", stageId: "practice" },
    ],
  },
  {
    id: "us-stock-funding",
    title: "美股账户准备与入金",
    description: "比较账户，再查阅中转账户、券商与汇款教程。",
    introduction: "按自己的账户条件选择阅读，不需要依次开通所有平台。这里汇集已发布的开户与综合使用教程；账户可用不等于任意通道均可转账，操作前需核对适用地区、真实用途、同名要求与平台规则。",
    kind: "path", status: "updating", artwork: "/images/articles/category-icons/broker-ivory.webp",
    mapRouteIds: ["transfer-to-us-broker", "traditional-us-stocks"],
    stages: [
      { id: "compare", title: "先比较账户", description: "先理解不同平台与资产权益的区别。" },
      { id: "accounts", title: "按需准备账户", description: "iFAST、Wise 等是不同选项；已有账户可跳过。" },
      { id: "brokers", title: "选择券商", description: "按自己的资格与需求选择，不必全部开户。" },
      { id: "transfers", title: "查阅转账流程", description: "现有综合教程包含注册、充值及汇款到盈透的图文。" },
    ],
    chapters: [
      { title: "不同证券平台与资产权益对比", articleId: "bit-comparison", stageId: "compare" },
      { title: "iFAST 注册与入金", articleId: "ifast-guide", stageId: "accounts" },
      { title: "Wise 注册与账户准备", articleId: "wise-register", stageId: "accounts" },
      { title: "盈透证券开户", articleId: "IBKR", stageId: "brokers", summary: "开户图文；文内部分入金内容仍为视频链接。" },
      { title: "嘉信证券开户", articleId: "jiaxin", stageId: "brokers" },
      { title: "第一证券开户", articleId: "diyi", stageId: "brokers" },
      { title: "StarryBlu 注册、充值与汇款到盈透", articleId: "StarryBlu-vcard", stageId: "transfers", summary: "综合教程，汇款到盈透见第 3.4 节。" },
    ],
  },
  {
    id: "hk-stock-funding",
    title: "港卡与港股券商开户入金",
    description: "香港银行、券商准备与现有入金图文。",
    introduction: "将香港银行和港股券商教程按阶段集中起来。各平台是按需选择的分支，不要求全部注册；已有账户可以直接查阅入金教程。具体账户资格和资金用途须按当前规则核对。",
    kind: "path", status: "updating", artwork: "/images/articles/category-icons/bank-ivory.webp",
    mapRouteIds: ["hk-card-to-hk-broker", "domestic-to-hk-card", "traditional-ipo"],
    stages: [
      { id: "banks", title: "选择香港银行", description: "根据材料与需求选择对应账户。" },
      { id: "brokers", title: "准备券商账户", description: "先查阅开户资格与所需材料。" },
      { id: "transfers", title: "查阅入金图文", description: "本阶段已有众安 / iFAST 入金复星教程，不代表其他通道均已覆盖。" },
    ],
    chapters: [
      { title: "汇丰香港开户", articleId: "huifeng-register", stageId: "banks" },
      { title: "中银香港开户", articleId: "zhongying-register", stageId: "banks" },
      { title: "众安银行开户", articleId: "zhongan-register", stageId: "banks" },
      { title: "天星银行开户", articleId: "tianxing-register", stageId: "banks" },
      { title: "复星证券开户", articleId: "futu-broker", stageId: "brokers" },
      { title: "致富证券开户与入金", articleId: "zhifu", stageId: "brokers" },
      { title: "腾达证券开户与入金", articleId: "tengda-broker", stageId: "brokers" },
      { title: "众安 / iFAST 入金复星", articleId: "ifas-fuxing", stageId: "transfers" },
    ],
  },
  {
    id: "crypto-tools",
    title: "交易所与钱包支付工具",
    description: "按平台查阅交易所、钱包卡与支付教程。",
    introduction: "这里整理现有的平台实操文章，并非完整的加密基础课程。交易所与钱包卡是不同产品，各平台按需选择；注册前先核对服务地区、身份验证、安全与费用要求。",
    kind: "path", status: "updating", artwork: "/images/articles/category-icons/crypto-ivory.webp",
    mapRouteIds: ["crypto-u-card-consume", "hk-card-u-card-consume"],
    stages: [
      { id: "exchanges", title: "了解交易所", description: "按平台选择注册、认证与使用教程。" },
      { id: "wallets", title: "了解钱包与支付卡", description: "按用途选择，不要求与上阶段的平台一一对应。" },
    ],
    chapters: [
      { title: "币安注册与使用", articleId: "biance-guide", stageId: "exchanges" },
      { title: "OKX 注册与使用", articleId: "okx-guide", stageId: "exchanges" },
      { title: "Bitget 交易所注册与使用", articleId: "bitget-exchange", stageId: "exchanges" },
      { title: "Bybit 注册与使用", articleId: "bybit-guide", stageId: "exchanges" },
      { title: "Bitget Wallet Card 申请与支付", articleId: "bitget-vcard", stageId: "wallets" },
      { title: "SafePal 认证、充值与支付", articleId: "safepal-vcard", stageId: "wallets" },
      { title: "Gate Card 申请与使用", articleId: "Gate-vcard", stageId: "wallets" },
    ],
  },
  {
    id: "ai-reading",
    title: "AI 工具与外文阅读",
    description: "账号准备、外文阅读与工具订阅。",
    introduction: "从现有的 Google 账号、沉浸式翻译和 GamsGo 教程入手。当前覆盖账号、翻译与订阅，尚不包含提示词、报告分析或自动化实战课程。",
    kind: "path", status: "updating", artwork: "/images/articles/category-icons/ai-ivory.webp",
    stages: [
      { id: "account", title: "准备账号", description: "已有可用账号可以跳过。" },
      { id: "reading", title: "阅读外文资料", description: "了解网页、视频与输入框翻译。" },
      { id: "subscription", title: "了解订阅方式", description: "按需阅读，先核对账号共享、隐私与服务限制。" },
    ],
    chapters: [
      { title: "Google 账号注册", articleId: "google-id", stageId: "account" },
      { title: "沉浸式翻译使用", articleId: "immersive-translate-guide", stageId: "reading" },
      { title: "GamsGo 订阅服务介绍", articleId: "gamsgo-guide", stageId: "subscription" },
    ],
  },
];

export function searchArticleSeries(query: string): ArticleSeries[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return articleSeries.filter((series) =>
    [series.id, series.title, series.description, series.introduction ?? "", ...series.chapters.map((chapter) => chapter.title)]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedQuery)
  );
}
