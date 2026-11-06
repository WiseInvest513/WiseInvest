import type { ArticleListItem } from "./articles";
import { articleSeries } from "./article-library";
import { getArticleSeries, getSeriesArticleHref, getSeriesReadingState } from "./article-series";
import { genUid } from "./article-uid";

export type ReadingRecommendation = Pick<ArticleListItem, "id" | "categoryId" | "title" | "summary" | "readTime"> & {
  href: string;
  label: string;
  reason: string;
};

const introductions: Record<string, string> = {
  broker: "继续了解账户选择、开户准备与资金入账。",
  bank: "串起账户准备、跨境收付款与后续使用。",
  crypto: "按自己的需要继续了解注册、账户安全与平台使用。",
  vcard: "继续比较开卡条件、充值方式与支付场景。",
  onchain: "进一步了解产品结构、资金路径与使用条件。",
  predict: "补充交易机制、账户准备与风险认识。",
  index: "把指数概念、购买方式和长期持有串起来看。",
  simcard: "继续了解境外手机号的开通、使用与维护。",
  ai: "接着了解工具选择、账号准备与实际使用。",
  outside: "补齐海外账号、通信与常用工具的准备。",
};

const connections: Record<string, { id: string; label: string; reason: string }[]> = {
  "bit-account-guide": [{ id: "bit-comparison", label: "接着读 · BIT 系列第二篇", reason: "比较不同券商的费用、资金路径与适用场景。" }],
  "bit-comparison": [{ id: "bit-account-guide", label: "配套教程 · BIT 开户", reason: "选好平台后，按图了解开户、认证和入金步骤。" }],
  "futu-broker": [{ id: "ifas-fuxing", label: "配套教程 · 复星入金", reason: "接着查阅众安与 iFAST 转账到复星的步骤。" }],
  "ifas-fuxing": [{ id: "futu-broker", label: "开户准备", reason: "尚未开通证券账户时，先核对开户材料与条件。" }],
  "biance-guide": [{ id: "binance-referral", label: "遇到问题 · 邀请码补填", reason: "已有账户但忘记邀请码时，先核对补填条件。" }],
  "binance-referral": [{ id: "biance-guide", label: "配套教程 · 币安使用", reason: "继续了解认证、入金和基础功能。" }],
  "bitget-exchange": [{ id: "bitget-referral", label: "遇到问题 · 邀请关系", reason: "已有账户时，了解补填与换绑的适用条件。" }],
  "bitget-referral": [{ id: "bitget-exchange", label: "配套教程 · Bitget 使用", reason: "继续了解开户注册、入金与平台基础功能。" }],
};

/** Recommend public metadata only; links still go through normal access checks. */
export function getArticleReadingRecommendations(
  current: Pick<ArticleListItem, "id" | "categoryId" | "subcategoryId">,
  articles: readonly ArticleListItem[],
  seriesId?: string,
  routeId?: string,
) {
  const byId = new Map(articles.filter(article => article.categoryId).map(article => [article.id, article]));
  const result: ReadingRecommendation[] = [];
  const seen = new Set([current.id]);
  const add = (id: string | undefined, label: string, reason: string, href?: string) => {
    if (!id || seen.has(id) || result.length >= 4) return;
    const article = byId.get(id);
    if (!article) return;
    seen.add(id);
    const { title, summary, readTime, categoryId } = article;
    result.push({ id, title, summary, readTime, categoryId, label, reason,
      href: href ?? `/articles/${categoryId}/${genUid(id)}` });
  };
  const series = getArticleSeries(seriesId, current.id);
  if (series) {
    const reading = getSeriesReadingState(series, [...articles], current.id, routeId);
    if (reading.next) add(reading.next.articleId,
      series.kind === "path" ? "继续本路线" : "同系列下一篇",
      series.kind === "path" ? "沿当前学习路线继续查阅，按自己的需求选择。" : "接着阅读这个系列的下一篇内容。",
      reading.next.href);
  }
  for (const connection of Object.hasOwn(connections, current.id) ? connections[current.id] : []) {
    add(connection.id, connection.label, connection.reason);
  }
  const relatedSeries = articleSeries.filter(item => item.chapters.some(chapter => chapter.articleId === current.id));
  for (const related of relatedSeries) {
    const at = related.chapters.findIndex(chapter => chapter.articleId === current.id);
    const candidates = [...related.chapters.slice(at + 1), ...related.chapters.slice(0, at).reverse()];
    for (const chapter of candidates) {
      const article = chapter.articleId ? byId.get(chapter.articleId) : undefined;
      if (!article) continue;
      add(article.id, related.kind === "path" ? "同路线延伸" : "同系列阅读", related.title,
        getSeriesArticleHref(related.id, article, related.id === series?.id ? routeId : undefined));
    }
  }
  const sameTopic = [...byId.values()].filter(article => article.categoryId === current.categoryId)
    .sort((a, b) => Number(b.subcategoryId === current.subcategoryId) - Number(a.subcategoryId === current.subcategoryId)
      || b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  for (const article of sameTopic) add(article.id, "同主题延伸", "补充这个主题下的其他选择与操作方法。");
  return { introduction: Object.hasOwn(introductions, current.categoryId) ? introductions[current.categoryId] : "沿着当前主题，继续了解相关方法与使用场景。", articles: result };
}
