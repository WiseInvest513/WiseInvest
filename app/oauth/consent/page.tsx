import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BadgeCheck, Check, ExternalLink, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { isRedirectUriAllowed, normalizeScopes, validateRequestedScopes } from "@/lib/sso/oauth";
import { membershipTierLabels } from "@/lib/vip/status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "授权 Wise ETF | Wise ID",
  description: "确认是否允许 Wise ETF 读取你的 Wise ID 基本资料与会员等级。",
  robots: { index: false, follow: false },
};

type ConsentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const scopeCopy: Record<string, { title: string; description: string }> = {
  openid: { title: "Wise ID", description: "确认这是你的统一 Wise 账户。" },
  profile: { title: "基本资料", description: "向 Wise ETF 提供昵称与头像。" },
  email: { title: "邮箱", description: "用于识别账户和展示个人资料。" },
  "wise.membership": { title: "会员等级", description: "确认你是普通用户、Wise VIP 或 Wise SVIP。" },
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function InvalidConsentRequest() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-white/10 dark:bg-slate-900">
        <LockKeyhole className="mx-auto h-10 w-10 text-rose-500" />
        <h1 className="mt-5 text-2xl font-black">授权请求无效</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">请返回 Wise ETF 重新发起登录，不要继续使用当前链接。</p>
        <a className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white dark:bg-white dark:text-slate-950" href="https://www.wise-etf.com/">
          返回 Wise ETF
        </a>
      </section>
    </main>
  );
}

export default async function ConsentPage({ searchParams }: ConsentPageProps) {
  const [params, session] = await Promise.all([searchParams, auth()]);
  const clientId = first(params.client_id);
  const redirectUri = first(params.redirect_uri);
  const responseType = first(params.response_type);
  const codeChallenge = first(params.code_challenge);
  const codeChallengeMethod = first(params.code_challenge_method);
  const requestedScopes = normalizeScopes(first(params.scope));
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value) query.append(key, value);
  });

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/oauth/authorize?${query.toString()}`)}`);
  }

  const [client, user] = await Promise.all([
    getPrisma().ssoClient.findUnique({
      where: { clientId },
      select: { name: true, enabled: true, allowedRedirectUris: true, allowedScopes: true, requirePkce: true },
    }),
    getPrisma().user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, membershipTier: true },
    }),
  ]);

  if (
    !client
    || !client.enabled
    || !user
    || responseType !== "code"
    || !isRedirectUriAllowed(client, redirectUri)
    || validateRequestedScopes(requestedScopes, client.allowedScopes)
    || (client.requirePkce && (!codeChallenge || codeChallengeMethod !== "S256"))
  ) {
    return <InvalidConsentRequest />;
  }

  const membershipLabel = membershipTierLabels[user.membershipTier];
  const membershipClass = user.membershipTier === "MEMBER"
    ? "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
    : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_16%_16%,rgba(59,130,246,0.14),transparent_30%),radial-gradient(circle_at_84%_80%,rgba(251,191,36,0.16),transparent_30%),#f8fafc] px-4 py-10 text-slate-950 dark:bg-[radial-gradient(circle_at_16%_16%,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_84%_80%,rgba(251,191,36,0.1),transparent_30%),#020617] dark:text-white md:py-16">
      <section className="mx-auto w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 shadow-2xl shadow-slate-300/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/95 dark:shadow-black/30">
        <div className="border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-7 text-white md:px-9">
          <div className="flex items-center gap-3 text-sm font-black tracking-wide">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><ShieldCheck className="h-5 w-5" /></span>
            Wise ID 安全授权
          </div>
          <h1 className="mt-6 text-2xl font-black md:text-3xl">是否允许 {client.name} 登录？</h1>
          <p className="mt-3 text-sm leading-7 text-blue-100">确认后，Wise ID 才会把以下账户资料提供给 {client.name}。</p>
        </div>

        <div className="space-y-7 p-6 md:p-9">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-400">当前授权账户</p>
              <p className="mt-1 truncate font-black">{user.name || user.email}</p>
              <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
            <span className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-black ${membershipClass}`}>
              {membershipLabel}
            </span>
          </div>

          <div>
            <h2 className="text-sm font-black">{client.name} 将获得</h2>
            <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 px-4 dark:divide-white/10 dark:border-white/10">
              {requestedScopes.map((scope) => {
                const item = scopeCopy[scope] ?? { title: scope, description: "用于完成本次 Wise ID 授权。" };
                return (
                  <div className="flex gap-3 py-4" key={scope}>
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"><Check className="h-4 w-4" /></span>
                    <div><p className="text-sm font-black">{item.title}</p><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p></div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-6 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100">
            <div className="flex gap-2"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" /><p><strong>会员状态由 Wise ID 实时确认。</strong> {client.name} 会收到当前会员等级，并据此提供普通用户、VIP 或 SVIP 对应功能。</p></div>
          </div>

          <form action="/oauth/authorize" method="post">
            {Object.entries(params).flatMap(([key, value]) => {
              const values = Array.isArray(value) ? value : value ? [value] : [];
              return values.map((item, index) => <input key={`${key}-${index}`} name={key} type="hidden" value={item} />);
            })}
            <div className="grid gap-3 sm:grid-cols-2">
              <button className="order-2 rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-black text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 sm:order-1" name="decision" type="submit" value="deny">
                取消
              </button>
              <button className="order-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 sm:order-2" name="decision" type="submit" value="approve">
                同意授权并继续 <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="flex items-start gap-2 text-[11px] leading-5 text-slate-400">
            <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>Wise ETF 不会看到你在 Wise Invest 使用的 Google、GitHub 或邮箱密码，也不能代替你修改主站账户。</p>
          </div>
        </div>
      </section>
    </main>
  );
}
