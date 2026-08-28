import { cookies } from "next/headers";
import {
  WISE_DEV_PREVIEW_COOKIE,
  isDevPreviewAdminCookieValue,
} from "@/lib/identity/dev-preview";

export async function isDevPreviewAdminSession() {
  const cookieStore = await cookies();
  return isDevPreviewAdminCookieValue(cookieStore.get(WISE_DEV_PREVIEW_COOKIE)?.value);
}
