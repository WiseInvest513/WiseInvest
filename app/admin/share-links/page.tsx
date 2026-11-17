import type { Metadata } from "next";
import { AdminShell } from "@/app/admin/admin-shell";
import { ShareLinksForm } from "@/app/admin/share-links/share-links-form";
import { getAllArticles, getArticleRoute } from "@/lib/articles";
import { requireAdminStaffUser } from "@/lib/identity/current-user";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "分享链接 | Wise Invest",
  description: "按渠道生成带来源参数的官网和文章分享链接。",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminShareLinksPage() {
  const adminUser = await requireAdminStaffUser();
  const articles = getAllArticles()
    .map((article) => ({
      title: article.title,
      path: getArticleRoute(article),
    }))
    .sort((left, right) => left.title.localeCompare(right.title, "zh-CN"));

  return (
    <AdminShell role={adminUser.role}>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
        <h1 className="font-heading text-3xl font-black md:text-4xl">分享链接</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">
          对外分享官网或文章时，先选渠道再复制完整链接。访问者第一次点进来后，若完成注册，后台会把该用户记为对应来源。同一篇内容只需更换链接后缀，不用复制多份正文。
        </p>
      </section>
      <ShareLinksForm articles={articles} />
    </AdminShell>
  );
}
