import { cookies } from "next/headers";
import { auth } from "@/auth";
import { isDatabaseConfigured } from "@/lib/prisma";
import {
  getDevPreviewRole,
  getDevPreviewTier,
  isDevPreviewCookieValue,
  WISE_DEV_PREVIEW_COOKIE,
} from "@/lib/identity/dev-preview";
import { pointViewerFromUser } from "./access";
import { PointError } from "./errors";
import type { PointViewer } from "./types";

export async function getPointViewer(): Promise<PointViewer> {
  const cookieStore = await cookies();
  const previewCookie = cookieStore.get(WISE_DEV_PREVIEW_COOKIE)?.value;
  // Preview is intentionally checked before session/database access and always selects the isolated store.
  if (isDevPreviewCookieValue(previewCookie)) {
    return pointViewerFromUser(
      {
        id: "point-dev-preview",
        role: getDevPreviewRole(previewCookie)!,
        membershipTier: getDevPreviewTier(previewCookie)!,
      },
      true,
    );
  }
  if (!isDatabaseConfigured()) return pointViewerFromUser(null);
  try {
    const session = await auth();
    if (!session?.user?.id) return pointViewerFromUser(null);
    // Server auth() has just refreshed role/tier in auth.ts's JWT callback.
    // Reuse that same-request result, not a frontend session or decoded JWT.
    // There is no shared user cache: revocation still applies on the next request.
    return pointViewerFromUser(session.user);
  } catch {
    // Fail closed; callers can still display the public locked/empty state.
    return pointViewerFromUser(null);
  }
}

export async function requirePointAdmin(): Promise<PointViewer> {
  const viewer = await getPointViewer();
  if (!viewer.isAdmin || !viewer.userId)
    throw new PointError(403, "仅管理员可管理点位。");
  return viewer;
}
