import { articleCategoryIcons } from "./article-icons";

export interface CategoryGuide {
  group: string;
  label: string;
  artwork: string;
  tagline: string;
  description: string;
  outcomes: readonly [readonly [string, string], readonly [string, string], readonly [string, string]];
}

const icon = (name: keyof typeof articleCategoryIcons) => articleCategoryIcons[name];

export const categoryGuides: Record<string, CategoryGuide> = {
  transfers: {
    group: "开户与资金", label: "资金流转", artwork: icon("transfers"),
    tagline: "从转出到到账，弄清每一步的钱去了哪里。",
    description: "从 SafePal 汇款与建行结汇，到 SafePal、众安入金盈透，结合真实操作截图梳理账户之间的资金流转。分清汇出账号、收款指令与付款附言，再核对费用和到账记录。",
    outcomes: [["看清资金路径", "区分钱包转账、账户充值、银行收款与结汇，核对通道是否仍可用。"], ["跟图核对步骤", "找到币种、网络、收款账户与付款凭证，避免把提交成功当作已经到账。"], ["算清实际成本", "分别检查网络费、汇率与银行扣费，留下可追溯的操作记录。"]],
  },
  domestic: {
    group: "投资与市场", label: "入门路径", artwork: icon("domestic"),
    tagline: "先理清账户与资金路径，再开始投资。",
    description: "从国内用户的实际准备出发，把银行卡、境外账户、券商和网络工具串起来，了解港美股投资需要哪些环节，以及不同环节之间如何衔接。",
    outcomes: [["理清准备顺序", "把银行卡、手机号与证券账户放进同一张准备清单。"], ["看懂资金路径", "了解换汇、中转与券商入金之间的关系。"], ["按需求补齐工具", "结合自己的条件查找具体教程，避免盲目开通一堆账户。"]],
  },
  index: {
    group: "投资与市场", label: "指数与基金", artwork: icon("index"),
    tagline: "从认识指数，到写下并执行自己的投资计划。",
    description: "围绕标普500与纳斯达克100，把现有文章串成六个学习阶段：认识资产、理解收益与回撤、制定投入计划、比较渠道与产品、完成购买、复核持有。每一阶段都有文章与蓝皮书章节衔接，第一次来可以顺序学习，已有基础也可以按问题查阅。",
    outcomes: [["先理解，再决定", "分清资产与指数，理解复利假设、回撤和自己的用钱期限。"], ["把选择变成计划", "安排投入节奏，比较费用、溢价和账户条件，再阅读实操。"], ["买完也知道怎么做", "检查份额与扣款，根据现金流和目标变化复核持有计划。"]],
  },
  strategy: {
    group: "投资与市场", label: "研究与决策", artwork: icon("strategy"),
    tagline: "从投资目标出发，建立自己的决策框架。",
    description: "以已发布的标普 500 中期选举策略研究为起点，围绕历史胜率、买入窗口与执行边界展开。后续还会补充仓位管理与复盘方法；指数与基金基础可先到「指数与基金」分类阅读。",
    outcomes: [["对照已有研究", "阅读标普 500 中期选举策略，理解历史样本、买入窗口与适用边界。"], ["理清目标与仓位", "把资金用途、投入周期与回撤承受放进同一套决策问题。"], ["留下可复盘记录", "区分单次运气与可重复过程，为后续研究文预留阅读空间。"]],
  },
  crypto: {
    group: "加密与 Web3", label: "交易所入门", artwork: icon("crypto"),
    tagline: "先走完基础五课，再进入具体交易所教程。",
    description: "建议先阅读「加密货币从 0 到 1」五课路线：认识资产、购买入口、C2C 入金、现货与合约、转账保管。再按需查阅币安、OKX、Bybit、Bitget 的注册使用教程，以及邀请码补填说明。涉及地区、费率和活动条件，以平台当前规则为准。",
    outcomes: [["先走基础五课", "分清币、交易所与钱包，再决定从哪个入口买币和转账。"], ["再看平台教程", "按需学习各大交易所的注册、入金、安全设置与产品边界。"], ["核对规则与风险", "关注付款核验、链上网络和邀请关系，识别操作边界。"]],
  },
  predict: {
    group: "加密与 Web3", label: "事件与概率", artwork: icon("predict"),
    tagline: "先读懂事件规则，再理解市场价格。",
    description: "以 Predict 入门教程为起点，认识预测市场的事件合约、页面信息与账户操作。重点理解结算来源、截止时间和交易风险，不把市场价格当作结果保证。",
    outcomes: [["认识事件合约", "区分交易题目、选项与市场价格，建立基础概念。"], ["熟悉平台流程", "了解注册、充值和查看市场的步骤与对应界面。"], ["先查结算条件", "核对事件定义、服务地区与结算规则，理解可能的损失。"]],
  },
  onchain: {
    group: "加密与 Web3", label: "链上证券", artwork: icon("onchain"),
    tagline: "同样写着美股，先弄清买到的是什么。",
    description: "围绕 BiyaPay、StableStock 与 StockCoin，了解链上港美股相关产品、打新入口和资金流转方式，关注资产权益、托管安排与平台规则之间的区别。",
    outcomes: [["辨别产品结构", "分清账户、交易入口与底层权益，不只看产品名称。"], ["串起使用步骤", "结合平台教程理解开户、入金、交易或打新的操作路径。"], ["核对资金与限制", "关注费用、出入金条件及平台风险，不把便利等同于安全。"]],
  },
  broker: {
    group: "开户与资金", label: "证券账户", artwork: icon("broker"),
    tagline: "从选择券商到完成入金，把开户路径理清楚。",
    description: "汇集美股、港股与数字券商的介绍、开户和入金教程。先了解开户资格、材料和账户结构，再按具体平台核对审核步骤、费用与资金路径。",
    outcomes: [["比较账户选择", "结合投资市场、开户条件与使用需求，了解不同券商的差异。"], ["准备开户材料", "梳理证件、地址与税务资料，跟着图文核对申请步骤。"], ["衔接入金与使用", "看懂银行转账、换汇与到账流程，关注费用和账户限制。"]],
  },
  bank: {
    group: "开户与资金", label: "跨境账户", artwork: icon("bank"),
    tagline: "选对账户用途，理清开户与跨境转账。",
    description: "从香港实体银行、虚拟银行到数字账户与见证开户，了解不同账户的申请条件、日常使用和转账方式。按自己的收付款需求比较，不把所有账户视作同一种产品。",
    outcomes: [["明确账户用途", "区分储蓄、收付款与券商入金等场景，了解账户服务差异。"], ["核对申请条件", "查阅证件、所在地与审核要求，再选择适合的开户路径。"], ["理解转账与维护", "关注汇款信息、到账时间、费用和账户日常使用要求。"]],
  },
  vcard: {
    group: "开户与资金", label: "支付工具", artwork: icon("vcard"),
    tagline: "从开卡到支付，弄清每一步的条件与成本。",
    description: "先读怎么选对比枢纽，再进入各卡申请、认证、充值与绑定支付教程；覆盖 AI 订阅和日常消费。重点比较适用地区、费用与商户支持，避免只看开卡门槛。",
    outcomes: [["比较使用场景", "了解不同卡片在订阅、线上支付和线下消费中的用途。"], ["了解开卡与绑定", "跟着平台教程核对认证、充值与支付工具绑定步骤。"], ["算清费用与限制", "关注充值、消费、退款与账户规则，确认实际使用成本。"]],
  },
  simcard: {
    group: "工具与出海", label: "通信指南", artwork: icon("simcard"),
    tagline: "从选卡到保号，让境外号码真正用起来。",
    description: "围绕 BeeSIM、Xesim 与 giffgaff，梳理实体 SIM、eSIM 与工具卡的使用方式，了解设备适配、开通激活与日常维护，找到适合自己的境外通信方案。",
    outcomes: [["选对通信方案", "分清卡片类型与设备要求，按收短信、上网等需求选择。"], ["完成开通与配置", "跟着图文完成购卡、绑定和激活，了解 eSIM 下载与切换。"], ["做好长期维护", "了解充值、保号和使用注意事项，减少号码停用与意外扣费。"]],
  },
  ai: {
    group: "工具与出海", label: "效率与阅读", artwork: icon("ai"),
    tagline: "把订阅和语言门槛，变成可以解决的具体问题。",
    description: "从 GamsGo 订阅服务与沉浸式翻译的使用教程入手，了解工具入口、配置方法和适用场景，帮助自己更顺畅地阅读外文资料、使用海外数字服务。",
    outcomes: [["找到合适的工具", "结合阅读、翻译和订阅需求，理解工具各自解决什么问题。"], ["完成基础配置", "按图文了解账号、订阅或浏览器工具的使用步骤。"], ["留意账号与隐私", "关注共享方式、续费条件和数据权限，了解服务边界。"]],
  },
  outside: {
    group: "工具与出海", label: "账号准备", artwork: icon("outside"),
    tagline: "先把基础账号备好，再连接需要的服务。",
    description: "通过 Apple ID 与 Google 账号教程，了解注册准备、地区设置和账号使用，补齐海外 App 下载与邮箱等基础入口，并关注后续安全与恢复方式。",
    outcomes: [["整理注册准备", "了解邮箱、手机号与设备等准备事项，区分不同账号用途。"], ["熟悉账号设置", "跟着教程查看注册与地区设置流程，核对服务的适用条件。"], ["保管登录与恢复", "关注验证方式、恢复信息和账号安全，减少后续使用障碍。"]],
  },
  web: {
    group: "Wise 指南", label: "网站地图", artwork: icon("web"),
    tagline: "从一个问题出发，找到对应的网站和工具。",
    description: "认识 Wise 旗下网站的分工，把教程、投资研究、数据工具与出海服务连接起来。先明确自己要解决的问题，再找到对应入口与后续阅读路径。",
    outcomes: [["认识网站分工", "了解各站点面向的需求与提供的内容，减少重复寻找。"], ["找到实用入口", "按学习、账户、数据或研究任务定位相关网站与教程。"], ["串联使用路径", "把内容阅读与工具使用连起来，形成适合自己的工作顺序。"]],
  },
  VIP: {
    group: "Wise 指南", label: "研究与进阶", artwork: icon("VIP"),
    tagline: "了解会员体系，也读懂研究背后的思考。",
    description: "这里收录 Wise VIP 体系介绍与市场研究手记，围绕宏观变化、资产表现和投资判断展开。文章的预览与完整阅读范围，按各自的会员权限展示。",
    outcomes: [["了解服务与权限", "查阅体系介绍，区分内容、工具、社群与不同阅读权限。"], ["跟随研究思路", "从市场手记中学习如何连接政策、经济变量与资产表现。"], ["建立自己的判断", "关注研究依据、适用阶段和不确定性，不把观点当作指令。"]],
  },
};

type SubcategoryGuide = Pick<CategoryGuide, "tagline" | "description"> & { categoryId: string };
export const subcategoryGuides: Record<string, SubcategoryGuide> = {
  "us-broker": { categoryId: "broker", tagline: "从美股券商的申请条件，到实际入金与使用。", description: "集中查看美股券商的开户资料、账户申请与入金教程，了解不同平台的证件、地址和税务资料要求，再核对费用、交易权限及适用地区。" },
  "hk-broker": { categoryId: "broker", tagline: "把港股券商开户、银行转账和市场权限串起来。", description: "围绕港股券商的开户与入金，了解申请流程、银行账户衔接和港美股交易入口，关注材料审核、转账信息及不同市场的使用条件。" },
  "digital-broker": { categoryId: "broker", tagline: "先看账户结构，再看数字券商的便利。", description: "结合数字券商介绍与对比文章，区分证券账户、综合账户及相关资金入口，理解购买的权益、资产划转方式和平台费用，避免只凭产品名称判断。" },
  "physical-bank": { categoryId: "bank", tagline: "从材料准备到开户申请，了解实体银行的具体流程。", description: "整理实体银行的开户教程，核对证件、所在地和申请方式，了解线上申请或线下办理的步骤，以及账户开通后的收付款与使用要求。" },
  "virtual-bank": { categoryId: "bank", tagline: "在手机上完成申请，也要读懂账户规则。", description: "集中查看虚拟银行的产品介绍和 App 开户教程，了解身份验证、服务地区、转账与日常使用要求；线上申请不代表没有所在地或材料限制。" },
  "digital-bank": { categoryId: "bank", tagline: "按收付款用途选择数字账户，先弄清服务边界。", description: "了解数字银行与跨境账户服务的注册、入金和转账方式，比较币种、费用及账户用途，注意不同产品的服务主体和资金保障安排并不相同。" },
  jianzheng: { categoryId: "bank", tagline: "先核对资格与材料，再了解见证开户路径。", description: "围绕见证开户教程，梳理境内外银行的衔接方式、申请条件与资料准备。具体受理地区、资产要求和审核安排，以银行当前确认的信息为准。" },
};

export function getCategoryGuide(categoryId?: string, subcategoryId?: string): CategoryGuide | undefined {
  if (!categoryId || !Object.hasOwn(categoryGuides, categoryId)) return undefined;
  const guide = categoryGuides[categoryId];
  const sub = subcategoryId && Object.hasOwn(subcategoryGuides, subcategoryId) ? subcategoryGuides[subcategoryId] : undefined;
  return sub?.categoryId === categoryId ? { ...guide, tagline: sub.tagline, description: sub.description } : guide;
}
