import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeDollarSign, ClipboardCheck, FileChartColumnIncreasing, History, ServerCog, Users, Waypoints } from "lucide-react";
import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdminUser } from "@/lib/identity/current-user";
import { devPreviewAuditLogs, devPreviewPartnerAccounts, devPreviewPartners, devPreviewUsers } from "@/lib/identity/dev-preview-data";
import { isDevPreviewAdminSession } from "@/lib/identity/dev-preview-server";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "管理后台 | Wise Invest",
  description: "Wise Invest 管理后台。",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  await requireAdminUser();
  const isMockAdmin = await isDevPreviewAdminSession();
  const [userCount, pendingCount, vipExchangeCount, partnerCount, auditCount] =
    isMockAdmin && !isDatabaseConfigured()
      ? [
          devPreviewUsers.length,
          devPreviewPartnerAccounts.filter((account) => account.status === "PENDING" || account.status === "NEEDS_REVIEW").length,
          2,
          devPreviewPartners.length,
          devPreviewAuditLogs.length,
        ]
      : await Promise.all([
          getPrisma().user.count(),
          getPrisma().partnerAccount.count({ where: { status: { in: ["PENDING", "NEEDS_REVIEW"] } } }),
          getPrisma().vipExchangeRecord.count(),
          getPrisma().partner.count(),
          getPrisma().auditLog.count(),
        ]);

  const cards = [
    { href: "/admin/users", label: "用户", value: userCount, icon: Users },
    { href: "/admin/vip", label: "待处理绑定", value: pendingCount, icon: ClipboardCheck },
    { href: "/admin/vip-management", label: "交易所 VIP", value: vipExchangeCount, icon: BadgeDollarSign },
    { href: "/admin/partners", label: "合作方", value: partnerCount, icon: Waypoints },
    { href: "/admin/audit", label: "审计日志", value: auditCount, icon: History },
    { href: "/admin/system", label: "系统检查", value: "ENV", icon: ServerCog },
  ];

  return (
    <AdminShell>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <h1 className="font-heading text-3xl font-black md:text-4xl">管理后台</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
            管理点位计划、Wise ID、VIP 审核、合作方配置和关键审计记录。
          </p>
          {isMockAdmin && !isDatabaseConfigured() && (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              当前是本地后台预览，展示 mock 数据；生产环境不会启用。
            </p>
          )}
        </section>
        <Link
          href="/admin/point"
          className="group flex flex-col gap-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm transition hover:border-amber-400 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-4 dark:border-amber-900/60 dark:bg-amber-950/20 dark:hover:border-amber-700 dark:hover:bg-amber-950/40 sm:flex-row sm:items-center sm:justify-between md:p-6"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-amber-300 dark:bg-amber-300 dark:text-slate-950">
              <FileChartColumnIncreasing className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-black">点位管理</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                新建、更新 VIP 点位计划，查看历史记录。
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white group-hover:bg-slate-800 dark:bg-amber-300 dark:text-slate-950 dark:group-hover:bg-amber-200 sm:self-auto">
            进入管理
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </Link>
        <section className="grid gap-4 md:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-900/60"
              >
                <Icon className="mb-4 h-5 w-5 text-amber-500" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="mt-2 text-3xl font-black">{card.value}</p>
              </Link>
            );
          })}
        </section>
    </AdminShell>
  );
}
