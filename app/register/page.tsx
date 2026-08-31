import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { RegisterForm } from "@/app/register/register-form";
import { isDatabaseConfigured } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "注册 Wise Invest | Wise ID",
  description: "创建 Wise ID，使用 Google、GitHub 或邮箱注册 Wise Invest 账户。",
  robots: {
    index: false,
    follow: false,
  },
};

type RegisterPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const [{ callbackUrl }, session] = await Promise.all([searchParams, auth()]);
  const safeCallbackUrl = callbackUrl?.startsWith("/") ? callbackUrl : "/account";

  if (session?.user) {
    redirect(safeCallbackUrl);
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] overflow-hidden bg-[radial-gradient(circle_at_80%_16%,rgba(251,191,36,0.2),transparent_28%),linear-gradient(135deg,#f8fafc_0%,#ffffff_45%,#fff7ed_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_80%_16%,rgba(251,191,36,0.15),transparent_28%),linear-gradient(135deg,#020617_0%,#0f172a_58%,#111827_100%)] dark:text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-sm font-black text-amber-800 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-white/10 dark:text-amber-200">
            <Sparkles className="h-4 w-4" />
            Create Wise ID
          </div>
          <div className="space-y-4">
            <h1 className="font-heading text-4xl font-black leading-tight text-slate-950 dark:text-white md:text-5xl">
              创建 Wise ID，把内容、记录和 VIP 权益放到同一个账户。
            </h1>
            <p className="max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300 md:text-lg">
              注册后默认成为普通用户，可以继续阅读完整内容、提交合作账户核验，并在未来 Wise 产品中复用同一身份。
            </p>
          </div>

          <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
              <BadgeCheck className="mb-3 h-5 w-5 text-amber-500" />
              <p className="font-black text-slate-950 dark:text-white">完整阅读</p>
              <p className="mt-2 leading-6">登录后回到原文继续看。</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
              <ShieldCheck className="mb-3 h-5 w-5 text-emerald-500" />
              <p className="font-black text-slate-950 dark:text-white">VIP 核验</p>
              <p className="mt-2 leading-6">提交合作账户后人工审核。</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
              <LockKeyhole className="mb-3 h-5 w-5 text-blue-500" />
              <p className="font-black text-slate-950 dark:text-white">安全账户</p>
              <p className="mt-2 leading-6">密码哈希保存，不存明文。</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">
            <span className="h-px w-10 bg-amber-300" />
            Register · Verify · Password · Wise ID
            <ArrowRight className="h-4 w-4 text-amber-500" />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/90 dark:shadow-black/30 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">注册账户</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              选择一种方式创建 Wise ID。邮箱验证码注册需要先确认邮箱可用，再设置登录密码。
            </p>
          </div>
          <RegisterForm
            callbackUrl={safeCallbackUrl}
            databaseConfigured={isDatabaseConfigured()}
            googleEnabled={Boolean(process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID)}
            githubEnabled={Boolean(process.env.AUTH_GITHUB_ID ?? process.env.GITHUB_CLIENT_ID)}
          />
        </section>
      </div>
    </main>
  );
}
