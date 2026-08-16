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
    link: "https://t.me/WiseInvest513Chat",
    tag: "长期福利",
  },
  {
    type: "article",
    title: "加密货币交易所开户与手续费福利",
    desc: "“币安、欧易、Bitget、Bybit 等常用交易所入口与手续费福利，一页集中整理。”",
    link: "https://www.wise-invest.org/perk/crypto",
    tag: "交易所福利",
    featured: true,
  },
  {
    type: "wool",
    title: "腾达证券开户、入金全流程实测",
    desc: "内地身份证可线上开户，覆盖港美股、ETF、碎股、期权与港股打新。",
    link: "https://www.wise-invest.org/articles/broker/4k1kTctf",
    tag: "券商教程",
  },
];
