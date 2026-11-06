// List thumbnails only. Original article illustrations and social previews stay independent.
export const ARTICLE_COVER_WIDTH = 640;
export const ARTICLE_COVER_HEIGHT = 360;

export const articleCovers: Record<string, { src: string; alt: string; topics: string[] }> = {
  "safepal-bank-remittance": {
    src: "/images/articles/covers/safepal-bank-remittance.webp",
    alt: "SafePal 汇款实操：米白银行、深蓝钱包与欧元凭证，2025 年实测记录",
    topics: ["SafePal", "Fiat24", "出入金", "USDC", "跨境汇款", "结汇"],
  },
  "sp500-midterm-strategy": {
    src: "/images/articles/covers/sp500-midterm-strategy.webp",
    alt: "标普 500 中期选举后的投资窗口：银白日历与玻璃市场波动带",
    topics: ["标普500", "中期选举", "投资策略", "ETF", "历史回测"],
  },
  "collective-ipo-guide": { src: "/images/articles/covers/collective-ipo-guide.webp", alt: "独立证券账户的配号凭证汇入共同记录台账，示意集合打新", topics: ["A股", "集合打新", "新股申购", "配号", "收益分配"] },
  "etf-how-it-works": {"src":"/images/articles/covers/etf-how-it-works.webp","alt":"银白玻璃资产篮子与独立基金凭证，示意组合与份额的关系","topics":["ETF","纳斯达克100","标普500","指数基金"]},
  "etf-major-products": {"src":"/images/articles/covers/etf-major-products.webp","alt":"股票资料册、债券凭证与金条组成的银白产品地图封面","topics":["ETF","纳斯达克100","标普500","指数基金"]},
  "etf-nasdaq-vs-sp500": {"src":"/images/articles/covers/etf-nasdaq-vs-sp500.webp","alt":"两组玻璃资产篮子中大小不同的积木，示意权重与重叠","topics":["ETF","纳斯达克100","标普500","指数基金"]},
  "etf-premium-nav": {"src":"/images/articles/covers/etf-premium-nav.webp","alt":"资产篮子与报价凭证放在天平两侧，旁有计时器","topics":["ETF","纳斯达克100","标普500","指数基金"]},
  "etf-understand-returns": {"src":"/images/articles/covers/etf-understand-returns.webp","alt":"分红凭证、汇率筹码与费用圆环连接同一本账户记录","topics":["ETF","纳斯达克100","标普500","指数基金"]},
  "etf-historical-drawdowns": {"src":"/images/articles/covers/etf-historical-drawdowns.webp","alt":"银白曲线经历低谷后回到同一高度，旁有时钟，示意回撤与等待","topics":["ETF","纳斯达克100","标普500","指数基金"]},
  "us-stock-platform-comparison": {
    src: "/images/articles/covers/us-stock-platform-comparison.webp",
    alt: "买美股之前先选对路径：基金文件、证券电脑与链上连接的银白玻璃封面",
    topics: ["美股", "平台对比", "基金", "券商", "数字证券", "链上产品"],
  },
  "galaxy-etf-guide": {
    src: "/images/articles/covers/galaxy-etf-guide.webp",
    alt: "银河证券 ETF 免五指南：银河标志、玻璃铭牌与佣金计算器的银白封面",
    topics: ["银河证券", "ETF", "免五", "佣金", "开户"],
  },
  "bit-account-guide": {
    src: "/images/articles/covers/bit-account-guide.webp",
    alt: "BIT 开户与入金：稳定币钱包、身份资料与证券账户的米白深蓝立体封面",
    topics: ["BIT", "开户", "稳定币", "入金"],
  },
  "bit-comparison": {
    src: "/images/articles/covers/bit-comparison.webp",
    alt: "BIT 值不值得用：链上美股、港资券商与美资券商的米白深蓝立体对比封面",
    topics: ["BIT", "券商对比", "交易费用", "开户福利"],
  },
  "nasdaq-investment-guide": {
    src: "/images/articles/covers/nasdaq-investment-guide.webp",
    alt: "纳斯达克投资：六条路径一次讲清，基金、券商与链上资产的银白概念封面",
    topics: ["纳斯达克", "投资路径", "基金", "QQQ", "链上资产"],
  },
  "IBKR": {
    src: "/images/articles/covers/IBKR.webp",
    alt: "盈透证券 IBKR 开户与使用：手机、账户申请资料及文件夹的银白概念封面",
    topics: ["IBKR","盈透证券","开户","入金","交易准备"],
  },
  "tengda-broker": {
    src: "/images/articles/covers/tengda-broker.webp",
    alt: "腾达证券开户与入金：笔记本电脑、账户凭证与文件夹的银白概念封面",
    topics: ["腾达证券","GigaMoney","开户","入金","账户准备"],
  },
  "ifas-fuxing": {
    src: "/images/articles/covers/ifas-fuxing.webp",
    alt: "复星证券银行入金指南：两路银行账户连接证券账户的银白玻璃概念封面",
    topics: ["复星证券","入金","众安","iFAST","银行转账"],
  },
  "futu-broker": {
    src: "/images/articles/covers/futu-broker.webp",
    alt: "复星证券开户使用指南：开户文件、账户凭证与签字笔的银白概念封面",
    topics: ["复星证券","开户","产品认识","账户","基础功能"],
  },
  "SGB-register": {
    src: "/images/articles/covers/SGB-register.webp",
    alt: "SGB 银行开户指南，玻璃银行与账户资料夹",
    topics: ["SGB银行","开户","资金路径"],
  },
  "jianzheng": {
    src: "/images/articles/covers/jianzheng.webp",
    alt: "香港银行见证开户，资料夹与玻璃银行入口",
    topics: ["香港银行","见证开户","材料准备"],
  },
  "huili": {
    src: "/images/articles/covers/huili.webp",
    alt: "汇立银行开户与转账，手机与玻璃账户连接",
    topics: ["汇立银行","开户","转账"],
  },
  "jianhang": {
    src: "/images/articles/covers/jianhang.webp",
    alt: "建行亚洲开户指南，两地银行账户连接",
    topics: ["建行亚洲","开户","两地账户"],
  },
  "pingan": {
    src: "/images/articles/covers/pingan.webp",
    alt: "平安数字银行开户指南，手机与身份验证卡",
    topics: ["平安数字银行","开户","身份验证"],
  },
  "zhongan-intro": {
    src: "/images/articles/covers/zhongan-intro.webp",
    alt: "众安银行使用指南，数字银行与钱包概念",
    topics: ["众安银行","开户","转账","消费","投资"],
  },
  "StockCoin": {
    src: "/images/articles/covers/StockCoin.webp",
    alt: "StockCoin 链上打新指南：证券资料、金属链节与玻璃文件的概念封面",
    topics: ["StockCoin","链上打新","产品认识","账户准备","申购"],
  },
  "stablestock": {
    src: "/images/articles/covers/stablestock.webp",
    alt: "StableStock 港美股入门：透明玻璃桥连接数字钱包与证券资料的封面",
    topics: ["StableStock","港美股","稳定币","入金","交易流程"],
  },
  "VIP": {
    src: "/images/articles/covers/VIP.webp",
    alt: "Wise VIP 服务体系介绍：学习书籍、放大镜与社群玻璃图形的封面",
    topics: ["Wise VIP","服务体系","研究工具","学习","社群"],
  },
  "web-guide": {
    src: "/images/articles/covers/web-guide.webp",
    alt: "Wise 网站使用指南：玻璃网站窗口与学习研究工具的概念封面",
    topics: ["Wise 网站","投资学习","数据工具","出海","使用指南"],
  },
  "beesim-guide": {
    src: "/images/articles/covers/beesim-guide.webp",
    alt: "BeeSIM 开通与使用：手机、工具卡与蓝牙连接的银白概念封面",
    topics: ["BeeSIM","工具卡","蓝牙","eSIM","使用教程"],
  },
  "xesim-guide": {
    src: "/images/articles/covers/xesim-guide.webp",
    alt: "Xesim 申请与开通：SIM 工具卡、配置文件与旅行手册的概念封面",
    topics: ["Xesim","申请","绑定","eSIM","套餐"],
  },
  "giffgaff-guide": {
    src: "/images/articles/covers/giffgaff-guide.webp",
    alt: "giffgaff 激活与保号：SIM 卡、日历与旅行资料的银白概念封面",
    topics: ["giffgaff","激活","保号","手机卡","日常维护"],
  },
  "MP-vcard": {
    src: "/images/articles/covers/MP-vcard.webp",
    alt: "MPCard 申请与使用教程，注册认证、充值开卡和支付绑定",
    topics: ["MPCard","充值开卡","支付绑定"],
  },
  "Gate-vcard": {
    src: "/images/articles/covers/Gate-vcard.webp",
    alt: "Gate 与 Gate Card 注册与开卡教程，账户注册、身份认证和卡片申请",
    topics: ["Gate Card","账户注册","卡片申请"],
  },
  "bitget-vcard": {
    src: "/images/articles/covers/bitget-vcard.webp",
    alt: "Bitget Wallet Card 申请与使用教程，钱包创建、地址证明和支付绑定",
    topics: ["Bitget Wallet","地址证明","支付绑定"],
  },
  "StarryBlu-vcard": {
    src: "/images/articles/covers/StarryBlu-vcard.webp",
    alt: "StarryBlu 开户与转账教程，账户申请、资金转入和转账使用",
    topics: ["StarryBlu","账户申请","转账使用"],
  },
  "UUWallet-vcard": {
    src: "/images/articles/covers/UUWallet-vcard.webp",
    alt: "UU Wallet 开卡与支付教程，钱包注册、充值开卡和日常支付",
    topics: ["UU Wallet","充值开卡","日常支付"],
  },
  "Benpay-vcard": {
    src: "/images/articles/covers/Benpay-vcard.webp",
    alt: "BenPay 开卡与订阅教程，卡片申请、账户充值和订阅支付",
    topics: ["BenPay","卡片申请","订阅支付"],
  },
  "us-guide": {
    src: "/images/articles/covers/us-guide.webp",
    alt: "港美股入门与开户资金路径：玻璃银行、证券文件和连接路线的银白概念封面",
    topics: ["港美股入门","港卡","券商","Web3","出海准备"],
  },
  "bybit-guide": {
    src: "/images/articles/covers/bybit-guide.webp",
    alt: "Bybit 开户与使用教程：手机和玻璃账户安全凭证的银白概念封面",
    topics: ["Bybit","注册","KYC","入金","账户安全"],
  },
  "biyapay": {
    src: "/images/articles/covers/biyapay.webp",
    alt: "BiyaPay 港美股与支付入门：银白钱包、概念支付卡与账户连接的封面",
    topics: ["BiyaPay","开户","港美股","虚拟卡","资金流转"],
  },
  "biance-guide": {
    src: "/images/articles/covers/biance-guide.webp",
    alt: "币安 Binance：注册、入金、买币，KYC 认证、账户安全与理财入门",
    topics: ["Binance", "KYC", "C2C 入金"],
  },
  "binance-referral": {
    src: "/images/articles/covers/binance-referral.webp",
    alt: "币安邀请码忘填后如何补绑：真实 Binance 金色标志与银白玻璃连接环的主题封面",
    topics: ["币安", "邀请码", "资格判断", "补绑", "官方入口"],
  },
  "bitget-referral": {
    src: "/images/articles/covers/bitget-referral.webp",
    alt: "Bitget 邀请码忘填或换绑怎么办：交易所真实双向折角标志与青绿玻璃主体的主题封面",
    topics: ["Bitget", "邀请码", "补绑", "换绑", "联系 Wise"],
  },
  "okx-guide": {
    src: "/images/articles/covers/okx-guide.webp",
    alt: "欧易 OKX：注册、入金、买币，KYC 认证、C2C 入金与 BTC 入门",
    topics: ["OKX", "C2C 入金", "BTC"],
  },
  "VIP002": {
    src: "/images/articles/covers/VIP002.webp",
    alt: "读懂美联储：看清资产的变化，政策预期 · 利率 · 资产定价",
    topics: ["美联储","利率","资产定价"],
  },
  "VIP001": {
    src: "/images/articles/covers/VIP001.webp",
    alt: "市场没结束：估值摩擦期，市场手记 Vol.01 · AI · 利率",
    topics: ["市场手记","AI","估值"],
  },
  "google-id": {
    src: "/images/articles/covers/google-id.webp",
    alt: "Google 账号：注册与安全设置，邮箱 · 手机验证 · 账号保护",
    topics: ["Google","注册","账号安全"],
  },
  "index-qa-2": {
    src: "/images/articles/covers/index-qa-2.webp",
    alt: "标普 / 纳指答疑：资金配置与复利，问答第二期 · 投资周期 · 风险管理",
    topics: ["问答第二期","资金配置","复利"],
  },
  "ifast-guide": {
    src: "/images/articles/covers/ifast-guide.webp",
    alt: "iFAST 英国银行：开户与入金教程，账户申请 · 多币种 · 跨境转账",
    topics: ["iFAST","开户","入金"],
  },
  "zhifu": {
    src: "/images/articles/covers/zhifu.webp",
    alt: "致富证券：开户与入金教程，账户申请 · 港美股 · 基础交易",
    topics: ["致富证券","开户","入金"],
  },
  "jiaxin": {
    src: "/images/articles/covers/jiaxin.webp",
    alt: "嘉信证券 Schwab：美股账户申请，材料准备 · 开户审核 · 入金",
    topics: ["Schwab","申请材料","账户审核"],
  },
  "aomenmayi-register": {
    src: "/images/articles/covers/aomenmayi-register.webp",
    alt: "澳门蚂蚁银行：开户与账户使用，材料准备 · 账户申请 · 入金",
    topics: ["澳门蚂蚁银行","开户","账户使用"],
  },
  "predict": {
    src: "/images/articles/covers/predict.webp",
    alt: "Predict 预测市场：从认识到上手，注册 · 充值 · 风险理解",
    topics: ["Predict","注册","风险理解"],
  },
  "BBAE": {
    src: "/images/articles/covers/BBAE.webp",
    alt: "BBAE 证券：开户与入金指南，平台介绍 · 账户申请 · 资金转入",
    topics: ["BBAE","账户申请","入金"],
  },
  "immersive-translate-guide": {
    src: "/images/articles/covers/immersive-translate-guide.webp",
    alt: "沉浸式翻译：打开双语信息世界，网页翻译 · 双语字幕 · 输入翻译",
    topics: ["沉浸式翻译","双语字幕","网页翻译"],
  },
  "passive-millionaire": {
    src: "/images/articles/covers/passive-millionaire.webp",
    alt: "长期定投：读懂时间与复利，持续投入 · 复利计算 · 投资周期",
    topics: ["长期定投","复利","投资周期"],
  },
  "safepal-vcard": {
    src: "/images/articles/covers/safepal-vcard.webp",
    alt: "SafePal 虚拟卡：申请与充值教程，身份认证 · 充值激活 · 支付绑定",
    topics: ["SafePal","认证","充值激活"],
  },
  "bybit-vcard": {
    src: "/images/articles/covers/bybit-vcard.webp",
    alt: "Bybit Card：申请与入金教程，账户准备 · 卡片申请 · 使用场景",
    topics: ["Bybit Card","申请","入金"],
  },
  "AppleID": {
    src: "/images/articles/covers/AppleID.webp",
    alt: "Apple 账号：美区注册与港区切换，账号准备 · 地区设置 · App 下载",
    topics: ["Apple 账号","美区注册","地区设置"],
  },
  "index-guide": {
    src: "/images/articles/covers/index-guide.webp",
    alt: "标普 500 · 纳指 100：指数投资完整指南，ETF · QDII · 产品比较",
    topics: ["ETF","QDII","指数投资"],
  },
  "index-practice": {
    src: "/images/articles/covers/index-practice.webp",
    alt: "标普 / 纳指基金：购买实操与费用，基金名称 · A/C 份额 · 持有成本",
    topics: ["基金购买","A/C 份额","持有成本"],
  },
  "index-qa-1": {
    src: "/images/articles/covers/index-qa-1.webp",
    alt: "标普 / 纳指答疑：新手常见问题，问答第一期 · 定投 · 基金选择",
    topics: ["问答第一期","定投","基金选择"],
  },
  "indexStock": {
    src: "/images/articles/covers/indexStock.webp",
    alt: "股票 · 国债 · 基金：一次读懂投资基础，资产类型 · 指数 · 利率",
    topics: ["股票","国债","基金"],
  },
  "idifferentIndex": {
    src: "/images/articles/covers/idifferentIndex.webp",
    alt: "场内与场外基金：看懂 ETF 的区别，交易机制 · 费用 · 流动性",
    topics: ["ETF","场内场外","交易费用"],
  },
  "bitget-exchange": {
    src: "/images/articles/covers/bitget-exchange.webp",
    alt: "Bitget 交易所：注册 · 入金 · 买币，KYC 认证 · 账户安全 · 功能入门",
    topics: ["Bitget","KYC","账户安全"],
  },
  "diyi": {
    src: "/images/articles/covers/diyi.webp",
    alt: "第一证券 Firstrade：美股开户指南，材料准备 · 账户申请 · 审核",
    topics: ["Firstrade","开户材料","审核"],
  },
  "xianggangmayi-register": {
    src: "/images/articles/covers/xianggangmayi-register.webp",
    alt: "蚂蚁银行（香港）：注册开户教程，材料准备 · 身份认证 · 账户申请",
    topics: ["香港蚂蚁银行","身份认证","开户"],
  },
  "huifeng-register": {
    src: "/images/articles/covers/huifeng-register.webp",
    alt: "汇丰 One 账户：线上开户教程，开户材料 · 信息填写 · 注意事项",
    topics: ["汇丰 One","开户材料","信息填写"],
  },
  "tianxing-register": {
    src: "/images/articles/covers/tianxing-register.webp",
    alt: "天星银行：注册与身份认证，开户准备 · 资料填写 · 申请流程",
    topics: ["天星银行","注册","身份认证"],
  },
  "zhongan-register": {
    src: "/images/articles/covers/zhongan-register.webp",
    alt: "众安银行 ZA Bank：注册开户教程，材料准备 · 身份认证 · 账户设置",
    topics: ["ZA Bank","开户","账户设置"],
  },
  "zhongying-register": {
    src: "/images/articles/covers/zhongying-register.webp",
    alt: "中银香港：注册开户指南，申请资料 · 信息填写 · 安全设置",
    topics: ["中银香港","申请资料","安全设置"],
  },
  "wise-register": {
    src: "/images/articles/covers/wise-register.webp",
    alt: "Wise 账户：注册与跨境收款，身份认证 · 多币种 · 账户设置",
    topics: ["Wise","账户注册","跨境收款"],
  },
  "gamsgo-guide": {
    src: "/images/articles/covers/gamsgo-guide.webp",
    alt: "GamsGo 订阅站：AI 工具使用指南，工具选择 · 订阅购买 · 使用流程",
    topics: ["GamsGo","AI 工具","订阅使用"],
  },
  "domestic-hk-us-guide": {
    src: "/images/articles/covers/domestic-hk-us-guide.webp",
    alt: "港美股投资入门：从开户到资金路径，银行账户 · 券商 · 入金",
    topics: ["港美股","银行账户","资金路径"],
  },
};

// Preserve the BIT tutorials' original instructional-image fallbacks.
// Dedicated list covers above take precedence; article bodies keep these screenshots.
export const preservedArticleCovers: Record<string, string> = {
  "bit-account-guide": "/content/articles/broker/BIT/01-app-account.webp",
  "bit-comparison": "/content/articles/broker/BIT/06-hkd-fees.webp",
};

export function getArticleListCover(id: string): string | undefined {
  if (Object.hasOwn(articleCovers, id)) return articleCovers[id].src;
  return Object.hasOwn(preservedArticleCovers, id) ? preservedArticleCovers[id] : undefined;
}
