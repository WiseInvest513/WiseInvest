import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRight, KeyRound, MailCheck, ShieldCheck, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { ResetPasswordForm } from "@/app/reset-password/reset-password-form";
import { isDatabaseConfigured } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "重设密码 | Wise Invest",
  description: "通过邮箱验证码重设 Wise Invest 账户密码。",
  robots: {
    index: false,
    follow: false,
  },
};

type ResetPasswordPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const [{ callbackUrl }, session] = await Promise.all([searchParams, auth()]);
  const safeCallbackUrl = callbackUrl?.startsWith("/") ? callbackUrl : "/account";

  if (session?.user) {
    redirect("/account/settings");
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] overflow-hidden bg-[radial-gradient(circle_at_78%_18%,rgba(20,184,166,0.15),transparent_28%),linear-gradient(135deg,#f8fafc_0%,#ffffff_48%,#fff7ed_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_78%_18%,rgba(20,184,166,0.12),transparent_28%),linear-gradient(135deg,#020617_0%,#0f172a_58%,#111827_100%)] dark:text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-sm font-black text-amber-800 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-white/10 dark:text-amber-200">
            <Sparkles className="h-4 w-4" />
            Wise ID Security
          </div>
          <div className="space-y-4">
            <h1 className="font-heading text-4xl font-black leading-tight text-slate-950 dark:text-white md:text-5xl">
              用邮箱验证码，安全重设你的登录密码。
            </h1>
            <p className="max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300 md:text-lg">
              验证码只会发送到你的注册邮箱。通过验证后，可以设置新的邮箱登录密码并重新进入账户。
            </p>
          </div>

          <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
              <MailCheck className="mb-3 h-5 w-5 text-amber-500" />
              <p className="font-black text-slate-950 dark:text-white">邮箱验证</p>
              <p className="mt-2 leading-6">先确认邮箱归属，再允许重设密码。</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
              <KeyRound className="mb-3 h-5 w-5 text-emerald-500" />
              <p className="font-black text-slate-950 dark:text-white">密码规则</p>
              <p className="mt-2 leading-6">新密码需要包含大小写字母和数字。</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
              <ShieldCheck className="mb-3 h-5 w-5 text-blue-500" />
              <p className="font-black text-slate-950 dark:text-white">敏感隔离</p>
              <p className="mt-2 leading-6">不会索要任何交易账户密码或私钥。</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">
            <span className="h-px w-10 bg-amber-300" />
            Email · Code · New Password · Login
            <ArrowRight className="h-4 w-4 text-amber-500" />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/90 dark:shadow-black/30 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">重设密码</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              输入注册邮箱并接收验证码，然后设置新的邮箱登录密码。
            </p>
          </div>
          <ResetPasswordForm callbackUrl={safeCallbackUrl} databaseConfigured={isDatabaseConfigured()} />
        </section>
      </div>
    </main>
  );
}
