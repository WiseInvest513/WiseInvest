"use client";

import { useState } from "react";
import styles from "./preview.module.css";
import { ArticleVipInvitation } from "@/components/article-vip-invitation";
import { ArticleVipReferencePrompt } from "@/components/article-vip-reference-prompt";

const platforms = [
  { name: "Bitget", kind: "exchange", href: "/articles/crypto/k3RVVcw4" },
  { name: "OKX", kind: "exchange", href: "/articles/crypto/mAPQm7WZ" },
  { name: "BBAE", kind: "broker", href: "/articles/broker/I0AIBXus" },
  { name: "银河证券", kind: "broker", href: "/articles/domestic/o0RA5e1p" },
] as const;

export function VipInvitationPreview() {
  const [variant, setVariant] = useState<"inline" | "popover">("inline");
  const [platformName, setPlatformName] = useState<string>("Bitget");
  const platform = platforms.find(item => item.name === platformName) ?? platforms[0];
  const isExchange = platform.kind === "exchange";
  return <main className={styles.page}>
    <header className={styles.previewHeader}>
      <div><h1>VIP 引导样式预览</h1><p>切换两种样式，看看它们放进文章后的实际大小和阅读感受。</p></div>
      <div className={styles.controls}>
        <div className={styles.variants} role="group" aria-label="预览样式">
          <button type="button" aria-pressed={variant === "inline"} onClick={() => setVariant("inline")}>A · 完整小卡片</button>
          <button type="button" aria-pressed={variant === "popover"} onClick={() => setVariant("popover")}>B · 整行入口</button>
        </div>
        <label className={styles.platformSelect}>示例平台<select value={platformName} onChange={event => setPlatformName(event.target.value)}>{platforms.map(item => <option key={item.name}>{item.name}</option>)}</select></label>
      </div>
    </header>
    <div className={styles.articleWell}>
      <article className={styles.article}>
        <header className={styles.articleHeader}><span>文章场景预览</span><p>{variant === "inline" ? "完整展示，随正文一起阅读" : "平时只占一行，点击提示查看"}</p></header>
        <h2>完成 {platform.name} {isExchange ? "注册" : "开户"}后</h2>
        <p className={styles.paragraph}>核对自己的{isExchange ? " UID 与邀请关系" : "账户 ID 与开户渠道"}，完成账户准备后，再继续阅读后面的使用教程。</p>
        <div className={styles.module} key={`${variant}-${platform.name}`}>
          {variant === "inline" ? <ArticleVipInvitation invitation={{ platform: platform.name, kind: platform.kind }} /> : <ArticleVipReferencePrompt references={[{ href: platform.href, invitation: { platform: platform.name, kind: platform.kind } }]} />}
        </div>
        <section className={styles.continuation}>
          <h2>继续了解账户的使用方式</h2>
          <p className={styles.paragraph}>根据自己的需求，选择对应的使用教程继续阅读。已有的账户可以继续使用，先确认账号安全设置和账户归属，再准备下一步操作。</p>
          <p className={styles.paragraph}>这张卡片只放在相关的注册或开户步骤之后。申请 VIP 时，前往账户中心提交必要的账户标识，由后台进行资格核验。</p>
          <div className={styles.readingNote}>完整卡片放在注册教程正文中；整行入口跟在其他文章的教程引用旁。点击“查看申请方式”直接前往申请说明，悬停仅有轻微上浮效果。</div>
        </section>
      </article>
    </div>
  </main>;
}
