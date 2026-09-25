import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPointViewer } from "@/lib/point/auth";
import { getPointDetail } from "@/lib/point/repository";
import { PointDetail } from "../point-detail";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "观察记录 | Wise Invest",
  robots: { index: false, follow: false },
};
export default async function PointDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await getPointViewer();
  const initial = await getPointDetail(viewer, id);
  if (!initial) notFound();
  return <PointDetail initial={initial} initialLoadedAt={Date.now()} />;
}
