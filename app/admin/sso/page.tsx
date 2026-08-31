import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { AdminShell } from "@/app/admin/admin-shell";
import { SsoClientForm } from "@/app/admin/sso/sso-client-form";
import { requireAdminUser } from "@/lib/identity/current-user";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { getSsoIssuer } from "@/lib/sso/crypto";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SSO 客户端 | Wise Invest",
  description: "Wise ID 外部网站登录接入配置。",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminSsoPage() {
  await requireAdminUser();
  const clients = isDatabaseConfigured()
    ? await getPrisma().ssoClient.findMany({
        orderBy: [{ enabled: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          clientId: true,
          name: true,
          allowedRedirectUris: true,
          allowedScopes: true,
          requirePkce: true,
          enabled: true,
          updatedAt: true,
        },
      })
    : [];
  const issuer = getSsoIssuer();

  return (
    <AdminShell>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <KeyRound className="h-3.5 w-3.5" />
            Wise SSO
          </div>
          <h1 className="font-heading text-3xl font-black md:text-4xl">SSO 客户端</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
            给 wise-etf.com 或其他 Wise 产品创建登录客户端。其他网站通过标准授权码流程接入 Wise ID。
          </p>
          <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-black uppercase text-slate-400">Issuer</p>
              <code className="mt-2 block break-all text-sm font-bold text-slate-900 dark:text-slate-100">{issuer}</code>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-black uppercase text-slate-400">Discovery</p>
              <code className="mt-2 block break-all text-sm font-bold text-slate-900 dark:text-slate-100">
                {issuer}/.well-known/openid-configuration
              </code>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <SsoClientForm />
          {clients.map((client) => (
            <SsoClientForm
              key={client.id}
              client={{
                id: client.id,
                clientId: client.clientId,
                name: client.name,
                allowedRedirectUris: client.allowedRedirectUris.join("\n"),
                allowedScopes: client.allowedScopes,
                enabled: client.enabled,
                requirePkce: client.requirePkce,
              }}
            />
          ))}
        </section>
    </AdminShell>
  );
}
