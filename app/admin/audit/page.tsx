import type { Metadata } from "next";
import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdminUser } from "@/lib/identity/current-user";
import { devPreviewAuditLogs } from "@/lib/identity/dev-preview-data";
import { isDevPreviewAdminSession } from "@/lib/identity/dev-preview-server";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "审计日志 | Wise Invest",
  description: "Wise Invest 管理操作审计日志。",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminAuditPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function AdminAuditPage({ searchParams }: AdminAuditPageProps) {
  await requireAdminUser();
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const isMockAdmin = await isDevPreviewAdminSession();
  const logs =
    isMockAdmin && !isDatabaseConfigured()
      ? devPreviewAuditLogs.filter((log) => {
          if (!query) return true;
          const normalizedQuery = query.toLowerCase();
          return [
            log.action,
            log.actorUser?.email,
            log.actorUser?.wiseUserId,
            log.targetUser?.email,
            log.targetUser?.wiseUserId,
          ].some((value) => value?.toLowerCase().includes(normalizedQuery));
        })
      : await getPrisma().auditLog.findMany({
          where: query
            ? {
                OR: [
                  { actorUser: { email: { contains: query, mode: "insensitive" } } },
                  { actorUser: { wiseUserId: { contains: query, mode: "insensitive" } } },
                  { targetUser: { email: { contains: query, mode: "insensitive" } } },
                  { targetUser: { wiseUserId: { contains: query, mode: "insensitive" } } },
                ],
              }
            : undefined,
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
            targetUser: {
              select: {
                email: true,
                wiseUserId: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 100,
        });

  return (
    <AdminShell>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <h1 className="font-heading text-3xl font-black md:text-4xl">审计日志</h1>
          <form className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              name="q"
              defaultValue={query}
              placeholder="搜索操作人或目标用户"
              className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950"
            />
            <button className="h-12 rounded-xl bg-slate-950 px-5 text-sm font-black text-amber-300 dark:bg-white dark:text-slate-950">
              搜索
            </button>
          </form>
        </section>

        <section className="space-y-3">
          {logs.map((log) => (
            <article key={log.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-sm font-black">{log.action}</p>
                <time className="text-xs text-slate-400">{log.createdAt.toISOString()}</time>
              </div>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <p className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-950">
                  操作人：{log.actorUser?.email ?? log.actorUser?.wiseUserId ?? "System"}
                </p>
                <p className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-950">
                  目标用户：{log.targetUser?.email ?? log.targetUser?.wiseUserId ?? "无"}
                </p>
              </div>
              {log.metadata && (
                <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              )}
            </article>
          ))}
          {logs.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              暂无审计记录。
            </p>
          )}
        </section>
    </AdminShell>
  );
}
