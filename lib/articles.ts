import { genUid } from "./article-uid";
import { articles as hardcodedArticles, type Article } from "./articles-data";
import { loadFsArticles, type FsArticle } from "./articles-fs";

export type AnyArticle = Article | FsArticle;
export type ArticleListItem = Omit<Article, "content"> & {
  content?: string;
  basePath?: string;
};
export type ArticleFaqItem = {
  question: string;
  answer: string;
};

export function getAllArticles(): AnyArticle[] {
  const fsArticles = loadFsArticles();
  const fsIds = new Set(fsArticles.map((article) => article.id));
  return [...hardcodedArticles.filter((article) => !fsIds.has(article.id)), ...fsArticles];
}

export function getArticleRoute(article: Pick<Article, "id" | "categoryId">): string {
  return `/articles/${article.categoryId}/${genUid(article.id)}`;
}

export function getArticleByRoute(categoryId: string, uid: string): AnyArticle | undefined {
  return getAllArticles().find(
    (article) => article.categoryId === categoryId && genUid(article.id) === uid
  );
}

export function toArticleListItem(article: AnyArticle): ArticleListItem {
  const { content: _content, ...listItem } = article;
  return listItem;
}

export function getArticlePrimaryImage(article: Pick<Article, "content">): string | undefined {
  const imageMatch = article.content.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (!imageMatch) return undefined;
  return imageMatch[1].trim();
}

export function getArticleSeoKeywords(article: Pick<Article, "title" | "summary" | "categoryId">): string[] {
  const categoryKeywords: Record<string, string[]> = {
    vcard: ["虚拟 U 卡", "U 卡教程", "Apple Pay", "支付宝", "微信支付", "AI 订阅"],
    crypto: ["加密交易所", "交易所注册", "C2C 入金", "USDT", "BTC", "KYC"],
    broker: ["美股券商", "港美股开户", "券商开户", "美股入金", "护照开户"],
    bank: ["境外银行", "香港银行", "跨境收款", "见证开户", "美元账户"],
    index: ["指数基金", "ETF", "标普500", "纳斯达克100", "定投"],
    simcard: ["海外手机号", "eSIM", "保号", "出海账号"],
    ai: ["AI 工具", "ChatGPT", "海外订阅", "AI 订阅"],
  };

  const text = `${article.title} ${article.summary}`;
  const phraseMatches = text.match(/[A-Za-z][A-Za-z0-9+.-]{1,}|[\u4e00-\u9fff]{2,}/g) ?? [];
  const candidates = [
    "Wise Invest",
    ...(categoryKeywords[article.categoryId] ?? []),
    ...phraseMatches,
  ];

  return Array.from(new Set(candidates))
    .filter((keyword) => keyword.length <= 24)
    .slice(0, 16);
}

export function getArticleFaqs(article: Pick<Article, "title" | "summary" | "categoryId">): ArticleFaqItem[] {
  const categoryFaqs: Record<string, ArticleFaqItem[]> = {
    vcard: [
      {
        question: "虚拟 U 卡能不能绑定 Apple Pay、支付宝或 AI 订阅？",
        answer: "不同卡片支持的支付场景不一样，重点看发卡地区、卡组织、KYC 要求和商户风控。操作前应以 App 内页面和官方说明为准。",
      },
      {
        question: "虚拟 U 卡使用前最应该先确认什么？",
        answer: "先确认开卡费、充值费、消费手续费、退款规则和风控限制，再用小额消费测试是否适合自己的订阅或支付场景。",
      },
    ],
    crypto: [
      {
        question: "大陆用户注册交易所前要先看什么？",
        answer: "先看平台当前注册地区、KYC、入金方式和账户安全要求。活动、返佣和可用通道会变化，注册前需要再次核对官方页面。",
      },
      {
        question: "C2C 入金和买币最需要注意什么？",
        answer: "优先小额测试，核对商家信誉、付款信息、到账时间和平台风控提示，不要脱离平台聊天或线下转账。",
      },
    ],
    broker: [
      {
        question: "港美股券商开户通常需要准备什么？",
        answer: "通常需要身份证件、地址证明、税务信息、邮箱手机号和入金账户。不同券商审核口径不同，提交前以券商页面为准。",
      },
      {
        question: "开户之后下一步应该做什么？",
        answer: "先完成安全设置和小额入金测试，再确认交易权限、换汇成本、佣金和税务表格，不建议一开始就做大额操作。",
      },
    ],
    bank: [
      {
        question: "境外银行开户前最应该确认什么？",
        answer: "重点确认开户资格、材料清单、账户管理费、转账费用、入金路径和资金用途说明，银行审核政策可能随时调整。",
      },
      {
        question: "Wise 或多币种账户可以替代银行账户吗？",
        answer: "它更适合跨境收付款和多币种周转，但是否能用于券商入金、收款或长期存放资金，要看目标平台的具体要求。",
      },
    ],
    index: [
      {
        question: "定投文章能不能直接当作买卖建议？",
        answer: "不能。定投记录和工具用于学习执行节奏、成本变化和回撤压力，具体买卖仍要结合自己的现金流、周期和风险承受能力。",
      },
      {
        question: "长期定投最应该关注哪些变量？",
        answer: "重点关注投入频率、现金流稳定性、最大回撤承受能力、标的质量和持有周期，而不是只看短期涨跌。",
      },
    ],
  };

  const fallback: ArticleFaqItem[] = [
    {
      question: `这篇《${article.title}》适合先读吗？`,
      answer: "适合先用来建立整体认知，再根据自己的具体场景跳转到相关教程、工具或福利入口。",
    },
    {
      question: "文章里的费率、活动和规则需要再次确认吗？",
      answer: "需要。涉及价格、费率、注册、开户、KYC 和地区限制的内容都会变化，实际操作前应以官方页面和账户内提示为准。",
    },
  ];

  return categoryFaqs[article.categoryId] ?? fallback;
}
