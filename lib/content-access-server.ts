import { getContentAccessRule, resolveContentItem, type ContentAccessLevel } from "@/lib/content-access";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";

export async function getResolvedContentAccessRule(hrefOrPath: string) {
  const fallback = getContentAccessRule(hrefOrPath);

  if (!isDatabaseConfigured()) return fallback;

  try {
    const item = resolveContentItem(hrefOrPath);
    const permission = await getPrisma().contentPermission.findUnique({
      where: {
        contentType_contentKey: {
          contentType: item.contentType,
          contentKey: item.contentKey,
        },
      },
      select: {
        access: true,
        reason: true,
      },
    });

    if (!permission) return fallback;

    return {
      access: permission.access as ContentAccessLevel,
      reason: permission.reason,
    };
  } catch (error) {
    console.warn("[content-access] failed to load DB rule", error);
    return fallback;
  }
}
