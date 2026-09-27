"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Expand, Pause, Play } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { profitScreenshots } from "./profit-screenshots";
import styles from "./profit-strip.module.css";

const disclaimer = "仅展示部分历史收益截图，含持仓浮盈，不代表完整交易记录或整体收益。杠杆会放大盈亏，历史表现不代表未来收益，不构成投资建议。";
const wrap = (index: number) => (index + profitScreenshots.length) % profitScreenshots.length;

export function ProfitStrip() {
  const viewport = useRef<HTMLDivElement>(null);
  const group = useRef<HTMLDivElement>(null);
  const groupWidth = useRef(0);
  const position = useRef(0);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const playing = !paused && !hovered && !focused && !open && !reducedMotion && inView && pageVisible;
  const item = profitScreenshots[selected];

  useEffect(() => {
    const element = viewport.current;
    const firstGroup = group.current;
    if (!element || !firstGroup) return;
    // Three identical sets keep both ends seamless; only the middle set is tabbable.
    const measure = () => {
      const width = firstGroup.getBoundingClientRect().width;
      const progress = groupWidth.current ? (element.scrollLeft % groupWidth.current) / groupWidth.current : 0;
      groupWidth.current = width;
      position.current = width * (1 + progress);
      element.scrollLeft = position.current;
    };
    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(firstGroup);
    const intersectionObserver = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    intersectionObserver.observe(element);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(motion.matches);
    const updateVisibility = () => setPageVisible(document.visibilityState === "visible");
    updateMotion();
    updateVisibility();
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous = 0;
    position.current = viewport.current?.scrollLeft ?? 0;
    const tick = (time: number) => {
      const element = viewport.current;
      const width = groupWidth.current;
      if (element && width > 0) {
        // Keep fractional progress across frames and responsive resizes without React renders.
        position.current -= previous ? Math.min(time - previous, 64) * 0.028 : 0;
        if (position.current < 0) position.current += width;
        if (position.current >= width * 2) position.current -= width;
        element.scrollLeft = position.current;
      }
      previous = time;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  function browse(direction: number) {
    setPaused(true);
    const element = viewport.current;
    if (!element || !groupWidth.current) return;
    const width = groupWidth.current;
    if (element.scrollLeft < width / 2) element.scrollLeft += width;
    else if (element.scrollLeft > width * 1.5) element.scrollLeft -= width;
    element.scrollBy({ left: direction * width / profitScreenshots.length, behavior: "instant" });
    position.current = element.scrollLeft;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className={styles.root}>
        <div className={styles.toolbar}>
          <span>{profitScreenshots.length} 张记录<span className={styles.hint}> · 点击放大查看</span></span>
          <div className={styles.controls}>
            <button type="button" onClick={() => browse(-1)} aria-label="向左浏览盈利截图"><ArrowLeft size={15} /></button>
            <button type="button" className={styles.playButton} onClick={() => setPaused(value => !value)} disabled={reducedMotion} aria-label={reducedMotion ? "系统已减少动态效果" : paused ? "播放盈利截图" : "暂停盈利截图"}>
              {paused || reducedMotion ? <Play size={13} /> : <Pause size={13} />}
              <span>{reducedMotion ? "手动浏览" : paused ? "播放" : "暂停"}</span>
            </button>
            <button type="button" onClick={() => browse(1)} aria-label="向右浏览盈利截图"><ArrowRight size={15} /></button>
          </div>
        </div>
        <div
          ref={viewport}
          className={styles.viewport}
          role="region"
          aria-label="历史盈利截图横向轮播"
          aria-describedby="profit-strip-note"
          tabIndex={0}
          data-playing={playing}
          data-pause-reason={reducedMotion ? "reduced-motion" : paused ? "manual" : open ? "dialog" : focused ? "focus" : hovered ? "hover" : !pageVisible ? "hidden-tab" : !inView ? "offscreen" : undefined}
          onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }}
          onPointerLeave={() => setHovered(false)}
          onPointerDown={() => setPaused(true)}
          onWheel={() => setPaused(true)}
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
          onKeyDown={event => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              browse(event.key === "ArrowLeft" ? -1 : 1);
            }
          }}
        >
          <div className={styles.track}>
            {[0, 1, 2].map(copy => (
              <div ref={copy === 0 ? group : undefined} key={copy} className={styles.group} aria-hidden={copy !== 1 ? true : undefined}>
                {profitScreenshots.map((screenshot, index) => (
                  <button
                    type="button" key={screenshot.id} className={styles.card} tabIndex={copy === 1 ? 0 : -1}
                    aria-label={`放大查看${screenshot.label}`}
                    onClick={event => { trigger.current = event.currentTarget; setSelected(index); setOpen(true); }}
                  >
                    <Image src={screenshot.src} alt={screenshot.label} width={screenshot.width} height={screenshot.height} sizes="(max-width: 640px) 216px, 252px" className={styles.image} draggable={false} />
                    <span className={styles.expand}><Expand size={13} aria-hidden="true" /><span>查看原图</span></span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className={styles.note} id="profit-strip-note">{disclaimer}</p>
      </div>

      <DialogContent
        className="max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-3xl gap-3 overflow-y-auto rounded-2xl bg-white p-4 text-slate-950 motion-reduce:animate-none sm:p-5 dark:bg-slate-900 dark:text-white"
        onCloseAutoFocus={event => {
          event.preventDefault();
          const accessibleTrigger = trigger.current?.isConnected && !trigger.current.closest('[aria-hidden="true"]');
          (accessibleTrigger ? trigger.current : viewport.current)?.focus({ preventScroll: true });
          touch.current = null;
        }}
        onKeyDown={event => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            setSelected(value => wrap(value + (event.key === "ArrowLeft" ? -1 : 1)));
          }
        }}
      >
        <DialogTitle className="pr-8 text-base leading-6">{item.label}</DialogTitle>
        <DialogDescription className="text-xs leading-5">{disclaimer}</DialogDescription>
        <div className={styles.enlargedFrame}
          onTouchStart={event => { const point = event.touches[0]; touch.current = event.touches.length === 1 ? { x: point.clientX, y: point.clientY } : null; }}
          onTouchCancel={() => { touch.current = null; }}
          onTouchEnd={event => {
            const start = touch.current;
            const end = event.changedTouches[0];
            touch.current = null;
            if (!start || !end || event.touches.length > 0) return;
            const dx = end.clientX - start.x, dy = end.clientY - start.y;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) setSelected(value => wrap(value + (dx < 0 ? 1 : -1)));
          }}
        >
          <Image key={item.id} src={item.src} alt={`${item.label}完整原图`} width={item.width} height={item.height} className={styles.enlargedImage} unoptimized loading="eager" draggable={false} />
        </div>
        <div className={styles.dialogFooter}>
          <div className={styles.controls}>
            <button type="button" onClick={() => setSelected(value => wrap(value - 1))} aria-label="上一张盈利原图"><ArrowLeft size={17} /></button>
            <span aria-live="polite" aria-atomic="true">{String(selected + 1).padStart(2, "0")} / {profitScreenshots.length}</span>
            <button type="button" onClick={() => setSelected(value => wrap(value + 1))} aria-label="下一张盈利原图"><ArrowRight size={17} /></button>
          </div>
          <a href={item.src} target="_blank" rel="noopener noreferrer" className={styles.original}>打开原图<ArrowUpRight size={14} /></a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
