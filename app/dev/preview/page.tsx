import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { PreviewRoleSwitcher } from "@/app/dev/preview/preview-role-switcher";
import { isDevPreviewEnabled } from "@/lib/identity/dev-preview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "本地身份调试 | Wise Invest",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DevPreviewPage() {
  if (!isDevPreviewEnabled()) notFound();

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-12 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <FlaskConical className="h-3.5 w-3.5" />
            Local Only
          </div>
          <h1 className="mt-4 font-heading text-3xl font-black md:text-4xl">选择本地调试身份</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
            三个入口使用本地 mock 数据，不会修改真实用户、会员等级或后台记录。切换身份时会自动清理当前登录会话。
          </p>
        </header>

        <PreviewRoleSwitcher />
      </div>
    </main>
  );
}
