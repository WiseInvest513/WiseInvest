"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  History,
  House,
  Plus,
  RefreshCw,
  Search,
  LockKeyhole,
} from "lucide-react";
import type { PointPlan } from "@/lib/point/types";
import { PointEditor } from "./point-editor";
import { chinaDate, lifecycle } from "./point-format";
import styles from "./point-admin.module.css";

type Filter = "all" | "published" | "draft" | "archived";
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "全部计划" },
  { value: "published", label: "已发布" },
  { value: "draft", label: "草稿" },
  { value: "archived", label: "已归档" },
];

export function PointManager({
  initialItems,
  previewMode,
  unavailable,
}: {
  initialItems: PointPlan[];
  previewMode: boolean;
  unavailable?: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [editor, setEditor] = useState<PointPlan | "new" | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState(
    unavailable ? "点位数据暂时不可用，请稍后重试。" : "",
  );
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [denied, setDenied] = useState(false);
  const request = useRef<AbortController | null>(null);
  const editorState = useRef({ dirty: false, saving: false });
  const noticeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (notice) noticeRef.current?.scrollIntoView({ block: "nearest" });
  }, [notice]);

  const accessDenied = useCallback(() => {
    request.current?.abort();
    request.current = null;
    setItems([]);
    setEditor(null);
    setNotice("");
    setError("");
    setLoading(false);
    setDenied(true);
  }, []);

  const editingChanged = useCallback((dirty: boolean, saving: boolean) => {
    editorState.current = { dirty, saving };
  }, []);

  function backToList() {
    if (editorState.current.saving) {
      setNotice("正在保存，请等待结果后再离开。");
      return;
    }
    if (
      editorState.current.dirty &&
      !window.confirm("还有未保存的修改。离开将丢失这些内容，确定离开吗？")
    )
      return;
    editorState.current = { dirty: false, saving: false };
    setEditor(null);
    setNotice("");
  }

  const refresh = useCallback(async () => {
    if (request.current || denied) return;
    const controller = new AbortController();
    request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/point", {
        cache: "no-store",
        signal: controller.signal,
      });
      if (response.status === 401 || response.status === 403) {
        accessDenied();
        return;
      }
      const result = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok || result.unavailable)
        throw new Error(result.message || "点位数据暂时不可用，请稍后重试。");
      setItems(result.items);
    } catch (cause) {
      if (request.current !== controller) return;
      setError(
        controller.signal.aborted
          ? "加载超时，请重试。"
          : cause instanceof Error
            ? cause.message
            : "加载失败，请重试。",
      );
    } finally {
      window.clearTimeout(timeout);
      if (request.current === controller) {
        request.current = null;
        setLoading(false);
      }
    }
  }, [accessDenied, denied]);

  useEffect(() => {
    const revalidate = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", revalidate);
    document.addEventListener("visibilitychange", revalidate);
    const timer = window.setInterval(revalidate, 5 * 60 * 1000);
    return () => {
      window.removeEventListener("focus", revalidate);
      document.removeEventListener("visibilitychange", revalidate);
      window.clearInterval(timer);
      request.current?.abort();
      request.current = null;
    };
  }, [refresh]);

  const visibleItems = items.filter((plan) => {
    const state = lifecycle(plan);
    const inFilter =
      filter === "all" ||
      (filter === "draft" && state === "草稿") ||
      (filter === "published" && state === "已发布") ||
      (filter === "archived" && ["已撤回", "已结束", "已到期"].includes(state));
    return (
      inFilter &&
      `${plan.instrument.symbol} ${plan.instrument.name} ${plan.id}`
        .toLowerCase()
        .includes(query.toLowerCase().trim())
    );
  });

  function saved(plan: PointPlan, message: string) {
    // A refresh started before this write must not replace the saved version.
    request.current?.abort();
    request.current = null;
    setLoading(false);
    setItems((current) => [
      plan,
      ...current.filter((item) => item.id !== plan.id),
    ]);
    setEditor(plan);
    setNotice(message);
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/admin" className={styles.brand}>
          Wise Invest<span>管理后台</span>
        </Link>
        <nav aria-label="点位管理导航" className={styles.nav}>
          <Link href="/point">
            <House size={20} />
            返回网站
          </Link>
          <button
            type="button"
            className={styles.navActive}
            onClick={backToList}
          >
            <FileText size={20} />
            点位管理
          </button>
          <Link href="/admin/audit">
            <History size={20} />
            操作记录
          </Link>
        </nav>
        <div className={styles.sidebarFooter}>
          Wisdom for a brighter tomorrow.
          <br />
          理性投资 · 更好的明天
        </div>
      </aside>
      <main className={styles.workspace}>
        {previewMode ? (
          <p className={styles.demoBanner}>
            本地演示模式 ·
            计划仅用于预览，保存不会写入正式数据库；参考行情从币安官方接口读取。
          </p>
        ) : null}
        {notice ? (
          <div ref={noticeRef} className={styles.success} role="status">
            {notice}
          </div>
        ) : null}
        {denied ? (
          <section className={styles.empty} role="alert">
            <LockKeyhole size={30} />
            <h1>管理权限已失效</h1>
            <p>已收回计划内容。请重新登录管理员账户后再打开此页面。</p>
            <Link
              href="/login?callbackUrl=%2Fadmin%2Fpoint"
              className={styles.primary}
            >
              重新登录
            </Link>
          </section>
        ) : editor !== null ? (
          <PointEditor
            key={typeof editor === "string" ? "new" : editor.id}
            plan={editor === "new" ? null : editor}
            previewMode={previewMode}
            onSaved={saved}
            onBack={backToList}
            onAccessDenied={accessDenied}
            onEditingChanged={editingChanged}
          />
        ) : (
          <>
            <header className={styles.listHeading}>
              <div>
                <h1>点位管理</h1>
                <p>管理交易计划、发布版本与归档记录。</p>
              </div>
              <button
                className={styles.primary}
                type="button"
                onClick={() => {
                  setEditor("new");
                  setNotice("");
                }}
              >
                <Plus size={17} />
                新建点位计划
              </button>
            </header>
            <div className={styles.listTools}>
              <div className={styles.tabs} role="group" aria-label="计划状态">
                {filters.map((item) => (
                  <button
                    type="button"
                    key={item.value}
                    aria-pressed={filter === item.value}
                    className={filter === item.value ? styles.tabActive : ""}
                    onClick={() => setFilter(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className={styles.search}>
                <Search size={17} />
                <input
                  aria-label="搜索现有计划"
                  placeholder="搜索品种、名称或计划编号"
                  value={query}
                  maxLength={100}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <button
                className={styles.iconButton}
                type="button"
                onClick={refresh}
                disabled={loading}
                aria-label="刷新计划"
              >
                <RefreshCw size={18} className={loading ? styles.spin : ""} />
              </button>
            </div>
            {error ? (
              <div className={styles.error} role="alert">
                {error}
                <button type="button" onClick={refresh}>
                  重新加载
                </button>
              </div>
            ) : null}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>交易品种 / 计划</th>
                    <th>方向</th>
                    <th>状态</th>
                    <th>版本</th>
                    <th>有效期至 · UTC+8</th>
                    <th>更新时间</th>
                    <th>
                      <span className={styles.srOnly}>操作</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((plan) => (
                    <tr key={plan.id}>
                      <td>
                        <strong>{plan.instrument.symbol}</strong>
                        <span>{plan.instrument.name}</span>
                        <small>{plan.id}</small>
                      </td>
                      <td data-label="方向">
                        <span
                          className={
                            plan.direction === "LONG"
                              ? styles.long
                              : styles.short
                          }
                        >
                          {plan.direction === "LONG" ? "做多" : "做空"}
                        </span>
                      </td>
                      <td data-label="状态">
                        <span
                          className={`${styles.status} ${lifecycle(plan) === "已发布" ? styles.published : ""}`}
                        >
                          {lifecycle(plan)}
                        </span>
                      </td>
                      <td data-label="版本">V{plan.version}</td>
                      <td data-label="有效期至 · UTC+8">
                        {chinaDate(plan.validUntil)}
                      </td>
                      <td data-label="更新时间">{chinaDate(plan.updatedAt)}</td>
                      <td>
                        <button
                          className={styles.rowAction}
                          type="button"
                          onClick={() => {
                            setEditor(plan);
                            setNotice("");
                          }}
                        >
                          查看 / 编辑
                          <ArrowRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibleItems.length === 0 && !error ? (
                <div className={styles.empty}>
                  <FileText size={30} />
                  <h2>
                    {items.length === 0 ? "还没有点位计划" : "没有匹配的计划"}
                  </h2>
                  <p>
                    {items.length === 0
                      ? "从搜索并确认交易品种开始，创建第一条计划。"
                      : "试试其他搜索词或切换计划状态。"}
                  </p>
                  {items.length === 0 ? (
                    <button
                      className={styles.secondary}
                      type="button"
                      onClick={() => setEditor("new")}
                    >
                      新建计划
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
            <p className={styles.listFootnote}>
              到期、撤回或结束的计划保留归档。发布更新生成新版本，不覆盖历史记录。
            </p>
            <Link href="/admin" className={styles.backToAdmin}>
              <ArrowLeft size={15} />
              返回管理后台
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
