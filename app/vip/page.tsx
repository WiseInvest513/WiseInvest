import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Building2, CandlestickChart, Check, Crown, MessageCircle, Plus, ShieldCheck } from "lucide-react";
import { CommunityDialogButton } from "@/components/community-dialog-button";
import { CopyTextButton } from "@/components/copy-text-button";
import { getContentViewerTier } from "@/lib/identity/content-viewer";
import { getEnabledVipPartners } from "@/lib/vip/partners";
import { perks } from "@/lib/perks-data";
import { LandingExperience } from "./landing-experience";
import { ReportPreview, WebsitePreview } from "./preview-media";
import { CommunityGallery } from "./community-gallery";
import { brokerageChannels, exchangeOrder, faqs, featuredArticle, introductionHref, joinSteps, problems } from "./landing-content";
import styles from "./vip.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Wise VIP | 5 条产业链持续跟踪，让投资判断多一份依据",
  description: "欢迎加入 Wise VIP。通过社群交流、AI 工具、产业信息与每日投研，建立自己的投资思路。了解真实服务、内容样例、合作账户申请条件与加入流程。",
  alternates: { canonical: "/vip" },
};

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
      <LandingExperience>
        <section id="invitation" tabIndex={-1} aria-labelledby="vip-title" className={styles.hero}>
          <div data-vip-reveal>
            <p className={styles.welcome}><Crown size={18} aria-hidden="true" />欢迎加入 Wise VIP</p>
            <h1 id="vip-title"><span>5 条产业链持续跟踪，</span><span>让投资判断，多一份依据。</span></h1>
          </div>
          <div className={styles.heroAside} data-vip-reveal>
            <h2>与认真关注市场的人同行</h2>
            <p className={styles.heroDescription}>从每日市场复盘、重点公司观察，到研究工具与社群交流，把零散消息整理成值得关注的方向。</p>
            <div className={styles.actions}>
              {isVip ? <Link className={styles.primary} href="/account/vip">进入我的 VIP 中心<ArrowRight /></Link> : <a className={styles.primary} href="#vip-services">了解 VIP 服务<ArrowRight /></a>}
              <a className={styles.secondary} href="#how-it-works">查看加入方式</a>
            </div>
          </div>
          <dl className={styles.heroStats} aria-label="VIP 服务概览" data-vip-reveal>
            <div>
              <dt><strong>5</strong><span>条产业链</span></dt>
              <dd>AI、存储、机器人、太空经济、核电</dd>
            </div>
            <div>
              <dt><strong>2</strong><span>个研究网站</span></dt>
              <dd>CHAIN 产业跟踪 · Crypto 加密市场工具</dd>
            </div>
            <div>
              <dt><strong>每日</strong><span>投研复盘</span></dt>
              <dd>市场变化、重点个股、次日观察清单</dd>
            </div>
          </dl>
        </section>
        <section id="why-vip" tabIndex={-1} aria-labelledby="vip-problems-title" className={styles.section}>
          <div data-vip-reveal><h2 id="vip-problems-title" className={styles.sectionHeading}>是不是经常遇到这些情况？</h2><div className={styles.goldRule} /></div>
          <div className={styles.problems}>
            {problems.map((problem, index) => <article key={problem.title} data-vip-reveal><span className={styles.problemNumber}>{String(index + 1).padStart(2, "0")}</span><h3>{problem.title}</h3><p>{problem.text}</p></article>)}
          </div>
          <div className={styles.whyAnswer} data-vip-reveal>
            <h2>为什么加入 Wise VIP？<br />让<span>信息有脉络</span>，让<span>交流有价值</span>。</h2>
            <p>更多有依据的信息参考，更有价值的沟通。<br />不是替你做决定，而是让你逐步形成自己的判断。</p>
          </div>
        </section>
        <section id="vip-services" tabIndex={-1} aria-labelledby="vip-services-title" className={`${styles.section} ${styles.servicesSection}`}>
          <div data-vip-reveal><h2 id="vip-services-title" className={`${styles.sectionHeading} ${styles.servicesHeading}`}>把投资做下去，需要的不止一份教程</h2><p className={styles.sectionIntro}>信息有出处，工具能用，问题有人一起讨论。</p></div>
          <div className={styles.serviceGrid}>
            <article className={styles.service}>
              <div className={styles.serviceCopy} data-vip-reveal><span className={styles.serviceNumber}>01 / 社群交流</span><h3>从一个人的判断，<br />到一群人的思考。</h3>
                <p className={styles.serviceDescription}>在群里交流市场变化、研究逻辑与实际问题。不是只看一个点位，更重要的是理解为什么。</p><p className={styles.serviceDescription}>讨论机会，也讨论风险；分享依据，也容得下不同的判断。</p>
                <a href="#how-it-works" className={styles.textLink}>了解如何加入<ArrowRight size={15} /></a>
              </div>
              <div className={styles.serviceMedia} data-vip-parallax><CommunityGallery /></div>
            </article>
            <article className={styles.service}>
              <div className={styles.serviceCopy} data-vip-reveal><span className={styles.serviceNumber}>02 / AI 工具与定制</span><h3>把重复的工作，<br />交给更适合的工具。</h3>
                <p className={styles.serviceDescription}>我们已经开发了多个网站和工具，用 AI 减少重复工作。也可以围绕你的研究流程与个人需求，沟通更适合的工具和定制方案。</p>
                <Link href="/website" className={styles.textLink}>查看已有网站与工具<ArrowUpRight size={15} /></Link><p className={styles.caption}>具体定制范围、时间与费用，按需求沟通确认。</p>
              </div>
              <div className={styles.serviceMedia} data-vip-parallax><WebsitePreview name="Wise 工具与网站" src="/images/vip/tools-overview.png" href="https://www.wise-invest.org/website" height={900} /></div>
            </article>
            <article className={styles.service}>
              <div className={styles.serviceCopy} data-vip-reveal><span className={styles.serviceNumber}>03 / 产业与事件</span><h3>CHAIN：<br />把每天的关注点理清。</h3>
                <p className={styles.serviceDescription}>不知道每天看什么？从 AI（含半导体）、存储、机器人、太空经济、核电五条产业链开始，把产业、公司、事件与财报放在一起，建立自己的观察主线。</p>
                <a href="https://chain.wise-invest.org/" target="_blank" rel="noopener noreferrer" className={styles.textLink}>打开 CHAIN<ArrowUpRight size={15} /></a><p className={styles.caption}>网站实景 · 部分内容需 Wise ID</p>
              </div>
              <div className={styles.serviceMedia} data-vip-parallax><WebsitePreview name="WiseChain" src="/images/vip/chain-overview.png" href="https://chain.wise-invest.org/" /></div>
            </article>
            <article className={styles.service}>
              <div className={styles.serviceCopy} data-vip-reveal><span className={styles.serviceNumber}>04 / 加密市场工具</span><h3>Crypto：<br />先有计划，再做交易。</h3>
                <p className={styles.serviceDescription}>看不清 BTC、ETH 的位置与风险？从行情、均线区间和 K 线开始，配合仓位、风险回报与杠杆工具，先理清计划，再决定是否参与。</p>
                <a href="https://crypto.wise-invest.org/" target="_blank" rel="noopener noreferrer" className={styles.textLink}>打开 Crypto<ArrowUpRight size={15} /></a><p className={styles.caption}>工具可先体验 · 人工策略尚未发布</p>
              </div>
              <div className={styles.serviceMedia} data-vip-parallax><WebsitePreview name="Wise Crypto" src="/images/vip/crypto-overview.png" href="https://crypto.wise-invest.org/" /></div>
            </article>
          </div>
        </section>
        <section id="vip-reports" tabIndex={-1} aria-labelledby="vip-reports-title" className={`${styles.section} ${styles.reportSection}`}>
          <div className={styles.reportRow}>
            <div className={styles.reportHeader} data-vip-reveal><div><span className={styles.serviceNumber}>05 / 每日投研</span><h2 id="vip-reports-title">先复盘昨天，<br />再准备明天。</h2><p>每天推送上一交易日的市场投研报告。整理市场要闻、财报、行业变化和重点个股，把“发生了什么”变成“接下来关注什么”。</p></div></div>
            <div className={styles.serviceMedia} data-vip-parallax><ReportPreview /></div>
          </div>
          <article className={styles.articleStrip} data-vip-reveal><div><span className={styles.articleEyebrow}><BookOpen size={15} />Wise VIP 市场手记 · Vol.01</span><h3>{featuredArticle.title}</h3><p>{featuredArticle.summary}<br /><time dateTime={featuredArticle.date}>{featuredArticle.date}</time> · 约 30 分钟阅读</p></div><Link href={featuredArticle.href} className={styles.textLink}>{isVip ? "阅读全文" : "免费试读约 35%"}<ArrowUpRight size={16} /></Link></article>
          <p className={styles.caption}>部分工具目前可公开体验；后续新增的 VIP 专属内容与功能，将按各页面说明开放。</p>
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
              <div className={styles.conditions}><strong>申请条件</strong><p>账户必须<strong className="!inline">绑定 Wise 邀请关系</strong>，并<strong className="!inline">入金 100U、完成任意金额交易</strong>后，再提交核验。</p></div><Link href="/perk/crypto" className={styles.textLink}>了解交易所合作渠道<ArrowUpRight size={15} /></Link>
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
