import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdminUser } from "@/lib/identity/current-user";
export const dynamic = "force-dynamic";
export default async function PopupAdminPage() {
  await requireAdminUser();
  return <AdminShell><p className="p-8">活动弹窗已停用，网站现自动展示加入群聊。</p></AdminShell>;
}
