"use client";

import { ArrowRight, BookOpen, CheckCircle2, HelpCircle, LayoutGrid } from "lucide-react";
import { ProtectedContentLink } from "@/components/content-access-gate";
import type { ReadingNextStep } from "@/lib/article-reading-recommendations";
import styles from "./article-reading.module.css";

export function ArticleNextStep({
  step,
  mapHref,
}: {
  step: ReadingNextStep;
  mapHref?: (href: string) => string;
}) {
  const resolve = (href: string) => (mapHref ? mapHref(href) : href);
  const showOverviewFallback = !step.next && step.overviewHref;

  return (
    <section className={styles.nextStep} aria-labelledby="article-next-step-heading" data-reading-chrome>
      <div className={styles.nextStepHeader}>
        <BookOpen size={16} strokeWidth={1.7} aria-hidden="true" />
        <h2 id="article-next-step-heading">接下来怎么读</h2>
      </div>

      <div className={styles.nextStepCompleted}>
        <CheckCircle2 size={16} strokeWidth={1.8} aria-hidden="true" />
        <p>
          <small>你刚完成</small>
          <strong>{step.completed}</strong>
        </p>
      </div>

      {step.next ? (
        <ProtectedContentLink href={resolve(step.next.href)} className={styles.nextStepPrimary}>
          <span className={styles.nextStepPrimaryCopy}>
            <small>{step.next.label}</small>
            <strong>{step.next.title}</strong>
            <span>为什么读：{step.next.reason}</span>
          </span>
          <ArrowRight size={18} aria-hidden="true" />
        </ProtectedContentLink>
      ) : showOverviewFallback ? (
        <ProtectedContentLink href={resolve(step.overviewHref!)} className={styles.nextStepPrimary}>
          <span className={styles.nextStepPrimaryCopy}>
            <small>本系列暂无下一篇</small>
            <strong>{step.overviewLabel ?? "回系列概览"}</strong>
            <span>回到目录，按自己的进度挑选还没读完的章节。</span>
          </span>
          <LayoutGrid size={18} aria-hidden="true" />
        </ProtectedContentLink>
      ) : (
        <ProtectedContentLink href="/articles" className={styles.nextStepPrimary}>
          <span className={styles.nextStepPrimaryCopy}>
            <small>继续探索</small>
            <strong>回到文章中心</strong>
            <span>按主题挑选下一篇适合你的教程。</span>
          </span>
          <ArrowRight size={18} aria-hidden="true" />
        </ProtectedContentLink>
      )}

      {step.stuck && (
        <ProtectedContentLink href={resolve(step.stuck.href)} className={styles.nextStepStuck}>
          <HelpCircle size={15} strokeWidth={1.8} aria-hidden="true" />
          <span>
            <small>卡点去哪 · {step.stuck.label}</small>
            <strong>{step.stuck.title}</strong>
            <span>{step.stuck.reason}</span>
          </span>
        </ProtectedContentLink>
      )}

      {step.next && step.overviewHref && (
        <ProtectedContentLink href={resolve(step.overviewHref)} className={styles.nextStepOverview}>
          <LayoutGrid size={14} aria-hidden="true" />
          {step.overviewLabel ?? "回系列概览"}
        </ProtectedContentLink>
      )}
    </section>
  );
}
