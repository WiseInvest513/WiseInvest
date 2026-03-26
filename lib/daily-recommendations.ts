export type RecommendationType = "welfare" | "article" | "wool";

export interface RecommendationItem {
  type: RecommendationType;
  title: string;
  desc: string;
  link: string;
  tag: string;
}

/**
 * 默认的每日精选配置
 */
const defaultRecommendations: RecommendationItem[] = [
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

/**
 * 从环境变量 NEXT_PUBLIC_RECOMMENDATIONS_JSON 读取每日精选配置
 * 如果环境变量未设置或格式错误，使用默认配置
 */
function getRecommendationsFromEnv(): RecommendationItem[] {
  if (typeof process === "undefined" || !process.env) {
    return defaultRecommendations;
  }

  const envData = process.env.NEXT_PUBLIC_RECOMMENDATIONS_JSON;
  if (!envData) {
    return defaultRecommendations;
  }

  try {
    const parsed = JSON.parse(envData);
    if (!Array.isArray(parsed)) {
      console.warn("[DailyRecommendations] ENV variable is not an array, using defaults");
      return defaultRecommendations;
    }

    // 验证每个推荐项
    const validated = parsed.filter(
      (item): item is RecommendationItem =>
        item &&
        typeof item === "object" &&
        ["welfare", "article", "wool"].includes(item.type) &&
        typeof item.title === "string" &&
        typeof item.desc === "string" &&
        typeof item.link === "string" &&
        typeof item.tag === "string"
    );

    return validated.length > 0 ? validated : defaultRecommendations;
  } catch (error) {
    console.warn(
      "[DailyRecommendations] Failed to parse NEXT_PUBLIC_RECOMMENDATIONS_JSON:",
      error
    );
    return defaultRecommendations;
  }
}

export const dailyRecommendations: RecommendationItem[] = getRecommendationsFromEnv();

