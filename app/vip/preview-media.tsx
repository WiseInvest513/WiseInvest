"use client";

import Image from "next/image";
import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { ArrowUpRight, Expand } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import styles from "./vip.module.css";

type PreviewImage = { src: string; label: string; alt: string; width: number; height: number };

const reports: PreviewImage[] = [
  { src: "/images/vip/report-semiconductors.png", label: "行业观察", alt: "日报样例：AI 硬件与半导体的均线、量能和结构观察", width: 2388, height: 1568 },
  { src: "/images/vip/report-watchlist.png", label: "重点个股", alt: "日报样例：用户重点关注股观察清单", width: 2392, height: 1606 },
  { src: "/images/vip/report-trade-plan.png", label: "明日计划", alt: "日报样例：明日交易计划与观察条件", width: 2400, height: 1596 },
];

function ImageDialog({ image, open, onOpenChange }: { image: PreviewImage; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-6xl gap-3 rounded-2xl bg-white p-4 text-slate-950 motion-reduce:animate-none motion-reduce:transition-none sm:p-6 dark:bg-slate-900 dark:text-white">
        <DialogTitle className="pr-8 text-base leading-6">{image.alt}</DialogTitle>
        <DialogDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          图片为内容样例，不代表实时行情。
          <a href={image.src} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-amber-800 underline underline-offset-4 dark:text-amber-300">打开原图，放大查看<ArrowUpRight className="h-3 w-3" /></a>
        </DialogDescription>
        <div className="max-h-[72dvh] overflow-auto rounded-lg border border-slate-200 bg-white">
          <Image src={image.src} alt={image.alt} width={image.width} height={image.height} unoptimized className="h-auto w-full" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function WebsitePreview({ src, name, href, width = 1440, height = 1100 }: { src: string; name: string; href: string; width?: number; height?: number }) {
  const [open, setOpen] = useState(false);
  const image = { src, label: name, alt: `${name} 网站实际界面`, width, height };
  return (
    <>
      <div className={styles.websitePreview}>
        <div className={styles.browserBar}><span aria-hidden="true" className={styles.browserDots}>•••</span><span>{new URL(href).hostname}</span><Expand aria-hidden="true" size={13} /></div>
        <button type="button" onClick={() => setOpen(true)} className={styles.imageButton} aria-label={`放大查看 ${name} 网站截图`}>
          <Image src={src} width={width} height={height} alt={image.alt} sizes="(min-width: 1280px) 650px, (min-width: 768px) 55vw, 92vw" className={styles.siteImage} />
          <span className={styles.zoomHint}><Expand size={14} />点击放大</span>
        </button>
      </div>
      <ImageDialog image={image} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function ReportPreview() {
  const [selected, setSelected] = useState(reports[0].label);
  const [open, setOpen] = useState(false);
  const current = reports.find(report => report.label === selected) ?? reports[0];
  return (
    <>
      <Tabs.Root value={selected} onValueChange={setSelected} className={styles.reportPreview}>
        <div className={styles.reportToolbar}>
          <Tabs.List aria-label="日报样例类型" className={styles.reportTabs}>
            {reports.map(report => <Tabs.Trigger key={report.label} value={report.label}>{report.label}</Tabs.Trigger>)}
          </Tabs.List>
          <button type="button" aria-label="放大查看日报样例" className={styles.expandReport} onClick={() => setOpen(true)}><Expand size={15} aria-hidden="true" /><span>放大查看</span></button>
        </div>
        {reports.map(report => (
          <Tabs.Content key={report.label} value={report.label} className={styles.reportPanel}>
            <button type="button" onClick={() => setOpen(true)} className={styles.imageButton} aria-label={`放大${report.label}日报样例`}>
              <Image src={report.src} alt={report.alt} width={report.width} height={report.height} sizes="(min-width: 1280px) 650px, (min-width: 768px) 55vw, 92vw" className={styles.reportImage} />
              <span className={styles.reportImageHint}>查看完整日报节选<Expand size={14} /></span>
            </button>
          </Tabs.Content>
        ))}
      </Tabs.Root>
      <p className={styles.caption}>日报节选，仅作内容样例，不代表当前行情或投资建议。点击图片可放大查看。</p>
      <ImageDialog image={current} open={open} onOpenChange={setOpen} />
    </>
  );
}
