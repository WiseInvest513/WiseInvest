import { cookies } from "next/headers";
import { auth } from "@/auth";
import { WISE_DEV_PREVIEW_COOKIE, getDevPreviewTier } from "@/lib/identity/dev-preview";

// Match account preview behavior without loading its partner accounts or entitlements.
// A real session takes precedence; preview cookies are ignored in production.
export async function getContentViewerTier(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.membershipTier ?? "MEMBER";

  const cookieStore = await cookies();
  return getDevPreviewTier(cookieStore.get(WISE_DEV_PREVIEW_COOKIE)?.value);
}
