"use client";

import Image from "next/image";
import { Expand, ArrowUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import styles from "./history-showcase.module.css";

const previewImage = "/images/vip/community-research.png";
const reviewSteps = [
  { title: "当时观点", description: "待补充原始观点、判断依据与适用条件。" },
  { title: "后续跟踪", description: "待补充后续记录，核对观点如何随信息变化。" },
  { title: "复盘结论", description: "待核对结果与局限，完整保留有效和失效的判断。" },
] as const;

export function HistoryShowcase() {
  return (
    <section id="vip-history" tabIndex={-1} aria-labelledby="vip-history-title" className={styles.section}>
      <header className={styles.header}>
        <h2 id="vip-history-title">历史战绩</h2>
        <p>看原始记录，再看后续变化。</p>
      </header>

      <article className={styles.featured} aria-label="首条历史案例的素材预览，案例信息待补充">
        <div className={styles.details}>
          <span className={styles.eyebrow}>首条案例 · 素材预览</span>
          <h3>从一个观点，到一次完整复盘</h3>
          <p className={styles.introduction}>判断的过程和结果，都留在原始记录里。</p>

          <dl className={styles.metadata}>
            <div><dt>产品 / 标的</dt><dd>待补充</dd></div>
            <div><dt>首次分享</dt><dd>待核对</dd></div>
            <div><dt>后续结果</dt><dd>待核对</dd></div>
          </dl>

          <ol className={styles.steps}>
            {reviewSteps.map((step, index) => (
              <li key={step.title}>
                <span className={styles.stepNumber} aria-hidden="true">0{index + 1}</span>
                <div>
                  <h4>{step.title}<span>{index === 2 ? "待核对" : "待补充"}</span></h4>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <Dialog>
          <figure className={styles.preview}>
            <DialogTrigger asChild>
              <button className={styles.imageButton} type="button" aria-label="放大查看群聊素材示意，不作为历史战绩证明">
                <Image
                  src={previewImage}
                  alt="群聊素材示意：投研交流截图，仅用于展示版式，不作为历史战绩证明"
                  width={360}
                  height={631}
                  sizes="230px"
                  unoptimized
                  className={styles.previewImage}
                />
                <span className={styles.expandHint}><Expand size={13} aria-hidden="true" />点击放大</span>
              </button>
            </DialogTrigger>
            <figcaption>群聊素材示意</figcaption>
          </figure>

          <DialogContent className={styles.dialog}>
            <DialogTitle className={styles.dialogTitle}>群聊素材示意</DialogTitle>
            <DialogDescription className={styles.dialogDescription}>
              当前图片仅演示展示方式，不作为历史战绩证明。最终案例以核对后的原始记录为准。
            </DialogDescription>
            <div className={styles.enlargedFrame}>
              <Image
                src={previewImage}
                alt="投研交流群聊素材完整原图，仅为版式示意，非已核实的历史案例"
                width={360}
                height={631}
                unoptimized
                className={styles.enlargedImage}
              />
            </div>
            <a href={previewImage} target="_blank" rel="noopener noreferrer" className={styles.originalLink}>
              打开原图<ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </DialogContent>
        </Dialog>
      </article>

      <div className={styles.disclaimer}>
        <p>当前图片仅演示展示方式，不作为历史战绩证明。最终案例以核对后的原始记录为准。</p>
        <p>历史表现不代表未来收益，不构成投资建议。</p>
      </div>
    </section>
  );
}
