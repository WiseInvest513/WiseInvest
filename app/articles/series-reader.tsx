"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, ArrowLeftRight, BookOpen, ChevronDown, Coins, Gift, Globe2, LayoutGrid, Layers, Mail, Map as MapIcon, ShieldCheck, ShieldAlert, Smartphone, UserRound, Wallet, ChartNoAxesCombined, type LucideIcon } from "lucide-react";
import type { ArticleListItem } from "@/lib/articles";
import { SeriesArticleEntry } from "./series-article-entry";
import { SeriesRecommendations } from "./series-recommendations";
import { SeriesFavoriteButton } from "./series-favorite-button";
import { SeriesProgressPanel, useReadableSeriesProgress } from "./series-progress";
import type { ArticleSeries } from "@/lib/article-library";
import { getArticleLearningPaths, getSeriesAvailabilityLabel, getSeriesOverviewHref, type SeriesReadingState } from "@/lib/article-series";
import { ProtectedContentLink } from "@/components/content-access-gate";
import styles from "./series-reader.module.css";

export interface SeriesReaderContext {
  series: ArticleSeries;
  reading: SeriesReadingState;
  articleId?: string;
  articles?: ArticleListItem[];
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

export function SeriesTypeBadge({ kind = "article", label }: { kind?: string; label?: string }) {
  return <span className={styles.typeBadge} data-content-type={kind}>{label ?? (kind === "series" ? "系列教程" : "学习文章")}</span>;
}

export function SeriesReturnNotice({ reading }: { reading: SeriesReadingState }) {
  const parent = reading.returnTo;
  if (!parent) return null;
  return <nav className={styles.returnNotice} aria-label="返回原学习阶段">
    <span><small>来自系列</small><strong>{parent.title}</strong><span>{parent.stageTitle}</span></span>
    <Link href={parent.href}><ArrowLeft size={15} aria-hidden="true" />返回原阶段</Link>
  </nav>;
}

function SeriesResource({ resource, compact, onNavigate }: {
  resource: NonNullable<SeriesReadingState["stages"][number]["resources"]>[number];
  compact?: boolean; onNavigate?: () => void;
}) {
  const target = resource;
  const Icon = target.kind === "series" ? Layers : target.kind === "tool" ? ChartNoAxesCombined : BookOpen;
  return <Link href={target.href} className={compact ? styles.chapter : styles.bookResource} onClick={onNavigate} data-series-resource={target.kind}>
    <Icon size={compact ? 15 : 24} aria-hidden="true" />
    <span className={styles.resourceCopy}>{resource.title}{!compact && target.series && <small>进入子系列 · 可返回当前阶段继续学习</small>}</span>
    <SeriesTypeBadge kind={target.kind} label={target.label} />
    {!compact && <ArrowRight size={16} aria-hidden="true" />}
  </Link>;
}

function PathNavigation({ series, reading, articleId, onNavigate }: SeriesReaderContext & { onNavigate?: () => void }) {
  const navigationId = useId();
  const progress = useReadableSeriesProgress(series, reading, articleId);
  const [expandedStage, setExpandedStage] = useState<string | undefined>(() => reading.stages[Math.max(0, reading.currentStageIndex)]?.id);
  useEffect(() => {
    if (articleId) return;
    const followHash = () => {
      const id = window.location.hash.replace(/^#stage-/, "");
      if (reading.stages.some(stage => stage.id === id)) setExpandedStage(id);
    };
    followHash();
    window.addEventListener("hashchange", followHash);
    return () => window.removeEventListener("hashchange", followHash);
  }, [articleId, reading.stages]);
  return (
    <nav aria-label="学习路线目录" className={styles.navigation}>
      <Link href={reading.returnTo?.href ?? "/articles?view=series"} className={styles.back} onClick={onNavigate}><ArrowLeft size={15} aria-hidden="true" />{reading.returnTo ? "返回原学习阶段" : "全部系列"}</Link>
      <div className={styles.heading}><SeriesMark series={series} small /><h2>{series.title}</h2><p>{reading.stages.length} 个阶段 · {reading.publishedCount} 篇文章</p><SeriesProgressPanel snapshot={progress.snapshot} ready={progress.ready} disabled={progress.disabled} onClear={progress.clear} onToggleDisabled={progress.toggleDisabled} /></div>
      <Link href={reading.overviewHref} className={styles.overviewLink} aria-current={!articleId ? "page" : undefined} onClick={onNavigate}><LayoutGrid size={16} aria-hidden="true" />路线目录</Link>
      {reading.mapHref && <ProtectedContentLink href={reading.mapHref} prefetch={false} className={styles.overviewLink}><MapIcon size={16} aria-hidden="true" />返回资金地图</ProtectedContentLink>}
      {reading.stages.map((stage, index) => {
        const expanded = expandedStage === stage.id;
        const panelId = `${navigationId}-stage-${index}`;
        return <section key={stage.id} className={styles.navStage} data-current={index === reading.currentStageIndex || undefined}>
          <h3><button id={`${panelId}-toggle`} type="button" className={styles.stageToggle} aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpandedStage(expanded ? undefined : stage.id)}><span>{String(index + 1).padStart(2, "0")}</span><span>{stage.title}</span><ChevronDown size={15} aria-hidden="true" /></button></h3>
          <div id={panelId} hidden={!expanded} aria-labelledby={`${panelId}-toggle`}>
            {stage.resources?.map(resource => <SeriesResource key={resource.href} resource={resource} compact onNavigate={onNavigate} />)}
            <ul className={styles.chapterList}>{stage.chapters.map(chapter => <li key={chapter.articleId ?? chapter.title}>{chapter.href ? <Link href={chapter.href} className={styles.chapter} data-read={progress.isRead(chapter.articleId) || undefined} aria-current={chapter.articleId === articleId ? "page" : undefined} onClick={onNavigate}><BookOpen size={15} aria-hidden="true" /><span>{chapter.title}</span><SeriesTypeBadge /></Link> : <span className={styles.chapter} aria-disabled="true">{chapter.title}<small>待更新</small></span>}</li>)}</ul>
          </div>
        </section>;
      })}
    </nav>
  );
}

function stageResourceSummary(resources: NonNullable<SeriesReadingState["stages"][number]["resources"]>) {
  const seriesCount = resources.filter(resource => resource.kind === "series").length;
  return [seriesCount ? `${seriesCount} 个子系列` : "", resources.length > seriesCount ? `${resources.length - seriesCount} 份资料` : ""].filter(Boolean).join(" · ");
}

function PathOverview({ series, reading, articles = [] }: SeriesReaderContext) {
  const byId = new globalThis.Map(articles.map(article => [article.id, article]));
  const progress = useReadableSeriesProgress(series, reading, undefined, false);
  return (
    <div className={`${styles.overview} ${styles.pathOverview}`}>
      <header className={styles.intro}>
        <div className={styles.productTitle}><SeriesMark series={series} /><div><h1>{series.title}</h1><p>{series.description}</p></div></div>
        <p className={styles.introduction}>{series.introduction}</p>
        <SeriesProgressPanel snapshot={progress.snapshot} ready={progress.ready} disabled={progress.disabled} onClear={progress.clear} onToggleDisabled={progress.toggleDisabled} />
        <div className={styles.introActions}>
          {reading.stages[0]?.resources?.length && reading.first?.href ? <Link href={reading.first.href} className={styles.start}><BookOpen size={17} aria-hidden="true" />从第一课开始<ArrowRight size={15} aria-hidden="true" /></Link> : null}
          {(reading.stages[0]?.resources?.[0]?.href ?? reading.first?.href) && <Link href={reading.stages[0]?.resources?.[0]?.href ?? reading.first!.href!} className={reading.stages[0]?.resources?.length && reading.first?.href ? styles.mapLink : styles.start}><BookOpen size={17} aria-hidden="true" />{reading.stages[0]?.resources?.length ? "阅读蓝皮书" : "开始阅读"}<ArrowRight size={15} aria-hidden="true" /></Link>}
          {reading.mapHref && <ProtectedContentLink href={reading.mapHref} prefetch={false} className={styles.mapLink}><MapIcon size={17} aria-hidden="true" />资金地图</ProtectedContentLink>}
          <SeriesFavoriteButton key={series.id} seriesId={series.id} title={series.title} summary={series.description} />
          <span>{reading.stages.length} 个阶段 · {reading.publishedCount} 篇已有文章</span>
        </div>
      </header>
      <nav className={styles.stageTabs} aria-label="学习阶段">{reading.stages.map((stage, index) => <a key={stage.id} href={`#stage-${stage.id}`}><span>{String(index + 1).padStart(2, "0")}</span>{stage.title}<ArrowRight size={13} aria-hidden="true" /></a>)}</nav>
      {reading.stages.map((stage, index) => <section key={stage.id} id={`stage-${stage.id}`} className={styles.pathStage} aria-labelledby={`heading-${stage.id}`}>
        {series.id === "nasdaq-investing" && (stage.id === "compare" ? <span id="stage-risk" /> : stage.id === "practice" ? <><span id="stage-plan" /><span id="stage-hold" /></> : null)}
        <div className={styles.stageHeading}><span>{String(index + 1).padStart(2, "0")}</span><div><div className={styles.stageTitleRow}><h2 id={`heading-${stage.id}`}>{stage.title}</h2>{reading.returnTo && <Link className={styles.stageReturn} href={reading.returnTo.href}><ArrowLeft size={13} aria-hidden="true" />返回原阶段</Link>}</div><p>{stage.description}</p></div><small>{stage.chapters.filter(chapter => chapter.href).length} 篇文章{stage.resources?.length ? ` · ${stageResourceSummary(stage.resources)}` : ""}</small></div>
        {stage.resources?.map(resource => <SeriesResource key={resource.href} resource={resource} />)}
        <ul className={styles.pathArticles}>{stage.chapters.map(chapter => <SeriesArticleEntry key={chapter.articleId ?? chapter.title} chapter={chapter} article={chapter.articleId ? byId.get(chapter.articleId) : undefined} read={progress.isRead(chapter.articleId)} />)}</ul>
      </section>)}
    </div>
  );
}

function PathPagination({ series, reading, articleId, compact }: SeriesReaderContext & { compact?: boolean }) {
  const stage = reading.stages[reading.currentStageIndex];
  const nextStage = reading.stages.slice(reading.currentStageIndex + 1).find(item => item.resources?.length || item.chapters.some(chapter => chapter.href));
  const progress = useReadableSeriesProgress(series, reading, articleId);
  if (compact) return <><SeriesReturnNotice reading={reading} /><SeriesProgressPanel snapshot={progress.snapshot} ready={progress.ready} disabled={progress.disabled} compact /><nav className={styles.toolbar} aria-label="当前学习路线"><div className={styles.position}><BookOpen size={16} aria-hidden="true" /><Link href={reading.overviewHref}>{series.title}</Link>{stage && <small>{stage.title}</small>}</div>{reading.mapHref && <div className={styles.arrows}><ProtectedContentLink href={reading.mapHref} prefetch={false} aria-label="返回资金地图" title="返回资金地图"><MapIcon size={18} /></ProtectedContentLink></div>}</nav></>;
  const alternatives = stage?.chapters.filter(chapter => chapter.href && chapter.articleId !== articleId) ?? [];
  return <section className={styles.continuePath} aria-label="继续学习">
    {alternatives.length > 0 && <div className={styles.relatedPaths}><span>同阶段其他文章</span>{alternatives.map(chapter => <Link key={chapter.articleId} href={chapter.href!}>{chapter.title}<ArrowUpRight size={14} aria-hidden="true" /></Link>)}</div>}
    <nav className={styles.pagination} aria-label="学习阶段切换">
      <Link href={reading.overviewHref}><ArrowLeft size={18} aria-hidden="true" /><span><small>当前路线</small>返回路线目录</span></Link>
      {nextStage ? <Link href={`${reading.overviewHref}#stage-${nextStage.id}`} className={styles.next}><span><small>下一阶段</small>{nextStage.title}</span><ArrowRight size={18} aria-hidden="true" /></Link> : <ProtectedContentLink href={reading.mapHref ?? "/roadmap"} prefetch={false} className={styles.next}><span><small>本路线当前最后一个阶段</small>返回学习路线</span><MapIcon size={18} aria-hidden="true" /></ProtectedContentLink>}
    </nav>
  </section>;
}

export function SeriesNavigation({ series, reading, articleId, onNavigate }: SeriesReaderContext & { onNavigate?: () => void }) {
  if (series.kind === "path") return <PathNavigation key={`${series.id}:${articleId ?? "overview"}`} series={series} reading={reading} articleId={articleId} onNavigate={onNavigate} />;
  return <StandardSeriesNavigation series={series} reading={reading} articleId={articleId} onNavigate={onNavigate} />;
}

function StandardSeriesNavigation({ series, reading, articleId, onNavigate }: SeriesReaderContext & { onNavigate?: () => void }) {
  const presentation = getPresentation(series);
  const isTopic = series.kind === "topic";
  const published = reading.chapters.filter(chapter => chapter.href);
  const planned = reading.chapters.filter(chapter => !chapter.href);
  const progress = useReadableSeriesProgress(series, reading, articleId);
  return (
    <nav aria-label={isTopic ? "系列内容" : "系列章节"} className={styles.navigation}>
      <Link href={reading.returnTo?.href ?? "/articles?view=series"} className={styles.back} onClick={onNavigate}><ArrowLeft size={15} aria-hidden="true" />{reading.returnTo ? "返回原学习阶段" : "全部系列"}</Link>
      <div className={styles.heading}>
        <SeriesMark series={series} small />
        <h2>{series.title}</h2>
        <p>{getSeriesAvailabilityLabel(series, reading)}</p>
        <SeriesProgressPanel snapshot={progress.snapshot} ready={progress.ready} disabled={progress.disabled} onClear={progress.clear} onToggleDisabled={progress.toggleDisabled} />
      </div>
      <Link href={reading.overviewHref} onClick={onNavigate} className={styles.overviewLink} aria-current={!articleId ? "page" : undefined}><LayoutGrid size={16} aria-hidden="true" />系列概览</Link>
      {reading.existingHref && <Link href={reading.existingHref} onClick={onNavigate} className={styles.supplement} aria-current={articleId === series.existingArticleId ? "page" : undefined}><BookOpen size={16} aria-hidden="true" /><span>阅读综合教程<small>已可读</small></span><ArrowRight size={15} aria-hidden="true" /></Link>}
      {published.length > 0 && <ol className={styles.chapterList}>
        {published.map(chapter => {
          const Icon = presentation.chapters[chapter.index]?.icon ?? BookOpen;
          return (
          <li key={chapter.title}>
              <Link href={chapter.href!} onClick={onNavigate} data-read={progress.isRead(chapter.articleId) || undefined} aria-current={chapter.articleId === articleId ? "page" : undefined} className={styles.chapter}>
                <span className={styles.chapterIcon} data-tone={chapter.index % 3}><Icon size={17} strokeWidth={1.6} aria-hidden="true" /></span>
                <span><small>第 {chapter.index + 1} {isTopic ? "篇" : "章"}</small>{chapter.title}</span><SeriesTypeBadge />
                {chapter.articleId === articleId && <BookOpen size={15} aria-hidden="true" />}
              </Link>
          </li>
        ); })}
      </ol>}
      {planned.length > 0 && <details className={styles.plannedNavigation}>
        <summary><span>{isTopic ? "后续内容规划" : "独立章节规划"}<small>{planned.length}</small></span><ChevronDown size={15} aria-hidden="true" /></summary>
        <ol className={styles.chapterList}>{planned.map(chapter => <li key={chapter.title}><span className={styles.plannedChapter}><span>{String(chapter.index + 1).padStart(2, "0")}</span>{chapter.title}</span></li>)}</ol>
      </details>}
    </nav>
  );
}

export function SeriesPagination({ series, reading, articleId, compact = false }: SeriesReaderContext & { compact?: boolean }) {
  if (series.kind === "path") return <PathPagination series={series} reading={reading} articleId={articleId} compact={compact} />;
  return <StandardSeriesPagination series={series} reading={reading} articleId={articleId} compact={compact} />;
}

function StandardSeriesPagination({ series, reading, articleId, compact = false }: SeriesReaderContext & { compact?: boolean }) {
  const { previous, next, currentIndex } = reading;
  const isTopic = series.kind === "topic";
  const progress = useReadableSeriesProgress(series, reading, articleId);
  return (
    <>{compact && <SeriesReturnNotice reading={reading} />}{compact && <SeriesProgressPanel snapshot={progress.snapshot} ready={progress.ready} disabled={progress.disabled} compact />}
    <nav aria-label={compact ? isTopic ? "文章切换" : "章节切换" : isTopic ? "继续阅读" : "继续学习"} className={compact ? styles.toolbar : styles.pagination}>
      {compact ? (
        <>
          <div className={styles.position}><BookOpen size={16} aria-hidden="true" /><Link href={reading.overviewHref}>{series.title}</Link><small>{currentIndex >= 0 ? `第 ${currentIndex + 1} / ${series.chapters.length} ${isTopic ? "篇" : "章"}` : isTopic ? "相关文章" : "综合教程"}</small></div>
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
    </nav></>
  );
}

export function SeriesOverview({ series, reading, articles = [] }: SeriesReaderContext) {
  return <div className={styles.pageLayout}>
    <div className={styles.mainColumn}><SeriesReturnNotice reading={reading} />{series.kind === "path" ? <PathOverview series={series} reading={reading} articles={articles} /> : <StandardOverview series={series} reading={reading} articles={articles} />}</div>
    <SeriesRecommendations series={series} articles={articles} />
  </div>;
}

function StandardOverview({ series, reading, articles = [] }: SeriesReaderContext) {
  const byId = new globalThis.Map(articles.map(article => [article.id, article]));
  const presentation = getPresentation(series);
  const startHref = reading.existingHref ?? reading.first?.href;
  const isTopic = series.kind === "topic";
  const published = reading.chapters.filter(chapter => chapter.href);
  const planned = reading.chapters.filter(chapter => !chapter.href);
  const progress = useReadableSeriesProgress(series, reading, undefined, false);
  return (
    <div className={styles.overview}>
      <header className={styles.intro}>
        <div className={styles.productTitle}><SeriesMark series={series} /><div><h1>{series.title}</h1><p>{series.description}</p></div></div>
        <p className={styles.introduction}>{presentation.introduction}</p>
        <SeriesProgressPanel snapshot={progress.snapshot} ready={progress.ready} disabled={progress.disabled} onClear={progress.clear} onToggleDisabled={progress.toggleDisabled} />
        <div className={styles.introActions}>
          {startHref && <Link href={startHref} className={styles.start}><BookOpen size={17} aria-hidden="true" />{reading.existingHref ? "阅读综合教程" : isTopic ? "开始阅读" : "开始学习"}<ArrowRight size={17} aria-hidden="true" /></Link>}
          <SeriesFavoriteButton key={series.id} seriesId={series.id} title={series.title} summary={series.description} />
          <span>{getSeriesAvailabilityLabel(series, reading)}</span>
        </div>
        {series.id === "binance" && <p className={styles.caution}>功能开放与使用资格因地区而异，操作前请核对平台规则。<a href="https://www.binance.com/en/academy/articles/binance-beginner-s-guide" target="_blank" rel="noopener noreferrer">官方介绍<ArrowUpRight size={12} aria-hidden="true" /></a></p>}
      </header>
      {reading.existingHref && <section className={styles.existingGuide} aria-labelledby="existing-guide-heading">
        <h2 id="existing-guide-heading">综合教程已可读</h2>
        <Link href={reading.existingHref} className={styles.bookResource}><BookOpen size={24} aria-hidden="true" /><span><small>从现有教程开始</small>{series.existingArticleTitle ?? `${series.title} · 综合教程`}</span><ArrowRight size={18} aria-hidden="true" /></Link>
      </section>}
      {presentation.outcomes.length > 0 ? (
        <section className={styles.learning} aria-labelledby="series-learning-heading">
          <h2 id="series-learning-heading">{isTopic ? "这个系列关注什么" : "你将在这个系列学到"}</h2>
          <div className={styles.outcomes}>{presentation.outcomes.map(({ icon: Icon, title, description }, index) => <div key={title} className={styles.outcome}><span className={styles.outcomeIcon} data-tone={index}><Icon size={21} strokeWidth={1.6} aria-hidden="true" /></span><h3>{title}</h3><p>{description}</p></div>)}</div>
        </section>
      ) : null}
      {published.length > 0 && <section aria-labelledby="series-outline-heading">
        <div className={styles.outlineHeader}><h2 id="series-outline-heading">{isTopic ? "内容目录" : "学习目录"}<small>（{published.length}）</small></h2><span>{isTopic ? "按自己的需要选择阅读" : "按章节循序学习"}</span></div>
        <ol className={styles.outline}>
          {published.map(chapter => <SeriesArticleEntry key={chapter.articleId ?? chapter.title} chapter={chapter} article={chapter.articleId ? byId.get(chapter.articleId) : undefined} read={progress.isRead(chapter.articleId)} />)}
        </ol>
      </section>}
      {planned.length > 0 && <details className={styles.plannedOutline}>
        <summary><span>{isTopic ? "后续内容规划" : "独立章节规划"}<small>{planned.length} {isTopic ? "篇" : "章"}筹备中</small></span><ChevronDown size={17} aria-hidden="true" /></summary>
        <p>{reading.existingHref ? "可先阅读上方综合教程。以下为待发布的独立章节，发布后会在目录中开放。" : "以下内容正在整理，发布后会在目录中开放。"}</p>
        <ol className={styles.outline}>
          {planned.map(chapter => {
            const detail = presentation.chapters[chapter.index];
            const Icon = detail?.icon ?? BookOpen;
            return <li key={chapter.title}><div className={styles.outlineRow} aria-disabled="true"><span className={styles.outlineIcon} data-tone={chapter.index % 3}><Icon size={22} strokeWidth={1.5} aria-hidden="true" /></span><span className={styles.outlineCopy}><span className={styles.outlineTitle}><span className={styles.number}>{String(chapter.index + 1).padStart(2, "0")}</span>{chapter.title}</span>{detail?.summary && <span className={styles.chapterSummary}>{detail.summary}</span>}</span><span className={styles.chapterStatus}>筹备中</span></div></li>;
          })}
        </ol>
      </details>}
    </div>
  );
}
