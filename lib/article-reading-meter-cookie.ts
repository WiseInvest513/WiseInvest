import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { normalizeReadings, type ReadingEntry } from "./article-reading-meter";

export const readingKey = (id: string) => createHash("sha256").update(id).digest("hex").slice(0, 16);
export function encodeReadingCookie(entries: ReadingEntry[], secret: string) {
  const payload = Buffer.from(JSON.stringify(entries)).toString("base64url");
  const signature = createHmac("sha256", secret).update(`reading-v1:${payload}`).digest("base64url");
  return `${payload}.${signature}`;
}
export function decodeReadingCookie(cookie: string | undefined, secret: string, now: number): ReadingEntry[] {
  if (!cookie || cookie.length > 3500) return [];
  try {
    const [payload, signature, extra] = cookie.split(".");
    if (!payload || !signature || extra) return [];
    const expected = createHmac("sha256", secret).update(`reading-v1:${payload}`).digest();
    const supplied = Buffer.from(signature, "base64url");
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return [];
    return normalizeReadings(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")), now);
  } catch { return []; }
}
