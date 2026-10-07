import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { AdminShell } from "@/app/admin/admin-shell";
import { CopyButton } from "@/app/admin/vip/copy-button";
import { isAdminAssistantRole } from "@/lib/auth/admin-roles";
import { getLoginProviderLabels } from "@/lib/auth/provider-display";
import { requireAdminStaffUser } from "@/lib/identity/current-user";
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
  ADMIN_ASSISTANT: "管理员助理",
  ADMIN: "管理员",
} as const;

function getUserRoleLabel(role: string) {
  return userRoleLabels[role as keyof typeof userRoleLabels] ?? role;
}

const tierFilters = [
  { key: "ALL", label: "全部用户" },
  { key: "MEMBER", label: "普通用户" },
  { key: "VIP", label: "Wise VIP" },
  { key: "VIP_PLUS", label: "Wise SVIP" },
] as const;

type TierFilterKey = (typeof tierFilters)[number]["key"];
type AdminUserRow = {
  id: string;
  wiseUserId: string;
  email: string | null;
  name: string | null;
  wechatId: string | null;
  wechatCity: string | null;
  membershipTier: keyof typeof membershipTierLabels;
  role: string;
  createdAt: Date;
  accounts: { provider: string }[];
  _count: {
    partnerAccounts: number;
    entitlements: number;
  };
};
type TierCountRow = {
  membershipTier: keyof typeof membershipTierLabels;
  _count: {
    membershipTier: number;
  };
};

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
  const adminUser = await requireAdminStaffUser();
  const isAssistant = isAdminAssistantRole(adminUser.role);
  const { q, tier } = await searchParams;
  const query = q?.trim() ?? "";
  const selectedTier = !isAssistant && tierFilters.some((filter) => filter.key === tier) ? (tier as TierFilterKey) : "ALL";
  const tierList = tierFilters.filter((filter) => filter.key !== "ALL").map((filter) => filter.key);
  const shouldSearchUsers = !isAssistant || query.length > 0;

  const isMockAdmin = await isDevPreviewAdminSession();
  const prisma = isMockAdmin && !isDatabaseConfigured() ? null : getPrisma();
  let users: AdminUserRow[] = [];
  let groupedCounts: TierCountRow[] = [];

  if (prisma) {
    const searchFields = query
      ? [
          { email: { contains: query, mode: "insensitive" as const } },
          ...(!isAssistant
            ? [
                { name: { contains: query, mode: "insensitive" as const } },
                { wiseUserId: { contains: query, mode: "insensitive" as const } },
                { wechatId: { contains: query, mode: "insensitive" as const } },
                { wechatCity: { contains: query, mode: "insensitive" as const } },
              ]
            : []),
        ]
      : undefined;

    users = shouldSearchUsers
      ? await prisma.user.findMany({
          where: {
            ...(searchFields ? { OR: searchFields } : {}),
            ...(selectedTier !== "ALL" ? { membershipTier: selectedTier } : {}),
          },
          select: {
            id: true,
            wiseUserId: true,
            email: true,
            name: true,
            wechatId: true,
            wechatCity: true,
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
          take: isAssistant ? 10 : 50,
        })
      : [];

    if (!isAssistant) {
      const grouped = await prisma.user.groupBy({
          by: ["membershipTier"],
          _count: { membershipTier: true },
        });
      groupedCounts = grouped.map((item) => ({
        membershipTier: item.membershipTier,
        _count: {
          membershipTier: item._count.membershipTier,
        },
      }));
    }
  } else if (shouldSearchUsers) {
    users = devPreviewUsers.filter((user) => {
      const normalizedQuery = query.toLowerCase();
      const matchQuery =
        !query ||
        (isAssistant
          ? [user.email]
          : [user.email, user.name, user.wiseUserId, user.wechatId, user.wechatCity]
        ).some((value) => value?.toLowerCase().includes(normalizedQuery));
      const matchTier = selectedTier === "ALL" || user.membershipTier === selectedTier;
      return matchQuery && matchTier;
    });
  }

  const tierCounts = Object.fromEntries(tierList.map((key) => [key, 0])) as Record<(typeof tierList)[number], number>;
  if (prisma && !isAssistant) {
    groupedCounts.forEach((item) => {
      tierCounts[item.membershipTier as keyof typeof tierCounts] = item._count.membershipTier;
    });
  } else if (!isAssistant) {
    devPreviewUsers.forEach((user) => {
      if (user.membershipTier in tierCounts) tierCounts[user.membershipTier as keyof typeof tierCounts] += 1;
    });
  }
  const allCount = Object.values(tierCounts).reduce((sum, count) => sum + count, 0);

  const getProviders = (accounts: { provider: string }[] = []) => getLoginProviderLabels(accounts);
  const gridClass = isAssistant
    ? "grid-cols-[1.45fr_1.25fr_1fr_0.75fr_0.45fr]"
    : "grid-cols-[1.45fr_1.25fr_1fr_0.75fr_0.9fr_0.4fr_0.4fr]";

  return (
    <AdminShell role={adminUser.role}>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <h1 className="font-heading text-3xl font-black md:text-4xl">{isAssistant ? "用户查询" : "用户管理"}</h1>
          {isAssistant ? (
            <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
              输入用户邮箱后查询账户，并将符合条件的普通用户升级为 Wise VIP。助理角色不会展示全站用户数量或会员分布。
            </p>
          ) : null}
          <form className="mt-5 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={query}
                placeholder={isAssistant ? "输入用户邮箱查询" : "搜索邮箱、昵称、Wise User ID 或微信号"}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <button className="h-12 rounded-xl bg-slate-950 px-5 text-sm font-black text-amber-300 dark:bg-white dark:text-slate-950">
              搜索
            </button>
          </form>
          {!isAssistant && <div className="mt-5 flex flex-wrap gap-2">
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
          </div>}
        </section>

        <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className={isAssistant ? "min-w-[920px]" : "min-w-[1180px]"}>
          <div className={`grid ${gridClass} gap-4 border-b border-slate-200 px-5 py-3 text-xs font-black uppercase text-slate-400 dark:border-slate-800`}>
            <span>用户名 / 微信</span>
            <span>邮箱</span>
            <span>Wise ID</span>
            <span>会员</span>
            {!isAssistant && <span>登录方式</span>}
            {!isAssistant && <span>绑定</span>}
            <span>操作</span>
          </div>
          {users.map((user) => {
            const providers = getProviders(user.accounts ?? []);

            return (
            <div key={user.id} className={`grid ${gridClass} gap-4 border-b border-slate-100 px-5 py-4 text-sm last:border-0 dark:border-slate-800`}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black">{user.name ?? "未命名用户"}</p>
                  {user.wechatId ? (
                    <div className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                      <span className="min-w-0 truncate font-mono text-xs font-black">{user.wechatId}</span>
                      <CopyButton value={user.wechatId} label="复制" />
                    </div>
                  ) : null}
                </div>
                {user.wechatCity ? <p className="mt-1 text-xs font-bold text-slate-400">城市：{user.wechatCity}</p> : null}
              </div>
              <p className="break-all text-xs font-bold text-slate-500 dark:text-slate-400">{user.email ?? "未绑定邮箱"}</p>
              <p className="break-all font-mono text-xs font-bold text-slate-400">{user.wiseUserId}</p>
              <div>
                <p className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${getTierBadgeClass(user.membershipTier)}`}>
                  {membershipTierLabels[user.membershipTier]}
                </p>
                {!isAssistant && <p className="mt-1 text-xs text-slate-400">{getUserRoleLabel(user.role)}</p>}
              </div>
              {!isAssistant && <div className="flex flex-wrap gap-1.5">
                {providers.length > 0 ? (
                  providers.map((provider) => (
                    <span key={provider} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-black leading-none text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                      {provider}
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-bold text-slate-400">未记录</span>
                )}
              </div>}
              {!isAssistant && <div className="font-bold">{user._count.partnerAccounts}</div>}
              <Link href={`/admin/users/${user.id}`} className="font-black text-amber-700 dark:text-amber-300">
                查看
              </Link>
            </div>
            );
          })}
          {users.length === 0 && (
            <p className="px-5 py-8 text-sm text-slate-500 dark:text-slate-400">
              {isAssistant && !query ? "请输入用户邮箱后查询。" : "没有找到匹配用户。"}
            </p>
          )}
          </div>
        </section>
    </AdminShell>
  );
}
