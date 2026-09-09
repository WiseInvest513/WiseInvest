"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Expand } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import styles from "./community-gallery.module.css";

// Only the three visible cards are mounted. The original screenshots stay in public assets.
const communityImages = [
  { name: "market", title: "市场交流", width: 377, height: 757 },
  { name: "macro", title: "宏观讨论", width: 352, height: 661 },
  { name: "research", title: "投研分享", width: 360, height: 631 },
  { name: "discussion", title: "观点讨论", width: 366, height: 659 },
  { name: "review", title: "市场复盘", width: 367, height: 657 },
  { name: "framework", title: "研究思路", width: 360, height: 690 },
] as const;

const caption = "历史群聊片段，仅展示交流形式；个别收益不代表未来表现，不构成买卖建议。";
const wrapIndex = (index: number) => (index + communityImages.length) % communityImages.length;
const imageSrc = (name: string) => `/images/vip/community-${name}.png`;

export function CommunityGallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [enlargedIndex, setEnlargedIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const selectedImage = communityImages[enlargedIndex];

  function movePreview(direction: number) {
    setActiveIndex((current) => wrapIndex(current + direction));
  }

  function moveEnlarged(direction: number) {
    setEnlargedIndex((current) => wrapIndex(current + direction));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <figure className={styles.gallery} aria-label="Wise VIP 群聊内容预览">
        <div className={styles.stage} role="group" aria-roledescription="轮播" aria-label="点击群聊图片放大查看">
          {([-1, 0, 1] as const).map((position) => {
            const index = wrapIndex(activeIndex + position);
            const item = communityImages[index];
            return (
              <button
                key={item.name}
                type="button"
                className={styles.card}
                data-position={position}
                aria-label={`放大查看${item.title}群聊截图`}
                onClick={(event) => {
                  triggerRef.current = event.currentTarget;
                  setEnlargedIndex(index);
                  setOpen(true);
                }}
              >
                <Image
                  src={imageSrc(item.name)}
                  alt={`${item.title}的历史群聊片段`}
                  width={item.width}
                  height={item.height}
                  sizes="(max-width: 640px) 155px, 220px"
                  className={styles.cardImage}
                  draggable={false}
                />
                <span className={styles.expandHint}><Expand size={13} aria-hidden="true" />点击放大</span>
              </button>
            );
          })}
        </div>

        <div className={styles.controls}>
          <button type="button" className={styles.arrow} onClick={() => movePreview(-1)} aria-label="上一张群聊截图">
            <ArrowLeft size={17} aria-hidden="true" />
          </button>
          <span className={styles.counter} aria-live="polite" aria-atomic="true">
            <strong>{String(activeIndex + 1).padStart(2, "0")}</strong><span aria-hidden="true"> / </span><span className="sr-only">，共</span>06<span className="sr-only">张</span>
          </span>
          <button type="button" className={styles.arrow} onClick={() => movePreview(1)} aria-label="下一张群聊截图">
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.dots} role="group" aria-label="选择群聊截图">
          {communityImages.map((item, index) => (
            <button
              key={item.name}
              type="button"
              aria-label={`预览${item.title}，第 ${index + 1} 张`}
              aria-pressed={activeIndex === index}
              className={styles.dot}
              onClick={() => setActiveIndex(index)}
            ><span /></button>
          ))}
        </div>
        <figcaption className={styles.caption}>{caption}</figcaption>
      </figure>

      <DialogContent
        className="max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-2xl gap-3 overflow-y-auto rounded-2xl bg-white p-4 text-slate-950 motion-reduce:animate-none motion-reduce:transition-none sm:p-5 dark:bg-slate-900 dark:text-white"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus();
          touchStartRef.current = null;
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            moveEnlarged(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        <DialogTitle className="pr-8 text-base leading-6">{selectedImage.title} · 群聊片段</DialogTitle>
        <DialogDescription className="pr-4 text-xs leading-5">{caption}</DialogDescription>
        <div
          className={styles.enlargedFrame}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            touchStartRef.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
          }}
          onTouchEnd={(event) => {
            const start = touchStartRef.current;
            const end = event.changedTouches[0];
            touchStartRef.current = null;
            if (!start || !end || event.touches.length > 0) return;
            const deltaX = end.clientX - start.x;
            const deltaY = end.clientY - start.y;
            if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
              moveEnlarged(deltaX < 0 ? 1 : -1);
            }
          }}
          onTouchCancel={() => { touchStartRef.current = null; }}
        >
          <Image
            key={selectedImage.name}
            src={imageSrc(selectedImage.name)}
            alt={`${selectedImage.title}的历史群聊片段完整原图`}
            width={selectedImage.width}
            height={selectedImage.height}
            unoptimized
            loading="eager"
            className={styles.enlargedImage}
            draggable={false}
          />
        </div>
        <div className={styles.dialogFooter}>
          <div className={styles.controls}>
            <button type="button" className={styles.arrow} onClick={() => moveEnlarged(-1)} aria-label="放大图上一张"><ArrowLeft size={17} aria-hidden="true" /></button>
            <span className={styles.counter} aria-live="polite" aria-atomic="true">{String(enlargedIndex + 1).padStart(2, "0")} / 06</span>
            <button type="button" className={styles.arrow} onClick={() => moveEnlarged(1)} aria-label="放大图下一张"><ArrowRight size={17} aria-hidden="true" /></button>
          </div>
          <a href={imageSrc(selectedImage.name)} target="_blank" rel="noopener noreferrer" className={styles.originalLink}>
            打开原图<ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
