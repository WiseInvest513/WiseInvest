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
    "binance-referral": { platform: "Binance 币安", kind: "exchange" },
    "bitget-referral": { platform: "Bitget", kind: "exchange" },
  },
  vcard: {
    "Gate-vcard": { platform: "Gate", kind: "exchange" },
  },
  broker: {
    BBAE: { platform: "BBAE 证券", kind: "broker" },
    zhifu: { platform: "致富证券", kind: "broker" },
    "futu-broker": { platform: "复星证券", kind: "broker" },
    "ifas-fuxing": { platform: "复星证券", kind: "broker" },
    "tengda-broker": { platform: "腾达证券", kind: "broker" },
  },
  domestic: {
    "galaxy-etf-guide": { platform: "银河证券", kind: "broker" },
  },
};

export function getArticleVipInvitation(
  article: { id: string; categoryId: string } | null | undefined,
): ArticleVipInvitation | null {
  if (!article || !Object.hasOwn(tutorialInvitations, article.categoryId)) return null;
  const category = tutorialInvitations[article.categoryId];
  return Object.hasOwn(category, article.id) ? category[article.id] : null;
}

const partnerSlugs: Record<string, string> = {
  "Binance 币安": "binance", "OKX 欧易": "okx", OKX: "okx", Bitget: "bitget",
  Bybit: "bybit", Gate: "gate", "致富证券": "chief-securities",
  "复星证券": "fosun-securities", "腾达证券": "tengda-securities",
  BBAE: "bbae", "BBAE 证券": "bbae", "银河证券": "galaxy-securities",
};

export function getArticleVipApplyHref(invitation?: ArticleVipInvitation | null) {
  const slug = invitation && Object.hasOwn(partnerSlugs, invitation.platform) ? partnerSlugs[invitation.platform] : null;
  return `/account/vip?apply=1${slug ? `&partner=${slug}` : ""}`;
}

export type ArticleVipReference = { href: string; invitation: ArticleVipInvitation };

// Audited canonical tutorials, also used to recognize explicit article references.
export const vipTutorialPaths = [
  { id: "biance-guide", categoryId: "crypto", path: "/articles/crypto/GaM38JYk" },
  { id: "okx-guide", categoryId: "crypto", path: "/articles/crypto/mAPQm7WZ" },
  { id: "bitget-exchange", categoryId: "crypto", path: "/articles/crypto/k3RVVcw4" },
  { id: "bybit-guide", categoryId: "crypto", path: "/articles/crypto/e6utod7B" },
  { id: "Gate-vcard", categoryId: "vcard", path: "/articles/vcard/GUhygjYV" },
  { id: "BBAE", categoryId: "broker", path: "/articles/broker/I0AIBXus" },
  { id: "zhifu", categoryId: "broker", path: "/articles/broker/GaobLP0X" },
  { id: "futu-broker", categoryId: "broker", path: "/articles/broker/sQSbLRe8" },
  { id: "tengda-broker", categoryId: "broker", path: "/articles/broker/4k1kTctf" },
  { id: "galaxy-etf-guide", categoryId: "domestic", path: "/articles/domestic/o0RA5e1p" },
];

// Only explicit, resolvable tutorial cards. Never infer eligibility from a
// brand mention, table link, card/wallet name, code example or generic ETF topic.
export function getArticleVipReferences(
  content: string,
  linkedArticles: readonly { id: string; categoryId: string }[],
): ArticleVipReference[] {
  const available = vipTutorialPaths.filter(tutorial => linkedArticles.some(article => article.id === tutorial.id && article.categoryId === tutorial.categoryId));
  const references: ArticleVipReference[] = [];
  const seen = new Set<string>();
  let fenced = false;
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) { fenced = !fenced; continue; }
    if (fenced) continue;
    const match = trimmed.match(/^\[[^\]]+\]\(([^)]+)\)\{card\}$/);
    if (!match) continue;
    try {
      const url = new URL(match[1], "https://www.wise-invest.org");
      const tutorial = available.find(item => item.path === url.pathname);
      if (url.origin === "https://www.wise-invest.org" && !url.username && !url.password && tutorial && !seen.has(tutorial.id)) {
        references.push({ href: `${url.pathname}${url.search}${url.hash}`, invitation: tutorialInvitations[tutorial.categoryId][tutorial.id] });
        seen.add(tutorial.id);
      }
    } catch { /* Unresolvable links stay ordinary article references. */ }
  }
  return references;
}
