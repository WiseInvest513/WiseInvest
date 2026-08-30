import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Github, IdCard, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { PasswordSettingsForm } from "@/app/account/settings/password-settings-form";
import { ProfileSettingsForm } from "@/app/account/settings/profile-settings-form";
import { SignOutButton } from "@/app/account/sign-out-button";
import { Button } from "@/components/ui/button";
import { requireWiseUser } from "@/lib/identity/current-user";
import { getPrisma } from "@/lib/prisma";
import { getPublicTierLabel } from "@/lib/vip/display";
import { getLoginProviderLabel } from "@/lib/auth/provider-display";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "账户设置 | Wise Invest",
  description: "查看 Wise ID、登录邮箱和账户安全信息。",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccountSettingsPage() {
  const user = await requireWiseUser();
  const passwordUser = user.id.startsWith("dev_")
    ? null
    : await getPrisma().user.findUnique({
        where: { id: user.id },
        select: {
          passwordHash: true,
        },
      });
  const linkedProviders = new Set(user.accounts?.map((account) => account.provider) ?? []);
  if (passwordUser?.passwordHash || linkedProviders.has("password")) linkedProviders.add("password");

  const accountRows = [
    {
      label: "昵称",
      value: user.name ?? "未命名用户",
      icon: UserRound,
    },
    {
      label: "Email",
      value: user.email ?? "未绑定邮箱",
      icon: Mail,
    },
    {
      label: "Wise ID",
      value: user.wiseUserId,
      icon: IdCard,
    },
    {
      label: "当前会员",
      value: getPublicTierLabel(user.membershipTier),
      icon: ShieldCheck,
    },
  ];

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        <Button asChild variant="outline" className="h-10 rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <Link href="/account">
            <ArrowLeft className="mr-2 h-4 w-4" />
            账户中心
          </Link>
        </Button>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            <LockKeyhole className="h-3.5 w-3.5" />
            Account Settings
          </div>
          <h1 className="font-heading text-3xl font-black md:text-4xl">账户设置</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
            这里保留身份、安全和登录方式信息。会员权益和合作账户状态请回到账户中心查看。
          </p>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {accountRows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="grid gap-2 border-b border-slate-100 px-5 py-5 last:border-0 dark:border-slate-800 md:grid-cols-[180px_1fr] md:items-center">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                  <Icon className="h-4 w-4" />
                  {row.label}
                </div>
                <p className="break-all font-mono text-sm font-black text-slate-900 dark:text-slate-100">{row.value}</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <ProfileSettingsForm name={user.name} email={user.email} image={user.image} />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-black">登录方式</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { provider: "password", label: "邮箱密码", icon: Mail },
              { provider: "google", label: "Google", icon: ShieldCheck },
              { provider: "github", label: "GitHub", icon: Github },
            ].map((item) => {
              const Icon = item.icon;
              const linked = linkedProviders.has(item.provider);
              return (
                <div
                  key={item.provider}
                  className={`rounded-2xl border p-4 ${
                    linked
                      ? "border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20"
                      : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
                  }`}
                >
                  <Icon className={`mb-3 h-5 w-5 ${linked ? "text-amber-600 dark:text-amber-300" : "text-slate-400"}`} />
                  <p className="font-black">{getLoginProviderLabel(item.provider)}</p>
                  <p className={`mt-1 text-sm font-semibold ${linked ? "text-amber-700 dark:text-amber-300" : "text-slate-500 dark:text-slate-400"}`}>
                    {linked ? "已绑定" : "未绑定"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <PasswordSettingsForm hasPassword={Boolean(passwordUser?.passwordHash)} />
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black">账户安全</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Wise 不会要求你提交券商密码、交易所密码、私钥、助记词或 2FA 密钥。
            </p>
          </div>
          <SignOutButton />
        </section>
      </div>
    </main>
  );
}
