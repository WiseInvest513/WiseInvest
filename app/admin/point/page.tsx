import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPointViewer } from "@/lib/point/auth";
import { listPointAdmin } from "@/lib/point/repository";
import { PointManager } from "./point-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "点位管理 | Wise Invest",
  description: "管理、发布与归档 Wise Invest 点位计划。",
  robots: { index: false, follow: false },
};

export default async function PointAdminPage() {
  const viewer = await getPointViewer();
  if (!viewer.isAdmin)
    redirect(
      viewer.userId ? "/account" : "/login?callbackUrl=%2Fadmin%2Fpoint",
    );
  const result = await listPointAdmin(viewer);
  return (
    <PointManager
      initialItems={result.items}
      previewMode={result.previewMode}
      unavailable={result.unavailable}
    />
  );
}
