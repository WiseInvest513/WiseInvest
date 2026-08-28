import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { AdminNav } from "@/app/admin/admin-nav";
import { requireAdminUser } from "@/lib/identity/current-user";
import { devPreviewPartnerAccounts } from "@/lib/identity/dev-preview-data";
import { isDevPreviewAdminSession } from "@/lib/identity/dev-preview-server";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { ReviewPanel } from "@/app/admin/vip/review-panel";
import { partnerAccountStatusLabels, partnerTypeLabels } from "@/lib/vip/status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VIP 审核后台 | Wise Invest",
  description: "Wise VIP 合作账户绑定审核后台。",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminVipPage() {
  await requireAdminUser();

  const isMockAdmin = await isDevPreviewAdminSession();
  const pendingAccounts =
    isMockAdmin && !isDatabaseConfigured()
      ? devPreviewPartnerAccounts
      : await getPrisma().partnerAccount.findMany({
          where: {
            status: {
              in: ["PENDING", "NEEDS_REVIEW"],
            },
          },
          select: {
            id: true,
            externalIdentifier: true,
            status: true,
            userNote: true,
            reviewNote: true,
            submittedAt: true,
            user: {
              select: {
                email: true,
                wiseUserId: true,
                membershipTier: true,
              },
            },
            partner: {
              select: {
                name: true,
                slug: true,
                type: true,
                vipEligible: true,
                vipPlusEligible: true,
              },
            },
          },
          orderBy: {
            submittedAt: "desc",
          },
        });

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <AdminNav />
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin
          </div>
          <h1 className="font-heading text-3xl font-black md:text-4xl">VIP 绑定审核</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            审核通过后系统会服务端刷新用户会员状态；用户提交 UID 本身不会直接获得 VIP。
          </p>
          {isMockAdmin && !isDatabaseConfigured() && (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              本地预览数据：审核操作会返回成功，但不会写入数据库。
            </p>
          )}
        </section>

        {pendingAccounts.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm leading-7 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            当前没有待审核或待补充的绑定。
          </section>
        ) : (
          <section className="space-y-4">
            {pendingAccounts.map((account) => (
              <article key={account.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-xl font-black">{account.partner.name}</h2>
                      <p className="mt-1 text-sm font-bold text-slate-400">
                        {partnerTypeLabels[account.partner.type]} · {account.partner.slug}
                      </p>
                    </div>
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                        <p className="font-bold text-slate-400">用户</p>
                        <p className="mt-1 break-all font-mono">{account.user.email ?? account.user.wiseUserId}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                        <p className="font-bold text-slate-400">UID / 账户标识</p>
                        <p className="mt-1 break-all font-mono">{account.externalIdentifier}</p>
                      </div>
                    </div>
                    {account.userNote && (
                      <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                        用户备注：{account.userNote}
                      </p>
                    )}
                    {account.reviewNote && (
                      <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                        上次审核备注：{account.reviewNote}
                      </p>
                    )}
                  </div>
                  <div className="w-full rounded-2xl border border-slate-200 p-4 dark:border-slate-800 lg:w-[360px]">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-slate-500 dark:text-slate-400">当前状态</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {partnerAccountStatusLabels[account.status]}
                      </span>
                    </div>
                    <ReviewPanel id={account.id} />
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
