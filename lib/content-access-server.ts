import { getContentAccessRule, resolveContentItem, type ContentAccessLevel } from "@/lib/content-access";
import { getArticleReleaseAccessRule } from "@/lib/article-release";
import { getCachedContentPermissions } from "@/lib/content-permission-cache";

export async function getResolvedContentAccessRules(hrefs: string[]) {
  const rules = new Map(hrefs.map((href) => [href, getContentAccessRule(href)]));

  if (hrefs.length > 0) {
    const items = hrefs.map((href) => ({ ...resolveContentItem(href), href }));
    try {
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
    } catch (error) {
      // Falling back to a default PUBLIC/MEMBER policy could expose content
      // restricted by the database. Only the authoritative scheduled-release
      // policies below can be safely resolved without the stored configuration.
      if (items.some(({ contentKey }) => !getArticleReleaseAccessRule(contentKey))) throw error;
      console.warn("[content-access] using authoritative release rule after DB failure");
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
