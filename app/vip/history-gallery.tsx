"use client";

import Image from "next/image";
import { useRef, useState, type TouchEvent } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Expand } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { historyScreenshots } from "./history-screenshots";
import styles from "./history-gallery.module.css";

const total = historyScreenshots.length;

export function HistoryGallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const touchRef = useRef<{ x: number; y: number; vertical: boolean } | null>(null);
  const suppressClickUntilRef = useRef(0);
  const selected = historyScreenshots[activeIndex];
  const counter = `${String(activeIndex + 1).padStart(2, "0")} / ${total}`;

  function move(direction: number) {
    setActiveIndex((current) => (current + direction + total) % total);
  }

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    suppressClickUntilRef.current = 0;
    touchRef.current = event.touches.length === 1
      ? { x: touch.clientX, y: touch.clientY, vertical: false }
      : null;
  }

  function onTouchMove(event: TouchEvent<HTMLDivElement>) {
    const start = touchRef.current;
    const touch = event.touches[0];
    if (!start || !touch || event.touches.length !== 1) {
      touchRef.current = null;
      return;
    }
    const dx = Math.abs(touch.clientX - start.x);
    const dy = Math.abs(touch.clientY - start.y);
    if (dy > 10 && dy > dx) start.vertical = true;
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = touchRef.current;
    const end = event.changedTouches[0];
    touchRef.current = null;
    if (!start || !end || event.touches.length > 0) return;
    const dx = end.clientX - start.x;
    const dy = end.clientY - start.y;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) suppressClickUntilRef.current = Date.now() + 500;
    if (!start.vertical && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
  }

  const swipeHandlers = {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel: () => { touchRef.current = null; },
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <figure
        className={styles.gallery}
        aria-label="历史战绩聊天记录"
        aria-roledescription="轮播"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        <div
          className={styles.stage}
          {...swipeHandlers}
          onClickCapture={(event) => {
            if (event.detail !== 0 && Date.now() < suppressClickUntilRef.current) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
        >
          <button
            ref={triggerRef}
            type="button"
            className={styles.imageButton}
            aria-label={`放大查看历史记录：${selected.title}，第 ${activeIndex + 1} 张，共 ${total} 张`}
            onClick={() => setOpen(true)}
          >
            <Image
              key={selected.src}
              src={selected.src}
              alt={selected.title}
              width={selected.width}
              height={selected.height}
              sizes="(max-width: 380px) 190px, 224px"
              className={styles.previewImage}
              draggable={false}
            />
            <span className={styles.expandHint}><Expand size={13} aria-hidden="true" />点击放大</span>
          </button>
        </div>

        <div className={styles.controls}>
          <button type="button" className={styles.arrow} onClick={() => move(-1)} aria-label="上一张历史记录"><ArrowLeft size={17} aria-hidden="true" /></button>
          <span className={styles.counter} aria-live="polite" aria-atomic="true" aria-label={`第 ${activeIndex + 1} 张，共 ${total} 张`}>{counter}</span>
          <button type="button" className={styles.arrow} onClick={() => move(1)} aria-label="下一张历史记录"><ArrowRight size={17} aria-hidden="true" /></button>
        </div>
        <figcaption className={styles.caption}>左右滑动 · 点击查看完整记录</figcaption>
      </figure>

      <DialogContent
        className="max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-2xl gap-3 overflow-y-auto rounded-2xl bg-white p-4 text-slate-950 motion-reduce:animate-none motion-reduce:transition-none sm:p-5 dark:bg-slate-900 dark:text-white"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus({ preventScroll: true });
          touchRef.current = null;
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        <DialogTitle className="pr-8 text-base leading-6">{selected.title} · 历史记录</DialogTitle>
        <DialogDescription className="pr-4 text-xs leading-5">部分历史群聊与反馈，不代表完整交易结果或未来收益，不构成投资建议。</DialogDescription>
        <div className={styles.dialogToolbar}>
          <div className={styles.controls}>
            <button type="button" className={styles.arrow} onClick={() => move(-1)} aria-label="历史记录放大图上一张"><ArrowLeft size={17} aria-hidden="true" /></button>
            <span className={styles.counter} aria-live="polite" aria-atomic="true">{counter}</span>
            <button type="button" className={styles.arrow} onClick={() => move(1)} aria-label="历史记录放大图下一张"><ArrowRight size={17} aria-hidden="true" /></button>
          </div>
          <a href={selected.src} target="_blank" rel="noopener noreferrer" className={styles.originalLink}>打开原图<ArrowUpRight size={14} aria-hidden="true" /></a>
        </div>
        <div className={styles.enlargedFrame} {...swipeHandlers}>
          <Image
            key={selected.src}
            src={selected.src}
            alt={`${selected.title}完整原图`}
            width={selected.width}
            height={selected.height}
            unoptimized
            loading="eager"
            className={styles.enlargedImage}
            draggable={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
