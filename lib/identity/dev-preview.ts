export const WISE_DEV_PREVIEW_COOKIE = "wise_dev_preview";

export function isDevPreviewEnabled() {
  return process.env.NODE_ENV !== "production";
}

export function isDevPreviewCookieValue(value: string | undefined) {
  return (
    isDevPreviewEnabled() &&
    (value === "user" ||
      value === "admin" ||
      value === "1" ||
      value === "user:MEMBER" ||
      value === "user:VIP" ||
      value === "user:VIP_PLUS")
  );
}

export function isDevPreviewAdminCookieValue(value: string | undefined) {
  return isDevPreviewEnabled() && value === "admin";
}

export function getDevPreviewRole(value: string | undefined) {
  if (!isDevPreviewCookieValue(value)) return null;
  return value === "admin" ? "ADMIN" : "USER";
}

export function getDevPreviewTier(value: string | undefined) {
  if (!isDevPreviewCookieValue(value)) return null;
  if (value === "user:MEMBER") return "MEMBER";
  if (value === "user:VIP_PLUS" || value === "admin") return "VIP_PLUS";
  return "VIP";
}
