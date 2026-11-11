import type { Metadata } from "next";
import { AdminShell } from "@/app/admin/admin-shell";
import { ContentPermissionTable } from "@/app/admin/content/content-permission-table";
import { getContentCatalogItems } from "@/lib/content-catalog";
import type { ContentAccessLevel } from "@/lib/content-access";
import { requireAdminUser } from "@/lib/identity/current-user";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "内容权限 | Wise Invest",
  description: "查看公开文章，配置 Wise Invest 学习路线与资金地图的访问权限。",
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
    const permission = item.contentType === "ARTICLE"
      ? undefined
      : permissionMap.get(`${item.contentType}:${item.contentKey}`);
    return {
      contentType: item.contentType,
      contentKey: item.contentKey,
      title: item.title,
      description: item.description,
      group: item.group,
      access: (permission?.access ?? item.fallbackAccess) as ContentAccessLevel,
      reason: permission?.reason ?? item.fallbackReason,
      source: permission ? "DATABASE" as const : "DEFAULT" as const,
    };
  });

  return (
    <AdminShell>
      <ContentPermissionTable rows={rows} />
    </AdminShell>
  );
}
