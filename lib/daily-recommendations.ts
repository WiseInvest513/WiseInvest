export type RecommendationType = "welfare" | "article" | "wool";

export interface RecommendationItem {
  type: RecommendationType;
  title: string;
  desc: string;
  link: string;
  tag: string;
  featured?: boolean;
}

/**
 * 今日精选内容 — 直接在此处修改
 */
export const dailyRecommendations: RecommendationItem[] = [
  {
    type: "article",
    title: "VIP 文章（加入 VIP）",
    desc: "从 0 到 1 学习 Wise 体系：如何加入、如何学习、如何高效筛选后续入口。",
    link: "/articles/VIP/mMMvDYhI",
    tag: "VIP 入门",
    featured: true,
  },
  {
    type: "welfare",
    title: "Wise Invest 官方社群",
    desc: "加入 Telegram 社群，获取每日独家研报与宏观策略。",
    link: "https://t.me/WiseInvest513Chat",
    tag: "长期福利",
  },
  {
    type: "article",
    title: "加密交易所开户与手续费福利",
    desc: "币安、欧易、Bitget、Bybit 等常用交易所入口与手续费福利，一页集中整理。",
    link: "https://www.wise-invest.org/perk/crypto",
    tag: "交易所福利",
  },
  {
    type: "welfare",
    title: "Wise Invest 官方社区",
    desc: "加入官方社群，交流实盘思路与日常运营更新。",
    link: "https://t.me/WiseInvest513Chat",
    tag: "官方社区",
  },
];
