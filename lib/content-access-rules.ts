import { genUid } from "@/lib/article-uid";

export type ContentAccessLevel = "PUBLIC" | "MEMBER" | "VIP" | "VIP_PLUS";

export type ContentAccessRuleConfig = {
  access: ContentAccessLevel;
  reason: string;
};

export type ArticleAccessRuleConfig = ContentAccessRuleConfig & {
  articleId: string;
  categoryId: string;
};

export type RoadmapAccessRuleConfig = ContentAccessRuleConfig & {
  id: string;
};

export const defaultArticleAccessRule: ContentAccessRuleConfig = {
  access: "PUBLIC",
  reason: "所有文章均可免登录阅读全文",
};

export const defaultRoadmapAccessRule: ContentAccessRuleConfig = {
  access: "MEMBER",
  reason: "完整学习路线需要登录 Wise ID 后查看",
};

export const publicArticleAccessRules: ArticleAccessRuleConfig[] = [
  {
    articleId: "galaxy-etf-guide",
    categoryId: "domestic",
    access: "PUBLIC",
    reason: "银河证券 ETF 免五公开指南",
  },
  {
    articleId: "web-guide",
    categoryId: "web",
    access: "PUBLIC",
    reason: "公开示范文章",
  },
  {
    articleId: "VIP",
    categoryId: "VIP",
    access: "PUBLIC",
    reason: "VIP 体系说明",
  },
];

// 2026-11-12：主网站所有文章（含原 VIP 文章）统一公开阅读。
export const vipArticleAccessRules: ArticleAccessRuleConfig[] = [];

export const publicRoadmapDetailAccessRules: RoadmapAccessRuleConfig[] = [
  {
    id: "crypto-trading",
    access: "PUBLIC",
    reason: "公开学习路线",
  },
  {
    id: "binance-alpha-okx-boost",
    access: "PUBLIC",
    reason: "公开学习路线",
  },
];

export const publicCapitalFlowRouteAccessRules: RoadmapAccessRuleConfig[] = [
  {
    id: "overview",
    access: "PUBLIC",
    reason: "公开资金路径",
  },
  {
    id: "onchain-us-stocks",
    access: "PUBLIC",
    reason: "公开资金路径",
  },
];

export const publicArticlePaths = new Set(
  publicArticleAccessRules.map((rule) => `/articles/${rule.categoryId}/${genUid(rule.articleId)}`)
);
export const vipArticlePaths = new Set(
  vipArticleAccessRules.map((rule) => `/articles/${rule.categoryId}/${genUid(rule.articleId)}`)
);

export const publicRoadmapDetailIds = new Set(publicRoadmapDetailAccessRules.map((rule) => rule.id));
export const publicCapitalFlowRouteIds = new Set(publicCapitalFlowRouteAccessRules.map((rule) => rule.id));
