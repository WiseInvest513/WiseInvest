import { getAllArticles, getArticleRoute } from "@/lib/articles";
import { categories } from "@/lib/articles-data";
import { roadmaps } from "@/lib/roadmaps-data";
import { getContentAccessRule, type ContentAccessLevel, type ContentItemType } from "@/lib/content-access";

export type ContentCatalogItem = {
  contentType: ContentItemType;
  contentKey: string;
  title: string;
  description: string;
  group: string;
  fallbackAccess: ContentAccessLevel;
  fallbackReason: string;
};

const capitalFlowRoutes = [
  { id: "overview", title: "完整资金环形总览", description: "资金路径地图总览" },
  { id: "onchain-us-stocks", title: "链上美股", description: "通过链上入口参与美股交易" },
  { id: "onchain-ipo", title: "链上打新", description: "链上产品的新股参与路径" },
  { id: "traditional-us-stocks", title: "传统美股", description: "传统券商购买美股路径" },
  { id: "traditional-ipo", title: "传统打新", description: "传统券商打新路径" },
  { id: "a-share-ipo", title: "A 股打新", description: "国内券商与 A 股打新路径" },
  { id: "domestic-to-hk", title: "国内银行转港卡", description: "从国内银行到香港卡的资金路径" },
  { id: "transfer-to-us-broker", title: "国内到美资券商", description: "中转后进入美资券商" },
  { id: "hk-card-to-broker", title: "港卡到港资券商", description: "香港卡入金港资券商" },
  { id: "us-bank-direct", title: "美国银行直达", description: "美国银行账户直接入金路径" },
  { id: "hk-u-card-consume", title: "港卡到 U 卡消费", description: "香港卡与虚拟 U 卡消费路径" },
  { id: "crypto-u-card-consume", title: "Crypto 到 U 卡消费", description: "加密资产连接消费卡" },
  { id: "crypto-to-us-broker", title: "Crypto 到美股券商", description: "交易所和链上美股相关路径" },
  { id: "return-home", title: "资金回流", description: "海外资金回流与中转路径" },
];

function withFallback(item: Omit<ContentCatalogItem, "fallbackAccess" | "fallbackReason">): ContentCatalogItem {
  const fallback = getContentAccessRule(item.contentKey);
  return {
    ...item,
    fallbackAccess: fallback.access,
    fallbackReason: fallback.reason,
  };
}

export function getContentCatalogItems(): ContentCatalogItem[] {
  const articles = getAllArticles().map((article) =>
    withFallback({
      contentType: "ARTICLE",
      contentKey: getArticleRoute(article),
      title: article.title,
      description: article.summary,
      group: categories.find((category) => category.id === article.categoryId)?.name ?? article.categoryId,
    })
  );

  const roadmapDetails = roadmaps.map((roadmap) =>
    withFallback({
      contentType: "ROADMAP_DETAIL",
      contentKey: `/roadmap/${roadmap.id}`,
      title: roadmap.title,
      description: roadmap.description,
      group: "学习路线",
    })
  );

  const roadmapRoutes = capitalFlowRoutes.map((route) =>
    withFallback({
      contentType: "ROADMAP_ROUTE",
      contentKey: `/roadmap?route=${route.id}`,
      title: route.title,
      description: route.description,
      group: "资金地图",
    })
  );

  return [...articles, ...roadmapDetails, ...roadmapRoutes];
}
