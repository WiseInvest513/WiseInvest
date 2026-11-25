import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isDevPreviewEnabled } from "@/lib/identity/dev-preview";
import { VipInvitationPreview } from "./preview";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "VIP 引导样式预览 | Wise Invest",
  robots: { index: false, follow: false },
};

export default function VipInvitationPreviewPage() {
  if (!isDevPreviewEnabled()) notFound();
  return <VipInvitationPreview />;
}
