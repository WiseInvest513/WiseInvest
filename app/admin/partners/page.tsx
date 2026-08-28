import type { Metadata } from "next";
import { AdminNav } from "@/app/admin/admin-nav";
import { PartnerForm } from "@/app/admin/partners/partner-form";
import { requireAdminUser } from "@/lib/identity/current-user";
import { devPreviewPartners } from "@/lib/identity/dev-preview-data";
import { isDevPreviewAdminSession } from "@/lib/identity/dev-preview-server";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "合作方配置 | Wise Invest",
  description: "Wise VIP 合作方配置。",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPartnersPage() {
  await requireAdminUser();
  const isMockAdmin = await isDevPreviewAdminSession();
  const partners =
    isMockAdmin && !isDatabaseConfigured()
      ? devPreviewPartners
      : await getPrisma().partner.findMany({
          orderBy: [{ enabled: "desc" }, { type: "asc" }, { name: "asc" }],
          select: {
            id: true,
            slug: true,
            name: true,
            type: true,
            referralUrl: true,
            referralCode: true,
            vipEligible: true,
            vipPlusEligible: true,
            vipPlusVolumeThreshold: true,
            enabled: true,
          },
        });

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <AdminNav />
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <h1 className="font-heading text-3xl font-black md:text-4xl">合作方配置</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
            这里决定哪些渠道可以提交 VIP 核验，以及哪些渠道未来可参与 SVIP 资格判断。
          </p>
          {isMockAdmin && !isDatabaseConfigured() && (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              本地预览数据：新增和编辑合作方只返回 mock 成功，不会保存。
            </p>
          )}
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <PartnerForm />
          {partners.map((partner) => (
            <PartnerForm
              key={partner.id}
              partner={{
                id: partner.id,
                slug: partner.slug,
                name: partner.name,
                type: partner.type,
                referralUrl: partner.referralUrl ?? "",
                referralCode: partner.referralCode ?? "",
                vipEligible: partner.vipEligible,
                vipPlusEligible: partner.vipPlusEligible,
                vipPlusVolumeThreshold: partner.vipPlusVolumeThreshold?.toString() ?? "",
                enabled: partner.enabled,
              }}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
