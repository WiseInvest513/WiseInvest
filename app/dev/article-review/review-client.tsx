"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, ChevronDown, Download, FileText, ImageIcon, Link2, Search } from "lucide-react";
import { genUid } from "@/lib/article-uid";
import type { Evidence, ReviewData, ReviewRecord } from "./types";
import styles from "./review.module.css";

type Decision = { status: string; note: string };
type Decisions = Record<string, Decision>;
const storageKey = "wise-article-referral-review-v1";
const decisionsList = ["待判断", "可同步", "需修改", "暂不放"];
const categoryNames: Record<string, string> = { crypto: "加密交易所", broker: "券商开户", bank: "银行开户", vcard: "虚拟卡", simcard: "电话卡", ai: "AI 工具", OnChain: "链上美股", onchain: "链上美股", predict: "预测市场", PREDICT: "预测市场", index: "指数投资", outside: "出海账号", domestic: "境内投资", VIP: "VIP", web: "网站指南" };
const statusNames: Record<string, string> = { "has-referral": "含邀请信息", referral: "含邀请信息", "site-only": "仅福利页有入口", "benefits-only": "有福利，缺邀请入口", "public-registration": "普通注册 / 购买", "related-guide": "综合 / 关联教程", "no-referral": "未见邀请信息" };
const invitationStatuses = new Set(["has-referral", "referral", "site-only", "benefits-only", "related-guide"]);
const clean = (text: string) => text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*`]/g, "").replace(/^>\s*/g, "");
const route = (id: string, category: string) => `/articles/${category}/${genUid(id)}`;

function SourceList({ title, entries }: { title: string; entries: Evidence[] }) {
  return <section className={styles.evidenceSection}>
    <h4>{title}</h4>
    {entries.length ? <ul>{entries.map((item, i) => <li key={i}>
      <p>{clean(item.text || item.context || "")}</p><span className={styles.line}>审计快照 L{item.line}</span>
    </li>)}</ul> : <p className={styles.muted}>原文未明确写出</p>}
  </section>;
}

function ReferralCard({ record: r, decision, onChange, published }: { record: ReviewRecord; decision: Decision; onChange: (value: Decision) => void; published: boolean }) {
  const codes = r.invitationConfirmation ? [r.invitationConfirmation.code] : [...new Set(r.inviteCodes.map(x => x.code).filter(Boolean))];
  const remainingIssues = r.confirmation?.remainingIssues ?? r.invitationConfirmation?.remainingIssues ?? r.issues;
  return <details className={styles.card} data-record={r.key}>
    <summary className={styles.cardSummary}>
      <div className={styles.product}><span className={styles.eyebrow}>{categoryNames[r.categoryId] || r.categoryId} · {published ? "文章" : "未发布草稿"}</span><h3>{r.productName}</h3><span className={styles.small}>{statusNames[r.status] || r.status}</span></div>
      <div className={styles.codeColumn}><span className={styles.small}>{r.invitationConfirmation ? "已确认的邀请码" : "稿件邀请码"}</span><strong>{codes.length ? codes.join(" / ") : "未单列"}</strong></div>
      <div className={styles.summaryText}><p>{r.confirmation?.text ?? (r.invitationConfirmation ? `邀请码已统一为 ${r.invitationConfirmation.code}。` : r.proposalSummary)}</p><div className={styles.badges}>{r.confirmation && <span className={styles.removedBadge}>福利口径已确认</span>}{r.invitationConfirmation && <span className={styles.removedBadge}>邀请码已确认</span>}{remainingIssues.length > 0 && <span className={styles.issueBadge}>{remainingIssues.length} 项待核对</span>}{decision.status !== "待判断" && <span className={styles.decisionBadge}>{decision.status}</span>}</div></div>
      <ChevronDown className={styles.chevron} size={18} />
    </summary>
    <div className={styles.cardBody}>
      <div className={styles.articleMeta}><span>{r.title}</span>{published && <a href={route(r.articleId, r.categoryId)} target="_blank" rel="noreferrer">查看文章 <ArrowUpRight size={14} /></a>}</div>
      <div className={styles.sourcePath}>{r.filePath}</div>
      {r.articleUpdatedAt && <p className={styles.small}>文章已于 {r.articleUpdatedAt} 更新；下方原文及链接保留为同步前的审计快照，当前展示请查看文章。</p>}
      {r.invitationConfirmation && !r.confirmation && <section className={styles.confirmationBox}><h4>已确认的邀请码</h4><p><code>{r.invitationConfirmation.code}</code></p><span>{r.invitationConfirmation.source} · {r.invitationConfirmation.confirmedAt} · {r.invitationConfirmation.syncedAt ? "已同步正文" : "待同步正文"}</span><details><summary>查看确认前的审计记录</summary><p>{r.proposalSummary}</p><ul>{r.issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul></details></section>}
      {r.confirmation && <section className={styles.confirmationBox}><h4>已确认的卡片文案</h4><p>{r.confirmation.text}</p>{r.invitationConfirmation && <p>邀请码：<code>{r.invitationConfirmation.code}</code></p>}<span>{r.confirmation.source} · {r.confirmation.confirmedAt} · {r.confirmation.syncedAt ? "已同步正文" : "待同步正文"}</span><details><summary>查看确认前的审计记录</summary><p>{r.proposalSummary}</p><ul>{r.issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul></details></section>}
      {remainingIssues.length > 0 && <section className={styles.issueBox}><h4>{r.articleUpdatedAt ? "同步前的审计发现" : r.confirmation ? "其余待核对项" : "需要一起判断"}</h4><ul>{remainingIssues.map((issue, i) => <li key={i}>{issue}</li>)}</ul></section>}
      <div className={styles.evidenceGrid}><SourceList title="原文福利" entries={r.benefits} /><SourceList title="领取条件与限制" entries={r.conditions} /></div>
      <section className={styles.evidenceSection}><h4>正文邀请入口与代码出处（原稿）</h4>
        {!r.registrationLinks.length && !r.inviteCodes.length && <p className={styles.muted}>正文没有明确邀请入口；如福利页另有配置，见下方对照。</p>}
        {r.registrationLinks.map((item, i) => <div className={styles.linkRow} key={`link-${i}`}><a href={item.url} target="_blank" rel="noreferrer">{item.url} <ArrowUpRight size={13} /></a><span className={styles.line}>L{item.line}</span><p>{clean(item.context || "")}</p></div>)}
        {r.inviteCodes.map((item, i) => <div className={styles.linkRow} key={`code-${i}`}><code>{item.code}</code><span className={styles.line}>{item.imageUrl ? "图片引用 " : ""}L{item.line}</span><p>{clean(item.context || "")}</p>{item.imageUrl && <a href={item.imageUrl} target="_blank" rel="noreferrer">查看邀请码原图 <ArrowUpRight size={13} /></a>}</div>)}
      </section>
      {r.siteComparison.length > 0 && <section className={styles.evidenceSection}><h4>站内福利页 / 其他配置对照</h4><div className={styles.comparisons}>{r.siteComparison.map((item, i) => <div key={i}><p>{item.note}</p><pre>{item.value}</pre><span className={styles.sourcePath}>{item.source}</span></div>)}</div></section>}
      {r.imageEvidence.length > 0 && <section className={styles.evidenceSection}><h4>图片里的活动信息</h4>{r.imageEvidence.map((item, i) => <div className={styles.imageEvidence} key={i}><p>{item.text}</p><a href={item.imageUrl} target="_blank" rel="noreferrer">查看证据图片 · 正文 L{item.line} <ArrowUpRight size={13} /></a></div>)}</section>}
      <div className={styles.decisionForm}>
        <label>整条记录的判断<select aria-label={`${r.productName}的判断`} value={decision.status} onChange={e => onChange({ ...decision, status: e.target.value })}>{decisionsList.map(x => <option key={x}>{x}</option>)}</select></label>
        <label className={styles.noteLabel}>备注<input aria-label={`${r.productName}的备注`} placeholder="例如：保留 20% 返佣，活动奖励暂不前置" value={decision.note} onChange={e => onChange({ ...decision, note: e.target.value })} /></label>
      </div>
    </div>
  </details>;
}

export default function ReviewClient({ data }: { data: ReviewData }) {
  const [tab, setTab] = useState("referrals");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [filter, setFilter] = useState("invitation");
  const [imageFilter, setImageFilter] = useState("all");
  const [decisions, setDecisions] = useState<Decisions>({});
  const [saveMessage, setSaveMessage] = useState("判断和备注只保存在当前浏览器，可导出交给我继续处理。");
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        const valid: Decisions = {};
        for (const [key, value] of Object.entries(saved)) {
          if (value && typeof value === "object" && "status" in value && "note" in value && typeof value.status === "string" && decisionsList.includes(value.status) && typeof value.note === "string") valid[key] = { status: value.status, note: value.note };
        }
        setDecisions(valid);
      }
    } catch { setSaveMessage("浏览器存储不可用；本次判断可通过导出保存。"); }
  }, []);
  function updateDecision(key: string, value: Decision) {
    const next = { ...decisions, [key]: value };
    setDecisions(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setSaveMessage("已保存到当前浏览器，尚未同步文章。"); }
    catch { setSaveMessage("浏览器存储不可用，请导出保存本次判断。"); }
  }
  function exportReview() {
    const blob = new Blob([JSON.stringify({ ...data, decisions }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = `wise-article-review-${data.auditedAt}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const normalizedQuery = query.trim().toLowerCase();
  const matches = (item: { categoryId: string }, text: string) => (category === "all" || category === item.categoryId) && (!normalizedQuery || text.toLowerCase().includes(normalizedQuery));
  const records = data.records.filter(r => matches(r, JSON.stringify(r)) && (filter === "all" || (filter === "invitation" && invitationStatuses.has(r.status)) || (filter === "issues" && (r.confirmation?.remainingIssues ?? r.invitationConfirmation?.remainingIssues ?? r.issues).length > 0) || (filter === "confirmed" && r.confirmation) || (filter === "reviewed" && decisions[r.key]?.status && decisions[r.key].status !== "待判断") || (filter === "none" && r.status === "no-referral")));
  const articles = data.articles.filter(a => matches(a, JSON.stringify(a)));
  const images = data.images.filter(i => matches(i, JSON.stringify(i)) && (imageFilter === "all" || (imageFilter === "removed" && i.applied) || (imageFilter === "ambiguous" && i.ambiguous) || (imageFilter === "kept" && !i.applied)));
  const articleMap = useMemo(() => new Map(data.articles.map(a => [a.filePath, a])), [data.articles]);
  const categories = [...new Set(data.articles.map(a => a.categoryId))];
  const reviewed = Object.values(decisions).filter(d => d.status !== "待判断").length;
  const confirmedCount = data.records.filter(r => r.confirmation).length;
  const count = tab === "referrals" ? records.length : tab === "links" ? articles.length : images.length;
  return <section aria-label="文章评审" className={styles.page}><div className={styles.container}>
    <header className={styles.header}><div><span className={styles.kicker}>WISE INVEST / 内容整理</span><h1>邀请码与福利，一起过一遍。</h1><p>先看原文与站内差异，再决定每个邀请卡片放什么。</p><a href="/dev/article-review/benefits" className={`${styles.exportButton} ${styles.currentBenefitsLink}`}>查看当前福利与待补清单 <ArrowUpRight size={16} /></a></div><button className={styles.exportButton} onClick={exportReview}><Download size={16} />导出清单与判断</button></header>
    {!!data.confirmedPolicies?.length && <section aria-label="已确认的福利口径" className={styles.confirmedPolicies}><h2><Check size={16} />{data.rollout ? "已确认并同步的口径" : "这三条已经确认"}</h2><div>{data.confirmedPolicies.map(policy => <article key={policy.id}><span>{policy.title}</span><h3>{policy.text}</h3><p>{policy.note}</p></article>)}</div>{!!data.confirmedInvites?.length && <p><strong>邀请码已确认：</strong>{data.confirmedInvites.map(item => `${item.productName}：${item.code}`).join("；")}。</p>}<p>{data.rollout ? `已为 ${data.rollout.cardArticles} 篇教程新增 ${data.rollout.cardsAdded} 张邀请卡，确认的福利与邀请码已同步到正文。` : "已记录你的确认，下面保留原稿证据。其余链接与活动单独处理，正文尚未批量同步。"}</p>{data.rollout?.deferred.map(text => <p key={text}>{text}</p>)}</section>}
    {data.rollout?.placement === "registration-step" ? <p className={styles.notice}>邀请卡已按正文注册、填码或领取优惠的步骤放置，不再统一置顶。邀请码、复制和注册链接同排展示，福利区采用紧凑布局。</p> : null}
    <div className={styles.stats}><div><strong>{data.stats.files}</strong><span>份稿件 · {data.stats.published} 篇有发布 ID</span></div><div><strong>{data.stats.referralArticles}</strong><span>篇涉及邀请入口 / 代码</span></div><div><strong>{data.stats.linkOccurrences}</strong><span>处链接 · 分布于 {data.stats.articlesWithLinks} 篇</span></div><div><strong>{data.stats.removedImages}<small> / {data.stats.preservedImageReferences}</small></strong><span>张封面移除 / 图片引用保留</span></div></div>
    <div className={styles.notice}><Check size={17} /><p><strong>{data.rollout ? "邀请卡与已确认福利已同步，原图保留。" : "首图已按用途处理，邀请码尚未批量同步。"}</strong>{data.rollout ? "下方原文、链接及问题是同步前的审计快照，保留用于追溯；当前入口和福利以文章中的新卡片为准。" : "此页整理现有稿件与福利页内容；有冲突、已过期或条件不全的内容单独标出，未重新核验活动现行有效性。"}审计日期：{data.auditedAt}。</p></div>
    <div className={styles.toolbar}>
      <div className={styles.tabs} role="tablist" aria-label="评审内容">{[{ id: "referrals", label: "邀请码与福利", icon: FileText }, { id: "links", label: "全部链接", icon: Link2 }, { id: "images", label: "首图处理", icon: ImageIcon }].map(t => <button id={`tab-${t.id}`} role="tab" aria-selected={tab === t.id} aria-controls="review-panel" key={t.id} onClick={() => setTab(t.id)}><t.icon size={16} />{t.label}</button>)}</div>
      <div className={styles.filters}><label className={styles.search}><Search size={16} /><input aria-label="搜索文章、平台或邀请码" placeholder="搜索平台、邀请码、福利…" value={query} onChange={e => setQuery(e.target.value)} /></label><select aria-label="文章分类" value={category} onChange={e => setCategory(e.target.value)}><option value="all">全部分类</option>{categories.map(c => <option value={c} key={c}>{categoryNames[c] || c}</option>)}</select>
        {tab === "referrals" && <select aria-label="邀请筛选" value={filter} onChange={e => setFilter(e.target.value)}><option value="invitation">邀请 / 福利相关</option><option value="confirmed">福利口径已确认</option><option value="issues">有待核对项</option><option value="all">全部审计记录</option><option value="none">未见邀请信息</option><option value="reviewed">已填写判断</option></select>}
        {tab === "images" && <select aria-label="首图筛选" value={imageFilter} onChange={e => setImageFilter(e.target.value)}><option value="all">全部首图</option><option value="removed">已移除封面</option><option value="ambiguous">混合信息，先保留</option><option value="kept">全部保留项</option></select>}
      </div>
    </div>
    <div className={styles.resultLine}><span>显示 {count} {tab === "referrals" ? "条产品记录 · 同篇涉及多个平台会分列" : "份稿件"}</span><span>{confirmedCount} 条福利已确认 · {reviewed} 条手动标记</span></div>
    <div id="review-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className={styles.results}>
      {tab === "referrals" && records.map(r => <ReferralCard key={r.key} record={r} published={articleMap.get(r.filePath)?.published ?? false} decision={decisions[r.key] || { status: "待判断", note: "" }} onChange={value => updateDecision(r.key, value)} />)}
      {tab === "links" && articles.map(a => <details className={styles.card} key={a.filePath}><summary className={styles.simpleSummary}><div><span className={styles.eyebrow}>{categoryNames[a.categoryId] || a.categoryId}{!a.published && " · 未发布草稿"}</span><h3>{a.title}</h3></div><span className={styles.linkCount}>{a.links.length} 处链接</span><ChevronDown size={18} className={styles.chevron} /></summary><div className={styles.cardBody}><p className={styles.sourcePath}>{a.filePath}</p>{!a.links.length && <p className={styles.muted}>未发现文字链接；图片中的邀请码和活动信息见「邀请码与福利」。</p>}{a.links.map((link, i) => <div className={styles.linkRow} key={i}><span className={styles.issueBadge}>{link.kind}</span><span className={styles.line}>L{link.line}</span><a href={link.url.startsWith(".") ? `/content/articles/${a.filePath.slice("content/articles/".length).split("/").slice(0, -1).join("/")}/${link.url.replace(/^\.\//, "")}` : link.url} target="_blank" rel="noreferrer">{link.url} <ArrowUpRight size={13} /></a><p>{link.context}</p></div>)}</div></details>)}
      {tab === "images" && images.map(item => <div className={`${styles.card} ${styles.imageCard}`} key={item.filePath}>{item.src && !item.missingAsset ? <a href={item.src} target="_blank" rel="noreferrer"><img src={item.src} alt={item.alt || item.title} loading="lazy" /></a> : <div className={styles.noImage}><ImageIcon size={25} /><span>{item.missingAsset ? "原图文件缺失" : "无正文图片"}</span></div>}<div><div className={styles.badges}><span className={item.applied ? styles.removedBadge : styles.decisionBadge}>{item.applied ? "已移除正文封面" : item.ambiguous ? "含功能信息 · 先保留" : item.imageCount ? "保留" : "无图"}</span><span className={styles.small}>原正文 {item.imageCount} 张图</span></div><h3>{item.title}</h3><p>{item.reason}</p><span className={styles.sourcePath}>{item.filePath}{item.originalLine ? ` · 原 L${item.originalLine}` : ""}</span>{item.applied && <p className={styles.small}>仅删除正文引用，源图与列表封面保留。</p>}</div></div>)}
      {!count && <div className={styles.empty}>没有匹配的记录，试试其他关键词或筛选条件。</div>}
    </div>
    <footer className={styles.footer}>{saveMessage}</footer>
  </div></section>;
}
