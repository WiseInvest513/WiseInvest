import type { PointPlan } from "@/lib/point/types";

export function chinaDate(value: string | null, full = false) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    ...(full ? { year: "numeric" as const } : {}),
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function lifecycle(plan: PointPlan) {
  if (plan.status === "DRAFT") return "草稿";
  if (plan.status === "WITHDRAWN") return "已撤回";
  if (plan.status === "CLOSED") return "已结束";
  if (new Date(plan.validUntil).getTime() <= Date.now()) return "已到期";
  return "已发布";
}
