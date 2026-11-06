"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useSearchParams } from "next/navigation";
import { categories } from "@/lib/articles-data";
import { readArticleLibraryFilters, updateArticleLibrarySearch, type ArticleLibraryFilters } from "@/lib/article-library-filters";

const categoryIds = categories.map(category => category.id);
const positionPrefix = "wise-article-list-position-v1:";
type LibraryState = ArticleLibraryFilters & { q: string };
type Position = { pane: number; window: number };
const empty: LibraryState = { q: "", topic: "", sort: "" };

/** URL owns filters; session storage remembers only the list's viewport position. */
export function useArticleLibraryNavigation(pathname: string, pane: RefObject<HTMLElement | null>, isListing: boolean) {
  const observedSearch = useSearchParams().toString();
  const [state, setState] = useState<LibraryState>(empty);
  const [ready, setReady] = useState(false);
  const restoring = useRef(false);
  const restoredKey = useRef("");
  const authoredUrl = useRef("");
  const key = useCallback(() => positionPrefix + window.location.pathname + window.location.search, []);
  const save = useCallback(() => {
    if (!isListing || restoring.current) return;
    try {
      sessionStorage.setItem(key(), JSON.stringify({ pane: pane.current?.scrollTop ?? 0, window: window.scrollY }));
    } catch { /* Reading and filtering still work when browser storage is disabled. */ }
  }, [isListing, key, pane]);

  useEffect(() => {
    const sync = () => {
      const next = readArticleLibraryFilters(window.location.search, categoryIds);
      setState(current => current.q === next.q && current.topic === next.topic && current.sort === next.sort ? current : next);
      setReady(true);
      // Our own filter changes already reset the viewport. A Link/Back can
      // change only the query on the same route and must restore URL state too.
      if (authoredUrl.current !== window.location.pathname + window.location.search) restoredKey.current = "";
      authoredUrl.current = "";
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [pathname, observedSearch]);

  const update = useCallback((patch: Partial<LibraryState>) => {
    save();
    const search = updateArticleLibrarySearch(window.location.search, patch);
    const next = readArticleLibraryFilters(search, categoryIds);
    const url = window.location.pathname + (search ? `?${search}` : "") + window.location.hash;
    // Preserve Next's history data so Back still returns to the original list.
    window.history.replaceState(window.history.state, "", url);
    authoredUrl.current = window.location.pathname + window.location.search;
    setState(next);
    restoredKey.current = key();
    if (isListing) {
      pane.current?.scrollTo({ top: 0, behavior: "instant" });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [isListing, key, pane, save]);

  useEffect(() => {
    if (!ready || !isListing) return;
    const currentKey = key();
    if (restoredKey.current === currentKey) return;
    restoredKey.current = currentKey;
    let position: Position | undefined;
    try {
      const parsed = JSON.parse(sessionStorage.getItem(currentKey) ?? "null");
      if (parsed && Number.isFinite(parsed.pane) && Number.isFinite(parsed.window)) position = parsed;
    } catch { /* Ignore stale or unavailable storage. */ }
    if (!position) return;
    restoring.current = true;
    let secondFrame = 0;
    const frame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        pane.current?.scrollTo({ top: position!.pane, behavior: "instant" });
        window.scrollTo({ top: position!.window, behavior: "instant" });
        restoring.current = false;
      });
    });
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(secondFrame); restoring.current = false; };
  }, [ready, isListing, pathname, state.q, state.topic, state.sort, key, pane]);

  useEffect(() => {
    if (!ready || !isListing) return;
    const element = pane.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if (!timer) timer = setTimeout(() => { timer = undefined; save(); }, 150);
    };
    const leaving = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a[href]")) save();
    };
    element?.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    element?.addEventListener("click", leaving, true);
    window.addEventListener("pagehide", save);
    return () => {
      if (timer) clearTimeout(timer);
      element?.removeEventListener("scroll", schedule);
      window.removeEventListener("scroll", schedule);
      element?.removeEventListener("click", leaving, true);
      window.removeEventListener("pagehide", save);
    };
  }, [ready, isListing, pane, save]);

  return {
    searchQuery: state.q,
    setSearchQuery: useCallback((q: string) => update({ q }), [update]),
    filterTopic: state.topic,
    sortOrder: state.sort,
    onFiltersChange: useCallback((filters: ArticleLibraryFilters) => update(filters), [update]),
  };
}
