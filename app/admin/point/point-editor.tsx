"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ExternalLink,
  Info,
  LoaderCircle,
  LockKeyhole,
  Search,
} from "lucide-react";
import type {
  PointCategory,
  PointInstrument,
  PointInstrumentSearch,
  PointPlan,
  PointPlanInput,
} from "@/lib/point/types";
import { pointPrice } from "@/lib/point/presentation";
import { usePointQuotes } from "@/app/point/use-point-quotes";
import { chinaDate, lifecycle } from "./point-format";
import styles from "./point-admin.module.css";

type Fields = Omit<PointPlanInput, "symbol" | "entryLower" | "entryUpper"> & {
  entryLower: string;
  entryUpper: string;
};
type SaveAction = "draft" | "publish" | "withdraw" | "close";
const categoryLabels: Record<PointCategory, string> = {
  CRYPTO: "加密",
  EQUITY: "美股",
  OTHER: "其他",
};

function toChinaInput(value: string) {
  return new Date(new Date(value).getTime() + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
}

function toUtc(value: string) {
  const date = new Date(`${value}:00+08:00`);
  if (Number.isNaN(date.getTime())) throw new Error("请填写有效的北京时间。");
  return date.toISOString();
}

function fieldsFor(plan: PointPlan | null): Fields {
  const now = new Date();
  return {
    direction: plan?.direction ?? "LONG",
    entryPrice: plan?.entryPrice ?? "",
    entryLower: plan?.entryLower ?? "",
    entryUpper: plan?.entryUpper ?? "",
    stopLoss: plan?.stopLoss ?? "",
    takeProfit: plan?.takeProfit ?? "",
    rationale: plan?.rationale ?? "",
    entryCondition: plan?.entryCondition ?? "",
    invalidationCondition: plan?.invalidationCondition ?? "",
    publicSummary: plan?.publicSummary ?? "",
    changeReason: "",
    validFrom: toChinaInput(plan?.validFrom ?? now.toISOString()),
    validUntil: toChinaInput(
      plan?.validUntil ??
        new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    ),
  };
}

function displayPrice(value: string | null | undefined) {
  return pointPrice(value);
}

function approximatePrice(value: string | null | undefined) {
  const formatted = pointPrice(value);
  return formatted === "—" ? formatted : `≈ ${formatted}`;
}

function InstrumentSearch({
  category,
  onCategory,
  onConfirm,
  disabled,
  onAccessDenied,
}: {
  category: PointCategory;
  onCategory: (value: PointCategory) => void;
  onConfirm: (instrument: PointInstrument) => void;
  disabled: boolean;
  onAccessDenied: () => void;
}) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<PointInstrumentSearch | null>(null);
  const [selected, setSelected] = useState<PointInstrument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  function resetSearch() {
    request.current?.abort();
    setResult(null);
    setSelected(null);
    setError("");
    setLoading(false);
  }

  async function search() {
    if (!query.trim()) {
      setError("请输入名称或代码，例如 MU、Micron、BTC。");
      return;
    }
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError("");
    setResult(null);
    setSelected(null);
    const timeout = window.setTimeout(() => {
      if (request.current !== controller) return;
      controller.abort();
      setError("品种搜索超时，请重试。");
      setLoading(false);
    }, 15_000);
    try {
      const response = await fetch(
        `/api/admin/point/instruments?q=${encodeURIComponent(query.trim())}&category=${category}`,
        { cache: "no-store", signal: controller.signal },
      );
      if (controller.signal.aborted) return;
      if (response.status === 401 || response.status === 403) {
        onAccessDenied();
        return;
      }
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "品种搜索失败，请稍后重试。");
      if (controller.signal.aborted) return;
      setResult(data);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(
        cause instanceof Error ? cause.message : "品种搜索失败，请稍后重试。",
      );
      setResult(null);
    } finally {
      window.clearTimeout(timeout);
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  return (
    <div className={styles.instrumentSearch}>
      <fieldset className={styles.inlineFieldset}>
        <legend>市场类型</legend>
        <div className={styles.radioGroup}>
          {(Object.keys(categoryLabels) as PointCategory[]).map((value) => (
            <label key={value}>
              <input
                type="radio"
                name="category"
                checked={category === value}
                disabled={disabled}
                onChange={() => {
                  resetSearch();
                  onCategory(value);
                }}
              />
              {categoryLabels[value]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className={styles.searchRow}>
        <label htmlFor="instrument-query">交易品种</label>
        <div className={styles.instrumentQuery}>
          <Search size={17} />
          <input
            id="instrument-query"
            value={query}
            maxLength={100}
            placeholder="搜索名称或代码，如 BTC、MU、INTC"
            disabled={disabled}
            onChange={(event) => {
              resetSearch();
              setQuery(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void search();
              }
            }}
          />
          <button
            className={styles.searchButton}
            type="button"
            onClick={search}
            disabled={loading || disabled}
          >
            {loading ? (
              <LoaderCircle size={16} className={styles.spin} />
            ) : (
              "搜索"
            )}
          </button>
        </div>
      </div>
      <p className={styles.hint}>
        代码仅用于搜索，不会自动选择。请核对名称、精确 Symbol 与结算资产。
      </p>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {result?.unavailable ? (
        <p className={styles.error} role="alert">
          {result.message || "官方品种信息暂时不可用，请稍后重试。"}{" "}
          当前不能确认品种。
        </p>
      ) : null}
      {result && result.items.length === 0 && !result.unavailable ? (
        <div className={styles.searchEmpty}>
          未找到可核验的匹配合约。请尝试完整名称或代码；若币安尚未提供该品种，不会创建替代标的。
        </div>
      ) : null}
      {result && result.items.length > 0 ? (
        <div
          className={styles.candidates}
          role="radiogroup"
          aria-label="匹配交易品种"
        >
          {result.items.map((instrument) => (
            <label
              key={instrument.symbol}
              className={`${styles.candidate} ${selected?.symbol === instrument.symbol ? styles.candidateSelected : ""}`}
            >
              <input
                type="radio"
                name="instrument"
                checked={selected?.symbol === instrument.symbol}
                disabled={
                  disabled ||
                  result.unavailable ||
                  loading ||
                  instrument.status !== "TRADING"
                }
                onChange={() => setSelected(instrument)}
              />
              <div>
                <div className={styles.candidateHeading}>
                  <strong>{instrument.name}</strong>
                  <code>{instrument.symbol}</code>
                  <span className={styles.status}>
                    {instrument.status === "TRADING"
                      ? "可交易"
                      : instrument.status}
                  </span>
                </div>
                <p>
                  {categoryLabels[instrument.category]} ·{" "}
                  {instrument.contractType === "PERPETUAL"
                    ? "USDⓈ-M 永续合约"
                    : instrument.contractType}{" "}
                  · 计价 {instrument.quoteAsset} / 结算 {instrument.marginAsset}
                </p>
                <div className={styles.source}>
                  {instrument.sourceUrl ? (
                    <a
                      href={instrument.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      币安官方核验来源
                      <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span>币安交易规则接口核验</span>
                  )}
                  <span>核验时间 {chinaDate(instrument.verifiedAt)}</span>
                </div>
              </div>
            </label>
          ))}
        </div>
      ) : null}
      {selected ? (
        <div className={styles.confirmRow}>
          <span>
            已选择 <strong>{selected.symbol}</strong> · {selected.name}
          </span>
          <button
            type="button"
            className={styles.primary}
            disabled={disabled || loading || result?.unavailable}
            onClick={() => onConfirm(selected)}
          >
            <Check size={16} />
            确认选择
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function PointEditor({
  plan,
  previewMode,
  onSaved,
  onBack,
  onAccessDenied,
  onEditingChanged,
}: {
  plan: PointPlan | null;
  previewMode: boolean;
  onSaved: (plan: PointPlan, message: string) => void;
  onBack: () => void;
  onAccessDenied: () => void;
  onEditingChanged: (dirty: boolean, saving: boolean) => void;
}) {
  const [fields, setFields] = useState<Fields>(() => fieldsFor(plan));
  const [instrument, setInstrument] = useState<PointInstrument | null>(
    plan?.instrument ?? null,
  );
  const [category, setCategory] = useState<PointCategory>(
    plan?.instrument.category ?? "CRYPTO",
  );
  const [range, setRange] = useState(
    Boolean(plan?.entryLower && plan?.entryUpper),
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<SaveAction | null>(null);
  const [conflict, setConflict] = useState(false);
  const [quoteDenied, setQuoteDenied] = useState(false);
  const [saveUncertain, setSaveUncertain] = useState(false);
  const savingRef = useRef(false);
  const pendingRequest = useRef<AbortController | null>(null);
  const errorFeedback = useRef<HTMLDivElement | null>(null);
  const savedState = useRef(
    JSON.stringify({ fields, symbol: instrument?.symbol, range }),
  );
  const dirty =
    JSON.stringify({ fields, symbol: instrument?.symbol, range }) !==
    savedState.current;
  const instrumentLocked = Boolean(
    plan?.publishedAt || (plan && plan.status !== "DRAFT"),
  );
  const archived = plan?.status === "WITHDRAWN" || plan?.status === "CLOSED";

  const handleQuoteDenied = useCallback(() => {
    setQuoteDenied(true);
    onAccessDenied();
  }, [onAccessDenied]);

  useEffect(() => {
    onEditingChanged(dirty, Boolean(saving));
    return () => onEditingChanged(false, false);
  }, [dirty, saving, onEditingChanged]);

  useEffect(() => () => pendingRequest.current?.abort(), []);

  useEffect(() => {
    if (!error) return;
    errorFeedback.current?.focus({ preventScroll: true });
    errorFeedback.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [error]);

  useEffect(() => {
    if (!dirty && !saving) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const beforeLink = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search
      )
        return;
      if (
        saving ||
        !window.confirm("还有未保存的修改。离开将丢失这些内容，确定离开吗？")
      ) {
        event.preventDefault();
        event.stopPropagation();
        if (saving) setError("正在保存，请等待结果后再离开。");
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", beforeLink, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", beforeLink, true);
    };
  }, [dirty, saving]);
  const { quotes } = usePointQuotes(
    instrument ? [instrument.symbol] : [],
    Boolean(instrument && !quoteDenied),
    handleQuoteDenied,
    "/api/admin/point/quotes",
  );
  const quote = instrument ? quotes[instrument.symbol] : undefined;

  function update<Key extends keyof Fields>(key: Key, value: Fields[Key]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function save(action: SaveAction) {
    if (savingRef.current || saveUncertain) return;
    setError("");
    if (!instrument) {
      setError("请先搜索、选择并确认精确交易品种。");
      return;
    }
    const lifecycleOnly = action === "withdraw" || action === "close";
    let payload: PointPlanInput | { changeReason: string } = {
      changeReason: fields.changeReason,
    };
    if (!lifecycleOnly) {
      if (range && (!fields.entryLower.trim() || !fields.entryUpper.trim())) {
        setError("选择入场区间时，请同时填写区间下限和上限。");
        return;
      }
      if (
        action === "publish" &&
        [
          fields.entryPrice,
          fields.stopLoss,
          fields.takeProfit,
          fields.rationale,
        ].some((value) => !value.trim())
      ) {
        setError("发布前请填写入场位、止损、止盈和一句备注。");
        return;
      }
      try {
        payload = {
          ...fields,
          symbol: instrument.symbol,
          entryLower: range ? fields.entryLower : null,
          entryUpper: range ? fields.entryUpper : null,
          validFrom: toUtc(fields.validFrom),
          validUntil: toUtc(fields.validUntil),
        };
        if (new Date(payload.validUntil) <= new Date(payload.validFrom))
          throw new Error("结束时间必须晚于开始时间。");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "请检查有效时间。");
        return;
      }
    }
    savingRef.current = true;
    setSaving(action);
    const controller = new AbortController();
    pendingRequest.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 20_000);
    let receivedResult = false;
    try {
      const response = await fetch(
        plan
          ? `/api/admin/point/${encodeURIComponent(plan.id)}`
          : "/api/admin/point",
        {
          method: plan ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            ...payload,
            action,
            confirmedSymbol: instrument.symbol,
            ...(plan ? { expectedVersion: plan.version } : {}),
          }),
        },
      );
      if (response.status === 401 || response.status === 403) {
        onAccessDenied();
        return;
      }
      const result = await response.json();
      // A late body can resolve after cancellation; its write outcome is still uncertain.
      if (controller.signal.aborted) throw new Error("保存响应已超时。");
      receivedResult = true;
      if (!response.ok) {
        setConflict(response.status === 409);
        throw new Error(result.message || "保存失败，请稍后重试。");
      }
      const messages: Record<SaveAction, string> = {
        draft: "草稿已保存，尚未向用户发布。",
        publish: `已发布 V${result.plan.version}，历史版本保持不变。`,
        withdraw: "计划已撤回并保留归档记录。",
        close: "计划已结束并保留归档记录。",
      };
      const nextFields = fieldsFor(result.plan);
      const nextRange = Boolean(
        result.plan.entryLower && result.plan.entryUpper,
      );
      savedState.current = JSON.stringify({
        fields: nextFields,
        symbol: result.plan.instrument.symbol,
        range: nextRange,
      });
      setFields(nextFields);
      setRange(nextRange);
      setInstrument(result.plan.instrument);
      setConflict(false);
      onSaved(result.plan, messages[action]);
    } catch (cause) {
      if (controller.signal.aborted || !receivedResult) {
        setSaveUncertain(true);
        setError(
          "保存结果未确认，服务器可能已收到请求。请返回列表刷新核对，避免重复发布。",
        );
        return;
      }
      setError(
        cause instanceof Error ? cause.message : "网络异常，保存失败。请重试。",
      );
    } finally {
      window.clearTimeout(timeout);
      pendingRequest.current = null;
      savingRef.current = false;
      setSaving(null);
    }
  }

  async function reloadLatest() {
    if (!plan || savingRef.current) return;
    savingRef.current = true;
    setSaving("draft");
    const controller = new AbortController();
    pendingRequest.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch("/api/admin/point", {
        cache: "no-store",
        signal: controller.signal,
      });
      if (response.status === 401 || response.status === 403) {
        onAccessDenied();
        return;
      }
      const result = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok || result.unavailable)
        throw new Error(result.message || "加载最新版本失败，请稍后重试。");
      const latest = result.items.find(
        (item: PointPlan) => item.id === plan.id,
      );
      if (!latest) throw new Error("未找到最新计划，请返回列表刷新。");
      const nextFields = fieldsFor(latest);
      const nextRange = Boolean(latest.entryLower && latest.entryUpper);
      savedState.current = JSON.stringify({
        fields: nextFields,
        symbol: latest.instrument.symbol,
        range: nextRange,
      });
      setFields(nextFields);
      setInstrument(latest.instrument);
      setRange(Boolean(latest.entryLower && latest.entryUpper));
      setConflict(false);
      setError("");
      onSaved(latest, `已载入最新版本 V${latest.version}，可以继续编辑。`);
    } catch (cause) {
      setError(
        controller.signal.aborted
          ? "加载最新版本超时，请重试。"
          : cause instanceof Error
            ? cause.message
            : "加载失败，请重试。",
      );
    } finally {
      window.clearTimeout(timeout);
      pendingRequest.current = null;
      savingRef.current = false;
      setSaving(null);
    }
  }

  const priceUnit = instrument?.quoteAsset ?? "USDT";
  const previewState = plan ? lifecycle(plan) : "未发布";
  return (
    <div className={styles.editor}>
      <div className={styles.editorMain}>
        <header className={styles.editorHeader}>
          <button
            className={styles.back}
            type="button"
            disabled={Boolean(saving)}
            onClick={onBack}
          >
            <ArrowLeft size={16} />
            全部计划
          </button>
          <h1>{plan ? "编辑点位计划" : "新建点位计划"}</h1>
          {dirty && !archived ? (
            <p className={styles.unsaved}>有未保存的修改</p>
          ) : null}
          <div className={styles.editorSubtitle}>
            <span>
              {instrument
                ? `${instrument.baseAsset} / ${instrument.quoteAsset}`
                : "搜索并确认交易品种"}
              {plan ? ` · ${plan.id}` : ""}
            </span>
            <small>
              {previewMode
                ? "隔离演示计划 · 官方参考行情"
                : plan
                  ? `当前版本 V${plan.version}`
                  : "尚未发布"}
            </small>
          </div>
        </header>

        <section className={styles.section}>
          <h2>基本信息</h2>
          {!instrument ? (
            <InstrumentSearch
              category={category}
              onCategory={setCategory}
              onConfirm={(value) => {
                setInstrument(value);
                setError("");
              }}
              disabled={Boolean(saving)}
              onAccessDenied={onAccessDenied}
            />
          ) : (
            <>
              <div className={styles.readRow}>
                <span>交易品种</span>
                <div className={styles.instrumentConfirmed}>
                  <strong>
                    {instrument.symbol} — {instrument.name}
                  </strong>
                  {instrumentLocked ? (
                    <LockKeyhole size={15} aria-label="已锁定交易品种" />
                  ) : (
                    <button
                      type="button"
                      disabled={Boolean(saving)}
                      onClick={() => setInstrument(null)}
                    >
                      更换
                    </button>
                  )}
                </div>
              </div>
              <p className={styles.instrumentMeta}>
                {categoryLabels[instrument.category]}合约 · Binance USDⓈ-M ·{" "}
                {instrument.quoteAsset} 计价 / {instrument.marginAsset} 结算 ·
                最新成交价
              </p>
              <p className={styles.confirmed}>
                <CheckCircle2 size={14} />
                已确认精确 Symbol：{instrument.symbol}
                {instrumentLocked ? " · 产品已固定，更换产品请新建计划。" : ""}
              </p>
              <div className={styles.quoteStrip}>
                <span>当前参考价</span>
                <strong>
                  {quote?.price ? `≈ ${displayPrice(quote.price)}` : "—"}
                  <small>{priceUnit}</small>
                </strong>
                <span>
                  {quote?.sourceTime
                    ? `行情时间 ${chinaDate(quote.sourceTime)}`
                    : "暂未取得参考行情"}
                </span>
                {quote?.status === "fresh" ? (
                  <b className={styles.quoteFresh}>官方报价 · 每 5 分钟刷新</b>
                ) : null}
                {quote && quote.status !== "fresh" ? (
                  <b>
                    {quote.status === "stale" ? "行情已延迟" : "行情不可用"}
                  </b>
                ) : null}
              </div>
            </>
          )}
        </section>

        {instrument ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <fieldset
              disabled={Boolean(saving) || archived || saveUncertain}
              className={styles.formFieldset}
            >
              <section className={styles.section}>
                <h2>交易计划</h2>
                <fieldset className={styles.inlineFieldset}>
                  <legend>交易方向</legend>
                  <div className={styles.radioGroup}>
                    <label>
                      <input
                        name="direction"
                        type="radio"
                        checked={fields.direction === "LONG"}
                        onChange={() => update("direction", "LONG")}
                      />
                      做多
                    </label>
                    <label>
                      <input
                        name="direction"
                        type="radio"
                        checked={fields.direction === "SHORT"}
                        onChange={() => update("direction", "SHORT")}
                      />
                      做空
                    </label>
                  </div>
                </fieldset>
                <div className={styles.prices}>
                  {(
                    [
                      { key: "entryPrice", label: "计划入场位" },
                      { key: "stopLoss", label: "止损位" },
                      { key: "takeProfit", label: "止盈位" },
                    ] as const
                  ).map(({ key, label }) => (
                    <label key={key}>
                      {label}
                      <div className={styles.priceInput}>
                        <input
                          aria-label={label}
                          inputMode="decimal"
                          maxLength={80}
                          placeholder="填写价格"
                          value={fields[key]}
                          onChange={(event) => update(key, event.target.value)}
                        />
                        <span>{priceUnit}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <label className={styles.rangeToggle}>
                  <input
                    type="checkbox"
                    checked={range}
                    onChange={(event) => setRange(event.target.checked)}
                  />
                  设置入场区间（可选）
                </label>
                {range ? (
                  <div className={styles.rangeFields}>
                    <label>
                      入场下限
                      <input
                        inputMode="decimal"
                        maxLength={80}
                        value={fields.entryLower}
                        onChange={(event) =>
                          update("entryLower", event.target.value)
                        }
                        placeholder={`下限 · ${priceUnit}`}
                      />
                    </label>
                    <label>
                      入场上限
                      <input
                        inputMode="decimal"
                        maxLength={80}
                        value={fields.entryUpper}
                        onChange={(event) =>
                          update("entryUpper", event.target.value)
                        }
                        placeholder={`上限 · ${priceUnit}`}
                      />
                    </label>
                  </div>
                ) : null}
                <p className={styles.info}>
                  <Info size={16} />
                  点位仅作参考，接近价位时仍需结合行情判断。
                </p>
              </section>
              <section className={styles.section}>
                <h2>备注</h2>
                <div className={styles.textareaRow}>
                  <label htmlFor="rationale">
                    一句备注<span>仅 VIP 可见</span>
                  </label>
                  <textarea
                    id="rationale"
                    rows={2}
                    maxLength={3000}
                    placeholder="例如：82,000 附近观察做空，止损参考 84,000，止盈参考 77,000；结合当时行情判断。"
                    value={fields.rationale}
                    onChange={(event) =>
                      update("rationale", event.target.value)
                    }
                  />
                </div>
              </section>
              <section className={styles.section}>
                <h2>有效期</h2>
                <div className={styles.dateFields}>
                  <label>
                    开始时间
                    <input
                      type="datetime-local"
                      value={fields.validFrom}
                      onChange={(event) =>
                        update("validFrom", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    结束时间
                    <input
                      type="datetime-local"
                      value={fields.validUntil}
                      onChange={(event) =>
                        update("validUntil", event.target.value)
                      }
                    />
                  </label>
                  <div className={styles.timezone}>
                    时区<strong>UTC+8</strong>
                  </div>
                </div>
                <p className={styles.hint}>
                  以上时间均为北京时间，到期自动归档。
                </p>
                <p className={styles.infoPanel}>
                  <Info size={19} />
                  {plan
                    ? `发布将生成 V${plan.version + 1}，历史版本不会被覆盖。`
                    : "发布后将生成首个版本，后续变更保留完整记录。"}
                  发布时间保留，更新时间由系统记录。
                </p>
              </section>
            </fieldset>
          </form>
        ) : (
          <div className={styles.lockedForm}>
            <LockKeyhole size={20} />
            <p>确认交易品种后，继续填写交易计划。</p>
          </div>
        )}
      </div>

      <aside className={styles.previewColumn}>
        {error ? (
          <div
            ref={errorFeedback}
            className={styles.error}
            role="alert"
            tabIndex={-1}
          >
            {error}
            {conflict ? (
              <button
                type="button"
                disabled={Boolean(saving)}
                onClick={reloadLatest}
              >
                放弃本地修改，载入最新版本
              </button>
            ) : null}
          </div>
        ) : null}
        <div className={styles.actions}>
          {plan?.status === "PUBLISHED" ? (
            <button
              className={styles.quietButton}
              type="button"
              disabled={Boolean(saving) || saveUncertain}
              onClick={() => save("withdraw")}
            >
              撤回计划
            </button>
          ) : null}
          {!archived && (!plan || plan.status === "DRAFT") ? (
            <button
              className={styles.secondary}
              type="button"
              disabled={Boolean(saving) || !instrument || saveUncertain}
              onClick={() => save("draft")}
            >
              {saving === "draft" ? "保存中…" : "保存草稿"}
            </button>
          ) : null}
          {!archived ? (
            <button
              className={styles.primary}
              type="button"
              disabled={Boolean(saving) || !instrument || saveUncertain}
              onClick={() => save("publish")}
            >
              {saving === "publish"
                ? "发布中…"
                : plan?.publishedAt
                  ? "发布更新"
                  : "发布计划"}
            </button>
          ) : (
            <span className={styles.status}>{previewState} · 只读归档</span>
          )}
        </div>
        <section className={styles.previewBox}>
          <div className={styles.previewTitle}>
            <h2>前台预览</h2>
            <span>仅 VIP 可见</span>
          </div>
          <div className={styles.previewCard}>
            <div className={styles.previewSymbol}>
              <strong>
                {instrument
                  ? `${instrument.baseAsset} / ${instrument.quoteAsset}`
                  : "待确认品种"}
              </strong>
              <span className={styles.status}>{previewState}</span>
            </div>
            <div className={styles.previewPrice}>
              {quote?.price ? `≈ ${displayPrice(quote.price)}` : "—"}
              <small>{priceUnit}</small>
            </div>
            <div className={styles.previewLevels}>
              <div>
                <span>
                  {fields.direction === "LONG" ? "做多入场" : "做空入场"}
                </span>
                <strong>{approximatePrice(fields.entryPrice)}</strong>
              </div>
              <div>
                <span>止损</span>
                <strong>{approximatePrice(fields.stopLoss)}</strong>
              </div>
              <div>
                <span>止盈</span>
                <strong>{approximatePrice(fields.takeProfit)}</strong>
              </div>
            </div>
            {range ? (
              <p className={styles.previewRange}>
                入场区间 ≈ {displayPrice(fields.entryLower)} –{" "}
                {displayPrice(fields.entryUpper)}
              </p>
            ) : null}
            {fields.rationale ? (
              <p className={styles.previewNote}>{fields.rationale}</p>
            ) : null}
            <div className={styles.previewExpiry}>
              有效至 {fields.validUntil.replace("T", " ").slice(5)}
              <span>UTC+8</span>
            </div>
          </div>
          <p className={styles.previewDisclaimer}>
            ≈ 为币安合约原生参考价，不代表成交价。计划仅供研究，不构成投资建议。
          </p>
        </section>
        <section className={styles.rules}>
          <p>
            发布后自动记录更新时间与版本，过期记录保留用于复盘。备注与点位仅 VIP
            可见。
          </p>
        </section>
        {plan?.status === "PUBLISHED" ? (
          <div className={styles.lifecycleActions}>
            <button
              type="button"
              disabled={Boolean(saving) || saveUncertain}
              onClick={() => save("close")}
            >
              结束计划并归档
            </button>
            <Link
              href={`/point/${encodeURIComponent(plan.id)}`}
              target="_blank"
            >
              查看已发布详情
              <ExternalLink size={13} />
            </Link>
          </div>
        ) : null}
        {archived ? (
          <p className={styles.hint}>
            归档计划不能重新发布。若有新的交易判断，请新建计划。
          </p>
        ) : null}
      </aside>
    </div>
  );
}
