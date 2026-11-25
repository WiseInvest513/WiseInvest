import { ArrowUpRight, Crown } from "lucide-react";
import type { ArticleVipReference } from "@/lib/article-vip-invitation";
import styles from "./article-vip-reference-prompt.module.css";

export function ArticleVipReferencePrompt({ references }: { references: readonly ArticleVipReference[] }) {
  const reference = references[0];
  if (!reference) return null;

  return <div className={styles.root} data-vip-reference-prompt>
    <a href="https://vip.wise-invest.org/join" className={styles.trigger} aria-label="查看申请方式">
      <span className={styles.emblem}><Crown size={27} strokeWidth={1.4} aria-hidden="true" /></span>
      <span className={styles.copy}>
        <span className={styles.triggerTitle}><span>{references.length === 1 ? `通过 ${reference.invitation.platform}，` : "通过这些合作平台，"}</span>{" "}<span>申请 Wise VIP</span></span>
        <span className={styles.summary}>社群交流、市场投研、专属工具。已有合作账户可以申请，核验通过后开通。</span>
      </span>
      <span className={styles.cta}><span>查看申请方式</span><ArrowUpRight size={19} aria-hidden="true" /></span>
    </a>
  </div>;
}
