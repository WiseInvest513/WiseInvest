export type RecommendationType = "welfare" | "article" | "wool";

export interface RecommendationItem {
  type: RecommendationType;
  title: string;
  desc: string;
  link: string;
  tag: string;
}

/**
 * 每日精选本地配置（最多展示前 3 条）
 * 维护位置：直接修改本文件即可，不再依赖 Vercel 环境变量
 */
export const dailyRecommendations: RecommendationItem[] = [
  {
    type: "welfare",
    title: "Wise Invest 专属粉丝群",
    desc: "加入社群，获取每日独家研报与宏观策略。",
    link: "https://t.me/WiseInvestChat513",
    tag: "长期福利",
  },
  {
    type: "article",
    title: "2026 年购买美股的多种策略和方式",
    desc: "从银行 App 到券商，再到链上，分享多种购买美股的方式",
    link: "https://x.com/WiseInvest513/status/2008529401483546953",
    tag: "深度好文",
  },
  {
    type: "wool",
    title: "Bitget 虚拟U卡注册，开卡消费立领5U 空投",
    desc: "限时活动，截止到本月底，手慢无。",
    link: "https://www.youtube.com/watch?v=ZxElS0gVpY4",
    tag: "限时羊毛",
  },
];

