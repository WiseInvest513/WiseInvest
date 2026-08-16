import calendarEventData from "@/lib/calendar-events.json";

export type CalendarEventCategory = "宏观" | "经济数据" | "美股财报";
export type CalendarEventImpact = "high" | "medium" | "low";
export type CalendarEventTheme = "消费/零售" | "通胀" | "就业" | "AI/半导体";

export interface CalendarEvent {
  id: string;
  date: string;
  time: string;
  title: string;
  category: CalendarEventCategory;
  impact: CalendarEventImpact;
  description: string;
}

const categories: CalendarEventCategory[] = ["宏观", "经济数据", "美股财报"];
const impacts: CalendarEventImpact[] = ["high", "medium", "low"];

const assertDateKey = (dateKey: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) throw new Error(`无效的日历日期：${dateKey}`);

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`无效的日历日期：${dateKey}`);
  }
};

export const calendarEvents: CalendarEvent[] = calendarEventData.map((event) => {
  assertDateKey(event.date);

  if (!categories.includes(event.category as CalendarEventCategory)) {
    throw new Error(`未知的日历分类：${event.category}`);
  }

  if (!impacts.includes(event.impact as CalendarEventImpact)) {
    throw new Error(`未知的影响等级：${event.impact}`);
  }

  if (!event.time || !event.title || !event.description) {
    throw new Error(`日历事件字段不完整：${event.date} ${event.title}`);
  }

  return {
    ...event,
    id: `${event.date}-${event.time}-${event.title}`,
    category: event.category as CalendarEventCategory,
    impact: event.impact as CalendarEventImpact,
  };
});

export const getBeijingTodayKey = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

export const addDaysToDateKey = (dateKey: string, days: number) => {
  assertDateKey(dateKey);
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
};

export const getDateKeyWeekday = (dateKey: string) => {
  assertDateKey(dateKey);
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
};

export const shiftMonthKey = (monthKey: string, offset: number) => {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};

export const sortCalendarEvents = (events: CalendarEvent[]) => {
  const getTimeRank = (time: string) => {
    if (time === "全天") return 0;
    if (time === "盘前") return 8 * 60;
    if (time === "盘后") return 24 * 60;
    const match = /^(\d{2}):(\d{2})$/.exec(time);
    return match ? Number(match[1]) * 60 + Number(match[2]) : 23 * 60;
  };

  return [...events].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      getTimeRank(a.time) - getTimeRank(b.time) ||
      a.title.localeCompare(b.title, "zh-CN")
  );
};

export const getEventThemes = (event: CalendarEvent): CalendarEventTheme[] => {
  const searchable = `${event.title} ${event.description}`.toLowerCase();
  const themes: CalendarEventTheme[] = [];

  if (
    /零售|消费者|消费|visa|ups|通用汽车|gm|迪士尼/.test(searchable)
  ) {
    themes.push("消费/零售");
  }

  if (
    /cpi|pce|ppi|通胀|价格|就业成本|劳动力成本/.test(searchable)
  ) {
    themes.push("通胀");
  }

  if (/非农|失业|就业|jolts|职位空缺/.test(searchable)) {
    themes.push("就业");
  }

  if (
    /ai|芯片|半导体|数据中心|cowos|azure|cloud|aws|dcai|foundry|palantir|coreweave|cisco|amd|台积电|英特尔|微软|alphabet|meta|亚马逊|applied materials/.test(
      searchable
    )
  ) {
    themes.push("AI/半导体");
  }

  return themes;
};

export const getEventMarketImpact = (event: CalendarEvent) => {
  const title = event.title.toLowerCase();

  if (event.category === "美股财报") {
    const earningsRules = [
      {
        pattern: /台积电|英特尔|amd|coreweave|cisco|applied materials/,
        copy: "订单、产能、毛利率与资本开支可验证 AI 需求的兑现速度；预期差较大时，影响可能传导至芯片、设备、网络和算力产业链。",
      },
      {
        pattern: /alphabet|微软|亚马逊/,
        copy: "云与 AI 收入增速、利润率和资本开支决定增长质量；投入与回报若明显错位，可能影响云计算及大盘成长股估值。",
      },
      {
        pattern: /meta/,
        copy: "广告增长、用户变现与 AI 投入共同决定盈利兑现；指引偏差可能带动互联网平台和数字广告板块预期。",
      },
      {
        pattern: /palantir/,
        copy: "订单、合同扩张、利润率和全年指引反映企业 AI 投入的兑现；偏差可能传导至软件及 AI 应用板块。",
      },
      {
        pattern: /通用汽车|特斯拉/,
        copy: "交付、定价、汽车毛利与现金流反映需求和竞争；指引偏差可能影响整车、零部件及电池产业链预期。",
      },
      {
        pattern: /苹果/,
        copy: "硬件需求、服务收入和毛利率决定盈利质量；指引偏差可能影响消费电子及供应链公司的预期。",
      },
      {
        pattern: /visa/,
        copy: "支付金额、交易量和跨境活动反映消费韧性；偏差可能传导至支付、零售和可选消费板块。",
      },
      {
        pattern: /3m|ups/,
        copy: "订单或货运量、价格与利润率是实体需求温度计；指引变化可能传导至运输、工业和消费链。",
      },
      {
        pattern: /埃克森美孚|雪佛龙/,
        copy: "产量、实现油价、成本和股东回报决定现金流质量；油价假设或资本纪律变化可能影响能源板块估值。",
      },
      {
        pattern: /uber|迪士尼/,
        copy: "订单或客流、用户变现和利润率反映服务消费韧性；指引偏差可能影响出行、文娱及平台经济预期。",
      },
      {
        pattern: /礼来/,
        copy: "核心药物销量、供应能力和全年指引决定增长兑现；偏差可能带动同赛道药企和医药供应链预期。",
      },
      {
        pattern: /spacex/,
        copy: "用户增长、单位经济性、现金流与资本开支决定扩张质量；偏差可能影响卫星通信和航天产业链预期。",
      },
    ];
    const matchedRule = earningsRules.find((rule) => rule.pattern.test(title));
    return (
      matchedRule?.copy ??
      "业绩只是第一层，重点看利润率、现金流与未来指引相对预期的差异；偏差可能从个股传导至同行和产业链。"
    );
  }

  if (title.includes("零售销售")) {
    return "反映居民消费与需求韧性。强于预期可能同时支持增长、抬高利率预期；弱于预期则可能增加增长担忧，零售、支付与可选消费较敏感。";
  }

  if (title.includes("就业成本") || title.includes("单位劳动力成本")) {
    return "工资与单位劳动力成本影响服务通胀和企业利润率；持续偏高可能强化高利率维持更久的预期，单季波动需结合生产率判断。";
  }

  if (title.includes("pce")) {
    return "核心 PCE 若明显偏离预期，可能重定价政策路径；美债收益率、美元和利率敏感型资产通常反应更直接。";
  }

  if (title.includes("cpi")) {
    return "观察居民端通胀和核心服务压力；高于预期通常削弱宽松预期，低于预期则相反，美债收益率、美元和成长股估值更敏感。";
  }

  if (title.includes("ppi")) {
    return "反映企业端成本及部分后续通胀压力；意外上行可能增加利润率与利率担忧，但需结合 CPI、PCE 和分项判断。";
  }

  if (title.includes("初请失业金")) {
    return "高频观察裁员与再就业压力，连续趋势比单周变化更重要；持续上升可能放大增长担忧，并改变宽松预期。";
  }

  if (title.includes("jolts") || title.includes("职位空缺")) {
    return "职位空缺、招聘与离职率反映劳动力需求和工资压力；温和降温有助于缓解通胀，过快走弱则可能增加增长担忧。";
  }

  if (title.includes("非农") || title.includes("就业报告")) {
    return "同时看新增就业、失业率、工资与前值修正；过热可能削弱宽松预期，明显走弱虽可能支持降息预期，也会放大增长担忧。";
  }

  if (title.includes("fomc会议开始")) {
    return "会议开始本身通常不释放新信息，重点在次日声明和记者会；会前仓位调整可能放大短线波动。";
  }

  if (title.includes("利率决议") || title.includes("新闻发布会")) {
    return "声明、投票与记者会决定市场如何理解后续利率路径；措辞变化可能快速影响美元、美债收益率及成长股估值。";
  }

  if (title.includes("会议纪要")) {
    return "用于理解官员分歧与政策反应函数，但信息相对滞后；只有超出会后已知信号的内容，才更容易引发重新定价。";
  }

  if (title.includes("sloos")) {
    return "贷款标准与需求反映银行信贷是否收紧；持续收紧可能压制企业和居民融资，中小盘、银行与信用市场更敏感。";
  }

  if (
    title.includes("美联储主席") ||
    title.includes("美联储理事") ||
    title.includes("听证会") ||
    title.includes("讲话")
  ) {
    return "观察官员如何权衡通胀、就业与政策时点；单次表态不是政策决定，但可能调整市场对下一次会议的预期。";
  }

  if (title.includes("gdp")) {
    return "确认经济增长速度和结构，消费、投资及库存往往比单一总量更重要；大幅偏离预期可能改变软着陆判断和利率定价。";
  }

  if (title.includes("领先经济指数") || title.includes("lei")) {
    return "用于观察未来数月经济方向，趋势比单月读数更有价值；持续走弱会增加周期放缓担忧，但不宜单独据此判断衰退。";
  }

  if (title.includes("pmi") || title.includes("ism")) {
    return "观察企业活动、新订单、就业与价格压力；这些分项若同向变化，可能改变市场对增长—通胀组合和企业盈利环境的判断。";
  }

  if (title.includes("消费者信心")) {
    return "反映消费者对收入、就业和通胀的感受，是消费前景的补充信号；趋势和分项通常比单一总值更有参考价值。";
  }

  if (title.includes("耐用品订单")) {
    return "核心资本品订单用于观察企业投资和制造业需求；持续改善通常支持工业周期判断，反之提示资本开支趋弱。";
  }

  if (event.category === "宏观") {
    return "可能改变市场对政策、通胀或增长路径的判断；重点看是否出现超出市场已有预期的新信息。";
  }

  return "实际值相对预期和前值的偏差，通常比绝对高低更重要；还需结合分项、修正值和当时市场定价。";
};
