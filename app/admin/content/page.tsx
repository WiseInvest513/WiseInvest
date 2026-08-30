import type { Metadata } from "next";
import { AdminNav } from "@/app/admin/admin-nav";
import { ContentPermissionTable } from "@/app/admin/content/content-permission-table";
import { getContentCatalogItems } from "@/lib/content-catalog";
import type { ContentAccessLevel } from "@/lib/content-access";
import { requireAdminUser } from "@/lib/identity/current-user";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "内容权限 | Wise Invest",
  description: "配置 Wise Invest 文章和学习路线的访问权限。",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminContentPage() {
  await requireAdminUser();
  const catalog = getContentCatalogItems();

  const permissions = isDatabaseConfigured()
    ? await getPrisma().contentPermission.findMany({
        select: {
          contentType: true,
          contentKey: true,
          access: true,
          reason: true,
        },
      })
    : [];

  const permissionMap = new Map(
    permissions.map((item) => [`${item.contentType}:${item.contentKey}`, item])
  );

  const rows = catalog.map((item) => {
    const permission = permissionMap.get(`${item.contentType}:${item.contentKey}`);
    return {
      contentType: item.contentType,
      contentKey: item.contentKey,
      title: item.title,
      description: item.description,
      access: (permission?.access ?? item.fallbackAccess) as ContentAccessLevel,
      reason: permission?.reason ?? item.fallbackReason,
      source: permission ? "DATABASE" as const : "DEFAULT" as const,
    };
  });

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <AdminNav />
        <ContentPermissionTable rows={rows} />
      </div>
    </main>
  );
}
