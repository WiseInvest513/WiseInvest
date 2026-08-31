import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/app/admin/admin-shell";
import { MembershipForm } from "@/app/admin/users/[id]/membership-form";
import { getLoginProviderLabels } from "@/lib/auth/provider-display";
import { requireAdminUser } from "@/lib/identity/current-user";
import { getDevPreviewUserDetail } from "@/lib/identity/dev-preview-data";
import { isDevPreviewAdminSession } from "@/lib/identity/dev-preview-server";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { membershipTierLabels, partnerAccountStatusLabels, partnerTypeLabels } from "@/lib/vip/status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "用户详情 | Wise Invest",
  description: "Wise Invest 用户详情和会员状态管理。",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminUserDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  await requireAdminUser();
  const { id } = await params;
  const isMockAdmin = await isDevPreviewAdminSession();
  const user =
    isMockAdmin && !isDatabaseConfigured()
      ? getDevPreviewUserDetail(id)
      : await getPrisma().user.findUnique({
          where: { id },
          select: {
            id: true,
            wiseUserId: true,
            email: true,
            name: true,
            membershipTier: true,
            role: true,
            createdAt: true,
            accounts: {
              select: {
                provider: true,
                type: true,
              },
            },
            partnerAccounts: {
              select: {
                id: true,
                externalIdentifier: true,
                status: true,
                userNote: true,
                reviewNote: true,
                submittedAt: true,
                verifiedAt: true,
                partner: {
                  select: {
                    name: true,
                    type: true,
                  },
                },
              },
              orderBy: { submittedAt: "desc" },
            },
            entitlements: {
              select: {
                id: true,
                key: true,
                source: true,
                startsAt: true,
                expiresAt: true,
              },
              orderBy: { createdAt: "desc" },
            },
            targetAuditLogs: {
              select: {
                id: true,
                action: true,
                metadata: true,
                createdAt: true,
                actorUser: {
                  select: {
                    email: true,
                    wiseUserId: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
              take: 20,
            },
          },
        });

  if (!user) notFound();

  return (
    <AdminShell>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <h1 className="font-heading text-3xl font-black md:text-4xl">{user.name ?? user.email ?? "用户详情"}</h1>
          <p className="mt-2 break-all text-sm text-slate-500 dark:text-slate-400">{user.email ?? "未绑定邮箱"}</p>
          <p className="mt-1 break-all font-mono text-sm text-slate-400">{user.wiseUserId}</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-black">会员状态</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                当前：<span className="font-black text-slate-950 dark:text-white">{membershipTierLabels[user.membershipTier]}</span>
              </p>
              <div className="mt-4">
                <MembershipForm userId={user.id} currentTier={user.membershipTier} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-black">登录方式</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {getLoginProviderLabels(user.accounts ?? []).length > 0 ? (
                  getLoginProviderLabels(user.accounts ?? []).map((provider) => (
                    <span key={provider} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {provider}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500 dark:text-slate-400">暂无登录方式记录。</span>
                )}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-400">
                OAuth 登录会自动记录 Google / GitHub；邮箱注册成功后会记录邮箱密码登录方式。
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-black">权益</h2>
              <div className="mt-4 space-y-3">
                {user.entitlements.map((entitlement) => (
                  <div key={entitlement.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono font-black">{entitlement.key}</span>
                      <span className="text-xs font-bold text-slate-400">
                        {!entitlement.expiresAt || entitlement.expiresAt > new Date() ? "ACTIVE" : "EXPIRED"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{entitlement.source}</p>
                  </div>
                ))}
                {user.entitlements.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">暂无权益。</p>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-black">合作账户绑定</h2>
              <div className="mt-4 space-y-3">
                {user.partnerAccounts.map((account) => (
                  <div key={account.id} className="rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-black">{account.partner.name}</p>
                        <p className="mt-1 font-mono text-xs text-slate-400">
                          {partnerTypeLabels[account.partner.type]} · {account.externalIdentifier}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {partnerAccountStatusLabels[account.status]}
                      </span>
                    </div>
                    {account.reviewNote && <p className="mt-3 text-slate-500 dark:text-slate-400">审核备注：{account.reviewNote}</p>}
                  </div>
                ))}
                {user.partnerAccounts.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">暂无绑定。</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-black">最近审计</h2>
              <div className="mt-4 space-y-3">
                {user.targetAuditLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-mono font-black">{log.action}</span>
                      <span className="text-xs text-slate-400">{log.createdAt.toISOString().slice(0, 10)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">操作人：{log.actorUser?.email ?? log.actorUser?.wiseUserId ?? "System"}</p>
                  </div>
                ))}
                {user.targetAuditLogs.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">暂无审计记录。</p>}
              </div>
            </div>
          </div>
        </section>
    </AdminShell>
  );
}
