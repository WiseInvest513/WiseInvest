import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { AdminNav } from "@/app/admin/admin-nav";
import { DcaEntryHelper } from "@/app/admin/dca/dca-entry-helper";
import { requireAdminUser } from "@/lib/identity/current-user";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DCA 数据维护 | Wise Invest",
  description: "维护 Wise Invest 定投实盘数据。",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDcaPage() {
  await requireAdminUser();

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <AdminNav />

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <BarChart3 className="h-3.5 w-3.5" />
            Admin
          </div>
          <h1 className="font-heading text-3xl font-black md:text-4xl">DCA 数据维护</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">
            这页先用于降低每周手动更新错误率。后续如果要做完全后台化，再把 DCA 历史记录迁移到数据库并由页面动态读取。
          </p>
        </section>

        <DcaEntryHelper />
      </div>
    </main>
  );
}
