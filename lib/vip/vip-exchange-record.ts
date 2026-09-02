export type VipExchangeRecordPayload = {
  email?: unknown;
  wechatId?: unknown;
  platform?: unknown;
  uid?: unknown;
  note?: unknown;
};

function normalizeText(value: unknown, label: string, maxLength: number, required = true) {
  const text = String(value ?? "").trim();
  if (required && !text) throw new Error(`请填写${label}。`);
  if (text.length > maxLength || /[\u0000-\u001f\u007f]/.test(text)) {
    throw new Error(`${label}格式不正确。`);
  }
  return text;
}

export function parseVipExchangeRecordPayload(payload: VipExchangeRecordPayload) {
  const email = normalizeText(payload.email, "邮箱", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("请输入有效的邮箱地址。");
  }

  const wechatId = normalizeText(payload.wechatId, "微信号", 64, false) || null;
  const platform = normalizeText(payload.platform, "所属平台", 80);
  const uid = normalizeText(payload.uid, "UID", 128);
  const note = normalizeText(payload.note, "备注", 1000, false) || null;

  return { email, wechatId, platform, uid, note };
}
