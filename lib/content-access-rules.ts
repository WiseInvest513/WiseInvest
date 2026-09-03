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
  access: "MEMBER",
  reason: "完整文章需要登录 Wise ID 后阅读",
};

export const defaultRoadmapAccessRule: ContentAccessRuleConfig = {
  access: "MEMBER",
  reason: "完整学习路线需要登录 Wise ID 后查看",
};

export const publicArticleAccessRules: ArticleAccessRuleConfig[] = [
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

export const publicRoadmapDetailIds = new Set(publicRoadmapDetailAccessRules.map((rule) => rule.id));
export const publicCapitalFlowRouteIds = new Set(publicCapitalFlowRouteAccessRules.map((rule) => rule.id));
