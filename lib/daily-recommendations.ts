export type RecommendationType = "welfare" | "article" | "wool";

export interface RecommendationItem {
  type: RecommendationType;
  title: string;
  desc: string;
  link: string;
  tag: string;
  featured?: boolean; // 是否为推荐项，显示红色 badge
}

/**
 * 默认的每日精选配置
 */
const defaultRecommendations: RecommendationItem[] = [
  {
    type: "welfare",
    title: "Wise Invest 专属会员福利",
    desc: "加入社群，获取每日独家研报与宏观策略。",
    link: "https://x.com/WiseInvest513/status/2012422265774964948",
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
    title: "某交易所新户注册送 50U",
    desc: "限时活动，截止到本月底，手慢无。",
    link: "https://x.com/WiseInvest513/status/2012150097937899867",
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

