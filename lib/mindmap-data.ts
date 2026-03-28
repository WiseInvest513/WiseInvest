export type NodeCategory =
  | "domestic-bank"    // 国内银行
  | "domestic-pay"     // 国内支付
  | "overseas-tool"    // 境外银行工具 (寰宇人生)
  | "overseas-bank"    // 境外数字银行 (IFast)
  | "hk-digital-bank"  // 香港数字银行
  | "hk-bank"          // 香港传统银行
  | "broker"           // 券商
  | "crypto";          // 虚拟U卡

export interface Tutorial {
  label: string;
  url: string;
}

export interface FlowNode {
  id: string;
  name: string;
  category: NodeCategory;
  x: number; // center x
  y: number; // center y
  description?: string;
  tutorials?: Tutorial[];
}

export interface FlowEdge {
  from: string; // node id
  to: string;   // node id
  isReturn?: boolean;
  tutorial?: Tutorial;
  /** If true, this edge is for tutorial lookup only and will NOT be rendered visually */
  hidden?: boolean;
}

export const categoryConfig: Record<
  NodeCategory,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  "domestic-bank":   { label: "国内银行",   color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", icon: "🏦" },
  "domestic-pay":    { label: "国内支付",   color: "#ea580c", bg: "#fff7ed", border: "#fdba74", icon: "💸" },
  "overseas-tool":   { label: "境外银行工具", color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd", icon: "💳" },
  "overseas-bank":   { label: "境外数字银行", color: "#0284c7", bg: "#f0f9ff", border: "#7dd3fc", icon: "🌐" },
  "hk-digital-bank": { label: "香港数字银行", color: "#0891b2", bg: "#ecfeff", border: "#67e8f9", icon: "📱" },
  "hk-bank":         { label: "香港传统银行", color: "#1d4ed8", bg: "#eff6ff", border: "#93c5fd", icon: "🏛️" },
  "broker":          { label: "券商",       color: "#059669", bg: "#ecfdf5", border: "#6ee7b7", icon: "📈" },
  "crypto":          { label: "虚拟U卡",    color: "#d97706", bg: "#fffbeb", border: "#fcd34d", icon: "🪙" },
};

// Node dimensions
export const NODE_W = 148; // kept for legacy reference
export const NODE_H = 48;
export const NODE_R = 52;  // circle radius

// ─── Node positions (all coordinates are node centers) ────────────────────
export const flowNodes: FlowNode[] = [
  // ── 国内 (far left) ──
  {
    id: "cncb",
    name: "建行 / 工行",
    category: "domestic-bank",
    x: -460,
    y: 0,
    description: "通过建设银行或工商银行换汇，将资金汇入寰宇人生借记卡",
  },
  {
    id: "wechat",
    name: "微信 / 支付宝",
    category: "domestic-pay",
    x: -460,
    y: 210,
    description: "国内微信/支付宝，可收取众安银行回流资金，也可向币安/欧易充值（买币通道）",
  },

  // ── 境外工具 ──
  {
    id: "xinye",
    name: "寰宇人生借记卡",
    category: "overseas-tool",
    x: -210,
    y: 0,
    description: "兴业银行境外借记卡，跨境转账免手续费，是资金流转的核心枢纽",
  },

  // ── 境外数字银行 (IFast独立一层) ──
  {
    id: "ifast",
    name: "IFast 英国银行",
    category: "overseas-bank",
    x: 80,
    y: -250,
    description: "英国数字银行，无门槛开户，美股券商入金首选通道",
    tutorials: [
      { label: "IFast 银行卡开通教程", url: "https://www.youtube.com/watch?v=2LcPWwwMSqw" },
    ],
  },

  // ── 香港数字银行 ──
  {
    id: "zongan",
    name: "众安银行",
    category: "hk-digital-bank",
    x: 80,
    y: -130,
    description: "香港数字银行，可接收 X 创作者工资，支持出金回国",
    tutorials: [
      { label: "众安/蚂蚁/天星开户教程", url: "https://www.youtube.com/watch?v=wqMChW__dyk" },
    ],
  },
  {
    id: "mayi",
    name: "蚂蚁银行",
    category: "hk-digital-bank",
    x: 80,
    y: -20,
    description: "香港蚂蚁银行，数字银行，入金灵活",
    tutorials: [
      { label: "众安/蚂蚁/天星开户教程", url: "https://www.youtube.com/watch?v=wqMChW__dyk" },
    ],
  },
  {
    id: "tianxing",
    name: "天星银行",
    category: "hk-digital-bank",
    x: 80,
    y: 90,
    description: "香港天星银行，数字银行",
    tutorials: [
      { label: "众安/蚂蚁/天星开户教程", url: "https://www.youtube.com/watch?v=wqMChW__dyk" },
    ],
  },

  // ── 香港传统银行 ──
  {
    id: "hsbc",
    name: "汇丰",
    category: "hk-bank",
    x: 80,
    y: 200,
    description: "香港汇丰银行，传统大行，信誉稳定",
    tutorials: [
      { label: "汇丰/中银开户教程", url: "https://www.youtube.com/watch?v=8zzn-IHIBIk" },
    ],
  },
  {
    id: "bochk",
    name: "中银香港",
    category: "hk-bank",
    x: 80,
    y: 310,
    description: "中国银行（香港），传统大行",
    tutorials: [
      { label: "汇丰/中银开户教程", url: "https://www.youtube.com/watch?v=8zzn-IHIBIk" },
    ],
  },

  // ── 券商 (far right) ──
  {
    id: "fusun",
    name: "复星",
    category: "broker",
    x: 380,
    y: -220,
    description: "复星国际证券",
    tutorials: [
      { label: "复星开户教程", url: "https://x.com/WiseInvest513/status/2037136151128268927" },
    ],
  },
  {
    id: "changqiao",
    name: "长桥",
    category: "broker",
    x: 380,
    y: -110,
    description: "长桥证券，港股美股交易平台",
  },
  {
    id: "yingli",
    name: "盈立",
    category: "broker",
    x: 380,
    y: 0,
    description: "盈立证券，国内身份证即可开户",
    tutorials: [
      { label: "盈立开户教程", url: "https://x.com/WiseInvest513/status/1970789148605948258" },
    ],
  },
  {
    id: "yintou",
    name: "盈透",
    category: "broker",
    x: 380,
    y: 110,
    description: "盈透证券（Interactive Brokers），全球最大经纪商之一",
  },
  {
    id: "zhifu",
    name: "致富",
    category: "broker",
    x: 380,
    y: 220,
    description: "致富证券",
    tutorials: [
      { label: "致富开户教程", url: "https://x.com/WiseInvest513/status/1953466482576556465" },
    ],
  },

  // ── 加密交易所 (底部左侧) ──
  {
    id: "cex",
    name: "币安 / 欧易",
    category: "crypto",
    x: -130,
    y: 470,
    description: "币安、欧易等主流 CEX 交易所，可通过国内微信/支付宝或银行卡充值，是加密资产的入口",
    tutorials: [
      { label: "币安注册教程", url: "https://x.com/WiseInvest513/status/1970757919500120451" },
      { label: "欧易注册教程", url: "https://x.com/WiseInvest513/status/1953466482576556465" },
    ],
  },

  // ── 虚拟U卡 (底部右侧) ──
  {
    id: "bitget",
    name: "Bitget",
    category: "crypto",
    x: 100,
    y: 470,
    description: "Bitget 虚拟 U 卡，可向券商（盈透）直接入金",
    tutorials: [
      { label: "Bitget 注册教程", url: "https://www.youtube.com/watch?v=ZxElS0gVpY4" },
    ],
  },
  {
    id: "safepal",
    name: "SafePal",
    category: "crypto",
    x: 300,
    y: 470,
    description: "SafePal 虚拟 U 卡，可入金盈透，也可汇款回国内银行",
    tutorials: [
      { label: "SafePal 注册教程", url: "https://www.youtube.com/watch?v=1Lw8VssYFNE" },
    ],
  },
];

// ─── Directed edges ────────────────────────────────────────────────────────
export const flowEdges: FlowEdge[] = [
  // 1. 国内银行 → 寰宇人生
  { from: "cncb", to: "xinye" },

  // 2. 寰宇人生 → IFast
  { from: "xinye", to: "ifast", tutorial: { label: "寰宇人生→IFast 入金教程", url: "https://www.youtube.com/watch?v=o94W7r8M2kY" } },

  // 7. 寰宇人生 → 香港数字银行
  { from: "xinye", to: "zongan" },
  { from: "xinye", to: "mayi" },
  { from: "xinye", to: "tianxing" },

  // 8. 寰宇人生 → 香港传统银行
  { from: "xinye", to: "hsbc" },
  { from: "xinye", to: "bochk" },

  // 银行→券商 的多对多连接通过页面中的 ribbon 色带展示，不在此列举

  // 11. 众安 → 国内微信（出金回流）
  { from: "zongan", to: "wechat", isReturn: true },

  // 国内入金通道：建行/工行 & 微信支付宝 → 币安/欧易
  { from: "cncb", to: "cex" },
  { from: "wechat", to: "cex" },

  // 币安/欧易 → 虚拟U卡
  { from: "cex", to: "bitget" },
  { from: "cex", to: "safepal" },

  // 12. Bitget → 盈透
  { from: "bitget", to: "yintou", tutorial: { label: "Bitget 入金盈透教程", url: "https://www.youtube.com/watch?v=9ji8KUh9ojs" } },

  // 13. SafePal → 盈透
  { from: "safepal", to: "yintou", tutorial: { label: "SafePal 入金盈透教程", url: "https://www.youtube.com/watch?v=6NoGmOejUsI" } },

  // 14. SafePal → 国内工行（回流）
  { from: "safepal", to: "cncb", isReturn: true, tutorial: { label: "SafePal 汇款回建行/工行教程", url: "https://www.youtube.com/watch?v=WWZiufXWkqE" } },

  // ── 隐藏边：通过总线入金的教程（不渲染线条，仅用于教程双向查找）──
  { from: "zongan", to: "fusun",    hidden: true, tutorial: { label: "众安入金复星教程",  url: "https://x.com/WiseInvest513/status/2037797205491515684" } },
  { from: "zongan", to: "yintou",   hidden: true, tutorial: { label: "众安入金盈透教程",  url: "https://www.youtube.com/watch?v=6NoGmOejUsI" } },
];
