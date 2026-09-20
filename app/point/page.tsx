import type { Metadata } from "next";
import { getPointViewer } from "@/lib/point/auth";
import { getPointList } from "@/lib/point/repository";
import { PointList } from "./point-list";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "点位观察 | Wise Invest",
  description:
    "带有效期的市场观察、参考点位与版本记录。所有 VIP 可查看完整内容。",
};

export default async function PointPage() {
  const viewer = await getPointViewer();
  const initial = await getPointList(viewer, {
    scope: "active",
    category: "ALL",
    page: 1,
  });
  return <PointList initial={initial} isAdmin={viewer.isAdmin} />;
}
