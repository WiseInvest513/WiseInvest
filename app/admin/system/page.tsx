import type { Metadata } from "next";
import { CheckCircle2, CircleAlert, ServerCog } from "lucide-react";
import { AdminShell } from "@/app/admin/admin-shell";
import { requireAdminUser } from "@/lib/identity/current-user";
import { isDatabaseConfigured } from "@/lib/prisma";
import { isRedisRatelimitConfigured } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "系统检查 | Wise Invest",
  description: "Wise ID 与 Wise VIP 生产环境配置检查。",
  robots: {
    index: false,
    follow: false,
  },
};

function hasEnv(...names: string[]) {
  return names.some((name) => Boolean(process.env[name]));
}

export default async function AdminSystemPage() {
  await requireAdminUser();

  const checks = [
    {
      label: "Postgres 数据库",
      ok: isDatabaseConfigured(),
      detail: "需要 DATABASE_URL，用于 Wise ID、VIP 绑定和审计日志。",
    },
    {
      label: "Auth Secret",
      ok: hasEnv("AUTH_SECRET"),
      detail: "需要 AUTH_SECRET，生产环境必须使用稳定随机值。",
    },
    {
      label: "站点 Auth URL",
      ok: hasEnv("AUTH_URL"),
      detail: "建议线上配置为 https://wise-invest.org。",
    },
    {
      label: "Google OAuth",
      ok: hasEnv("AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID") && hasEnv("AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET"),
      detail: "用于 Google 登录，回调地址为 /api/auth/callback/google。",
    },
    {
      label: "GitHub OAuth",
      ok: hasEnv("AUTH_GITHUB_ID", "GITHUB_CLIENT_ID") && hasEnv("AUTH_GITHUB_SECRET", "GITHUB_CLIENT_SECRET"),
      detail: "用于 GitHub 登录，回调地址为 /api/auth/callback/github。",
    },
    {
      label: "Email OTP",
      ok: hasEnv("RESEND_API_KEY") && hasEnv("EMAIL_FROM"),
      detail: "用于邮箱注册验证码，建议完成发信域名验证后上线。",
    },
    {
      label: "Redis 限流",
      ok: isRedisRatelimitConfigured(),
      detail: "复用 Upstash Redis，对短链、VIP 提交和后台写操作限流。",
    },
    {
      label: "首批管理员",
      ok: hasEnv("WISE_ADMIN_EMAILS"),
      detail: "首个管理员邮箱必须在第一次登录前配置。",
    },
    {
      label: "Wise SSO Issuer",
      ok: hasEnv("WISE_SSO_ISSUER", "AUTH_URL", "NEXT_PUBLIC_SITE_URL"),
      detail: "用于对外声明 Wise 身份中心地址，线上建议为 https://wise-invest.org。",
    },
    {
      label: "Wise SSO 私钥",
      ok: hasEnv("WISE_SSO_PRIVATE_KEY"),
      detail: "用于签发跨站登录 token。生产环境必须配置 RS256 私钥。",
    },
  ];

  return (
    <AdminShell>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <ServerCog className="h-3.5 w-3.5" />
            System
          </div>
          <h1 className="font-heading text-3xl font-black md:text-4xl">系统检查</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
            只显示配置是否存在，不展示任何密钥内容。用于上线前检查 Wise ID / VIP 依赖是否齐全。
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {checks.map((check) => (
            <article key={check.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-3">
                {check.ok ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
                ) : (
                  <CircleAlert className="mt-0.5 h-5 w-5 text-amber-500" />
                )}
                <div>
                  <h2 className="font-black">{check.label}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{check.detail}</p>
                  <p className={`mt-2 text-xs font-black ${check.ok ? "text-emerald-600 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
                    {check.ok ? "已配置" : "未配置"}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>
    </AdminShell>
  );
}
