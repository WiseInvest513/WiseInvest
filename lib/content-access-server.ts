import { getContentAccessRule, isPublicArticleHref, resolveContentItem, type ContentAccessLevel } from "@/lib/content-access";
import { getCachedContentPermissions } from "@/lib/content-permission-cache";

export async function getResolvedContentAccessRules(hrefs: string[]) {
  const rules = new Map(hrefs.map((href) => [href, getContentAccessRule(href)]));
  // Article reading is an authoritative public policy. Old database restrictions
  // must not relock an article, and article-only requests do not depend on the DB.
  const items = hrefs.filter((href) => !isPublicArticleHref(href))
    .map((href) => ({ ...resolveContentItem(href), href }));

  if (items.length > 0) {
    // Other content keeps its stored permissions and fails closed on DB errors.
    const permissions = await getCachedContentPermissions();
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
  }
  return rules;
}

export async function getResolvedContentAccessRule(hrefOrPath: string) {
  const rules = await getResolvedContentAccessRules([hrefOrPath]);
  return rules.get(hrefOrPath)!;
}
