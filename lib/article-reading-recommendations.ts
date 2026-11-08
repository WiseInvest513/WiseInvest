import type { ArticleListItem } from "./articles";
import { articleSeries } from "./article-library";
import { getArticleSeries, getPrimaryArticleSeries, getSeriesArticleHref, getSeriesReadingState } from "./article-series";
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
  "crypto-first-steps": [
    { id: "crypto-buying-platforms", label: "下一课 · 购买入口", reason: "认清资产后，比较法币入口、交易所和链上兑换的条件。" },
    { id: "crypto-transfer-basics", label: "已有资产 · 转账保管", reason: "准备转出时，进一步检查地址、网络、到账与密钥责任。" },
  ],
  "crypto-buying-platforms": [
    { id: "crypto-c2c-funding", label: "下一课 · C2C 入金", reason: "把交易对手、付款订单与收到资产的步骤分开看。" },
    { id: "biance-guide", label: "配套图解 · 币安", reason: "符合本人服务资格后，再查阅注册与账户操作图。" },
  ],
  "crypto-c2c-funding": [
    { id: "crypto-spot-futures", label: "下一课 · 买卖与成交", reason: "收到资产后，继续认识交易对、现货订单和合约区别。" },
    { id: "crypto-transfer-basics", label: "准备转出 · 到账核对", reason: "需要链上转出时，核对网络、最低金额、手续费和接收条件。" },
  ],
  "crypto-spot-futures": [
    { id: "crypto-transfer-basics", label: "下一课 · 转账与保管", reason: "持仓之后再理解转出、链上确认和钱包保管。" },
    { id: "crypto-first-steps", label: "回看基础 · 资产与账户", reason: "把余额、资产数量和控制权限重新对应起来。" },
  ],
  "crypto-transfer-basics": [
    { id: "crypto-buying-platforms", label: "回看入口选择", reason: "按实际资金来源和保管需求重新检查平台与钱包。" },
    { id: "bitget-exchange", label: "配套图解 · 跨平台转入", reason: "用已有平台图解对照充币、提币和到账记录的位置。" },
  ],
  "us-stock-account-basics": [
    { id: "us-stock-first-order", label: "下一课 · 第一笔订单", reason: "看懂资金后，继续核对报价、订单条件与成交状态。" },
    { id: "us-stock-money-status", label: "资金问题 · 到账与结算", reason: "区分账户记账、可交易与可提取，查清资金停在哪一步。" },
  ],
  "us-stock-first-order": [
    { id: "us-stock-money-status", label: "下一课 · 资金状态", reason: "把成交后的结算与银行回款接起来看。" },
    { id: "us-stock-account-basics", label: "下单准备 · 购买力", reason: "出现资金不足或借款提示时，回到账户和币种明细。" },
  ],
  "us-stock-money-status": [
    { id: "us-guide", label: "回到全流程", reason: "把资金状态与开户、入金、下单及退出连接起来。" },
    { id: "us-stock-account-basics", label: "配套基础 · 账户余额", reason: "分清账上资产、实际现金与可交易额度。" },
  ],
  "us-guide": [
    { id: "us-stock-platform-comparison", label: "先选路线 · 平台比较", reason: "比较证券账户、人民币基金和链上产品的资产权利与资金要求。" },
    { id: "bit-account-guide", label: "配套操作 · BIT 开户与入金", reason: "按图查看证券开户、银行电汇与稳定币划转的入口。" },
    { id: "BBAE", label: "配套操作 · 美资券商", reason: "继续核对 BBAE 的开户材料、同名入金和渠道奖励条件。" },
    { id: "ifas-fuxing", label: "配套操作 · 港资券商入金", reason: "查看众安与 iFAST 资金转入复星的具体图解。" },
  ],
  "us-stock-platform-comparison": [{ id: "us-guide", label: "配套实操 · 美股投资", reason: "选定账户后，把银行入金、首笔订单与卖出出金接起来。" }],
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
  const series = getArticleSeries(seriesId, current.id) ?? (seriesId ? undefined : getPrimaryArticleSeries(current.id));
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
  const introduction = current.id === "us-guide"
    ? "选定自己的资金路线，再进入对应的账户与入金图解。"
    : Object.hasOwn(introductions, current.categoryId) ? introductions[current.categoryId] : "沿着当前主题，继续了解相关方法与使用场景。";
  return { introduction, articles: result };
}

export type ReadingNextStep = {
  completed: string;
  next: ReadingRecommendation | null;
  stuck: Pick<ReadingRecommendation, "id" | "title" | "href" | "label" | "reason"> | null;
  overviewHref?: string;
  overviewLabel?: string;
};

/** Fixed end-of-article task chain: what you finished, what to read next and why. */
export function getArticleReadingNextStep(
  current: Pick<ArticleListItem, "id" | "categoryId" | "subcategoryId" | "title">,
  articles: readonly ArticleListItem[],
  seriesId?: string,
  routeId?: string,
): ReadingNextStep {
  const recommendations = getArticleReadingRecommendations(current, articles, seriesId, routeId);
  const series = getArticleSeries(seriesId, current.id) ?? (seriesId ? undefined : getPrimaryArticleSeries(current.id));
  const reading = series ? getSeriesReadingState(series, [...articles], current.id, routeId) : undefined;

  let completed = `读完了「${current.title}」`;
  if (series && reading && reading.currentIndex >= 0) {
    const unit = series.kind === "topic" ? "篇" : "课";
    const chapter = reading.chapters[reading.currentIndex];
    completed = `完成第 ${reading.currentIndex + 1} ${unit}：${chapter.title}`;
  }

  const next = recommendations.articles[0] ?? null;
  const stuckCandidate = recommendations.articles[1];
  const stuck = stuckCandidate
    ? {
        id: stuckCandidate.id,
        title: stuckCandidate.title,
        href: stuckCandidate.href,
        label: stuckCandidate.label,
        reason: stuckCandidate.reason,
      }
    : null;

  if (!series || !reading) {
    return { completed, next, stuck };
  }

  return {
    completed,
    next,
    stuck,
    overviewHref: reading.overviewHref,
    overviewLabel: series.kind === "path" ? "回路线目录" : "回系列概览",
  };
}
