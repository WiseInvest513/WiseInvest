import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { AdminNav } from "@/app/admin/admin-nav";
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
  }>;
};

const userRoleLabels = {
  USER: "普通账户",
  ADMIN: "管理员",
} as const;

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  await requireAdminUser();
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const isMockAdmin = await isDevPreviewAdminSession();
  const users =
    isMockAdmin && !isDatabaseConfigured()
      ? devPreviewUsers.filter((user) => {
          if (!query) return true;
          const normalizedQuery = query.toLowerCase();
          return [user.email, user.name, user.wiseUserId].some((value) => value?.toLowerCase().includes(normalizedQuery));
        })
      : await getPrisma().user.findMany({
          where: query
            ? {
                OR: [
                  { email: { contains: query, mode: "insensitive" } },
                  { name: { contains: query, mode: "insensitive" } },
                  { wiseUserId: { contains: query, mode: "insensitive" } },
                ],
              }
            : undefined,
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
        });

  const getProviders = (accounts: { provider: string }[] = []) => getLoginProviderLabels(accounts);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <AdminNav />
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
                <p className="font-bold">{membershipTierLabels[user.membershipTier]}</p>
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
      </div>
    </main>
  );
}
