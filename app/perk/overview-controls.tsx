"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import type { PerkSearchEntry } from "./overview-content";
import styles from "./overview.module.css";

export function PerkSearch({ entries }: { entries: PerkSearchEntry[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const results = words.length ? entries.filter((entry) => {
    const text = `${entry.title} ${entry.category} ${entry.keywords}`.toLocaleLowerCase();
    return words.every((word) => text.includes(word));
  }) : [];
  const visible = open && words.length > 0;

  return (
    <div className={styles.search} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
    }}>
      <form role="search" onSubmit={(event) => { event.preventDefault(); setOpen(true); }}>
        <Search aria-hidden="true" size={21} />
        <label className={styles.srOnly} htmlFor="perk-search">搜索平台或你需要的福利</label>
        <input
          ref={inputRef} id="perk-search" type="search" value={query} autoComplete="off"
          placeholder="搜索平台或你需要的福利" aria-controls={visible ? "perk-search-results" : undefined}
          onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
        />
        {query && <button type="button" aria-label="清空福利搜索" onClick={() => { setQuery(""); inputRef.current?.focus(); }}><X size={17} /></button>}
      </form>
      {visible && <div id="perk-search-results" className={styles.searchResults}>
        <p role="status">{results.length ? `找到 ${results.length} 个相关入口` : "暂未找到相关福利，试试平台名称或分类。"}</p>
        <ul>
          {results.map((entry) => <li key={entry.id}>
            <Link href={entry.href} prefetch={false} onClick={() => setOpen(false)}>
              <span><strong>{entry.title}</strong><small>{entry.category}</small></span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </li>)}
        </ul>
      </div>}
    </div>
  );
}

export function PerkTopicNav({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const sections = items.map(({ id }) => document.getElementById(id)).filter((section): section is HTMLElement => Boolean(section));
    let frame = 0;
    const updateActive = () => {
      frame = 0;
      // Use the top reading position, not whichever section happens to enter
      // the bottom of a tall viewport during smooth scrolling.
      const threshold = window.innerWidth <= 760 ? 180 : 210;
      let current = sections[0]?.id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= threshold) current = section.id;
      }
      if (current) setActive(current);
    };
    const scheduleUpdate = () => { if (!frame) frame = requestAnimationFrame(updateActive); };
    updateActive();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      cancelAnimationFrame(frame);
    };
  }, [items]);

  return <nav aria-label="按需求浏览福利" className={styles.topicNav}>
    {items.map(({ id, label }) => <a
      key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const section = document.getElementById(id);
        if (!section) return;
        event.preventDefault();
        setActive(id);
        window.history.replaceState(null, "", `#${id}`);
        section.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      }}
    >{label}</a>)}
  </nav>;
}
