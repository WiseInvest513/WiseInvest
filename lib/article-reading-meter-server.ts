import { cookies } from "next/headers";
import { getContentViewerTier } from "@/lib/identity/content-viewer";
import { READING_COOKIE, READING_LIMIT } from "./article-reading-meter";
import { decodeReadingCookie } from "./article-reading-meter-cookie";

export function readingMeterSecret() {
  const secret = process.env.AUTH_SECRET ?? (process.env.NODE_ENV !== "production" ? "wise-invest-local-auth-secret" : undefined);
  if (!secret) throw new Error("AUTH_SECRET is required for the reading trial");
  return secret;
}
export async function readBrowserReadings() {
  const value = (await cookies()).get(READING_COOKIE)?.value;
  if (!value) return [];
  return decodeReadingCookie(value, readingMeterSecret(), Date.now());
}
export async function requiresReadingRegistration() {
  const entries = await readBrowserReadings();
  // New readers remain independent of the identity database.
  if (entries.length < READING_LIMIT) return false;
  return !(await getContentViewerTier());
}
