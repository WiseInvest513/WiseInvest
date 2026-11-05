"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight, ArrowLeftRight, BookOpen, Check, Coins, Gift, Globe2, LayoutGrid, Mail, Map, ShieldCheck, ShieldAlert, Smartphone, UserRound, Wallet, ChartNoAxesCombined, type LucideIcon } from "lucide-react";
import type { ArticleSeries } from "@/lib/article-library";
import { getArticleLearningPaths, getSeriesOverviewHref, type SeriesReadingState } from "@/lib/article-series";
import { ProtectedContentLink } from "@/components/content-access-gate";
import styles from "./series-reader.module.css";

export interface SeriesReaderContext {
  series: ArticleSeries;
  reading: SeriesReadingState;
  articleId?: string;
}

type SeriesPresentation = {
  icon: LucideIcon;
  logo?: string;
  introduction: string;
  outcomes: { icon: LucideIcon; title: string; description: string }[];
  chapters: { icon: LucideIcon; summary: string }[];
};

const presentations: Record<string, SeriesPresentation> = {
  binance: {
    icon: Coins,
    logo: "/images/perks/overview/binance.svg",
    introduction: "币安 Binance 是提供加密资产买卖、交易与 Web3 相关服务的平台。本系列从认识产品开始，逐步梳理账户准备、入金与买币，再到常用功能和钱包的使用。",
    outcomes: [
      { icon: ShieldCheck, title: "准备好账户", description: "了解注册、身份认证与基础安全设置。" },
      { icon: ArrowLeftRight, title: "理清资金路径", description: "认识入金、买币和账户间的资金流转。" },
      { icon: Wallet, title: "理解产品与风险", description: "分清交易、理财与钱包的用途和边界。" },
    ],
    chapters: [
      { icon: LayoutGrid, summary: "认识平台定位、主要功能和常见使用场景。" },
      { icon: ShieldCheck, summary: "梳理注册材料、身份认证与双重验证。" },
      { icon: ArrowLeftRight, summary: "了解充值、C2C 买币和资金划转的基本流程。" },
      { icon: Gift, summary: "读懂活动条件、手续费规则与参与限制。" },
      { icon: ChartNoAxesCombined, summary: "区分现货、兑换与理财功能，认识各自风险。" },
      { icon: Wallet, summary: "认识交易所账户与链上钱包的区别及安全边界。" },
    ],
  },
  "crypto-basics": {
    icon: Coins,
    introduction: "从比特币、稳定币等基础概念出发，建立对加密资产、交易所和钱包的整体认识。先理解资产在哪里、交易如何发生，再认识保管与操作中的风险。",
    outcomes: [
      { icon: Coins, title: "理解基础概念", description: "分清常见资产、网络与交易术语。" },
      { icon: Wallet, title: "认识使用工具", description: "了解交易所和钱包各自承担的角色。" },
      { icon: ShieldAlert, title: "建立风险意识", description: "认识波动、私钥保管与常见骗局。" },
    ],
    chapters: [
      { icon: Coins, summary: "从比特币、稳定币与区块链的基本概念开始。" },
      { icon: ArrowLeftRight, summary: "理解交易所的作用、买卖流程与费用。" },
      { icon: Wallet, summary: "认识地址、私钥、网络选择和转账。" },
      { icon: ShieldAlert, summary: "识别价格波动、操作风险与常见骗局。" },
    ],
  },
  overseas: {
    icon: Globe2,
    introduction: "把海外账号与通信工具的准备串成一条学习路径。从 Google、Apple ID 到境外手机号与 eSIM，逐步了解申请、使用和后续维护。",
    outcomes: [
      { icon: UserRound, title: "准备常用账号", description: "了解 Google 与不同地区 Apple ID 的注册。" },
      { icon: Smartphone, title: "选择通信工具", description: "认识实体 SIM 卡、eSIM 与开通流程。" },
      { icon: ShieldCheck, title: "做好后续维护", description: "关注账号安全、保号和日常使用限制。" },
    ],
    chapters: [
      { icon: Mail, summary: "准备注册资料，了解账号创建与验证。" },
      { icon: UserRound, summary: "梳理不同地区 Apple ID 的申请和使用。" },
      { icon: Smartphone, summary: "了解 giffgaff 激活、使用与保号。" },
      { icon: Globe2, summary: "了解 Xesim 申请、开通与设备准备。" },
    ],
  },
};

function getPresentation(series: ArticleSeries): SeriesPresentation {
  return presentations[series.id] ?? { icon: BookOpen, introduction: series.introduction ?? series.description, outcomes: [], chapters: [] };
}

function SeriesMark({ series, small = false }: { series: ArticleSeries; small?: boolean }) {
  const { logo, icon: Icon } = getPresentation(series);
  if (series.kind === "path") return <span className={styles.brandMark} data-small={small}><Image src={series.artwork} width={64} height={64} alt="" /></span>;
  return <span className={styles.brandMark} data-small={small}>{logo ? <Image src={logo} width={48} height={48} alt="币安 Binance" /> : <Icon size={small ? 25 : 36} strokeWidth={1.5} aria-hidden="true" />}</span>;
}

export function LearningPathLinks({ articleId }: { articleId: string }) {
  const paths = getArticleLearningPaths(articleId);
  if (!paths.length) return null;
  return <nav className={styles.relatedPaths} aria-label="所在学习路线"><span><BookOpen size={15} aria-hidden="true" />所在学习路线</span>{paths.map(path => <Link key={path.id} href={getSeriesOverviewHref(path.id)}>{path.title}<ArrowUpRight size={14} aria-hidden="true" /></Link>)}</nav>;
}

function PathNavigation({ series, reading, articleId, onNavigate }: SeriesReaderContext & { onNavigate?: () => void }) {
  return (
    <nav aria-label="学习路线目录" className={styles.navigation}>
      <Link href="/articles?view=series" className={styles.back} onClick={onNavigate}><ArrowLeft size={15} aria-hidden="true" />全部系列</Link>
      <div className={styles.heading}><SeriesMark series={series} small /><h2>{series.title}</h2><p>{reading.stages.length} 个阶段 · {reading.publishedCount} 篇文章</p></div>
      <Link href={reading.overviewHref} className={styles.overviewLink} aria-current={!articleId ? "page" : undefined} onClick={onNavigate}><LayoutGrid size={16} aria-hidden="true" />路线目录</Link>
      {reading.mapHref && <ProtectedContentLink href={reading.mapHref} prefetch={false} className={styles.overviewLink}><Map size={16} aria-hidden="true" />返回资金地图</ProtectedContentLink>}
      {reading.stages.map((stage, index) => <section key={stage.id} className={styles.navStage}>
        <h3><span>{String(index + 1).padStart(2, "0")}</span>{stage.title}</h3>
        {stage.resources?.map(resource => <Link key={resource.href} href={resource.href} className={styles.chapter} onClick={onNavigate}><BookOpen size={15} aria-hidden="true" /><span>{resource.title}</span></Link>)}
        <ul className={styles.chapterList}>{stage.chapters.map(chapter => <li key={chapter.articleId ?? chapter.title}>{chapter.href ? <Link href={chapter.href} className={styles.chapter} aria-current={chapter.articleId === articleId ? "page" : undefined} onClick={onNavigate}><BookOpen size={15} aria-hidden="true" /><span>{chapter.title}</span></Link> : <span className={styles.chapter} aria-disabled="true">{chapter.title}<small>待更新</small></span>}</li>)}</ul>
      </section>)}
    </nav>
  );
}

function PathOverview({ series, reading }: SeriesReaderContext) {
  return (
    <div className={styles.overview}>
      <header className={styles.intro}>
        <div className={styles.productTitle}><SeriesMark series={series} /><div><h1>{series.title}</h1><p>{series.description}</p></div></div>
        <p className={styles.introduction}>{series.introduction}</p>
        <div className={styles.introActions}>
          {(reading.stages[0]?.resources?.[0]?.href ?? reading.first?.href) && <Link href={reading.stages[0]?.resources?.[0]?.href ?? reading.first!.href!} className={styles.start}><BookOpen size={17} aria-hidden="true" />{reading.stages[0]?.resources?.length ? "阅读蓝皮书" : "开始阅读"}<ArrowRight size={15} aria-hidden="true" /></Link>}
          {reading.mapHref && <ProtectedContentLink href={reading.mapHref} prefetch={false} className={styles.mapLink}><Map size={17} aria-hidden="true" />资金地图</ProtectedContentLink>}
          <span>{reading.stages.length} 个阶段 · {reading.publishedCount} 篇已有文章</span>
        </div>
      </header>
      <nav className={styles.stageTabs} aria-label="学习阶段">{reading.stages.map((stage, index) => <a key={stage.id} href={`#stage-${stage.id}`}><span>{String(index + 1).padStart(2, "0")}</span>{stage.title}</a>)}</nav>
      {reading.stages.map((stage, index) => <section key={stage.id} id={`stage-${stage.id}`} className={styles.pathStage} aria-labelledby={`heading-${stage.id}`}>
        <div className={styles.stageHeading}><span>{String(index + 1).padStart(2, "0")}</span><div><h2 id={`heading-${stage.id}`}>{stage.title}</h2><p>{stage.description}</p></div></div>
        {stage.resources?.map(resource => <Link key={resource.href} href={resource.href} className={styles.bookResource}><BookOpen size={24} aria-hidden="true" /><span><small>系统阅读</small>{resource.title}</span><ArrowUpRight size={18} aria-hidden="true" /></Link>)}
        <ul className={styles.outline}>{stage.chapters.map(chapter => {
          const content = <><span className={styles.outlineIcon} data-tone={index % 3}><BookOpen size={21} aria-hidden="true" /></span><span className={styles.outlineCopy}><span className={styles.outlineTitle}>{chapter.title}</span>{chapter.summary && <span className={styles.chapterSummary}>{chapter.summary}</span>}</span><span className={styles.chapterStatus}>{chapter.href ? <>阅读文章<ArrowRight size={15} aria-hidden="true" /></> : "待更新"}</span></>;
          return <li key={chapter.articleId ?? chapter.title}>{chapter.href ? <Link href={chapter.href} className={styles.outlineRow}>{content}</Link> : <div className={styles.outlineRow} aria-disabled="true">{content}</div>}</li>;
        })}</ul>
      </section>)}
    </div>
  );
}

function PathPagination({ series, reading, articleId, compact }: SeriesReaderContext & { compact?: boolean }) {
  const stage = reading.stages[reading.currentStageIndex];
  const nextStage = reading.stages.slice(reading.currentStageIndex + 1).find(item => item.resources?.length || item.chapters.some(chapter => chapter.href));
  if (compact) return <nav className={styles.toolbar} aria-label="当前学习路线"><div className={styles.position}><BookOpen size={16} aria-hidden="true" /><Link href={reading.overviewHref}>{series.title}</Link>{stage && <small>{stage.title}</small>}</div>{reading.mapHref && <div className={styles.arrows}><ProtectedContentLink href={reading.mapHref} prefetch={false} aria-label="返回资金地图" title="返回资金地图"><Map size={18} /></ProtectedContentLink></div>}</nav>;
  const alternatives = stage?.chapters.filter(chapter => chapter.href && chapter.articleId !== articleId) ?? [];
  return <section className={styles.continuePath} aria-label="继续学习">
    {alternatives.length > 0 && <div className={styles.relatedPaths}><span>同阶段其他文章</span>{alternatives.map(chapter => <Link key={chapter.articleId} href={chapter.href!}>{chapter.title}<ArrowUpRight size={14} aria-hidden="true" /></Link>)}</div>}
    <nav className={styles.pagination} aria-label="学习阶段切换">
      <Link href={reading.overviewHref}><ArrowLeft size={18} aria-hidden="true" /><span><small>当前路线</small>返回路线目录</span></Link>
      {nextStage ? <Link href={`${reading.overviewHref}#stage-${nextStage.id}`} className={styles.next}><span><small>下一阶段</small>{nextStage.title}</span><ArrowRight size={18} aria-hidden="true" /></Link> : <ProtectedContentLink href={reading.mapHref ?? "/roadmap"} prefetch={false} className={styles.next}><span><small>本路线当前最后一个阶段</small>返回学习路线</span><Map size={18} aria-hidden="true" /></ProtectedContentLink>}
    </nav>
  </section>;
}

export function SeriesNavigation({ series, reading, articleId, onNavigate }: SeriesReaderContext & { onNavigate?: () => void }) {
  if (series.kind === "path") return <PathNavigation series={series} reading={reading} articleId={articleId} onNavigate={onNavigate} />;
  const presentation = getPresentation(series);
  const isTopic = series.kind === "topic";
  return (
    <nav aria-label={isTopic ? "系列内容" : "系列章节"} className={styles.navigation}>
      <Link href="/articles?view=series" className={styles.back} onClick={onNavigate}><ArrowLeft size={15} aria-hidden="true" />全部系列</Link>
      <div className={styles.heading}>
        <SeriesMark series={series} small />
        <h2>{series.title}</h2>
        <p>{series.chapters.length} {isTopic ? "篇内容" : "个章节"} · {reading.publishedCount ? `${reading.publishedCount} 篇已发布` : "整理中"}</p>
      </div>
      <Link href={`/articles/series/${series.id}`} onClick={onNavigate} className={styles.overviewLink} aria-current={!articleId ? "page" : undefined}><LayoutGrid size={16} aria-hidden="true" />系列概览</Link>
      <ol className={styles.chapterList}>
        {reading.chapters.map(chapter => {
          const Icon = presentation.chapters[chapter.index]?.icon ?? BookOpen;
          return (
          <li key={chapter.title}>
            {chapter.href ? (
              <Link href={chapter.href} onClick={onNavigate} aria-current={chapter.articleId === articleId ? "page" : undefined} className={styles.chapter}>
                <span className={styles.chapterIcon} data-tone={chapter.index % 3}><Icon size={17} strokeWidth={1.6} aria-hidden="true" /></span>
                <span><small>第 {chapter.index + 1} {isTopic ? "篇" : "章"}</small>{chapter.title}</span>
                {chapter.articleId === articleId && <BookOpen size={15} aria-hidden="true" />}
              </Link>
            ) : (
              <div className={styles.chapter} aria-disabled="true">
                <span className={styles.chapterIcon} data-tone={chapter.index % 3}><Icon size={17} strokeWidth={1.6} aria-hidden="true" /></span>
                <span>{chapter.title}<small>待更新</small></span>
              </div>
            )}
          </li>
        ); })}
      </ol>
      {reading.existingHref && <Link href={reading.existingHref} onClick={onNavigate} className={styles.supplement} aria-current={articleId === series.existingArticleId ? "page" : undefined}><BookOpen size={16} aria-hidden="true" />{isTopic ? "现有相关文章" : "现有综合教程"}<ArrowRight size={15} aria-hidden="true" /></Link>}
    </nav>
  );
}

export function SeriesPagination({ series, reading, articleId, compact = false }: SeriesReaderContext & { compact?: boolean }) {
  if (series.kind === "path") return <PathPagination series={series} reading={reading} articleId={articleId} compact={compact} />;
  const { previous, next, currentIndex } = reading;
  const isTopic = series.kind === "topic";
  return (
    <nav aria-label={compact ? isTopic ? "文章切换" : "章节切换" : isTopic ? "继续阅读" : "继续学习"} className={compact ? styles.toolbar : styles.pagination}>
      {compact ? (
        <>
          <div className={styles.position}><BookOpen size={16} aria-hidden="true" /><Link href={`/articles/series/${series.id}`}>{series.title}</Link><small>{currentIndex >= 0 ? `第 ${currentIndex + 1} / ${series.chapters.length} ${isTopic ? "篇" : "章"}` : isTopic ? "相关文章" : "综合教程"}</small></div>
          <div className={styles.arrows}>
            {previous?.href ? <Link href={previous.href} aria-label={`上一篇：${previous.title}`} title={`上一篇：${previous.title}`}><ArrowLeft size={18} /></Link> : <button disabled aria-label="没有上一篇"><ArrowLeft size={18} /></button>}
            {next?.href ? <Link href={next.href} aria-label={`下一篇：${next.title}`} title={`下一篇：${next.title}`}><ArrowRight size={18} /></Link> : <button disabled aria-label="没有下一篇"><ArrowRight size={18} /></button>}
          </div>
        </>
      ) : (
        <>
          {previous?.href ? <Link href={previous.href}><ArrowLeft size={18} aria-hidden="true" /><span><small>上一篇</small>{previous.title}</span></Link> : <Link href="/articles?view=series"><ArrowLeft size={18} aria-hidden="true" /><span><small>{isTopic ? "系列内容" : "系列教程"}</small>返回全部系列</span></Link>}
          {next?.href ? <Link href={next.href} className={styles.next}><span><small>下一篇</small>{next.title}</span><ArrowRight size={18} aria-hidden="true" /></Link> : <div className={styles.end}><BookOpen size={18} aria-hidden="true" /><span>{currentIndex >= 0 ? "已到当前系列最后一篇" : isTopic ? "相关文章整理中" : "独立章节整理中"}<small>{series.status === "updating" ? isTopic ? "后续文章持续更新" : "后续章节持续更新" : "发布后将在目录中显示"}</small></span></div>}
        </>
      )}
    </nav>
  );
}

export function SeriesOverview({ series, reading }: SeriesReaderContext) {
  if (series.kind === "path") return <PathOverview series={series} reading={reading} />;
  const presentation = getPresentation(series);
  const startHref = reading.first?.href ?? reading.existingHref;
  const isTopic = series.kind === "topic";
  return (
    <div className={styles.overview}>
      <header className={styles.intro}>
        <div className={styles.productTitle}><SeriesMark series={series} /><div><h1>{series.title}</h1><p>{series.description}</p></div></div>
        <p className={styles.introduction}>{presentation.introduction}</p>
        <div className={styles.introActions}>
          {startHref && <Link href={startHref} className={styles.start}><BookOpen size={17} aria-hidden="true" />{reading.first ? isTopic ? "开始阅读" : "开始学习" : isTopic ? "阅读相关文章" : "阅读现有综合教程"}<ArrowRight size={17} aria-hidden="true" /></Link>}
          <span>{reading.publishedCount > 0 ? `${reading.publishedCount} 篇已发布` : isTopic ? "相关文章整理中" : "独立章节整理中"} · {series.chapters.length} {isTopic ? "篇内容" : "个章节"}</span>
        </div>
        {series.id === "binance" && <p className={styles.caution}>功能开放与使用资格因地区而异，操作前请核对平台规则。<a href="https://www.binance.com/en/academy/articles/binance-beginner-s-guide" target="_blank" rel="noopener noreferrer">官方介绍<ArrowUpRight size={12} aria-hidden="true" /></a></p>}
      </header>
      {presentation.outcomes.length > 0 ? (
        <section className={styles.learning} aria-labelledby="series-learning-heading">
          <h2 id="series-learning-heading">{isTopic ? "这个系列关注什么" : "你将在这个系列学到"}</h2>
          <div className={styles.outcomes}>{presentation.outcomes.map(({ icon: Icon, title, description }, index) => <div key={title} className={styles.outcome}><span className={styles.outcomeIcon} data-tone={index}><Icon size={21} strokeWidth={1.6} aria-hidden="true" /></span><h3>{title}</h3><p>{description}</p></div>)}</div>
        </section>
      ) : null}
      <section aria-labelledby="series-outline-heading">
        <div className={styles.outlineHeader}><h2 id="series-outline-heading">{isTopic ? "内容目录" : reading.publishedCount ? "学习目录" : "章节规划"}<small>（{series.chapters.length}）</small></h2><span>{isTopic ? "按自己的需要选择阅读" : reading.publishedCount ? "按章节循序学习" : "独立章节将陆续更新"}</span></div>
        <ol className={styles.outline}>
          {reading.chapters.map(chapter => {
            const detail = presentation.chapters[chapter.index];
            const Icon = detail?.icon ?? BookOpen;
            const content = <><span className={styles.outlineIcon} data-tone={chapter.index % 3}><Icon size={22} strokeWidth={1.5} aria-hidden="true" /></span><span className={styles.outlineCopy}><span className={styles.outlineTitle}><span className={styles.number}>{String(chapter.index + 1).padStart(2, "0")}</span>{chapter.title}</span>{detail?.summary && <span className={styles.chapterSummary}>{detail.summary}</span>}</span><span className={styles.chapterStatus}>{chapter.href ? <><Check size={13} aria-hidden="true" />开始阅读<ArrowRight size={15} aria-hidden="true" /></> : "待更新"}</span></>;
            return <li key={chapter.title}>{chapter.href ? <Link href={chapter.href} className={styles.outlineRow}>{content}</Link> : <div className={styles.outlineRow} aria-disabled="true">{content}</div>}</li>;
          })}
        </ol>
      </section>
    </div>
  );
}
