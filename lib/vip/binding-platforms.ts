// Public VIP brokerage channels plus the user-confirmed BIT exchange. Missing database
// rows are created only when a user submits; existing admin settings win.
export const additionalBindingPartners = [
  { slug: "fosun-securities", name: "复星证券", type: "BROKERAGE", tutorialHref: "/articles/broker/sQSbLRe8" },
  { slug: "chief-securities", name: "致富证券", type: "BROKERAGE", tutorialHref: "/articles/broker/GaobLP0X" },
  { slug: "tengda-securities", name: "腾达证券", type: "BROKERAGE", tutorialHref: "/articles/broker/4k1kTctf" },
  { slug: "bbae", name: "BBAE 证券", type: "BROKERAGE", tutorialHref: "/articles/broker/I0AIBXus" },
  { slug: "bit", name: "BIT 交易所", type: "EXCHANGE", tutorialHref: null },
  { slug: "other", name: "其他平台", type: "OTHER", tutorialHref: null },
] as const;

export const OTHER_BINDING_SLUG = "other";

export function getAdditionalBindingPartner(slug: string) {
  const platform = additionalBindingPartners.find((item) => item.slug === slug);
  if (!platform) return null;
  return {
    slug: platform.slug,
    name: platform.name,
    type: platform.type,
    referralUrl: null,
    referralCode: null,
    vipEligible: true,
    vipPlusEligible: false,
    vipPlusVolumeThreshold: null,
    verificationMode: "MANUAL" as const,
  };
}

export function getBindingNoteError(partnerSlug: string, userNote: string, platformName: string) {
  if (!userNote.trim()) return "请填写补充说明，并注明账户注册 / 开户时间后再提交。";
  if (userNote.trim().length > 2000) return "补充说明请控制在 2000 字以内。";
  if (partnerSlug === OTHER_BINDING_SLUG && (!platformName.trim() || platformName.trim().length > 60)) {
    return "选择其他时，请填写平台 / 产品名称（最多 60 字），并在补充说明中写明注册时间和渠道。";
  }
  return null;
}

export function formatBindingNote(partnerSlug: string, userNote: string, platformName: string) {
  return partnerSlug === OTHER_BINDING_SLUG
    ? `平台 / 产品：${platformName.trim()}\n${userNote.trim()}`
    : userNote.trim();
}
