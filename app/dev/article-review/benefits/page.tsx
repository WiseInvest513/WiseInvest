import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleRegistrationCard } from "@/components/article-registration-card";
import { getAllArticles, getArticleRoute } from "@/lib/articles";
import { parseRegistrationCallout, type RegistrationCallout } from "@/lib/article-registration";
import { isDevPreviewEnabled } from "@/lib/identity/dev-preview";
import { getRegistrationBrand, type RegistrationBrand } from "@/lib/registration-brands";
import { exclusiveInvitationBenefits } from "@/lib/registration-benefits";
import styles from "./benefits.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "文章邀请福利清单 | Wise Invest",
  robots: { index: false, follow: false },
};

type BenefitEntry = {
  key: string;
  name: string;
  card: RegistrationCallout;
  brand?: RegistrationBrand;
  benefits?: RegistrationBrand["benefits"];
  hasBenefit: boolean;
  isGenericInvitation: boolean;
  gap?: string;
  sources: { title: string; href: string }[];
};

function collectBenefits() {
  const entries = new Map<string, BenefitEntry>();
  const articleIds = new Set<string>();
  let cardCount = 0;

  for (const article of getAllArticles()) {
    for (const line of article.content.split("\n")) {
      const card = parseRegistrationCallout(line);
      if (!card) continue;
      cardCount += 1;
      articleIds.add(article.id);
      const brand = getRegistrationBrand(card.href, card.title);
      const name = brand?.name ?? card.title;
      const key = JSON.stringify([name, card.code ?? "", card.benefitText ?? ""]);
      const source = { title: article.title, href: getArticleRoute(article) };
      const existing = entries.get(key);
      if (existing) {
        if (!existing.sources.some((item) => item.href === source.href)) existing.sources.push(source);
        continue;
      }

      // Match the article component: explicit Markdown overrides a different
      // brand default, while the same summary retains the structured details.
      const benefits = !card.benefitText || card.benefitText === brand?.benefits?.summaryText
        ? brand?.benefits ?? (card.codeLabel === "优惠码" ? undefined : exclusiveInvitationBenefits)
        : undefined;
      const isGenericInvitation = benefits?.kind === "invitation";
      const hasBenefit = !isGenericInvitation && Boolean(benefits?.items.length || card.benefitText?.trim());
      const gap = brand?.benefitGap ?? (!hasBenefit && !isGenericInvitation ? "正文未写明具体奖励金额、比例及领取条件，待补充。" : undefined);
      entries.set(key, { key, name, card, brand, benefits, hasBenefit, isGenericInvitation, gap, sources: [source] });
    }
  }

  return {
    entries: [...entries.values()].sort((a, b) => a.name.localeCompare(b.name, "zh-CN")),
    articleCount: articleIds.size,
    cardCount,
  };
}

function BenefitRow({ entry }: { entry: BenefitEntry }) {
  return (
    <article className={styles.row} aria-label={`${entry.name}邀请福利`}>
      <div className={styles.columns}>
        <div className={styles.product}>
          <div className={styles.productHeading}>
            {entry.brand ? <img src={entry.brand.iconSrc} alt="" width={32} height={32} /> : null}
            <h3>{entry.name}</h3>
          </div>
          <p className={styles.code}>{entry.card.code ? <>{entry.card.codeLabel} <code>{entry.card.code}</code></> : "邀请链接，无单独邀请码"}</p>
          <span className={entry.hasBenefit || entry.isGenericInvitation ? styles.presentBadge : styles.missingBadge}>
            {entry.isGenericInvitation ? "通用邀请文案" : entry.hasBenefit ? entry.gap ? "有福利 · 条件待补" : "已提取福利" : "福利待补充"}
          </span>
        </div>
        <div className={styles.benefitCell}>
          <h4 className={styles.mobileLabel}>目前展示的福利与条件</h4>
          {entry.benefits ? <>
            <p className={styles.benefitTitle}>{entry.benefits.title}{entry.benefits.period ? <span> · {entry.benefits.period}</span> : null}</p>
            <ul className={styles.benefitList}>
              {entry.benefits.items.map((item, index) => <li key={`${item.label}-${index}`}>
                <p>{item.value ? <strong>{item.value}</strong> : null} {item.label}</p>
                <p className={styles.condition}>{item.condition}</p>
              </li>)}
            </ul>
            {entry.benefits.note ? <p className={styles.note}>{entry.benefits.note}</p> : null}
          </> : entry.card.benefitText ? <p>{entry.card.benefitText}</p> : <p className={styles.muted}>正文尚未提供可展示的具体福利。</p>}
        </div>
        <div className={styles.gapCell}>
          <h4 className={styles.mobileLabel}>待补内容</h4>
          {entry.gap ? <p className={styles.gap}>{entry.gap}</p> : <p className={styles.muted}>{entry.isGenericInvitation ? "按已确认口径展示独家福利，不列具体金额或比例。" : "未列出待补项"}</p>}
        </div>
        <div className={styles.sourceCell}>
          <h4 className={styles.mobileLabel}>来源文章</h4>
          <ul className={styles.sources}>{entry.sources.map((source) => <li key={source.href}>
            <a href={source.href} target="_blank" rel="noreferrer">{source.title}<span aria-hidden="true"> ↗</span></a>
          </li>)}</ul>
        </div>
      </div>
      <details className={styles.preview}>
        <summary>查看 {entry.name} 邀请卡预览</summary>
        <div className={styles.previewContent}><ArticleRegistrationCard {...entry.card} /></div>
      </details>
    </article>
  );
}

function BenefitGroup({ id, title, description, entries }: { id: string; title: string; description: string; entries: BenefitEntry[] }) {
  return <section id={id} className={styles.group}>
    <div className={styles.groupHeading}><h2>{title} <span>{entries.length}</span></h2><p>{description}</p></div>
    {entries.length ? <div className={styles.table}>
      <div className={`${styles.columns} ${styles.tableHeading}`} aria-hidden="true">
        <span>产品与邀请码</span><span>目前展示的福利与条件</span><span>待补内容</span><span>来源文章</span>
      </div>
      {entries.map((entry) => <BenefitRow key={entry.key} entry={entry} />)}
    </div> : <p className={styles.empty}>这一组暂无内容。</p>}
  </section>;
}

export default function ArticleBenefitsPage() {
  if (!isDevPreviewEnabled()) notFound();
  const { entries, articleCount, cardCount } = collectBenefits();
  const withBenefits = entries.filter((entry) => entry.hasBenefit);
  const genericInvitations = entries.filter((entry) => entry.isGenericInvitation);
  const missingBenefits = entries.filter((entry) => !entry.hasBenefit && !entry.isGenericInvitation);
  const needDetails = entries.filter((entry) => entry.gap).length;

  return <main className={styles.page}>
    <div className={styles.container}>
      <header className={styles.header}>
        <a className={styles.backLink} href="/dev/article-review">← 返回文章审阅</a>
        <p className={styles.kicker}>WISE INVEST · 本地审阅</p>
        <h1>文章邀请福利清单</h1>
        <p>先看已有福利，再补缺少的金额、比例与领取条件。展开任一条，可以直接预览文章中使用的邀请卡。</p>
      </header>
      <dl className={styles.stats}>
        <div><dt>涉及文章</dt><dd>{articleCount}</dd></div>
        <div><dt>正文邀请卡</dt><dd>{cardCount}</dd></div>
        <div><dt>合并后条目</dt><dd>{entries.length}</dd></div>
        <div><dt>有待补内容</dt><dd>{needDetails}</dd></div>
      </dl>
      <p className={styles.scope}>根据文章原文与已确认的邀请配置整理，同一产品、邀请码和福利合并展示。缺少条件与已结束的活动单独列出；本页尚未逐一核验平台最新活动。</p>
      <nav className={styles.navigation} aria-label="福利清单分组">
        <a href="#with-benefits">已有福利 <strong>{withBenefits.length}</strong></a>
        {genericInvitations.length ? <a href="#exclusive-invitations">独家福利说明 <strong>{genericInvitations.length}</strong></a> : null}
        {missingBenefits.length ? <a href="#missing-benefits">福利待补 <strong>{missingBenefits.length}</strong></a> : null}
      </nav>
      <BenefitGroup id="with-benefits" title="已有福利" description="保留金额、比例的实际基数和领取门槛；部分条件缺失会单独列在右侧。" entries={withBenefits} />
      {genericInvitations.length ? <BenefitGroup id="exclusive-invitations" title="独家福利说明" description="使用统一的专属邀请文案；未设置具体金额或比例，不计入已提取具体权益的数量。" entries={genericInvitations} /> : null}
      {missingBenefits.length ? <BenefitGroup id="missing-benefits" title="福利待补" description="当前正文尚未写出可用的具体福利，列明缺口后再补充。" entries={missingBenefits} /> : null}
    </div>
  </main>;
}
