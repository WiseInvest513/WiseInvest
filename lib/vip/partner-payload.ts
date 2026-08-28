const partnerTypes = ["BROKERAGE", "EXCHANGE", "OTHER"] as const;

type PartnerType = (typeof partnerTypes)[number];

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

export type PartnerPayload = {
  slug?: string;
  name?: string;
  type?: string;
  referralUrl?: string;
  referralCode?: string;
  vipEligible?: boolean;
  vipPlusEligible?: boolean;
  vipPlusVolumeThreshold?: string | null;
  enabled?: boolean;
};

export function parsePartnerPayload(body: PartnerPayload) {
  const slug = normalizeSlug(body.slug ?? "");
  const name = body.name?.trim() ?? "";
  const type = partnerTypes.includes(body.type as PartnerType) ? (body.type as PartnerType) : null;
  const threshold = body.vipPlusVolumeThreshold?.trim();

  if (!slug || !name || !type) {
    throw new Error("Slug、名称和类型不能为空。");
  }

  if (threshold && !/^\d+(\.\d{1,2})?$/.test(threshold)) {
    throw new Error("SVIP 阈值需要是最多两位小数的数字。");
  }

  return {
    slug,
    name,
    type,
    referralUrl: body.referralUrl?.trim() || null,
    referralCode: body.referralCode?.trim() || null,
    vipEligible: Boolean(body.vipEligible),
    vipPlusEligible: Boolean(body.vipPlusEligible),
    vipPlusVolumeThreshold: threshold || null,
    verificationMode: "MANUAL" as const,
    enabled: body.enabled ?? true,
  };
}
