import { ArrowUpRight, Crown } from "lucide-react";
import styles from "./vip-discovery-card.module.css";

type VipDiscoveryCardProps = {
  context?: "learning" | "products" | "broker";
  compact?: boolean;
  variant?: "inline" | "panel" | "rail";
  className?: string;
};

export function VipDiscoveryCard({ context = "learning", compact = false, variant = "inline", className }: VipDiscoveryCardProps) {
  const expanded = variant !== "inline";
  const title = context === "broker"
    ? "通过券商开户，申请成为 VIP"
    : context === "products"
      ? "注册使用产品，申请成为 VIP"
      : "成为 VIP，一起持续学习";

  return (
    <a
      href="https://vip.wise-invest.org/join"
      target="_blank"
      rel="noopener noreferrer"
      className={[styles.card, styles[variant], compact ? styles.compact : "", className].filter(Boolean).join(" ")}
      data-vip-discovery={context}
      data-vip-variant={variant}
      aria-label={`${title}，了解权益与加入方式（新窗口打开）`}
    >
      <span className={styles.heading}>
        <span className={styles.icon}><Crown size={20} strokeWidth={1.6} aria-hidden="true" /></span>
        <span className={styles.copy}>
          <strong className={styles.title}>{variant === "rail" && context !== "learning" ? <>{context === "broker" ? "通过券商开户" : "注册使用产品"}<br />申请成为 VIP</> : title}</strong>
          {!expanded && <span className={styles.description}>{compact ? "学习群聊 · 定期分享 · 专属工具" : "学习群聊、定期分享与会员专属工具"}</span>}
        </span>
        {!expanded && <ArrowUpRight className={styles.arrow} size={17} strokeWidth={1.6} aria-hidden="true" />}
      </span>
      {expanded && <>
        <span className={styles.benefits}>
          <span><strong>一起交流</strong><span>学习群聊，每日 / 每周内容与点位分享</span></span>
          <span><strong>深入学习</strong><span>美股、加密、ETF 等主题内容与工具</span></span>
          {variant === "rail" && <span><strong>全站通用</strong><span>主站升级，同步解锁各分站 VIP 区域</span></span>}
        </span>
        {variant === "rail" && <span className={styles.requirements}>通过本站合作渠道完成对应注册、入金等条件，在个人后台联系核验后开通。</span>}
        <span className={styles.footer}><span>了解权益与加入方式</span><ArrowUpRight size={15} strokeWidth={1.7} aria-hidden="true" /></span>
      </>}
    </a>
  );
}
