"use client";

import { useEffect, useId, useRef, useState } from "react";
import imageMetadata from "@/lib/article-image-metadata.json";
import styles from "./article-image.module.css";

const dimensions = imageMetadata as Record<string, number[]>;
function knownDimensions(src: string) {
  const pathname = src.split(/[?#]/)[0];
  try { return dimensions[pathname] ?? dimensions[decodeURI(pathname)]; }
  catch { return dimensions[pathname]; }
}

/** Fold tall screenshots, not ordinary landscape graphics or square QR codes. */
export function shouldFoldArticleImage(width: number, height: number, renderedWidth: number, limit: number, guide = false, caption = "") {
  // A single invitation QR poster must remain scannable. Tall step collages
  // containing a QR code still use the long-image viewer.
  if (/二维码|QR\s?code/i.test(caption) && height / width <= 1.5) return false;
  return width > 0 && height > 0 && renderedWidth > 0
    && (guide || height / width >= 1.25)
    && renderedWidth * height / width > limit + 32;
}

export function ArticleImage({ src, alt, guide = false }: { src: string; alt: string; guide?: boolean }) {
  // Generated at build/dev startup: reserve the real aspect ratio before lazy
  // images load, without reading public assets in serverless request handlers.
  const [size, setSize] = useState(() => {
    const known = knownDimensions(src);
    return known ? { src, width: known[0], height: known[1] } : { src: "", width: 0, height: 0 };
  });
  const [layout, setLayout] = useState({ width: 0, limit: 448 });
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const previewId = useId();
  const titleId = useId();
  const ready = size.src === src && size.width > 0;
  const long = ready && shouldFoldArticleImage(size.width, size.height, layout.width || 896, layout.limit, guide, alt);
  const scrollable = long || (ready && size.height / size.width >= 1.25);
  const label = alt || "文章配图";

  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth) {
      setSize({ src, width: image.naturalWidth, height: image.naturalHeight });
    }
  }, [src]);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;
    const measure = () => {
      const width = preview.getBoundingClientRect().width;
      const limit = parseFloat(getComputedStyle(preview).getPropertyValue("--preview-limit")) || 448;
      setLayout(previous => previous.width === width && previous.limit === limit ? previous : { width, limit });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(preview);
    measure();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const readingPane = previewRef.current?.closest<HTMLElement>('[aria-label="文章内容"]');
    const surfaces = [document.documentElement, readingPane].filter((element): element is HTMLElement => Boolean(element));
    const previous = surfaces.map(element => ({ element, overflow: element.style.overflow, top: element.scrollTop }));
    previous.forEach(({ element }) => { element.style.overflow = "hidden"; });
    dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });
    if (scrollerRef.current) scrollerRef.current.scrollTo(0, 0);
    return () => {
      dialog.close();
      previous.forEach(({ element, overflow, top }) => { element.style.overflow = overflow; element.scrollTop = top; });
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

  const openViewer = (event: React.MouseEvent<HTMLElement>) => {
    triggerRef.current = event.currentTarget;
    setZoomed(false);
    setOpen(true);
  };
  const toggleExpanded = () => {
    if (expanded) previewRef.current?.scrollIntoView({ block: "nearest" });
    setExpanded(value => !value);
  };

  return <div className={styles.frame} data-article-image data-long={long} data-guide={guide}>
    {guide || long ? <div className={styles.toolbar}>
      <span>{guide ? "操作图解" : "长图预览"}</span>
      <div>
        {long ? <button type="button" aria-expanded={expanded} aria-controls={previewId} onClick={toggleExpanded}>{expanded ? "收起长图" : "在正文展开"}</button> : null}
        <button type="button" onClick={openViewer}>{long ? "查看完整长图" : "放大查看"} <span aria-hidden="true">↗</span></button>
      </div>
    </div> : null}
    <div ref={previewRef} id={previewId} className={styles.preview} data-folded={!expanded && (!ready || long)} data-pending={!ready}
      style={ready ? { aspectRatio: `${size.width} / ${size.height}` } : { aspectRatio: guide ? undefined : "16 / 9", height: guide ? "var(--preview-limit)" : undefined }}>
      <button type="button" onClick={openViewer} aria-label={`放大查看：${label}`} className={styles.imageButton}>
        <img ref={imageRef} src={src} alt={alt} width={ready ? size.width : undefined} height={ready ? size.height : undefined} loading="lazy" decoding="async" className={styles.image}
          onLoad={event => { const image = event.currentTarget; setSize({ src, width: image.naturalWidth, height: image.naturalHeight }); }}
          onError={() => setSize({ src, width: 1, height: 1 })} />
        {long && !expanded ? <span className={styles.fade}><span>点击查看完整长图 <span aria-hidden="true">↗</span></span></span> : null}
      </button>
    </div>
    <dialog ref={dialogRef} aria-labelledby={titleId} className={styles.dialog}
      onCancel={event => { event.preventDefault(); setOpen(false); }}
      onClose={() => setOpen(false)}
      onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      {open ? <div className={styles.viewer}>
        <div className={styles.viewerHeader}>
          <div><p id={titleId}>{label}</p><span>{scrollable ? "上下滚动查看完整长图，可放大查看细节" : "查看完整图片，可放大查看细节"}</span></div>
          <div className={styles.viewerActions}>
            <button type="button" aria-pressed={zoomed} onClick={() => setZoomed(value => !value)}>{zoomed ? "适应宽度" : "放大细节"}</button>
            <a href={src} target="_blank" rel="noopener noreferrer">原图 <span aria-hidden="true">↗</span></a>
            <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="关闭图片">关闭</button>
          </div>
        </div>
        <div ref={scrollerRef} className={styles.scroller} tabIndex={0} aria-label="完整图片，可滚动查看" data-zoomed={zoomed} data-long={scrollable}>
          <img src={src} alt={alt} className={styles.fullImage}
            style={zoomed ? { width: Math.max(size.width, 1200), maxWidth: "none", maxHeight: "none" } : undefined} />
        </div>
      </div> : null}
    </dialog>
  </div>;
}
