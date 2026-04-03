import React from "react";

// ─── UID generation (deterministic 4-digit from article id) ──
export function genUid(id: string): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let h1 = 5381, h2 = 52711;
  for (let i = 0; i < id.length; i++) {
    const c = id.charCodeAt(i);
    h1 = ((h1 << 5) + h1) ^ c;
    h2 = ((h2 << 5) + h2) ^ c;
  }
  let result = "";
  let seed = ((h1 >>> 0) * 0x100000000 + (h2 >>> 0));
  for (let i = 0; i < 8; i++) {
    result += chars[Math.abs(Math.floor(seed / Math.pow(62, i))) % 62];
  }
  return result;
}

// ─── TOC 提取 ──────────────────────────────────────────────
export function extractToc(content: string) {
  const toc: { id: string; text: string; level: number }[] = [];
  let idx = 0;
  content.split("\n").forEach((line) => {
    const m = line.match(/^(#{1,4})\s+(.+)/);
    if (m) toc.push({ id: `h-${idx++}`, text: m[2].replace(/\*\*/g, ""), level: m[1].length });
  });
  return toc;
}

// ─── Inline markdown (bold / code / link) ─────────────────
export function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|`(.+?)`/g;
  let lastIdx = 0; let key = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(<span key={key++}>{text.slice(lastIdx, match.index)}</span>);
    if (match[1] != null) parts.push(<a key={key++} href={match[2]} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">{renderInline(match[1])}</a>);
    else if (match[3] != null) parts.push(<strong key={key++} className="font-semibold">{match[3]}</strong>);
    else if (match[4] != null) parts.push(<code key={key++} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono text-amber-700 dark:text-amber-400">{match[4]}</code>);
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) parts.push(<span key={key++}>{text.slice(lastIdx)}</span>);
  return <>{parts}</>;
}

// ─── Markdown Renderer ─────────────────────────────────────
export function renderMarkdown(content: string, toc: { id: string; text: string; level: number }[]) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let tocIdx = 0; let i = 0; let k = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // heading
    const hm = trimmed.match(/^(#{1,4})\s+(.+)/);
    if (hm) {
      const level = hm[1].length;
      const text = hm[2].replace(/\*\*/g, "");
      const id = toc[tocIdx]?.id ?? `h-${tocIdx}`; tocIdx++;
      const cls = {
        1: "text-2xl font-bold text-slate-900 dark:text-white mt-10 mb-4 scroll-mt-24",
        2: "text-xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-3 scroll-mt-24",
        3: "text-lg font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-2 scroll-mt-24",
        4: "text-base font-semibold text-slate-700 dark:text-slate-300 mt-4 mb-2 scroll-mt-24",
      }[level] ?? "";
      const Tag = `h${level}` as "h1"|"h2"|"h3"|"h4";
      elements.push(<Tag key={k++} id={id} className={cls}>{text}</Tag>);
      i++; continue;
    }

    // hr
    if (trimmed === "---") { elements.push(<hr key={k++} className="my-8 border-slate-100 dark:border-slate-800" />); i++; continue; }

    // code block
    if (trimmed.startsWith("```")) {
      const block: string[] = []; i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) { block.push(lines[i]); i++; }
      elements.push(
        <pre key={k++} className="my-5 rounded-xl bg-slate-900 dark:bg-slate-950 p-5 overflow-x-auto border border-slate-800">
          <code className="text-[13px] font-mono text-slate-300 leading-7">{block.join("\n")}</code>
        </pre>
      );
      i++; continue;
    }

    // blockquote
    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote key={k++} className="my-5 pl-5 border-l-4 border-amber-400 bg-amber-50/50 dark:bg-amber-900/10 py-3 pr-4 rounded-r-lg text-slate-600 dark:text-slate-400 italic">
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
      i++; continue;
    }

    // iframe
    if (trimmed.startsWith("<iframe")) {
      const srcMatch = trimmed.match(/src="([^"]+)"/);
      const heightMatch = trimmed.match(/height="([^"]+)"/);
      if (srcMatch) {
        const src = srcMatch[1];
        const height = heightMatch ? heightMatch[1] : "500";
        elements.push(
          <div key={k++} className="my-6 rounded-2xl overflow-hidden aspect-video">
            <iframe
              src={src}
              width="100%"
              height={height}
              className="w-full rounded-xl"
              frameBorder={0}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        );
        // 跳过多行 iframe 直到结束
        while (i < lines.length && !lines[i].includes("/>") && !lines[i].includes("</iframe>")) i++;
        i++; continue;
      }
    }

    // image
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      const [, alt, src] = imgMatch;
      elements.push(
        <figure key={k++} className="my-6 max-w-4xl mx-auto">
          <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-3">
            <img src={src} alt={alt} className="w-full rounded-xl object-cover" loading="lazy" />
          </div>
          {alt && <figcaption className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">{alt}</figcaption>}
        </figure>
      );
      i++; continue;
    }

    // table
    if (trimmed.startsWith("|") && i + 1 < lines.length && lines[i+1].trim().match(/^\|[-| :]+\|$/)) {
      const headerCells = trimmed.split("|").filter(Boolean).map(c => c.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(lines[i].trim().split("|").filter(Boolean).map(c => c.trim())); i++;
      }
      elements.push(
        <div key={k++} className="my-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr>{headerCells.map((h,j) => <th key={j} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  {row.map((cell, ci) => <td key={ci} className="px-5 py-3 text-slate-700 dark:text-slate-300">{renderInline(cell)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // unordered list
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) { items.push(lines[i].trim().slice(2)); i++; }
      elements.push(
        <ul key={k++} className="my-4 space-y-2 pl-5">
          {items.map((it, j) => <li key={j} className="text-slate-700 dark:text-slate-300 text-[16px] leading-8 list-disc marker:text-amber-400">{renderInline(it)}</li>)}
        </ul>
      );
      continue;
    }

    // ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s/, "")); i++; }
      elements.push(
        <ol key={k++} className="my-4 space-y-2 pl-5 list-decimal marker:text-amber-500 marker:font-semibold">
          {items.map((it, j) => <li key={j} className="text-slate-700 dark:text-slate-300 text-[16px] leading-8">{renderInline(it)}</li>)}
        </ol>
      );
      continue;
    }

    if (!trimmed) { elements.push(<div key={k++} className="h-2" />); i++; continue; }

    elements.push(
      <p key={k++} className="my-3 text-[16px] text-slate-600 dark:text-slate-400 leading-8">{renderInline(trimmed)}</p>
    );
    i++;
  }
  return elements;
}
