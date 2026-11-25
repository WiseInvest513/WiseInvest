"use client";

import { useId } from "react";
import { ArrowRight, ArrowUpRight, Crown, MessagesSquare, ChartNoAxesCombined, PanelsTopLeft } from "lucide-react";
import { getArticleVipApplyHref, type ArticleVipInvitation as Invitation } from "@/lib/article-vip-invitation";
import styles from "./article-vip-invitation.module.css";

const benefits = [
  { icon: MessagesSquare, title: "社群交流", detail: "美股与加密，持续讨论与复盘" },
  { icon: ChartNoAxesCombined, title: "市场投研", detail: "关注重点公司、事件与市场机会" },
  { icon: PanelsTopLeft, title: "专属工具", detail: "用研究与点位工具辅助判断" },
];

export function ArticleVipInvitation({ invitation }: { invitation?: Invitation | null }) {
  const titleId = useId();
  return (
    <aside id="article-vip-invitation" aria-labelledby={titleId} className={styles.card} data-article-vip-invitation>
      <div className={styles.copy}>
        <h3 id={titleId} className={styles.title}>
          <Crown size={26} strokeWidth={1.5} aria-hidden="true" />
          <span>{invitation ? `${invitation.kind === "exchange" ? `已注册 ${invitation.platform}` : `已在${invitation.platform}开户`}？申请 Wise VIP` : "加入 Wise VIP，一起交流与研究"}</span>
        </h3>
        <p className={styles.intro}>加入之后，从阅读教程到一起讨论，让研究多一份支持。</p>
        <ul className={styles.benefits} aria-label="VIP 权益">
          {benefits.map(({ icon: Icon, title, detail }) => <li key={title}>
            <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
            <span><strong>{title}</strong><span>{detail}</span></span>
          </li>)}
        </ul>
        <p className={styles.note}>{invitation?.kind === "broker" ? "提交证券账户资料，核验开户渠道与申请资格，通过后开通。" : invitation ? "提交账户 UID，核验邀请关系与申请资格，通过后开通。" : "提交合作账户资料，核验邀请关系与申请资格，通过后开通。"}</p>
      </div>
      <div className={styles.actions}>
        <a href={getArticleVipApplyHref(invitation)} className={styles.primary}>成为 VIP<ArrowRight size={18} aria-hidden="true" /></a>
        <a href="/vip" target="_blank" rel="noopener noreferrer" className={styles.secondary}>了解 VIP 权益<ArrowUpRight size={15} aria-hidden="true" /></a>
      </div>
    </aside>
  );
}
