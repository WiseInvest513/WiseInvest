"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Clock3,
  Crown,
} from "lucide-react";
import type { PointDetailResponse, PointPlan } from "@/lib/point/types";
import {
  entryLabel,
  pointPrice,
  pointState,
  pointTime,
} from "@/lib/point/presentation";
import { DemoNotice, Disclaimer, VipGate } from "./components";
import { usePointQuotes } from "./use-point-quotes";
import s from "./point.module.css";

function LegacyConditions({
  entryCondition,
  invalidationCondition,
}: Pick<PointPlan, "entryCondition" | "invalidationCondition">) {
  const hasEntry = Boolean(entryCondition?.trim());
  const hasInvalidation = Boolean(invalidationCondition?.trim());
  if (!hasEntry && !hasInvalidation) return null;

  return (
    <details className={s.legacyConditions}>
      <summary>
        补充条件（历史内容）
        <ChevronDown size={13} />
      </summary>
      {hasEntry ? <p>观察条件：{entryCondition}</p> : null}
      {hasInvalidation ? <p>失效条件：{invalidationCondition}</p> : null}
    </details>
  );
}

export function PointDetail({ initial }: { initial: PointDetailResponse }) {
  const [data, setData] = useState<PointDetailResponse | null>(initial);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const id = initial.plan.id;
  const onDenied = useCallback(() => {
    setData(null);
    setRefreshKey((k) => k + 1);
  }, []);
  useEffect(() => {
    let disposed = false;
    let controller: AbortController | null = null;
    let requestVersion = 0;
    const refresh = async () => {
      if (document.hidden) return;
      controller?.abort();
      const request = new AbortController();
      controller = request;
      const version = ++requestVersion;
      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        request.abort();
      }, 15_000);
      try {
        const response = await fetch(`/api/point/${encodeURIComponent(id)}`, {
          cache: "no-store",
          signal: request.signal,
        });
        if (disposed || version !== requestVersion || request.signal.aborted)
          return;
        if ([401, 403, 404].includes(response.status)) {
          setData(null);
          setError("此观察暂无公开预览，完整内容仅向 VIP 开放。");
          return;
        }
        if (!response.ok) throw new Error();
        const next = (await response.json()) as PointDetailResponse;
        if (
          !disposed &&
          version === requestVersion &&
          !request.signal.aborted
        ) {
          setData(next);
          setError("");
        }
      } catch (e) {
        if (
          !disposed &&
          version === requestVersion &&
          (timedOut || !request.signal.aborted)
        )
          setError(
            "暂时无法获取最新版本。下方为上次加载的记录，请核对更新时间。",
          );
      } finally {
        clearTimeout(timeout);
      }
    };
    void refresh();
    const timer = setInterval(refresh, 300_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      disposed = true;
      controller?.abort();
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [id, refreshKey]);
  const vip = data?.access === "vip";
  const quoteEnabled = vip && data.plan.status !== "DRAFT";
  const { quotes, now } = usePointQuotes(
    quoteEnabled ? [data.plan.instrument.symbol] : [],
    quoteEnabled,
    onDenied,
  );
  const plan = vip ? data.plan : null;
  const quote = plan ? quotes[plan.instrument.symbol] : undefined;
  const state = plan ? pointState(plan, quote, now) : null;
  return (
    <div className={s.page}>
      <div className={s.wrap} style={{ maxWidth: 1296 }}>
        {data?.previewMode && <DemoNotice />}
        <div className={s.breadcrumb}>
          <Link href="/point" className={s.textLink}>
            <ArrowLeft size={14} />
            点位观察
          </Link>
          <span>/</span>
          <span>观察记录</span>
        </div>
        {error && (
          <p className={s.error} role="alert">
            {error}
            <button
              className={s.textLink}
              style={{ marginLeft: 12 }}
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              重试
            </button>
          </p>
        )}
        {!data ? (
          <VipGate />
        ) : data.access === "preview" ? (
          <>
            <div className={s.detailTitle}>
              <h1>{data.plan.symbol} · 公开摘要</h1>
              <span className={s.badge}>预览</span>
            </div>
            <div className={s.previewIntro}>
              <h2>{data.plan.name}</h2>
              <p>{data.plan.publicSummary}</p>
              <p>
                更新 {pointTime(data.plan.updatedAt)} · 有效至{" "}
                {pointTime(data.plan.validUntil)}
              </p>
            </div>
            <VipGate />
          </>
        ) : plan && state ? (
          <>
            <header>
              <div className={s.detailTitle}>
                <span
                  className={`${s.coin} ${plan.instrument.category === "EQUITY" ? s.equity : ""}`}
                >
                  {plan.instrument.baseAsset.slice(0, 3)}
                </span>
                <h1>
                  {plan.instrument.symbol} <span className={s.muted}>/</span>{" "}
                  {plan.direction === "SHORT" ? "做空观察" : "做多观察"}
                </h1>
                <span className={s.badge}>
                  <Crown size={12} />
                  VIP
                </span>
              </div>
              <p className={s.subtitle}>
                {plan.instrument.name} · Binance USDⓈ-M{" "}
                {plan.instrument.category === "EQUITY"
                  ? "美股关联永续合约"
                  : "永续合约"}{" "}
                · 计价 {plan.instrument.quoteAsset}
              </p>
            </header>
            <section className={s.sheet} aria-label="当前观察计划">
              <div className={s.spotlight}>
                <div className={s.spotlightTop}>
                  <span>当前观察 · V{plan.version}</span>
                  <span>
                    <Clock3
                      size={12}
                      style={{ display: "inline", marginRight: 6 }}
                    />
                    有效至 {pointTime(plan.validUntil)}
                  </span>
                </div>
                <div>
                  <h2>{state.label}</h2>
                  <h3 className={s.nextFocus}>
                    {plan.status !== "PUBLISHED" ||
                    now >= Date.parse(plan.validUntil)
                      ? "仅供历史复盘，不再作为当前参考。"
                      : quote?.status !== "fresh"
                        ? "先核对最新行情，再看观察参考位。"
                        : `关注 ${entryLabel(plan)} 附近的走势。`}
                  </h3>
                  <p>{state.description}</p>
                  <p style={{ marginTop: 12, fontSize: 11 }}>
                    状态仅对比本次采样报价，不确认历史触价或实际成交。
                  </p>
                </div>
                <div className={s.quoteBlock}>
                  <label>
                    {quote?.status === "fresh"
                      ? "最新成交价"
                      : "行情延迟 / 暂不可用"}{" "}
                    · {plan.instrument.quoteAsset}
                  </label>
                  <strong>{pointPrice(quote?.price)}</strong>
                  <small>行情时间 {pointTime(quote?.sourceTime)}</small>
                  <small>获取时间 {pointTime(quote?.fetchedAt)}</small>
                </div>
              </div>
              <div className={s.metrics}>
                <div className={s.metric}>
                  <label>
                    {plan.direction === "SHORT" ? "做空观察位" : "做多观察位"}
                  </label>
                  <strong>{entryLabel(plan)}</strong>
                  <small>接近参考位时，结合行情分析</small>
                </div>
                <div className={s.metric}>
                  <label>止损参考位</label>
                  <strong>≈ {pointPrice(plan.stopLoss)}</strong>
                  <small>超出预期，重新评估风险</small>
                </div>
                <div className={s.metric}>
                  <label>止盈参考位</label>
                  <strong>≈ {pointPrice(plan.takeProfit)}</strong>
                  <small>目标区域，不代表收益承诺</small>
                </div>
              </div>
              <div className={s.sheetFooter}>
                <span>发布 {pointTime(plan.publishedAt)}</span>
                <span>更新 {pointTime(plan.updatedAt)}</span>
                <span>生效 {pointTime(plan.validFrom)}</span>
                {plan.publishedReferencePrice && (
                  <span>
                    发布时参考价 {pointPrice(plan.publishedReferencePrice)}
                  </span>
                )}
              </div>
            </section>
            <section className={s.analysis} aria-label="观察备注">
              <h2>备注</h2>
              <p>{plan.rationale || "暂无备注。"}</p>
              <LegacyConditions
                entryCondition={plan.entryCondition}
                invalidationCondition={plan.invalidationCondition}
              />
            </section>
            <details className={s.accordion}>
              <summary>
                更新与历史版本<span>{data.revisions.length} 条留痕</span>
                <ChevronDown size={16} />
              </summary>
              <div className={s.history}>
                {data.revisions.length ? (
                  data.revisions.map((revision) => (
                    <article className={s.revision} key={revision.id}>
                      <div className={s.revisionHead}>
                        <strong>
                          V{revision.version} ·{" "}
                          {
                            (
                              {
                                CREATED: "创建",
                                UPDATED: "更新",
                                PUBLISHED: "发布",
                                WITHDRAWN: "撤回",
                                CLOSED: "结束",
                              } as const
                            )[revision.action]
                          }
                        </strong>
                        <span className={s.muted}>
                          {pointTime(revision.createdAt)}
                        </span>
                      </div>
                      <p>{revision.reason || "未填写变更说明"}</p>
                      <div className={s.revisionValues}>
                        <span>
                          {revision.snapshot.direction === "SHORT"
                            ? "做空"
                            : "做多"}{" "}
                          {entryLabel(revision.snapshot)}
                        </span>
                        <span>
                          止损 ≈ {pointPrice(revision.snapshot.stopLoss)}
                        </span>
                        <span>
                          止盈 ≈ {pointPrice(revision.snapshot.takeProfit)}
                        </span>
                      </div>
                      <p>
                        生效：{pointTime(revision.snapshot.validFrom)}
                        <br />
                        到期：{pointTime(revision.snapshot.validUntil)}
                      </p>
                      {revision.snapshot.rationale?.trim() ? (
                        <p>备注：{revision.snapshot.rationale}</p>
                      ) : null}
                      <LegacyConditions
                        entryCondition={revision.snapshot.entryCondition}
                        invalidationCondition={
                          revision.snapshot.invalidationCondition
                        }
                      />
                    </article>
                  ))
                ) : (
                  <p className={s.small}>暂无版本记录。</p>
                )}
              </div>
            </details>
            <details className={s.accordion}>
              <summary>
                这个产品的其他观察<span>{data.related.length} 条记录</span>
                <ChevronDown size={16} />
              </summary>
              <div className={s.history}>
                {data.related.length ? (
                  data.related.map((past: PointPlan) => (
                    <div className={s.revision} key={past.id}>
                      <Link className={s.textLink} href={`/point/${past.id}`}>
                        {past.direction === "SHORT" ? "做空观察" : "做多观察"} ·{" "}
                        {pointTime(past.publishedAt)}
                        <ArrowRight size={13} />
                      </Link>
                      <p>
                        有效至 {pointTime(past.validUntil)} ·{" "}
                        {pointState(past, undefined, now).label}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className={s.small}>暂无其他观察记录。</p>
                )}
              </div>
            </details>
          </>
        ) : null}
        <Disclaimer />
      </div>
    </div>
  );
}
