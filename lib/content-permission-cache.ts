import { revalidateTag, unstable_cache } from "next/cache";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";

const CONTENT_PERMISSION_CACHE_TAG = "wise-content-permissions";
const CONTENT_PERMISSION_CACHE_SECONDS = 60;

// Only shared policy configuration enters the Data Cache: never identity,
// membership, viewer decisions, or time-dependent article release rules.
const readCachedContentPermissions = unstable_cache(
  async (_timeBucket: number) => getPrisma().contentPermission.findMany({
    select: {
      contentType: true,
      contentKey: true,
      access: true,
      reason: true,
    },
  }),
  ["content-permissions-v1"],
  {
    tags: [CONTENT_PERMISSION_CACHE_TAG],
    revalidate: CONTENT_PERMISSION_CACHE_SECONDS,
  },
);

export async function getCachedContentPermissions() {
  // A database-free local preview must not populate the production policy cache.
  if (!isDatabaseConfigured()) return [];

  // Next 15 time revalidation can serve stale data while refreshing. A bounded
  // key ensures an old PUBLIC policy cannot survive beyond this minute if a
  // later database refresh fails. Rejected reads are never cached as defaults.
  const timeBucket = Math.floor(Date.now() / (CONTENT_PERMISSION_CACHE_SECONDS * 1000));
  return readCachedContentPermissions(timeBucket);
}

export function invalidateContentPermissionCache() {
  // Next 15's single-argument form expires the tag instead of serving stale data.
  try {
    revalidateTag(CONTENT_PERMISSION_CACHE_TAG);
  } catch {
    // The permission write has already committed. Preserve its audit/success
    // response; the strict minute bucket bounds stale policies if invalidation
    // is unavailable. Do not expose cache/backend details in application logs.
    console.warn("[content-access] cache invalidation unavailable; using bounded expiry");
  }
}
