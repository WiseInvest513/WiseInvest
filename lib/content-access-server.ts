import { getContentAccessRule, resolveContentItem, type ContentAccessLevel } from "@/lib/content-access";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { getArticleReleaseAccessRule } from "@/lib/article-release";

export async function getResolvedContentAccessRules(hrefs: string[]) {
  const rules = new Map(hrefs.map((href) => [href, getContentAccessRule(href)]));

  if (isDatabaseConfigured() && hrefs.length > 0) {
    try {
      const items = hrefs.map((href) => ({ ...resolveContentItem(href), href }));
      const permissions = await getPrisma().contentPermission.findMany({
        where: {
          OR: items.map(({ contentType, contentKey }) => ({ contentType, contentKey })),
        },
        select: {
          contentType: true,
          contentKey: true,
          access: true,
          reason: true,
        },
      });

      const byKey = new Map(permissions.map((permission) => [
        `${permission.contentType}:${permission.contentKey}`, permission,
      ]));
      for (const item of items) {
        const permission = byKey.get(`${item.contentType}:${item.contentKey}`);
        if (permission) rules.set(item.href, {
          access: permission.access as ContentAccessLevel,
          reason: permission.reason,
        });
      }
    } catch (error) {
      console.warn("[content-access] failed to load DB rule", error);
    }
  }

  // This article's scheduled release takes precedence over stored permissions.
  // Evaluate after database I/O, including failed lookups, so a stale PUBLIC
  // override or an in-flight request cannot extend the public-reading window.
  const now = Date.now();
  for (const href of hrefs) {
    const releaseRule = getArticleReleaseAccessRule(resolveContentItem(href).contentKey, now);
    if (releaseRule) rules.set(href, releaseRule);
  }
  return rules;
}

export async function getResolvedContentAccessRule(hrefOrPath: string) {
  const rules = await getResolvedContentAccessRules([hrefOrPath]);
  return rules.get(hrefOrPath)!;
}
