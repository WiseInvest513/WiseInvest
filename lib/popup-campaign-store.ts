import "server-only";
import { getPrisma } from "@/lib/prisma";
import { DEFAULT_POPUP_CAMPAIGN, parsePopupCampaign, type PopupCampaign } from "@/lib/popup-campaign";

const KEY = "wise-global-popup";
type Snapshot = { config: PopupCampaign; revision: number };
const local = globalThis as typeof globalThis & { wisePopupPreview?: Snapshot };
// Development is deliberately isolated from the production database.
export async function readPopupCampaign(): Promise<Snapshot> {
  if (process.env.NODE_ENV !== "production") return local.wisePopupPreview ?? { config: DEFAULT_POPUP_CAMPAIGN, revision: 0 };
  const row = await getPrisma().popupCampaign.findUnique({ where: { id: KEY } });
  return row ? { config: parsePopupCampaign(row.config), revision: row.revision } : { config: DEFAULT_POPUP_CAMPAIGN, revision: 0 };
}
export async function savePopupCampaign(config: PopupCampaign, expectedRevision: number, actorUserId: string): Promise<Snapshot> {
  if (process.env.NODE_ENV !== "production") {
    const current = await readPopupCampaign();
    if (current.revision !== expectedRevision) throw new Error("配置已被更新，请刷新页面后重试");
    return local.wisePopupPreview = { config, revision: current.revision + 1 };
  }
  return getPrisma().$transaction(async (tx) => {
    // Ensure a singleton row exists, then compare-and-swap to prevent lost edits.
    await tx.popupCampaign.upsert({ where: { id: KEY }, create: { id: KEY, config: DEFAULT_POPUP_CAMPAIGN }, update: {} });
    const changed = await tx.popupCampaign.updateMany({ where: { id: KEY, revision: expectedRevision }, data: { config, revision: { increment: 1 } } });
    if (changed.count !== 1) throw new Error("配置已被更新，请刷新页面后重试");
    await tx.auditLog.create({ data: { actorUserId, action: "POPUP_CAMPAIGN_UPDATED", metadata: { revision: expectedRevision + 1, config } } });
    return { config, revision: expectedRevision + 1 };
  });
}
