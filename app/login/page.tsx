import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, Globe2, ShieldCheck, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { LoginForm } from "@/app/login/login-form";
import { isDatabaseConfigured } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "登录 Wise Invest | Wise ID",
  description: "使用 Google、GitHub 或邮箱密码登录 Wise Invest，进入账户中心与 Wise VIP 服务。",
  robots: {
    index: false,
    follow: false,
  },
};

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
};

function getLoginErrorMessage(error: string) {
  if (error === "OAuthAccountNotLinked") {
    return {
      title: "这个邮箱已经注册过",
      message: "请使用你第一次注册 Wise ID 时的登录方式进入账户。后续可以在账户中心绑定其他登录方式。",
    };
  }

  if (error === "OAuthCallback" || error === "OAuthSignin") {
    return {
      title: "第三方登录没有完成",
      message: "请确认 OAuth 回调地址配置正确；如果是本地测试，也要确认代理和网络可以访问对应登录服务。",
    };
  }

  return {
    title: "登录没有完成",
    message: "请换一种登录方式重试。如果仍然失败，可以使用邮箱密码登录，或先进入注册页创建 Wise ID。",
  };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [{ callbackUrl, error }, session] = await Promise.all([searchParams, auth()]);
  const safeCallbackUrl = callbackUrl?.startsWith("/") ? callbackUrl : "/account";
  const loginError = error ? getLoginErrorMessage(error) : null;

  if (session?.user) {
    redirect(safeCallbackUrl);
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] overflow-hidden bg-[radial-gradient(circle_at_18%_20%,rgba(251,191,36,0.18),transparent_28%),linear-gradient(135deg,#f8fafc_0%,#ffffff_46%,#fff7ed_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_18%_20%,rgba(251,191,36,0.14),transparent_28%),linear-gradient(135deg,#020617_0%,#0f172a_58%,#111827_100%)] dark:text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-sm font-black text-amber-800 shadow-sm backdrop-blur dark:border-amber-800/40 dark:bg-white/10 dark:text-amber-200">
            <Sparkles className="h-4 w-4" />
            Wise ID
          </div>
          <div className="space-y-4">
            <h1 className="font-heading text-4xl font-black leading-tight text-slate-950 dark:text-white md:text-5xl">
              一个账户，即可享受 Wise 旗下所有产品。
            </h1>
            <p className="max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300 md:text-lg">
              Wise ID 会承接你的账户、VIP 身份、合作账户核验和未来跨产品权限。主站登录一次，后续服务都围绕同一个身份展开。
            </p>
          </div>

          <div className="rounded-3xl border border-white/80 bg-white/75 p-5 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:shadow-black/20">
            <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/50">
                <BadgeCheck className="mb-3 h-5 w-5 text-amber-500" />
                <p className="font-black text-slate-950 dark:text-white">统一身份</p>
                <p className="mt-2 leading-6">登录后生成稳定 Wise User ID。</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/50">
                <ShieldCheck className="mb-3 h-5 w-5 text-emerald-500" />
                <p className="font-black text-slate-950 dark:text-white">安全核验</p>
                <p className="mt-2 leading-6">只提交必要标识，不收集敏感凭据。</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/50">
                <Globe2 className="mb-3 h-5 w-5 text-blue-500" />
                <p className="font-black text-slate-950 dark:text-white">未来通行</p>
                <p className="mt-2 leading-6">为后续 Wise 产品和权限打底。</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">
            <span className="h-px w-10 bg-amber-300" />
            Account · VIP · SVIP · Future Products
            <ArrowRight className="h-4 w-4 text-amber-500" />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/90 dark:shadow-black/30 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">登录账户</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              已有账户可以使用 Google、GitHub 或邮箱密码登录。没有账户时，请先进入注册页创建 Wise ID。
            </p>
          </div>
          {loginError && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              <p className="font-black">{loginError.title}</p>
              <p className="mt-1">{loginError.message}</p>
            </div>
          )}
          <LoginForm
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
