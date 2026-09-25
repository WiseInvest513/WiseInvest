"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Crown,
  LockKeyhole,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import type {
  PointCategory,
  PointDirection,
  PointListResponse,
  PointPlan,
  PointPreview,
} from "@/lib/point/types";
import {
  entryLabel,
  pointPrice,
  pointState,
  pointTime,
} from "@/lib/point/presentation";
import { DemoNotice, Disclaimer, ReferralRail, VipGate } from "./components";
import { usePointQuotes } from "./use-point-quotes";
import s from "./point.module.css";

export function PointList({
  initial,
  isAdmin,
  initialLoadedAt = 0,
}: {
  initial: PointListResponse;
  isAdmin: boolean;
  initialLoadedAt?: number;
}) {
  const [data, setData] = useState(initial);
  const [scope, setScope] = useState<"active" | "all">("active");
  const [category, setCategory] = useState<"ALL" | PointCategory>("ALL");
  const [direction, setDirection] = useState<"ALL" | PointDirection>("ALL");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const lastSuccess = useRef({
    key: JSON.stringify(["active", "ALL", "ALL", "", 1, 0]),
    at: initial.unavailable ? 0 : initialLoadedAt,
  });
  const accessDenied = useCallback(() => {
    setData((previous) => ({
      access: "preview",
      items: [],
      total: 0,
      page: 1,
      pageSize: 3,
      previewMode: previous.previewMode,
    }));
    setRefreshKey((k) => k + 1);
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    let disposed = false;
    let controller: AbortController | null = null;
    let requestVersion = 0;
    const requestKey = JSON.stringify([
      scope, category, direction, query, page, refreshKey,
    ]);
    const refresh = async (scheduled = false) => {
      if (document.hidden || (controller && !controller.signal.aborted)) return;
      // SSR already loaded the initial view. Refocus/visibility events within a
      // minute reuse it; filters, explicit retries and the 5-minute poll do not.
      if (
        !scheduled &&
        lastSuccess.current.key === requestKey &&
        Date.now() - lastSuccess.current.at < 60_000
      )
        return;
      const request = new AbortController();
      controller = request;
      const version = ++requestVersion;
      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        request.abort();
      }, 15_000);
      setBusy(true);
      try {
        const params = new URLSearchParams({
          scope,
          category,
          direction,
          q: query,
          page: String(page),
        });
        const response = await fetch(`/api/point?${params}`, {
          cache: "no-store",
          signal: request.signal,
        });
        if (disposed || version !== requestVersion || request.signal.aborted)
          return;
        if (response.status === 401 || response.status === 403) {
          setData((previous) => ({
            access: "preview",
            items: [],
            total: 0,
            page: 1,
            pageSize: 3,
            previewMode: previous.previewMode,
          }));
          throw new Error("access denied");
        }
        if (!response.ok) throw new Error("暂时无法更新观察列表，请稍后重试。");
        const next = (await response.json()) as PointListResponse;
        if (
          !disposed &&
          version === requestVersion &&
          !request.signal.aborted
        ) {
          if (!next.unavailable)
            lastSuccess.current = {
              key: JSON.stringify([
                scope, category, direction, query, next.page, refreshKey,
              ]),
              at: Date.now(),
            };
          setData(next);
          setPage(next.page);
          setError("");
        }
      } catch (e) {
        if (
          !disposed &&
          version === requestVersion &&
          (timedOut || !request.signal.aborted)
        )
          setError("暂时无法更新观察列表，请稍后重试。");
      } finally {
        clearTimeout(timeout);
        if (!disposed && version === requestVersion) {
          controller = null;
          setBusy(false);
        }
      }
    };
    void refresh();
    const foregroundRefresh = () => void refresh();
    const timer = setInterval(() => void refresh(true), 300_000);
    window.addEventListener("focus", foregroundRefresh);
    document.addEventListener("visibilitychange", foregroundRefresh);
    return () => {
      disposed = true;
      controller?.abort();
      clearInterval(timer);
      window.removeEventListener("focus", foregroundRefresh);
      document.removeEventListener("visibilitychange", foregroundRefresh);
    };
  }, [scope, category, direction, query, page, refreshKey]);
  const vip = data.access === "vip";
  const { quotes, now } = usePointQuotes(
    vip ? data.items.map((p) => p.instrument.symbol) : [],
    vip,
    accessDenied,
  );
  const changeScope = (value: "active" | "all") => {
    setScope(value);
    setPage(1);
  };
  const changeCategory = (value: "ALL" | PointCategory) => {
    setCategory(value);
    setPage(1);
  };
  const changeDirection = (value: "ALL" | PointDirection) => {
    setDirection(value);
    setPage(1);
  };
  const hasFilters =
    Boolean(query.trim()) || category !== "ALL" || direction !== "ALL";
  const resetFilters = () => {
    setSearch("");
    setQuery("");
    setCategory("ALL");
    setDirection("ALL");
    setPage(1);
  };
  return (
    <div className={`${s.page} ${s.listPage}`}>
      <div className={s.wrap}>
        {data.previewMode && <DemoNotice />}
        <header className={s.header}>
          <div className={s.headerIdentity}>
            <h1 className={s.title}>
              点位观察{" "}
              <span className={s.badge}>
                <Crown size={13} />
                {vip ? "VIP 专享" : "公开预览"}
              </span>
            </h1>
            <p className={s.subtitle}>看清计划，等到条件，再做判断。</p>
          </div>
          {isAdmin && (
            <Link href="/admin/point" className={s.button}>
              管理观察
              <ArrowRight size={14} />
            </Link>
          )}
        </header>
        {vip ? (
          <div className={s.toolbar}>
            <div className={s.tabs} role="group" aria-label="观察范围">
              <button
                className={s.tab}
                aria-pressed={scope === "active"}
                onClick={() => changeScope("active")}
              >
                当前观察
              </button>
              <button
                className={s.tab}
                aria-pressed={scope === "all"}
                onClick={() => changeScope("all")}
              >
                全部与历史
              </button>
            </div>
            <div
              className={`${s.tabs} ${s.marketTabs}`}
              role="group"
              aria-label="市场分类"
            >
              {(
                [
                  ["ALL", "全部"],
                  ["CRYPTO", "加密合约"],
                  ["EQUITY", "美股合约"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  className={s.tab}
                  aria-pressed={category === value}
                  onClick={() => changeCategory(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              className={s.marketSelect}
              aria-label="筛选市场类型"
              value={category}
              onChange={(event) =>
                changeCategory(event.target.value as "ALL" | PointCategory)
              }
            >
              <option value="ALL">全部市场</option>
              <option value="CRYPTO">加密合约</option>
              <option value="EQUITY">美股合约</option>
            </select>
            <div
              className={`${s.tabs} ${s.directionTabs}`}
              role="group"
              aria-label="观察方向筛选"
            >
              <button
                type="button"
                className={s.tab}
                aria-pressed={direction === "ALL"}
                onClick={() => changeDirection("ALL")}
              >
                全部方向
              </button>
              <button
                type="button"
                className={`${s.tab} ${s.directionTab}`}
                data-direction="LONG"
                aria-pressed={direction === "LONG"}
                onClick={() => changeDirection("LONG")}
              >
                <TrendingUp size={15} aria-hidden="true" />
                只看做多
              </button>
              <button
                type="button"
                className={`${s.tab} ${s.directionTab}`}
                data-direction="SHORT"
                aria-pressed={direction === "SHORT"}
                onClick={() => changeDirection("SHORT")}
              >
                <TrendingDown size={15} aria-hidden="true" />
                只看做空
              </button>
            </div>
            <div className={s.search}>
              <Search size={16} />
              <input
                aria-label="搜索产品代码或名称"
                placeholder="搜索代码或名称"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search ? (
                <button
                  type="button"
                  className={s.clearSearch}
                  aria-label="清空搜索"
                  onClick={() => {
                    setSearch("");
                    setQuery("");
                    setPage(1);
                  }}
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className={s.previewIntro}>
            <h2>先看看，我们在关注什么。</h2>
            <p>
              以下仅展示最新 3
              条公开摘要。完整点位、方向、观察条件与历史记录，对所有 VIP 开放。
            </p>
          </div>
        )}
        {error && (
          <p className={s.error} role="alert">
            {error}{" "}
            <button
              className={s.textLink}
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              重试
            </button>
          </p>
        )}
        <div className={s.columns}>
          <div className={s.feed} aria-busy={busy}>
            <div className={s.loadingHint} role="status" aria-live="polite">
              {busy ? "正在更新观察记录…" : ""}
            </div>
            {data.items.length === 0 ? (
              <div className={s.empty}>
                <strong>
                  {data.unavailable
                    ? "观察内容暂时无法加载"
                    : busy
                      ? "正在加载观察记录…"
                      : hasFilters
                        ? "没有匹配的观察记录"
                        : "这里暂时没有观察记录"}
                </strong>
                {data.unavailable
                  ? "数据服务暂不可用，请稍后再试。"
                  : busy
                    ? ""
                    : hasFilters
                      ? "试试其他方向、市场或产品代码，或清除筛选查看全部品种。"
                      : "新计划发布后会出现在这里；已结束的计划可在历史中查看。"}
                {hasFilters && !busy && !data.unavailable ? (
                  <button
                    type="button"
                    className={s.button}
                    onClick={resetFilters}
                  >
                    清除筛选
                  </button>
                ) : null}
              </div>
            ) : vip ? (
              <table className={s.table}>
                <thead>
                  <tr>
                    {[
                      "产品 / 合约",
                      "最新成交价",
                      "方向",
                      "观察参考位",
                      "止损参考",
                      "止盈参考",
                      "观察状态",
                    ].map((label) => (
                      <th key={label} scope="col">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                {(data.items as PointPlan[]).map((plan) => {
                  const quote = quotes[plan.instrument.symbol];
                  const state = pointState(plan, quote, now);
                  return (
                    <tbody
                      key={plan.id}
                      className={s.record}
                      data-direction={plan.direction}
                    >
                      <tr className={s.row}>
                        <td>
                          <div className={s.product}>
                            <span
                              className={`${s.coin} ${plan.instrument.category === "EQUITY" ? s.equity : ""}`}
                            >
                              {plan.instrument.baseAsset.slice(0, 3)}
                            </span>
                            <div>
                              <Link
                                href={`/point/${plan.id}`}
                                className={s.symbol}
                              >
                                {plan.instrument.symbol}
                              </Link>
                              <div className={s.small}>
                                {plan.instrument.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={s.mobileLabel}>最新成交价</span>
                          <strong>{pointPrice(quote?.price)}</strong>
                          <div className={s.small}>
                            {quote?.status === "fresh"
                              ? pointTime(quote.sourceTime, true)
                              : quote?.price
                                ? "延迟报价"
                                : "等待行情"}
                          </div>
                        </td>
                        <td>
                          <span className={s.mobileLabel}>观察方向</span>
                          <span
                            className={`${s.directionBadge} ${plan.direction === "SHORT" ? s.short : s.long}`}
                          >
                            {plan.direction === "SHORT" ? (
                              <TrendingDown size={16} aria-hidden="true" />
                            ) : (
                              <TrendingUp size={16} aria-hidden="true" />
                            )}
                            {plan.direction === "SHORT"
                              ? "做空观察"
                              : "做多观察"}
                          </span>
                        </td>
                        <td className={s.entry}>
                          <span className={s.mobileLabel}>观察参考位</span>
                          {entryLabel(plan)}
                        </td>
                        <td>
                          <span className={s.mobileLabel}>止损参考</span>≈{" "}
                          {pointPrice(plan.stopLoss)}
                        </td>
                        <td>
                          <span className={s.mobileLabel}>止盈参考</span>≈{" "}
                          {pointPrice(plan.takeProfit)}
                        </td>
                        <td>
                          <span className={s.state} data-tone={state.tone}>
                            {state.label}
                          </span>
                        </td>
                      </tr>
                      <tr className={s.metaRow}>
                        <td colSpan={7}>
                          <div className={s.meta}>
                            <span>
                              发布 {pointTime(plan.publishedAt, true)}
                            </span>
                            <span>更新 {pointTime(plan.updatedAt, true)}</span>
                            <span>
                              有效至 {pointTime(plan.validUntil, true)}
                            </span>
                            <span>
                              计价 {plan.instrument.quoteAsset} · Binance 合约
                            </span>
                            <Link
                              className={s.textLink}
                              href={`/point/${plan.id}`}
                            >
                              查看观察与记录
                              <ArrowRight size={12} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                      <tr className={s.recordGap} aria-hidden="true">
                        <td colSpan={7} />
                      </tr>
                    </tbody>
                  );
                })}
              </table>
            ) : (
              <div>
                {(data.items as PointPreview[]).map((plan) => (
                  <article className={s.previewItem} key={plan.id}>
                    <div>
                      <div className={s.product}>
                        <span className={s.coin}>
                          {plan.symbol.slice(0, 3)}
                        </span>
                        <div>
                          <h3 className={s.symbol}>{plan.symbol}</h3>
                          <div className={s.small}>{plan.name}</div>
                        </div>
                      </div>
                      <p>
                        {plan.publicSummary ||
                          "作者已发布新的市场观察，完整条件对 VIP 开放。"}
                      </p>
                      <div className={s.small}>
                        更新 {pointTime(plan.updatedAt)} · 有效至{" "}
                        {pointTime(plan.validUntil)}
                      </div>
                      <div className={s.lockText} style={{ marginTop: 12 }}>
                        <LockKeyhole size={12} />
                        完整点位与历史 · VIP 可见
                      </div>
                    </div>
                    <Link href={`/point/${plan.id}`} className={s.textLink}>
                      查看摘要
                      <ArrowRight size={13} />
                    </Link>
                  </article>
                ))}
              </div>
            )}
            {vip ? (
              <div className={s.pagination}>
                <span>{data.total} 条记录 · 每 5 分钟刷新报价</span>
                <div>
                  <button
                    className={s.button}
                    aria-label="上一页"
                    disabled={page <= 1 || busy}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ alignSelf: "center" }}>{data.page}</span>
                  <button
                    className={s.button}
                    aria-label="下一页"
                    disabled={page * data.pageSize >= data.total || busy}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <VipGate />
            )}
          </div>
          <ReferralRail />
        </div>
        <Disclaimer />
      </div>
    </div>
  );
}
