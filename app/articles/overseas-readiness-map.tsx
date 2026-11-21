"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, Check, Download, Mail, MessageSquareText, Plane, Smartphone, Wifi } from "lucide-react";
import type { SeriesReadingState } from "@/lib/article-series";
import styles from "./overseas-readiness-map.module.css";

const routes = [
  {
    id: "accounts", icon: Download, title: "注册与下载应用", shortTitle: "注册应用", hint: "先准备自己的账号",
    tools: [
      { title: "Google / Gmail", detail: "邮箱、登录与账号恢复", icon: Mail, articleId: "google-id" },
      { title: "Apple 账号", detail: "iPhone 下载应用时按需准备", icon: Smartphone, articleId: "AppleID" },
    ],
    outcome: "建立自己的使用入口", result: "收注册邮件、下载应用，再按平台要求注册。",
    note: "已有账号，直接接着用", explanation: "先确认邮箱能收信，再通过官方入口下载应用。服务是否开放，还要核对地区与平台要求；Telegram 注册教程筹备中。",
    links: [{ title: "先看准备总览", articleId: "overseas-start" }],
  },
  {
    id: "verification", icon: MessageSquareText, title: "接收短信验证码", shortTitle: "短信验证", hint: "先确认号码能长期用",
    tools: [
      { title: "自己掌握的手机号", detail: "核对短信能力与所在地漫游", icon: Smartphone, articleId: "overseas-mobile-basics" },
      { title: "giffgaff 英国卡", detail: "需要英国号码时的可选方案", icon: MessageSquareText, articleId: "giffgaff-guide" },
    ],
    outcome: "验证与找回账号", result: "号码、漫游和平台规则均支持时，可接收验证短信。",
    note: "现有号码能用，就不必先买新卡", explanation: "先确认短信能接收、号码能持续保留。英国卡是可选方案，能否收到某个平台的验证码仍需实际核对，纯流量套餐不能代替短信号码。",
    links: [{ title: "了解号码怎么选", articleId: "overseas-mobile-basics" }, { title: "giffgaff 激活与保号", articleId: "giffgaff-guide" }],
  },
  {
    id: "travel", icon: Plane, title: "出国旅行上网", shortTitle: "旅行上网", hint: "按行程准备数据流量",
    tools: [
      { title: "目的地 eSIM 流量", detail: "按覆盖地区、天数和用量选", icon: Wifi, articleId: "beesim-guide" },
      { title: "兼容手机或 eSIM 工具卡", detail: "原生支持 / XeSIM / BeeSIM", icon: Smartphone, articleId: "overseas-mobile-basics" },
    ],
    outcome: "在目的地联网", result: "安装并启用合适的套餐，用于导航、沟通和查询。",
    note: "先选流量，再看手机怎么装", explanation: "支持所选 eSIM 的手机可直接安装；需要工具卡时，再看 XeSIM 或 BeeSIM。Apple 账号地区不决定手机的 eSIM 能力。",
    links: [{ title: "XeSIM 使用教程", articleId: "xesim-guide" }, { title: "BeeSIM 与流量购买", articleId: "beesim-guide" }],
  },
] as const;

function Connections({ index, animate }: { index: number; animate: boolean }) {
  const start = 64 + index * 110;
  const paths = [
    `M186 ${start} C290 ${start} 292 65 408 65`,
    `M186 ${start} C292 ${start} 292 225 408 225`,
    "M408 65 C530 65 524 160 692 160",
    "M408 225 C530 225 524 160 692 160",
  ];
  return <svg className={styles.connections} data-animate={animate} viewBox="0 0 800 350" preserveAspectRatio="none" fill="none" aria-hidden="true">
    {paths.map((d, i) => <g key={d}>
      <path d={d} className={styles.wire} />
      <path d={d} pathLength="1" className={i < 2 ? styles.branch : styles.merge} />
    </g>)}
  </svg>;
}

function GlobeIcon() {
  return <svg width="94" height="94" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true">
    <circle cx="50" cy="50" r="39" />
    <ellipse cx="50" cy="50" rx="18" ry="39" />
    <path d="M50 11V89M16.2 30.5Q50 47 83.8 30.5M16.2 69.5Q50 53 83.8 69.5" />
  </svg>;
}

export function OverseasReadinessMap({ reading }: { reading: SeriesReadingState }) {
  const headingId = useId();
  const detailId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [selected, setSelected] = useState<(typeof routes)[number]["id"]>("accounts");
  const activeRoute = routes.find(route => route.id === selected)!;
  const selectedIndex = routes.findIndex(route => route.id === selected);
  const hrefFor = (articleId: string) => reading.chapters.find(chapter => chapter.articleId === articleId)?.href;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (!("IntersectionObserver" in window)) {
      setHasEntered(true);
      return;
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setHasEntered(true);
        observer.disconnect();
      }
    }, { threshold: 0.2 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return <section ref={sectionRef} className={styles.section} aria-labelledby={headingId} data-overseas-readiness>
    <div className={styles.heading}>
      <h2 id={headingId}>从你的需求出发</h2>
      <p>选一个需求，看看需要准备什么。点击产品节点，进入对应教程。</p>
    </div>
    <div className={styles.canvas}>
      <div className={styles.columnHeadings} aria-hidden="true">
        <p><span>01</span>你的需求</p><p><span>02</span>准备这些</p><p><span>03</span>开始使用</p>
      </div>
      <div className={styles.diagram} data-entered={hasEntered}>
        <Connections key={selected} index={selectedIndex} animate={hasEntered} />
          <div className={styles.needs} role="group" aria-label="选择出海需求">
            {routes.map(({ id, icon: Icon, title, shortTitle, hint }) => <button key={id} type="button" className={styles.need} aria-label={title} aria-pressed={selected === id} aria-controls={detailId} onClick={() => setSelected(id)}>
              <Icon size={25} strokeWidth={1.4} aria-hidden="true" />
              <span><strong className={styles.fullTitle}>{title}</strong><strong className={styles.shortTitle}>{shortTitle}</strong><small>{hint}</small></span>
            </button>)}
          </div>
          <div className={styles.toolGroups}>
            {routes.map(route => <div key={route.id} className={styles.tools} hidden={selected !== route.id} aria-label={`${route.title}需要准备`}>
              {route.tools.map(({ title, detail, icon: Icon, articleId }) => {
                const href = hrefFor(articleId);
                const content = <><span className={styles.toolIcon}><Icon size={34} strokeWidth={1.3} aria-hidden="true" /></span><span className={styles.toolCaption}><strong>{title}{href && <ArrowUpRight size={12} aria-hidden="true" />}</strong><small>{detail}</small></span></>;
                return href ? <Link key={title} href={href} className={styles.tool} aria-label={`学习：${title}`}>{content}</Link> : <span key={title} className={styles.tool}>{content}</span>;
              })}
            </div>)}
          </div>
          <div className={styles.results}>
            {routes.map(route => <div key={route.id} className={styles.result} hidden={selected !== route.id}>
              <div className={styles.orbit} aria-hidden="true"><GlobeIcon /><span className={styles.resultMark}><Check size={20} strokeWidth={2} /></span></div>
              <div className={styles.resultCopy}><strong>{route.outcome}</strong><p>{route.result}</p></div>
            </div>)}
          </div>
      </div>
      <div id={detailId} className={styles.detail}>
        <div key={selected} className={styles.detailCopy} aria-live="polite" aria-atomic="true"><strong>{activeRoute.note}</strong><p>{activeRoute.explanation}</p></div>
        <div className={styles.detailLinks}>{activeRoute.links.map(link => {
          const href = hrefFor(link.articleId);
          return href ? <Link key={link.articleId} href={href}>{link.title}<ArrowUpRight size={13} aria-hidden="true" /></Link> : null;
        })}</div>
      </div>
    </div>
  </section>;
}
