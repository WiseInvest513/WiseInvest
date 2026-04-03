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
    type: "welfare",
    title: "Wise Invest 官方社群",
    desc: "加入 Telegram 社群，获取每日独家研报与宏观策略。",
    link: "https://t.me/WiseInvestChat513",
    tag: "长期福利",
  },
  {
    type: "article",
    title: "2026 giffgaff 英国手机卡购买",
    desc: "一手渠道和货源，帮助大家顺利拥有一个自己的境外手机卡",
    link: "https://www.wise-sim.org/",
    tag: "SIM 卡购买",
    featured: true,
  },
  {
    type: "wool",
    title: "复星证券开户教程（可对接渠道开户）",
    desc: "入金一万港币，港美股终身免佣。",
    link: "https://www.wise-invest.org/articles/broker/sQSbLRe8",
    tag: "券商福利",
  },
];
