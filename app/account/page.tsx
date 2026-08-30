import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bookmark,
  Circle,
  CircleCheck,
  Crown,
  Settings,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { SignOutButton } from "@/app/account/sign-out-button";
import { Button } from "@/components/ui/button";
import { requireWiseUser } from "@/lib/identity/current-user";
import {
  getNextTier,
  getPartnerAccountStatusLabel,
  getPublicTierLabel,
  getTierIndex,
  maskIdentifier,
  membershipJourneyCopy,
  type PublicMembershipTier,
} from "@/lib/vip/display";
import { partnerTypeLabels } from "@/lib/vip/status";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "账户中心 | Wise Invest",
  description: "查看 Wise 会员等级、升级路径、合作账户和当前权益。",
  robots: {
    index: false,
    follow: false,
  },
};

function getHeroCopy(tier: string, verifiedCount: number) {
  if (tier === "VIP_PLUS") {
    return {
      eyebrow: "Wise SVIP 已激活",
      title: "你已经达到 Wise SVIP 等级。",
      body: "高级会员状态已记录到你的 Wise ID，后续产品权限会继续围绕同一个账户发放。",
      primaryHref: "/account/vip",
      primaryLabel: "查看我的权益",
    };
  }

  if (tier === "VIP") {
    return {
      eyebrow: "Wise VIP 已激活",
      title: "Wise VIP 已激活",
      body: `你已通过符合条件的合作账户完成资格验证，当前可以使用 Wise VIP 权益。已验证合作账户：${verifiedCount} 个。`,
      primaryHref: "/account/vip",
      primaryLabel: "查看我的权益",
    };
  }

  return {
    eyebrow: "当前等级 普通用户",
    title: "完成合作账户验证，即可升级 Wise VIP。",
    body: "完成任意一个符合条件的 Wise 合作账户绑定并通过验证，即可升级 Wise VIP。",
    primaryHref: "/account/vip",
    primaryLabel: "去升级 VIP",
  };
}

function getDisplayName(user: { name: string | null; email: string | null; wiseUserId: string }) {
  const name = user.name?.trim();
  if (name) return name;

  const emailName = user.email?.split("@")[0]?.trim();
  if (emailName) return emailName;

  return user.wiseUserId;
}

function getAccountStatusTone(status: string) {
  if (status === "VERIFIED") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300";
  if (status === "REJECTED") return "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300";
  if (status === "NEEDS_REVIEW") return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-200";
  return "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200";
}

function formatContentTime(value: Date | string | null) {
  if (!value) return "刚刚";
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });
}

async function getUserContentLibrary(userId: string) {
  if (!isDatabaseConfigured()) return { favorites: [], recent: [] };

  const prisma = getPrisma();
  const [favorites, recent] = await Promise.all([
    prisma.userContentItem.findMany({
      where: {
        userId,
        favoritedAt: { not: null },
      },
      orderBy: { favoritedAt: "desc" },
      take: 4,
      select: {
        id: true,
        href: true,
        title: true,
        summary: true,
        favoritedAt: true,
        lastViewedAt: true,
        viewCount: true,
      },
    }),
    prisma.userContentItem.findMany({
      where: {
        userId,
        lastViewedAt: { not: null },
      },
      orderBy: { lastViewedAt: "desc" },
      take: 4,
      select: {
        id: true,
        href: true,
        title: true,
        summary: true,
        favoritedAt: true,
        lastViewedAt: true,
        viewCount: true,
      },
    }),
  ]);

  return { favorites, recent };
}

function ContentLibraryColumn({
  title,
  icon,
  empty,
  items,
}: {
  title: string;
  icon: "book" | "bookmark";
  empty: string;
  items: Awaited<ReturnType<typeof getUserContentLibrary>>["recent"];
}) {
  const Icon = icon === "book" ? BookOpen : Bookmark;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-amber-500" />
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-amber-200 hover:bg-amber-50/60 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-amber-900/60 dark:hover:bg-amber-950/15"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="line-clamp-2 text-sm font-black leading-6 text-slate-900 group-hover:text-amber-700 dark:text-slate-100 dark:group-hover:text-amber-300">
                  {item.title}
                </p>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-amber-500" />
              </div>
              {item.summary ? (
                <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
                  {item.summary}
                </p>
              ) : null}
              <p className="mt-3 text-[11px] font-bold text-slate-400">
                {item.lastViewedAt ? `最近阅读 ${formatContentTime(item.lastViewedAt)}` : `收藏于 ${formatContentTime(item.favoritedAt)}`}
                {item.viewCount > 0 ? ` · ${item.viewCount} 次` : ""}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm font-semibold leading-7 text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {empty}
        </div>
      )}
    </div>
  );
}

export default async function AccountPage() {
  const user = await requireWiseUser();
  const displayName = getDisplayName(user);
  const currentTier = user.membershipTier as PublicMembershipTier;
  const currentTierIndex = getTierIndex(currentTier);
  const nextTier = getNextTier(currentTier);
  const verifiedAccounts = user.partnerAccounts.filter((account) => account.status === "VERIFIED");
  const hero = getHeroCopy(currentTier, verifiedAccounts.length);
  const contentLibrary = await getUserContentLibrary(user.id);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              <Crown className="h-3.5 w-3.5" />
              {hero.eyebrow}
            </div>
            <h1 className="font-heading text-3xl font-black leading-tight md:text-4xl">{hero.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">{hero.body}</p>
            <div className="mt-4 flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                {user.image ? (
                  <img
                    src={user.image}
                    alt="账户头像"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Crown className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">你好，{displayName}</p>
                <p className="truncate text-xs text-slate-400">{user.email ?? "未绑定邮箱"}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button asChild className="h-12 rounded-xl bg-slate-950 px-5 text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
              <Link href={hero.primaryHref}>
                {hero.primaryLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-xl border-slate-200 bg-white px-5 dark:border-slate-700 dark:bg-slate-900">
              <Link href="/account/settings">
                <Settings className="mr-2 h-4 w-4" />
                账户设置
              </Link>
            </Button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <h2 className="text-2xl font-black">会员升级路径</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            你现在是 {getPublicTierLabel(currentTier)}
            {nextTier ? `，下一等级是 ${getPublicTierLabel(nextTier)}。` : "，已经处于当前最高公开等级。"}
          </p>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {(["MEMBER", "VIP", "VIP_PLUS"] as PublicMembershipTier[]).map((tier, index) => {
              const isDone = index < currentTierIndex;
              const isCurrent = tier === currentTier;
              const Icon = isDone || isCurrent ? CircleCheck : Circle;
              return (
                <div
                  key={tier}
                  className={`rounded-2xl border p-5 ${
                    isCurrent
                      ? "border-amber-300 bg-amber-50/70 dark:border-amber-800/60 dark:bg-amber-950/25"
                      : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
                  }`}
                >
                  <Icon className={`mb-4 h-5 w-5 ${isDone || isCurrent ? "text-amber-500" : "text-slate-300 dark:text-slate-600"}`} />
                  <p className="font-black">{membershipJourneyCopy[tier].label}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">{membershipJourneyCopy[tier].short}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{membershipJourneyCopy[tier].description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">我的合作账户</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">账户标识默认隐藏，审核状态会在这里同步。</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {user.partnerAccounts.length > 0 ? (
              user.partnerAccounts.map((account) => {
                const Icon =
                  account.status === "VERIFIED"
                    ? CircleCheck
                    : account.status === "REJECTED"
                      ? XCircle
                      : account.status === "NEEDS_REVIEW"
                        ? AlertTriangle
                        : Circle;
                return (
                  <div key={account.id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-800 md:grid-cols-[1fr_auto_auto] md:items-center">
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                      <div>
                        <p className="font-black">{account.partner.name}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">{partnerTypeLabels[account.partner.type]}</p>
                        {account.reviewNote && (
                          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                            审核说明：{account.reviewNote}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="font-mono font-bold text-slate-500 dark:text-slate-400">{maskIdentifier(account.externalIdentifier)}</p>
                      <details className="text-xs text-slate-500 dark:text-slate-400">
                        <summary className="cursor-pointer font-bold text-amber-700 dark:text-amber-300">查看详情</summary>
                        <p className="mt-2 break-all font-mono">{account.externalIdentifier}</p>
                      </details>
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${getAccountStatusTone(account.status)}`}>
                      {getPartnerAccountStatusLabel(account.status)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm leading-7 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                当前还没有绑定记录。需要提交合作账户核验时，请进入 VIP 中心处理。
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8 lg:grid-cols-2">
          <ContentLibraryColumn
            title="继续阅读"
            icon="book"
            empty="还没有最近阅读记录。打开一篇完整文章后，这里会自动记录。"
            items={contentLibrary.recent}
          />
          <ContentLibraryColumn
            title="我的收藏"
            icon="bookmark"
            empty="还没有收藏内容。阅读文章时点击收藏，之后可以从这里快速回来。"
            items={contentLibrary.favorites}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Link
            href="/account/settings"
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-900/60"
          >
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-slate-400" />
              <div>
                <p className="font-black">账户设置</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">查看 Wise ID、邮箱和安全信息。</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
          {user.role === "ADMIN" ? (
            <Link
              href="/admin"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-900/60"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-black">管理后台</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">处理用户核验和合作方配置。</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          ) : null}
        </section>

        <div className="flex justify-end">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
