import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, BookOpen, Building2, CandlestickChart, Check, Crown, LockKeyhole, MessageCircle, Plus, ShieldCheck } from "lucide-react";
import { CommunityDialogButton } from "@/components/community-dialog-button";
import { CopyTextButton } from "@/components/copy-text-button";
import { getContentViewerTier } from "@/lib/identity/content-viewer";
import { getEnabledVipPartners } from "@/lib/vip/partners";
import { perks } from "@/lib/perks-data";
import { LandingExperience } from "./landing-experience";
import { WebsitePreview } from "./preview-media";
import { HistoryShowcase } from "./history-showcase";
import { CommunityGallery } from "./community-gallery";
import { ServiceSymbol } from "./service-symbol";
import { brokerageChannels, exchangeOrder, faqs, featuredArticle, introductionHref, joinSteps } from "./landing-content";
import styles from "./vip.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Wise VIP | 和认真关注市场的人，把投资聊透",
  description: "以群聊为主，研究工具为辅。了解 Wise VIP 的美股与加密讨论、历史案例展示、每周观察清单、每月直播对谈与点位观察系统，以及会员加入方式。",
  alternates: { canonical: "/vip" },
};

const discussionTopics = [
  {
    id: "industry", title: "美股与产业", lead: "从产业变化，看到值得研究的公司",
    image: "/images/vip/topic-industry.png", alt: "芯片、机械臂、航天火箭与核电设施的立体产业模型",
    tags: ["AI · 半导体", "存储", "航天", "核电", "机器人"],
    description: "聊产业链、重点公司与财报，理解增长从哪里来，也看清预期和风险。",
  },
  {
    id: "crypto", title: "加密与市场", lead: "不只看涨跌，更看市场为什么变化",
    image: "/images/vip/topic-crypto.png", alt: "比特币、以太坊与市场网络的立体研究模型",
    tags: ["BTC / ETH", "市场结构", "关键位置", "风险管理"],
    description: "围绕加密市场交流观察思路，关注资金、潜在催化与关键位置，讨论机会与风险。",
  },
  {
    id: "review", title: "跟踪与复盘", lead: "让每次讨论，都留下判断的过程",
    image: "/images/vip/topic-review.png", alt: "研究笔记、放大镜与时间线的立体复盘模型",
    tags: ["观点跟踪", "条件变化", "历史记录"],
    description: "对照原始观点与后续变化，讨论哪些依据仍然成立、哪里需要修正，而不是只看结果。",
  },
] as const;

export default async function VipPage() {
  const [tier, partners] = await Promise.all([getContentViewerTier(), getEnabledVipPartners()]);
  const isVip = tier === "VIP" || tier === "VIP_PLUS";
  const accountHref = tier ? "/account/vip" : "/login?callbackUrl=/account/vip";
  // Brokerage keeps its unified submission flow. The database still controls verification availability.
  const hasBrokerage = partners.some(partner => partner.type === "BROKERAGE");
  const exchangePartners = partners.filter(partner => partner.type === "EXCHANGE").sort((a, b) => {
    const first = exchangeOrder.indexOf(a.slug), second = exchangeOrder.indexOf(b.slug);
    return (first < 0 ? 99 : first) - (second < 0 ? 99 : second);
  });
  return (
    <div className={styles.page}>
      <LandingExperience hero={
        <section id="invitation" tabIndex={-1} aria-labelledby="vip-title" className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.welcome}><Crown size={16} aria-hidden="true" />WISE VIP<span>一起关注，也一起复盘</span></p>
            <h1 id="vip-title">看懂机会，也看清风险。<br /><span>和 Wise 一起，把投资聊透。</span></h1>
            <p className={styles.heroDescription}>从美股到加密，在群里持续讨论、跟踪与复盘。<br />有值得关注的方向，也有一起推敲判断的人。</p>
            <div className={styles.actions}>
              {isVip ? <Link className={styles.primary} href="/account/vip">进入我的 VIP 中心<ArrowRight /></Link> : <a className={styles.primary} href="#how-it-works">了解加入方式<ArrowRight /></a>}
              <a className={styles.secondary} href="#vip-history">先看历史战绩<ArrowUpRight size={15} /></a>
            </div>
            <p className={styles.heroFootnote}>群内交流为主 · 网站与点位工具辅助</p>
          </div>
          <div className={styles.heroGallery}><CommunityGallery /></div>
        </section>
      }>
        <section id="vip-community" tabIndex={-1} aria-labelledby="vip-community-title" className={styles.section}>
          <div className={styles.sectionHeader}><div><p className={styles.eyebrow}>01 / 社群交流</p><h2 id="vip-community-title" className={styles.sectionHeading}>进群之后，我们聊什么？</h2><p className={styles.sectionIntro}>把值得关注的方向聊清楚，也把判断变化留下来。</p></div><span className={styles.sectionAside}>不是只给一个答案，<br />而是一起理解为什么。</span></div>
          <div className={styles.topicGrid}>
            {discussionTopics.map(topic => <article key={topic.id}>
              <div className={styles.topicArtwork}><Image src={topic.image} alt={topic.alt} fill sizes="96px" /></div>
              <div className={styles.topicCopy}><h3>{topic.title}</h3><p className={styles.topicLead}>{topic.lead}</p><ul className={styles.topicTags} aria-label={`${topic.title}讨论方向`}>{topic.tags.map(tag => <li key={tag}>{tag}</li>)}</ul><p>{topic.description}</p></div>
            </article>)}
          </div>
          <Link href={featuredArticle.href} className={styles.readingStrip}><BookOpen size={18} /><span><small>先读一篇市场手记</small>{featuredArticle.title}</span><span className={styles.readingAction}>{isVip ? "阅读全文" : "免费试读"}<ArrowUpRight size={16} /></span></Link>
        </section>
        <HistoryShowcase />
        <section id="vip-tools" tabIndex={-1} aria-labelledby="vip-tools-title" className={`${styles.section} ${styles.toolsSection}`}>
          <div><p className={styles.eyebrow}>03 / 研究工具</p><h2 id="vip-tools-title" className={styles.sectionHeading}>讨论在群里，<br />研究有工具。</h2><p className={styles.sectionIntro}>CHAIN 跟踪产业与公司，Crypto 辅助查看加密市场。把群里的讨论，延伸到自己的研究里。</p><p className={styles.caption}>公开工具可先体验；会员内容以各页面权限说明为准。</p><Link href="/website" className={styles.textLink}>查看全部网站<ArrowUpRight size={15} /></Link></div>
          <div className={styles.toolsWell}>
            <article><WebsitePreview name="Wise CHAIN" src="/images/vip/chain-overview.png" href="https://chain.wise-invest.org/" /><div className={styles.toolCopy}><div><h3>CHAIN</h3><p>产业、公司与关键事件</p></div><a href="https://chain.wise-invest.org/" target="_blank" rel="noopener noreferrer" aria-label="打开 CHAIN" className={styles.toolArrow}><ArrowUpRight size={18} /></a></div></article>
            <article><WebsitePreview name="Wise Crypto" src="/images/vip/crypto-overview.png" href="https://crypto.wise-invest.org/" /><div className={styles.toolCopy}><div><h3>Crypto</h3><p>行情观察与风险工具</p></div><a href="https://crypto.wise-invest.org/" target="_blank" rel="noopener noreferrer" aria-label="打开 Crypto" className={styles.toolArrow}><ArrowUpRight size={18} /></a></div></article>
            <p className={styles.toolsCaption}>网站界面截图 · 非实时行情</p>
          </div>
        </section>
        <section id="vip-services" tabIndex={-1} aria-labelledby="vip-services-title" className={`${styles.section} ${styles.servicesSection}`}>
          <div className={styles.sectionHeader}><div><p className={styles.eyebrow}>04 / 服务体系</p><h2 id="vip-services-title" className={styles.sectionHeading}>有节奏的交流，持续发生。</h2><p className={styles.sectionIntro}>不只是进一个群，而是持续参与市场的讨论。</p></div><span className={styles.sectionAside}>具体时间与安排<br />以群内公告为准</span></div>
          <div className={styles.serviceGrid}>
            <article><div className={styles.serviceTop}><ServiceSymbol kind="discussion" /><span>平时 · 持续交流</span></div><h3>群内交流与观点更新</h3><p>聊市场变化、重点公司与研究思路，有进展继续跟踪，有变化一起复盘。</p></article>
            <article><div className={styles.serviceTop}><ServiceSymbol kind="calendar" /><span>每周日 · 提前准备</span></div><h3>下周重点事件与观察清单</h3><p>在群里同步下周值得关注的大事件，提前梳理财报、经济数据与潜在催化。</p></article>
            <article><div className={styles.serviceTop}><ServiceSymbol kind="live" /><span>每月 1–2 场 · 深入对谈</span></div><h3>线上直播对谈</h3><p>围绕近期市场、产业与公司展开交流，把值得深入聊的问题放在一起讨论。</p></article>
          </div>
        </section>
        <section id="vip-point" tabIndex={-1} aria-labelledby="vip-point-title" className={styles.pointSection}>
          <div><p className={styles.eyebrow}>05 / 点位观察</p><h2 id="vip-point-title">把讨论，变成<br />可跟踪的计划。</h2><p>参考区间、止损止盈、更新时间与有效期，一起查看。保留历史版本，方便回看判断的变化。</p><Link href="/point" className={styles.primary}>查看点位系统<ArrowRight /></Link></div>
          <div className={styles.pointPreview}><div className={styles.pointPreviewHeader}><span><CandlestickChart size={16} />点位观察</span><span><LockKeyhole size={12} />VIP 完整内容</span></div><div className={styles.pointColumns} aria-hidden="true"><span>产品 / 合约</span><span>观察参考</span><span>更新时间</span></div><div className={styles.pointPlaceholder}><div><span>加密合约</span><i /><i /></div><div><span>美股合约</span><i /><i /></div></div><div className={styles.pointPreviewFooter}><ShieldCheck size={14} />先看时间，再看点位</div><p className={styles.pointCaption}>仅作界面示意，非实时行情或交易建议。普通用户可查看少量摘要，VIP 查看完整计划。参考位置不是精确成交承诺，需结合当时行情判断。</p></div>
        </section>
        <section id="how-it-works" tabIndex={-1} aria-labelledby="vip-join-title" className={`${styles.section} ${styles.joining}`}>
          <div data-vip-reveal><h2 id="vip-join-title" className={styles.sectionHeading}>想加入，从你的真实账户开始。</h2><p className={styles.sectionIntro}>通过账户核验加入 Wise VIP，面向通过 Wise 合作渠道开户、符合条件的真实用户。我们希望与认真关注市场的朋友长期同行。也可以选择下方的付费 SVIP 方式，无需提交合作账户资料。</p></div>
          <div className={styles.eligibility}>
            <article className={styles.qualification} data-vip-reveal><h3><Building2 aria-hidden="true" />券商账户</h3>
              {hasBrokerage ? <ul className={styles.platformList}>{brokerageChannels.map(channel => <li key={channel.name}><span>{channel.name}</span>{channel.href ? <Link href={channel.href} className={styles.textLink} aria-label={`${channel.name}：${channel.cta}`}>{channel.cta}<ArrowUpRight size={12} /></Link> : <span className={styles.pending}>{channel.cta}</span>}</li>)}</ul> : <p className={styles.sectionIntro}>券商账户核验暂未开放，请以账户中心的可选渠道为准。</p>}
              <div className={styles.conditions}><strong>申请条件</strong><p>通过 Wise 合作渠道<strong className="!inline">开户、入金并激活账户</strong>后，再提交核验。</p></div><Link href="/perk/broker" className={styles.textLink}>了解券商合作渠道<ArrowUpRight size={15} /></Link>
            </article>
            <article className={styles.qualification} data-vip-reveal><h3><CandlestickChart aria-hidden="true" />交易所账户</h3>
              <ul className={styles.platformList}>{exchangePartners.map(partner => {
                const rawHref = perks.find(perk => perk.category === "Crypto" && perk.id === partner.slug)?.tutorialLink;
                const href = rawHref?.replace(/^https:\/\/www\.wise-invest\.org(?=\/)/, "");
                return <li key={partner.slug}><span>{partner.name}</span>{href ? <Link href={href} className={styles.textLink} aria-label={`${partner.name}：查看教程`}>查看教程<ArrowUpRight size={12} /></Link> : null}</li>;
              })}</ul>
              {exchangePartners.length === 0 ? <p className={styles.sectionIntro}>交易所账户核验暂未开放，请以账户中心为准。</p> : null}
              <div className={styles.conditions}><strong>申请条件</strong><p>账户必须<strong className="!inline">绑定 Wise 邀请关系</strong>，并<strong className="!inline">入金 1000U、完成 10000U 合约交易</strong>后，再提交核验。</p></div><Link href="/perk/crypto" className={styles.textLink}>了解交易所合作渠道<ArrowUpRight size={15} /></Link>
            </article>
          </div>
          <h3 className={styles.stepsTitle}>加入流程，只需 5 步。</h3><ol className={styles.steps}>{joinSteps.map(([title, description], index) => <li key={title}><span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span><h4>{title}</h4><p>{description}</p></li>)}</ol>
          <div className={styles.joinCallout} data-vip-reveal><div><h3>已经准备好了？</h3><p>提交真实的合作账户，人工核验通过后即可加入。<br />不是填入邀请码，就自动获得 VIP。</p></div><Link className={styles.primary} href={accountHref}>{isVip ? "查看我的 VIP 权益" : tier ? "提交账户核验" : "登录并提交核验"}<ArrowRight /></Link></div>
          <p className={styles.joinNote}><ShieldCheck size={15} />请选择自己真实需要、适合所在地区的账户，量力参与；无需为获得 VIP 使用杠杆或承担不适合自己的风险。</p>
        </section>
        <section id="svip" tabIndex={-1} aria-labelledby="svip-title" className={`${styles.section} ${styles.svipSection}`}>
          <div className={styles.svipCopy} data-vip-reveal><span className={styles.serviceNumber}>Wise SVIP</span><h2 id="svip-title" className={styles.sectionHeading}>不想提交账户资料？<br />也可以，直接加入 SVIP。</h2><p className={styles.sectionIntro}>无需提交券商或交易所账户资料，付费升级，获得更进一步的服务与支持。</p><p className={styles.caption}>工具定制与资源对接逐步提供，具体服务范围、费用与交付安排，请先沟通确认。</p></div>
          <div className={styles.svipDetails} data-vip-reveal>
            <p className={styles.svipPrice}><span>$</span>300<span className={styles.svipTerm}>美元 · 长期有效</span></p>
            <ul className={styles.svipBenefits}><li><Check size={17} />VIP 社群与内容权益</li><li><Check size={17} />更深入的需求沟通</li><li><Check size={17} />工具定制与资源对接的沟通支持</li></ul>
            <div className={styles.svipContact}><p>微信 <strong>WiseInvest520</strong></p><CopyTextButton value="WiseInvest520" className={styles.svipButton}>复制微信，联系开通</CopyTextButton><p className={styles.caption}>确认权益与付款方式后，由管理员为你的 Wise ID 开通。</p></div>
          </div>
        </section>
        <section id="vip-faq" tabIndex={-1} aria-labelledby="vip-faq-title" className={`${styles.section} ${styles.faqSection}`}>
          <h2 id="vip-faq-title" className={styles.sectionHeading}>加入之前，你可能还想知道。</h2>
          <div className={styles.faqList}>{faqs.map((faq, index) => <details key={faq.question} open={index === 0}><summary>{faq.question}<Plus aria-hidden="true" /></summary><div className={styles.faqAnswer}><p>{faq.answer}</p>{faq.href ? <Link href={faq.href} className={styles.textLink}>{faq.linkLabel}<ArrowUpRight size={14} /></Link> : null}</div></details>)}</div>
          <div className={styles.finalInvite} data-vip-reveal><h2>期待与你，一起把投资做下去。</h2><p>先了解，再决定。我们更期待长期、认真、有价值的同行。</p><div className={styles.actions}><a href="#how-it-works" className={styles.primary}>查看加入方式<ArrowRight /></a><CommunityDialogButton className={styles.communityButton}><MessageCircle size={16} />先加入免费群</CommunityDialogButton></div><Link href={introductionHref} className={`${styles.textLink} mt-6`}>阅读完整 VIP 体系介绍<ArrowUpRight size={14} /></Link></div>
        </section>
      </LandingExperience>
    </div>
  );
}
