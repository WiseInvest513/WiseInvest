import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, ShieldCheck, XCircle } from "lucide-react";
import { AdminNav } from "@/app/admin/admin-nav";
import { CopyButton } from "@/app/admin/vip/copy-button";
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

type AdminVipPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const statusFilters = [
  { key: "PENDING", label: "未审核", icon: Clock3 },
  { key: "NEEDS_REVIEW", label: "待补充", icon: AlertTriangle },
  { key: "VERIFIED", label: "审核通过", icon: CheckCircle2 },
  { key: "REJECTED", label: "审核驳回", icon: XCircle },
  { key: "ALL", label: "全部", icon: ShieldCheck },
] as const;

type StatusFilterKey = (typeof statusFilters)[number]["key"];

function getStatusTone(status: string) {
  if (status === "VERIFIED") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300";
  if (status === "REJECTED") return "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300";
  if (status === "NEEDS_REVIEW") return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-200";
  return "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200";
}

function getFilterHref(status: StatusFilterKey) {
  return status === "PENDING" ? "/admin/vip" : `/admin/vip?status=${status}`;
}

function getReviewUserName(user: { name?: string | null; email: string | null; wiseUserId: string }) {
  return user.name ?? "未命名用户";
}

export default async function AdminVipPage({ searchParams }: AdminVipPageProps) {
  await requireAdminUser();
  const { status } = await searchParams;
  const selectedStatus = statusFilters.some((filter) => filter.key === status) ? (status as StatusFilterKey) : "PENDING";

  const isMockAdmin = await isDevPreviewAdminSession();
  const statusList = statusFilters.filter((filter) => filter.key !== "ALL").map((filter) => filter.key);
  const allMockAccounts = devPreviewPartnerAccounts;
  const visibleMockAccounts =
    selectedStatus === "ALL" ? allMockAccounts : allMockAccounts.filter((account) => account.status === selectedStatus);

  const prisma = isMockAdmin && !isDatabaseConfigured() ? null : getPrisma();
  const [reviewAccounts, groupedCounts] = prisma
    ? await Promise.all([
        prisma.partnerAccount.findMany({
          where: {
            status: selectedStatus === "ALL" ? { in: statusList } : selectedStatus,
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
                name: true,
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
          take: 80,
        }),
        prisma.partnerAccount.groupBy({
          by: ["status"],
          where: { status: { in: statusList } },
          _count: { status: true },
        }),
      ])
    : [visibleMockAccounts, []];

  const statusCounts = Object.fromEntries(statusList.map((key) => [key, 0])) as Record<(typeof statusList)[number], number>;
  if (prisma) {
    groupedCounts.forEach((item) => {
      statusCounts[item.status as keyof typeof statusCounts] = item._count.status;
    });
  } else {
    allMockAccounts.forEach((account) => {
      if (account.status in statusCounts) statusCounts[account.status as keyof typeof statusCounts] += 1;
    });
  }
  const allCount = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

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
            审核通过后系统会服务端刷新用户会员状态；驳回或要求补充时，审核说明会直接展示给用户。
          </p>
          {isMockAdmin && !isDatabaseConfigured() && (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              本地预览数据：审核操作会返回成功，但不会写入数据库。
            </p>
          )}
        </section>

        <section className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => {
            const Icon = filter.icon;
            const active = filter.key === selectedStatus;
            const count = filter.key === "ALL" ? allCount : statusCounts[filter.key];
            return (
              <Link
                key={filter.key}
                href={getFilterHref(filter.key)}
                className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-black transition ${
                  active
                    ? "border-slate-950 bg-slate-950 text-amber-300 dark:border-white dark:bg-white dark:text-slate-950"
                    : "border-slate-200 bg-white text-slate-600 hover:border-amber-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {filter.label}
                <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/10" : "bg-slate-100 dark:bg-slate-800"}`}>{count}</span>
              </Link>
            );
          })}
        </section>

        {reviewAccounts.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm leading-7 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            当前筛选条件下没有绑定记录。
          </section>
        ) : (
          <section className="space-y-4">
            {reviewAccounts.map((account) => {
              const isResubmission = account.status === "PENDING" && Boolean(account.reviewNote);
              return (
              <article key={account.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black">{account.partner.name}</h2>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${getStatusTone(account.status)}`}>
                          {partnerAccountStatusLabels[account.status]}
                        </span>
                        {isResubmission && (
                          <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-black text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-200">
                            二次提交
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-400">
                        <span>{partnerTypeLabels[account.partner.type]} · {account.partner.slug}</span>
                        <span>提交于 {account.submittedAt.toLocaleString("zh-CN", { hour12: false })}</span>
                      </div>
                    </div>
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-bold text-slate-400">用户</p>
                          <CopyButton value={`${getReviewUserName(account.user)}\n${account.user.email ?? ""}\n${account.user.wiseUserId}`} />
                        </div>
                        <p className="mt-1 break-all font-bold">{getReviewUserName(account.user)}</p>
                        <p className="mt-1 break-all font-mono text-xs text-slate-500 dark:text-slate-400">{account.user.email ?? "未绑定邮箱"}</p>
                        <p className="mt-1 break-all font-mono text-xs text-slate-400">{account.user.wiseUserId}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-bold text-slate-400">UID / 账户标识</p>
                          <CopyButton value={account.externalIdentifier} />
                        </div>
                        <p className="mt-1 break-all font-mono">{account.externalIdentifier}</p>
                      </div>
                    </div>
                    {account.userNote && (
                      <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                        <span className="font-black text-slate-700 dark:text-slate-200">用户备注：</span>
                        {account.userNote}
                        <span className="ml-2 inline-flex align-middle"><CopyButton value={account.userNote} label="复制备注" /></span>
                      </p>
                    )}
                    {account.reviewNote && (
                      <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                        <span className="font-black">{isResubmission ? "上次驳回 / 补充原因：" : "给用户的审核说明："}</span>
                        {account.reviewNote}
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
                    <ReviewPanel id={account.id} defaultNote={account.status === "PENDING" ? null : account.reviewNote} />
                  </div>
                </div>
              </article>
            )})}
          </section>
        )}
      </div>
    </main>
  );
}
