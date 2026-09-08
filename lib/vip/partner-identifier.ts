const exchangeUidRules = new Map([
  ["binance", { name: "币安", digits: 10 }],
  ["bitget", { name: "Bitget", digits: 10 }],
  ["bybit", { name: "Bybit", digits: 9 }],
  ["gate", { name: "Gate", digits: 8 }],
  ["okx", { name: "OKX", digits: 18 }],
]);

export function getExchangeUidRule(partnerSlug: string) {
  return exchangeUidRules.get(partnerSlug) ?? null;
}

export function normalizePartnerIdentifier(partnerSlug: string, value: string) {
  // Keep UIDs as strings: an 18-digit OKX UID can exceed Number's safe precision.
  // Do not remove internal whitespace from exchange UIDs to turn invalid input valid.
  return getExchangeUidRule(partnerSlug) ? value.trim() : value.trim().replace(/\s+/g, "");
}

export function getPartnerIdentifierError(partnerSlug: string, value: string) {
  const rule = getExchangeUidRule(partnerSlug);
  const identifier = normalizePartnerIdentifier(partnerSlug, value);
  if (rule) {
    return /^[0-9]+$/.test(identifier) && identifier.length === rule.digits
      ? null
      : `${rule.name} UID 必须为 ${rule.digits} 位数字。`;
  }

  return identifier.length >= 3 && identifier.length <= 80
    ? null
    : "UID / 账户标识长度需要在 3 到 80 个字符之间。";
}
