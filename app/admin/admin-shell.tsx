import type { ReactNode } from "react";
import { AdminNav } from "@/app/admin/admin-nav";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.10),transparent_32rem),linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#f8fafc_100%)] px-4 py-8 text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.08),transparent_30rem),linear-gradient(180deg,#020617_0%,#0f172a_100%)] dark:text-white lg:px-6 lg:py-10">
      <div className="mx-auto grid w-full max-w-[1480px] gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          <AdminNav />
        </aside>
        <div className="min-w-0 space-y-6">{children}</div>
      </div>
    </main>
  );
}
