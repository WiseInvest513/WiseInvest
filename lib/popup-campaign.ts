export const POPUP_SITE_IDS = ["main", "etf", "chain", "crypto", "vip", "sim", "witness", "hold", "ipo"] as const;
export type PopupSite = typeof POPUP_SITE_IDS[number];
export type PopupCampaign = {
  enabled: boolean;
  sites: PopupSite[];
  eyebrow: string;
  title: string;
  subtitle: string;
  message: string;
  profileLabel: string;
  profileUrl: string;
  voteLabel: string;
  voteUrl: string;
};
export const DEFAULT_POPUP_CAMPAIGN: PopupCampaign = {
  enabled: true,
  sites: [...POPUP_SITE_IDS],
  eyebrow: "为 Wise 助力",
  title: "帮 WiseInvest 投票",
  subtitle: "冲区块链百强创作者",
  message: "谢谢各位大哥大姐 ✦",
  profileLabel: "前往 Wise 广场主页投票",
  profileUrl: "https://www.binance.com/zh-CN/square/profile/wiseinvest",
  voteLabel: "快速投票",
  voteUrl: "https://www.binance.com/zh-CN/square/blockchain-100-2026?username=456",
};
export function parsePopupCampaign(value: unknown): PopupCampaign {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("弹窗配置无效");
  const input = value as Record<string, unknown>;
  if (typeof input.enabled !== "boolean") throw new Error("启用状态无效");
  if (!Array.isArray(input.sites) || input.sites.some((site) => !POPUP_SITE_IDS.includes(site))) throw new Error("站点列表无效");
  const text = (key: string, max: number) => {
    const v = input[key];
    if (typeof v !== "string" || !v.trim() || v.trim().length > max) throw new Error(`${key} 不能为空，且不能超过 ${max} 字`);
    return v.trim();
  };
  const url = (key: string) => {
    const raw = text(key, 2048);
    let u: URL;
    try { u = new URL(raw); } catch { throw new Error(`${key} 必须是完整的 HTTPS 链接`); }
    if (u.protocol !== "https:" || u.username || u.password) throw new Error(`${key} 必须是 HTTPS 链接且不能携带账户密码`);
    return u.href;
  };
  return {
    enabled: input.enabled, sites: Array.from(new Set(input.sites)) as PopupSite[],
    eyebrow: text("eyebrow", 30), title: text("title", 60), subtitle: text("subtitle", 60), message: text("message", 120),
    profileLabel: text("profileLabel", 50), profileUrl: url("profileUrl"), voteLabel: text("voteLabel", 50), voteUrl: url("voteUrl"),
  };
}
