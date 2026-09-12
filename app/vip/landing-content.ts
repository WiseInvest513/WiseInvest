import { genUid } from "@/lib/article-uid";

// Public editorial metadata only; no protected article body on this landing page.
export const featuredArticle = {
  href: `/articles/VIP/${genUid("VIP001")}`,
  title: "市场没结束，只是进入了估值摩擦期",
  date: "2026-09-05",
  summary: "从美债与利率，到 AI、存储、BTC 与黄金，看看一个市场判断是怎样形成的。",
};
export const introductionHref = `/articles/VIP/${genUid("VIP")}`;
export const problems = [
  { title: "消息总是慢人一步", text: "别人已经在讨论、晒图，你才知道市场发生了什么，追着消息走，却总觉得晚了一步。" },
  { title: "信息很多，没有方向", text: "新闻刷了不少，还是不知道每天该看什么、哪些事件值得放进观察清单。" },
  { title: "不知道市场往哪个方向发展", text: "涨跌都能找到解释，却理不清利率、产业和资金之间的关系，也找不到自己的观察主线。" },
  { title: "看懂点位，却不懂操作逻辑", text: "知道一个价格，不等于知道为什么参与、风险在哪里，以及判断失效后怎么办。" },
  { title: "没有同行的人一起交流", text: "遇到问题不知道问谁，有了想法也缺少讨论。一个人摸索，很多疑问就一直留在那里。" },
];
export const brokerageChannels = [
  { name: "银河证券", href: "/perk/broker#a-share-broker", cta: "开户说明" },
  { name: "腾达证券", href: "/articles/broker/4k1kTctf", cta: "查看教程" },
  { name: "致富证券", href: "/articles/broker/GaobLP0X", cta: "查看教程" },
  { name: "复星证券", href: "/articles/broker/sQSbLRe8", cta: "查看教程" },
  { name: "BBAE 证券", href: `/articles/broker/${genUid("BBAE")}`, cta: "查看教程" },
];
export const exchangeOrder = ["binance", "bitget", "bybit", "gate", "okx"];
export const joinSteps = [
  ["注册 Wise ID", "创建你的 Wise 账户，统一管理会员身份。"],
  ["使用 Wise 渠道", "选择自己需要的券商或交易所，确认合作与邀请关系。"],
  ["完成账户条件", "券商开户、入金并激活；交易所入金 100U 并完成任意金额交易。"],
  ["提交核验资料", "填写真实 UID / 账户 ID，以及注册时间；券商需注明名称。"],
  ["审核通过，加入 VIP", "人工核验通过后升级身份，在账户中心查看权益与进群方式。"],
];
export const faqs = [
  { question: "没有加入 VIP，还能使用网站吗？", answer: "可以的，公开教程、学习路线和公开工具仍然可以使用。但后续部分新功能和专属内容只会对 VIP 用户开放，具体以各页面的权限说明为准。" },
  { question: "付费升级 SVIP，需要提交交易所 UID 吗？", answer: "不需要。你可以选择支付 300 美元开通 SVIP，长期有效，无需提交券商或交易所账户资料。请联系 Wise 确认权益与付款方式，完成后由管理员为你的 Wise ID 开通。" },
  { question: "填写 Wise 邀请码，就会自动成为 VIP 吗？", answer: "不会。你的真实账户必须属于 Wise 合作渠道或邀请关系，并完成对应的入金、激活或交易条件。提交资料后还需要人工核验；单独填写邀请码或无关 UID，不能获得 VIP 资格。" },
  { question: "已有账户，但不是 Wise 邀请关系，怎么办？", answer: "先查看对应平台的邀请关系处理说明，确认是否支持补绑或更换渠道，不要直接提交无关账户。如果符合条件，再完成相应流程后申请核验。", href: "/guide/exchange-referral", linkLabel: "查看邀请码绑定异常处理" },
  { question: "审核通过后，在哪里加入 VIP 群？", answer: "进入“我的 VIP 中心”或“VIP 内容中心”，按其中展示的联系方式申请进群。群聊、内容与会员身份统一以账户中心的实际权益为准。" },
  { question: "加入 VIP，能保证收益或获取内幕消息吗？", answer: "不能。我们提供公开信息整理、研究参考、工具与交流，不提供内幕消息，也不承诺收益。价格区间和观察条件不是买卖指令，合约与杠杆具有较高风险，请独立判断、量力参与。" },
  { question: "AI 工具与定制，具体包含什么？", answer: "可以先使用已有网站与工具，并围绕信息整理、研究流程等实际需求沟通改进或定制。是否承接、交付范围、时间与费用需要具体确认，不代表无限量免费开发。" },
  { question: "提交核验需要提供密码吗？", answer: "不需要。只提交必要的账户标识和说明。Wise 不会要求你提供账户密码、验证码、私钥、助记词或 API Secret。" },
];
