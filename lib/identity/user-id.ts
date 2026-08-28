import { customAlphabet } from "nanoid";

const makeId = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 12);

export function generateWiseUserId() {
  return `Y${makeId()}`;
}

export function isInitialAdminEmail(email: string | null | undefined) {
  if (!email || !process.env.WISE_ADMIN_EMAILS) return false;
  const normalizedEmail = email.trim().toLowerCase();
  return process.env.WISE_ADMIN_EMAILS.split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalizedEmail);
}
