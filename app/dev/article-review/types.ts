export type Evidence = { line: number; text?: string; context?: string; url?: string; code?: string; imageUrl?: string; source?: string };
export type ReviewRecord = {
  key: string; articleId: string; title: string; categoryId: string; filePath: string;
  productName: string; status: string; publicationStatus?: string; proposalSummary: string;
  registrationLinks: Evidence[]; inviteCodes: Evidence[]; benefits: Evidence[]; conditions: Evidence[];
  issues: string[]; siteComparison: { source: string; value: string; note: string }[];
  imageEvidence: Evidence[];
  confirmation?: { policyId: string; text: string; confirmedAt: string; source: string; remainingIssues: string[]; syncedAt?: string };
  invitationConfirmation?: { code: string; confirmedAt: string; source: string; syncedAt?: string; remainingIssues?: string[] };
  articleUpdatedAt?: string;
};
export type ReviewArticle = {
  id: string; title: string; categoryId: string; filePath: string; published: boolean;
  links: { url: string; label: string; line: number; context: string; kind: string }[];
  recordKeys: string[]; sourceSha256: string;
};
export type ReviewImage = {
  articleId: string; filePath: string; title: string; categoryId: string;
  action: string; applied: boolean; reason: string; classification: string;
  ambiguous: boolean; missingAsset: boolean; src: string; alt: string; originalLine?: number; before?: string; imageCount: number;
};
export type ReviewData = {
  rollout?: { syncedAt: string; articlesUpdated: number; cardArticles: number; cardsAdded: number; deferred: string[]; placement?: "registration-step" };
  confirmedPolicies?: { id: string; title: string; text: string; note: string; confirmedAt: string; source: string; recordKeys: string[] }[];
  confirmedInvites?: { productName: string; code: string; confirmedAt: string; source: string; recordKeys: string[] }[];
  auditedAt: string; method: string; records: ReviewRecord[]; articles: ReviewArticle[]; images: ReviewImage[];
  stats: { files: number; published: number; records: number; referralArticles: number; removedImages: number; preservedImageReferences: number; linkOccurrences: number; articlesWithLinks: number };
};
