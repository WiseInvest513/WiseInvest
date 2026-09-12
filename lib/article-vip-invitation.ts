export type ArticleVipInvitation = {
  platform: string;
  kind: "exchange" | "broker";
};

// Only tutorials for supported partner accounts, not entire article categories.
// This is a reading-page invitation, not a membership eligibility check.
const tutorialInvitations: Record<string, Record<string, ArticleVipInvitation>> = {
  crypto: {
    "biance-guide": { platform: "Binance 币安", kind: "exchange" },
    "okx-guide": { platform: "OKX 欧易", kind: "exchange" },
    "bitget-exchange": { platform: "Bitget", kind: "exchange" },
    "bybit-guide": { platform: "Bybit", kind: "exchange" },
  },
  vcard: {
    "Gate-vcard": { platform: "Gate", kind: "exchange" },
  },
  broker: {
    zhifu: { platform: "致富证券", kind: "broker" },
    "futu-broker": { platform: "复星证券", kind: "broker" },
    "tengda-broker": { platform: "腾达证券", kind: "broker" },
  },
};

export function getArticleVipInvitation(
  article: { id: string; categoryId: string } | null | undefined,
): ArticleVipInvitation | null {
  if (!article || !Object.hasOwn(tutorialInvitations, article.categoryId)) return null;
  const category = tutorialInvitations[article.categoryId];
  return Object.hasOwn(category, article.id) ? category[article.id] : null;
}
