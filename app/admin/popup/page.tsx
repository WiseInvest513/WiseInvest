import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdminUser } from "@/lib/identity/current-user";
import { readPopupCampaign } from "@/lib/popup-campaign-store";
import { PopupEditor } from "./popup-editor";
export const dynamic = "force-dynamic";
export const metadata = { title: "全站弹窗 | Wise Invest", robots: { index: false, follow: false } };
export default async function PopupAdminPage() {
  await requireAdminUser();
  let snapshot;
  try { snapshot = await readPopupCampaign(); } catch {
    return <AdminShell><p role="alert" className="rounded-2xl border border-red-200 bg-white p-8 text-red-700">暂时无法读取弹窗配置。请检查数据库连接，并先应用 popup_campaign 数据库迁移。</p></AdminShell>;
  }
  return <AdminShell><PopupEditor initial={snapshot.config} initialRevision={snapshot.revision} localPreview={process.env.NODE_ENV !== "production"}/></AdminShell>;
}
