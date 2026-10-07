export const ADMIN_ROLE = "ADMIN";
export const ADMIN_ASSISTANT_ROLE = "ADMIN_ASSISTANT";

export type AdminRole = typeof ADMIN_ROLE | typeof ADMIN_ASSISTANT_ROLE;

export function isSuperAdminRole(role: string | null | undefined) {
  return role === ADMIN_ROLE;
}

export function isAdminAssistantRole(role: string | null | undefined) {
  return role === ADMIN_ASSISTANT_ROLE;
}

export function isAdminStaffRole(role: string | null | undefined) {
  return isSuperAdminRole(role) || isAdminAssistantRole(role);
}
