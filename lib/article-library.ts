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
  /** Editorial navigation label; keep short and consistent within each stage, independent of the article headline. */
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
  /** Wide artwork for series list cards; reading navigation keeps its small artwork. */
  cardArtwork?: string;
  cover?: string;
  status: "planned" | "updating";
  chapters: ArticleSeriesChapter[];
  existingArticleId?: string;
  /** Short label for a comprehensive guide, separate from its full article headline. */
  existingArticleTitle?: string;
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
      { title: "认识加密货币" },
      { title: "交易所买卖入门" },
      { title: "钱包保管与转账" },
      { title: "波动与安全风险" },
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
    existingArticleTitle: "币安注册与使用",
    chapters: [
      { title: "币安产品介绍" },
      { title: "注册、认证与安全" },
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
      { title: "Google 注册", articleId: "google-id" },
      { title: "Apple ID 注册", articleId: "AppleID" },
      { title: "giffgaff 激活与保号", articleId: "giffgaff-guide" },
      { title: "Xesim eSIM 开通", articleId: "xesim-guide" },
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
      { title: "币安邀请码补填", articleId: "binance-referral" },
      { title: "OKX 邀请码补填" },
      { title: "Bitget 邀请码补填与换绑", articleId: "bitget-referral" },
      { title: "Bybit 邀请码补填" },
      { title: "Gate 邀请码补填" },
    ],
  },
  {
    id: "investment-foundations",
    title: "投资基础起步",
    description: "先认识常见资产，再理解指数与基金。",
    introduction: "从现有的资产基础文章开始，认识股票、债券、基金与指数，再了解场内外基金的区别。网站指南作为补充入口，不要求先开户或交易。",
    kind: "path", status: "updating", artwork: "/images/articles/category-icons/domestic-ivory.webp",
    cardArtwork: "/images/articles/series/investment-foundations-wide-v1.webp",
    stages: [
      { id: "basics", title: "认识资产", description: "先把常见的投资名词弄清楚。" },
      { id: "funds", title: "理解基金", description: "了解不同购买方式对应的产品区别。" },
      { id: "resources", title: "找到后续资料", description: "按自己的目标继续查阅。" },
    ],
    chapters: [
      { title: "股票、债券、基金与指数", articleId: "indexStock", stageId: "basics" },
      { title: "场内外基金对比", articleId: "idifferentIndex", stageId: "funds" },
      { title: "Wise 网站导航", articleId: "web-guide", stageId: "resources" },
    ],
  },
  {
    id: "nasdaq-investing",
    title: "纳指与标普：从入门到长期持有",
    description: "先认识指数，再读懂产品与投入方式，最后进入支付宝、银河和港美券商的购买路径。",
    introduction: "基础部分认识 ETF 与指数；进阶部分集中比较场内外基金、产品、费用与投入方式；实操部分从购买渠道总览开始，接上支付宝买入、银河开户与费率，以及港资、美资券商的开户入金教程，最后检查持有安排。已有基础可以直接进入实操，按自己的条件选择一条路径，不需要开通所有账户。",
    kind: "path",
    status: "updating",
    artwork: "/images/articles/category-icons/index-ivory.webp",
    cardArtwork: "/images/articles/series/nasdaq-investing-wide-v1.webp",
    stages: [
      {"id": "understand", "title": "基础：认识 ETF 与指数", "description": "先弄懂资产、ETF 运作和两种指数的区别。", "resources": [{"title": "纳指 / 标普投资蓝皮书", "href": "/book/nasdaq"}]},
      {"id": "compare", "title": "进阶：产品选择与投入计划", "description": "比较场内外基金与常见 ETF，理解收益、回撤、溢价和费用，再确定产品与投入节奏。", "resources": [{"title": "WiseETF · 查溢价", "href": "https://www.wise-etf.com/today/etf-premium"}, {"title": "WiseETF · 查额度", "href": "https://www.wise-etf.com/today/qdii-limits"}]},
      {"id": "practice", "title": "实操：购买与持有", "description": "先看购买渠道总览，再按需进入支付宝买入、银河场内 ETF 账户准备或港美券商教程；完成操作后检查订单与持有计划。", "resources": [{"title": "港资券商开户与入金", "href": "/articles/series/hk-stock-funding#stage-brokers"}, {"title": "美资券商开户与入金", "href": "/articles/series/us-stock-funding#stage-brokers"}]},
    ],
    chapters: [
      {"title": "股票、债券、基金与指数", "articleId": "indexStock", "stageId": "understand"},
      {"title": "ETF 运作原理", "articleId": "etf-how-it-works", "stageId": "understand"},
      {"title": "纳指与标普对比", "articleId": "etf-nasdaq-vs-sp500", "stageId": "understand"},
      {"title": "场内外基金对比", "articleId": "idifferentIndex", "stageId": "compare"},
      {"title": "常见 ETF 对比", "articleId": "etf-major-products", "stageId": "compare"},
      {"title": "ETF 收益构成", "articleId": "etf-understand-returns", "stageId": "compare"},
      {"title": "历史回撤与修复", "articleId": "etf-historical-drawdowns", "stageId": "compare"},
      {"title": "限购、溢价与净值", "articleId": "etf-premium-nav", "stageId": "compare"},
      {"title": "ETF 产品筛选", "articleId": "index-guide", "stageId": "compare"},
      {"title": "复利与定投测算", "articleId": "passive-millionaire", "stageId": "compare"},
      {"title": "定投与一次买入", "articleId": "index-qa-1", "stageId": "compare"},
      {"title": "纳指购买渠道", "articleId": "nasdaq-investment-guide", "stageId": "practice", "summary": "支付宝、银河场内 ETF、港资与美资券商、数字证券和链上产品，按已有账户选择对应教程。"},
      {"title": "支付宝买入实操", "articleId": "index-practice", "stageId": "practice"},
      {"title": "银河开户与费率", "articleId": "galaxy-etf-guide", "stageId": "practice", "summary": "准备场内 ETF 账户：了解银河开户渠道、ETF 佣金、免五申请条件与生效核对。"},
      {"title": "买入后的持有检查", "articleId": "index-qa-2", "stageId": "practice"},
    ],
  },
  {
    id: "us-stock-funding",
    title: "美股账户准备与入金",
    description: "比较账户，再查阅中转账户、券商与汇款教程。",
    introduction: "按自己的账户条件选择阅读，不需要依次开通所有平台。这里汇集已发布的开户与综合使用教程；账户可用不等于任意通道均可转账，操作前需核对适用地区、真实用途、同名要求与平台规则。",
    kind: "path", status: "updating", artwork: "/images/articles/category-icons/broker-ivory.webp",
    cardArtwork: "/images/articles/series/us-stock-funding-wide-v1.webp",
    mapRouteIds: ["transfer-to-us-broker", "traditional-us-stocks"],
    stages: [
      { id: "compare", title: "先比较账户", description: "先理解不同平台与资产权益的区别。" },
      { id: "accounts", title: "按需准备账户", description: "iFAST、Wise 等是不同选项；已有账户可跳过。" },
      { id: "brokers", title: "选择券商", description: "按自己的资格与需求选择，不必全部开户。" },
      { id: "transfers", title: "查阅转账流程", description: "现有综合教程包含注册、充值及汇款到盈透的图文。" },
    ],
    chapters: [
      { title: "平台与资金路径对比", articleId: "us-stock-platform-comparison", stageId: "compare" },
      { title: "BIT 与券商对比", articleId: "bit-comparison", stageId: "compare" },
      { title: "iFAST 开户", articleId: "ifast-guide", stageId: "accounts" },
      { title: "Wise 注册", articleId: "wise-register", stageId: "accounts" },
      { title: "盈透开户", articleId: "IBKR", stageId: "brokers", summary: "开户图文；文内部分入金内容仍为视频链接。" },
      { title: "BBAE 开户", articleId: "BBAE", stageId: "brokers" },
      { title: "嘉信开户", articleId: "jiaxin", stageId: "brokers" },
      { title: "第一证券开户", articleId: "diyi", stageId: "brokers" },
      { title: "StarryBlu 转账到盈透", articleId: "StarryBlu-vcard", stageId: "transfers", summary: "综合教程，汇款到盈透见第 3.4 节。" },
    ],
  },
  {
    id: "hk-stock-funding",
    title: "港卡与港股券商开户入金",
    description: "香港银行、券商准备与现有入金图文。",
    introduction: "将香港银行和港股券商教程按阶段集中起来。各平台是按需选择的分支，不要求全部注册；已有账户可以直接查阅入金教程。具体账户资格和资金用途须按当前规则核对。",
    kind: "path", status: "updating", artwork: "/images/articles/category-icons/bank-ivory.webp",
    cardArtwork: "/images/articles/series/hk-stock-funding-wide-v1.webp",
    mapRouteIds: ["hk-card-to-hk-broker", "domestic-to-hk-card", "traditional-ipo"],
    stages: [
      { id: "banks", title: "选择香港银行", description: "根据材料与需求选择对应账户。" },
      { id: "brokers", title: "准备券商账户", description: "先查阅开户资格与所需材料。" },
      { id: "transfers", title: "查阅入金图文", description: "本阶段已有众安 / iFAST 入金复星教程，不代表其他通道均已覆盖。" },
    ],
    chapters: [
      { title: "汇丰香港开户", articleId: "huifeng-register", stageId: "banks" },
      { title: "中银香港开户", articleId: "zhongying-register", stageId: "banks" },
      { title: "众安开户", articleId: "zhongan-register", stageId: "banks" },
      { title: "天星开户", articleId: "tianxing-register", stageId: "banks" },
      { title: "复星开户", articleId: "futu-broker", stageId: "brokers" },
      { title: "致富开户", articleId: "zhifu", stageId: "brokers" },
      { title: "腾达开户", articleId: "tengda-broker", stageId: "brokers" },
      { title: "复星入金", articleId: "ifas-fuxing", stageId: "transfers" },
    ],
  },
  {
    id: "crypto-tools",
    title: "交易所与钱包支付工具",
    description: "按平台查阅交易所、钱包卡与支付教程。",
    introduction: "这里整理现有的平台实操文章，并非完整的加密基础课程。交易所与钱包卡是不同产品，各平台按需选择；注册前先核对服务地区、身份验证、安全与费用要求。",
    kind: "path", status: "updating", artwork: "/images/articles/category-icons/crypto-ivory.webp",
    cardArtwork: "/images/articles/series/crypto-tools-wide-v1.webp",
    mapRouteIds: ["crypto-u-card-consume", "hk-card-u-card-consume"],
    stages: [
      { id: "exchanges", title: "了解交易所", description: "按平台选择注册、认证与使用教程。" },
      { id: "wallets", title: "了解钱包与支付卡", description: "按用途选择，不要求与上阶段的平台一一对应。" },
    ],
    chapters: [
      { title: "币安注册", articleId: "biance-guide", stageId: "exchanges" },
      { title: "OKX 注册", articleId: "okx-guide", stageId: "exchanges" },
      { title: "Bitget 注册", articleId: "bitget-exchange", stageId: "exchanges" },
      { title: "Bybit 注册", articleId: "bybit-guide", stageId: "exchanges" },
      { title: "Bitget Wallet 开卡", articleId: "bitget-vcard", stageId: "wallets" },
      { title: "SafePal 开卡", articleId: "safepal-vcard", stageId: "wallets" },
      { title: "Gate Card 开卡", articleId: "Gate-vcard", stageId: "wallets" },
    ],
  },
  {
    id: "ai-reading",
    title: "AI 工具与外文阅读",
    description: "账号准备、外文阅读与工具订阅。",
    introduction: "从现有的 Google 账号、沉浸式翻译和 GamsGo 教程入手。当前覆盖账号、翻译与订阅，尚不包含提示词、报告分析或自动化实战课程。",
    kind: "path", status: "updating", artwork: "/images/articles/category-icons/ai-ivory.webp",
    cardArtwork: "/images/articles/series/ai-reading-wide-v1.webp",
    stages: [
      { id: "account", title: "准备账号", description: "已有可用账号可以跳过。" },
      { id: "reading", title: "阅读外文资料", description: "了解网页、视频与输入框翻译。" },
      { id: "subscription", title: "了解订阅方式", description: "按需阅读，先核对账号共享、隐私与服务限制。" },
    ],
    chapters: [
      { title: "Google 注册", articleId: "google-id", stageId: "account" },
      { title: "沉浸式翻译使用", articleId: "immersive-translate-guide", stageId: "reading" },
      { title: "GamsGo 订阅", articleId: "gamsgo-guide", stageId: "subscription" },
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
