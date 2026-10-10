import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, FileText, Globe2, Wrench, Building2, Blocks, CandlestickChart, ChartNoAxesColumnIncreasing, Crown } from "lucide-react";
import { ProtectedContentLink } from "@/components/content-access-gate";
import { siteConfig } from "@/lib/config";
import { perkSections } from "./data";
import { featuredPerks, overviewTopics, perkSearchEntries, type OverviewEntry } from "./overview-content";
import { PerkSearch, PerkTopicNav } from "./overview-controls";
import styles from "./overview.module.css";

export const metadata: Metadata = {
  title: "Wise Invest 福利中心：交易所返佣、港美股开户、境外银行与虚拟 U 卡入口",
  description: "Wise Invest 福利中心，整理 Binance、OKX、Bybit、Bitget 等交易所返佣，BBAE、盈透、嘉信等美股券商开户，境外银行、虚拟 U 卡和出海工具入口。",
  keywords: ["Wise Invest 福利", "交易所返佣", "币安邀请码", "OKX 邀请码", "美股券商开户", "BBAE 证券开户", "盈透证券开户", "嘉信证券开户", "境外银行开户", "虚拟 U 卡"],
  alternates: { canonical: siteConfig.url("/perk") },
  openGraph: {
    title: "Wise Invest 福利中心：交易所返佣、港美股开户、境外银行与虚拟 U 卡入口",
    description: "整理交易所返佣、美股券商开户、境外银行、虚拟 U 卡和出海工具入口。",
    url: siteConfig.url("/perk"), siteName: siteConfig.name, type: "website",
  },
  twitter: {
    card: "summary",
    title: "Wise Invest 福利中心：交易所返佣、港美股开户、境外银行与虚拟 U 卡入口",
    description: "整理交易所返佣、美股券商开户、境外银行、虚拟 U 卡和出海工具入口。",
  },
};

const entryIcons = { document: FileText, sim: Globe2, tools: Wrench, broker: Building2, onchain: Blocks, market: CandlestickChart, ipo: ChartNoAxesColumnIncreasing };

function EntryContent({ entry }: { entry: OverviewEntry }) {
  const Icon = entry.icon ? entryIcons[entry.icon] : null;
  return <>
    {entry.kind === "card" && entry.image && <div className={styles.cardArt}>
      <Image src={entry.image} alt={entry.title + " 卡面示意"} fill sizes="(max-width: 599px) calc(100vw - 40px), (max-width: 1099px) 30vw, 300px" />
    </div>}
    <div className={styles.entryHeading}>
      {entry.image && !entry.kind && <Image src={entry.image} alt="" width={40} height={40} className={styles.brandMark} />}
      {Icon && <Icon className={styles.entryIcon} strokeWidth={1.5} aria-hidden="true" />}
      <h3>{entry.title}</h3>
    </div>
    {entry.marks && <div className={styles.bankMarks} aria-hidden="true">
      {entry.marks.map((mark) => <span key={mark.name}>
        <Image src={mark.src} alt="" width={36} height={36} />
        <b>{mark.name}</b>
      </span>)}
    </div>}
    {entry.description && <p>{entry.description}</p>}
    <span className={styles.entryAction}>{entry.action}<ArrowRight size={20} aria-hidden="true" /></span>
  </>;
}

function EntryCard({ entry }: { entry: OverviewEntry }) {
  const className = [styles.entry, entry.highlighted ? styles.highlighted : "", entry.kind === "card" ? styles.cardEntry : "", entry.kind === "resource" ? styles.resourceEntry : ""].filter(Boolean).join(" ");
  const content = <EntryContent entry={entry} />;
  // Tutorials still use the existing access component; this page grants no access.
  if (entry.href.startsWith("/articles/")) {
    return <ProtectedContentLink href={entry.href} className={className}>{content}</ProtectedContentLink>;
  }
  return <Link href={entry.href} prefetch={false} className={className}>{content}</Link>;
}

function FeaturedCard({ item, priority }: { item: (typeof featuredPerks)[number]; priority: boolean }) {
  const images = { binance: "binance-studio", bbae: "broker-studio", gate: "gate-card-studio" };
  const className = styles.feature;
  const content = <>
    <div className={styles.featureArt} aria-hidden="true">
      <Image src={`/images/perks/overview/${images[item.id]}.webp`} alt="" fill sizes="(max-width: 599px) calc(100vw - 40px), (max-width: 1295px) 31vw, 390px" priority={priority} />
    </div>
    <div className={styles.featureCopy}>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <span className={styles.featureAction}>{item.action}<ArrowRight size={19} aria-hidden="true" /></span>
    </div>
  </>;
  return item.href.startsWith("/articles/")
    ? <ProtectedContentLink href={item.href} className={className}>{content}</ProtectedContentLink>
    : <Link href={item.href} prefetch={false} className={className}>{content}</Link>;
}

export default function PerkPage() {
  const perkJsonLd = {
    "@context": "https://schema.org", "@type": "ItemList",
    name: "Wise Invest 福利中心", url: siteConfig.url("/perk"),
    itemListElement: [...perkSections.map((section) => ({ name: section.title, url: siteConfig.url("/perk/" + section.slug) })), { name: "虚拟 U 卡", url: siteConfig.url("/card") }]
      .map((entry, index) => ({ "@type": "ListItem", position: index + 1, ...entry })),
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(perkJsonLd) }} />
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div><h1>Wise 福利中心</h1><p>开户、返佣、支付与出海资源。</p></div>
          <PerkSearch entries={perkSearchEntries} />
        </header>

        <section aria-labelledby="featured-perks" className={styles.featured}>
          <h2 id="featured-perks">精选入口</h2>
          <div className={styles.featureGrid}>{featuredPerks.map((item, index) => <FeaturedCard key={item.id} item={item} priority={index === 0} />)}</div>
        </section>

        <PerkTopicNav items={overviewTopics.map((topic) => ({ id: topic.id, label: topic.nav }))} />

        <div className={styles.topics}>
          {overviewTopics.map((topic) => <section key={topic.id} id={topic.id} className={styles.topic} aria-labelledby={topic.id + "-heading"}>
            <div className={styles.topicIntro}>
              <h2 id={topic.id + "-heading"}>{topic.title}</h2>
              <p>{topic.description}</p>
              {topic.allHref && <Link href={topic.allHref} prefetch={false} className={styles.allLink}>{topic.allLabel}<ArrowRight size={21} aria-hidden="true" /></Link>}
            </div>
            <div className={styles.entries + " " + (topic.entries.length === 2 ? styles.twoEntries : "")}>
              {topic.entries.map((entry) => <EntryCard key={entry.id} entry={entry} />)}
            </div>
          </section>)}
        </div>

        <section className={styles.vip} aria-labelledby="perk-vip-title">
          <Crown className={styles.vipIcon} size={36} strokeWidth={1.5} aria-hidden="true" />
          <div className={styles.vipCopy}><h2 id="perk-vip-title">已通过 Wise 合作渠道开户？</h2><p>查看 VIP 申请条件，核验通过后解锁更多服务。</p></div>
          <a href="https://vip.wise-invest.org/join" target="_blank" rel="noopener noreferrer" className={styles.vipAction}>了解 Wise VIP<ArrowUpRight size={19} aria-hidden="true" /></a>
        </section>
        <p className={styles.notice}>合作福利与申请条件以各平台页面为准。</p>
      </div>
    </div>
  </>;
}
