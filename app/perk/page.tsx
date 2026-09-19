import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileText, Cpu, Wrench } from "lucide-react";
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

const entryIcons = { document: FileText, sim: Cpu, tools: Wrench };

function EntryContent({ entry }: { entry: OverviewEntry }) {
  const Icon = entry.icon ? entryIcons[entry.icon] : null;
  return <>
    <div className={styles.entryHeading}>
      {entry.image && !entry.kind && <Image src={entry.image} alt="" width={52} height={52} className={styles.brandMark} />}
      <h3>{entry.title}</h3>
    </div>
    {entry.kind === "card" && entry.image && <div className={styles.cardArt}>
      <Image src={entry.image} alt={entry.title + " 卡面示意"} width={360} height={240} sizes="(max-width: 640px) 240px, 280px" />
    </div>}
    {entry.marks && <div className={styles.bankMarks} aria-hidden="true">
      {entry.marks.map((mark) => <span key={mark.name}>
        <Image src={mark.src} alt="" width={36} height={36} />
        <b>{mark.name}</b>
      </span>)}
    </div>}
    {Icon && <Icon className={styles.entryIcon} strokeWidth={1.4} aria-hidden="true" />}
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

function FeaturedCard({ item }: { item: (typeof featuredPerks)[number] }) {
  const className = styles.feature + " " + styles[item.id];
  const content = <>
    <div className={styles.featureCopy}>
      <h3>{item.id === "binance" && <Image src="/images/perks/overview/binance.svg" alt="" width={38} height={38} />}{item.title}</h3>
      <p>{item.description}</p>
      <span className={styles.featureAction}>{item.action}<ArrowRight size={19} aria-hidden="true" /></span>
    </div>
    <div className={styles.featureArt} aria-hidden="true">
      {item.id === "binance" ? <>
        <Image src="/images/perks/overview/binance.svg" alt="" width={66} height={66} />
        <span>BINANCE</span>
      </> : <Image
        src={"/images/perks/overview/" + (item.id === "bbae" ? "bbae-mark" : "gate-card") + ".webp"}
        alt="" width={item.id === "bbae" ? 140 : 260} height={180}
        sizes="(max-width: 640px) 160px, 200px" priority
      />}
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
          <div className={styles.featureGrid}>{featuredPerks.map((item) => <FeaturedCard key={item.id} item={item} />)}</div>
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
          <div><h2 id="perk-vip-title">已通过 Wise 合作渠道开户？</h2><p>查看 VIP 申请条件，核验通过后解锁更多服务。</p></div>
          <Link href="/vip#how-it-works" className={styles.vipAction}>了解 Wise VIP<ArrowRight size={19} aria-hidden="true" /></Link>
        </section>
        <p className={styles.notice}>合作福利与申请条件以各平台页面为准。</p>
      </div>
    </div>
  </>;
}
