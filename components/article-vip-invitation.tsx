import Link from "next/link";
import { ArrowRight, Crown } from "lucide-react";
import type { ArticleVipInvitation as Invitation } from "@/lib/article-vip-invitation";

export function ArticleVipInvitation({ invitation }: { invitation: Invitation }) {
  const isExchange = invitation.kind === "exchange";

  return (
    <section
      id="article-vip-invitation"
      aria-labelledby="article-vip-invitation-title"
      className="mt-8 rounded-2xl border border-amber-200 bg-white p-5 sm:p-7 dark:border-amber-900/70 dark:bg-slate-900"
    >
      <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-amber-700 dark:text-amber-400">
        <Crown aria-hidden="true" className="h-4 w-4" />
        下一站 · Wise VIP
      </p>
      <h2 id="article-vip-invitation-title" className="mt-3 text-xl font-bold leading-relaxed text-slate-900 dark:text-white">
        已经完成 {invitation.platform} {isExchange ? "注册" : "开户"}？
      </h2>
      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
        教程之后，还有社群交流、市场投研与专属工具。查看如何加入 Wise VIP，让投资多一份支持。
      </p>
      <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
        {isExchange
          ? "交易所账户需绑定 Wise 邀请关系、入金 100 U 并完成任意金额交易。"
          : "券商账户需通过 Wise 合作渠道开户，完成入金并激活账户。"}
        满足条件后提交账户资料，通过核验即可加入 VIP。
      </p>
      <div className="mt-5 border-t border-amber-100 pt-5 dark:border-amber-900/50">
        <Link
          href="/vip"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 sm:w-auto dark:focus-visible:ring-offset-slate-900"
        >
          查看如何加入 VIP
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
