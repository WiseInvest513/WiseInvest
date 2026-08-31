import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { AdminShell } from "@/app/admin/admin-shell";
import { getLoginProviderLabels } from "@/lib/auth/provider-display";
import { requireAdminUser } from "@/lib/identity/current-user";
import { devPreviewUsers } from "@/lib/identity/dev-preview-data";
import { isDevPreviewAdminSession } from "@/lib/identity/dev-preview-server";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { membershipTierLabels } from "@/lib/vip/status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "用户管理 | Wise Invest",
  description: "Wise Invest 用户搜索和会员状态管理。",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminUsersPageProps = {
  searchParams: Promise<{
    q?: string;
    tier?: string;
  }>;
};

const userRoleLabels = {
  USER: "普通账户",
  ADMIN: "管理员",
} as const;

const tierFilters = [
  { key: "ALL", label: "全部用户" },
  { key: "MEMBER", label: "普通用户" },
  { key: "VIP", label: "Wise VIP" },
  { key: "VIP_PLUS", label: "Wise SVIP" },
] as const;

type TierFilterKey = (typeof tierFilters)[number]["key"];

function getTierFilterHref(tier: TierFilterKey, query: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (tier !== "ALL") params.set("tier", tier);
  const suffix = params.toString();
  return suffix ? `/admin/users?${suffix}` : "/admin/users";
}

function getTierBadgeClass(tier: string) {
  if (tier === "VIP_PLUS") return "border-slate-950 bg-slate-950 text-amber-300 dark:border-white dark:bg-white dark:text-slate-950";
  if (tier === "VIP") return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200";
  return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300";
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  await requireAdminUser();
  const { q, tier } = await searchParams;
  const query = q?.trim() ?? "";
  const selectedTier = tierFilters.some((filter) => filter.key === tier) ? (tier as TierFilterKey) : "ALL";
  const tierList = tierFilters.filter((filter) => filter.key !== "ALL").map((filter) => filter.key);

  const isMockAdmin = await isDevPreviewAdminSession();
  const prisma = isMockAdmin && !isDatabaseConfigured() ? null : getPrisma();
  const [users, groupedCounts] = prisma
    ? await Promise.all([
        prisma.user.findMany({
          where: {
            ...(query
              ? {
                  OR: [
                    { email: { contains: query, mode: "insensitive" } },
                    { name: { contains: query, mode: "insensitive" } },
                    { wiseUserId: { contains: query, mode: "insensitive" } },
                  ],
                }
              : {}),
            ...(selectedTier !== "ALL" ? { membershipTier: selectedTier } : {}),
          },
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
              },
            },
            _count: {
              select: {
                partnerAccounts: true,
                entitlements: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        }),
        prisma.user.groupBy({
          by: ["membershipTier"],
          _count: { membershipTier: true },
        }),
      ])
    : [
        devPreviewUsers.filter((user) => {
          const normalizedQuery = query.toLowerCase();
          const matchQuery =
            !query || [user.email, user.name, user.wiseUserId].some((value) => value?.toLowerCase().includes(normalizedQuery));
          const matchTier = selectedTier === "ALL" || user.membershipTier === selectedTier;
          return matchQuery && matchTier;
        }),
        [],
      ];

  const tierCounts = Object.fromEntries(tierList.map((key) => [key, 0])) as Record<(typeof tierList)[number], number>;
  if (prisma) {
    groupedCounts.forEach((item) => {
      tierCounts[item.membershipTier as keyof typeof tierCounts] = item._count.membershipTier;
    });
  } else {
    devPreviewUsers.forEach((user) => {
      if (user.membershipTier in tierCounts) tierCounts[user.membershipTier as keyof typeof tierCounts] += 1;
    });
  }
  const allCount = Object.values(tierCounts).reduce((sum, count) => sum + count, 0);

  const getProviders = (accounts: { provider: string }[] = []) => getLoginProviderLabels(accounts);

  return (
    <AdminShell>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <h1 className="font-heading text-3xl font-black md:text-4xl">用户管理</h1>
          <form className="mt-5 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={query}
                placeholder="搜索邮箱、昵称或 Wise User ID"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <button className="h-12 rounded-xl bg-slate-950 px-5 text-sm font-black text-amber-300 dark:bg-white dark:text-slate-950">
              搜索
            </button>
          </form>
          <div className="mt-5 flex flex-wrap gap-2">
            {tierFilters.map((filter) => {
              const active = filter.key === selectedTier;
              const count = filter.key === "ALL" ? allCount : tierCounts[filter.key];
              return (
                <Link
                  key={filter.key}
                  href={getTierFilterHref(filter.key, query)}
                  className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-black transition ${
                    active
                      ? "border-slate-950 bg-slate-950 text-amber-300 dark:border-white dark:bg-white dark:text-slate-950"
                      : "border-slate-200 bg-white text-slate-600 hover:border-amber-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                  }`}
                >
                  {filter.label}
                  <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/10" : "bg-slate-100 dark:bg-slate-800"}`}>{count}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="min-w-[1040px]">
          <div className="grid grid-cols-[1fr_1.35fr_1fr_0.75fr_0.95fr_0.45fr_0.45fr] gap-4 border-b border-slate-200 px-5 py-3 text-xs font-black uppercase text-slate-400 dark:border-slate-800">
            <span>用户名</span>
            <span>邮箱</span>
            <span>Wise ID</span>
            <span>会员</span>
            <span>登录方式</span>
            <span>绑定</span>
            <span>操作</span>
          </div>
          {users.map((user) => {
            const providers = getProviders(user.accounts ?? []);

            return (
            <div key={user.id} className="grid grid-cols-[1fr_1.35fr_1fr_0.75fr_0.95fr_0.45fr_0.45fr] gap-4 border-b border-slate-100 px-5 py-4 text-sm last:border-0 dark:border-slate-800">
              <p className="font-black">{user.name ?? "未命名用户"}</p>
              <p className="break-all text-xs font-bold text-slate-500 dark:text-slate-400">{user.email ?? "未绑定邮箱"}</p>
              <p className="break-all font-mono text-xs font-bold text-slate-400">{user.wiseUserId}</p>
              <div>
                <p className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${getTierBadgeClass(user.membershipTier)}`}>
                  {membershipTierLabels[user.membershipTier]}
                </p>
                <p className="mt-1 text-xs text-slate-400">{userRoleLabels[user.role] ?? user.role}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {providers.length > 0 ? (
                  providers.map((provider) => (
                    <span key={provider} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-black leading-none text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                      {provider}
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-bold text-slate-400">未记录</span>
                )}
              </div>
              <div className="font-bold">{user._count.partnerAccounts}</div>
              <Link href={`/admin/users/${user.id}`} className="font-black text-amber-700 dark:text-amber-300">
                查看
              </Link>
            </div>
            );
          })}
          {users.length === 0 && (
            <p className="px-5 py-8 text-sm text-slate-500 dark:text-slate-400">没有找到匹配用户。</p>
          )}
          </div>
        </section>
    </AdminShell>
  );
}
