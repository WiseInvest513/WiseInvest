import { ArrowDown, CandlestickChart, Coins, Wrench } from "lucide-react";
import { getSeriesOverviewHref } from "@/lib/article-series";
import { HomeAction } from "./primitives";
import styles from "./home.module.css";

const paths = [
  {
    id: "us-stocks",
    title: "我想买美股",
    description: "从开户到入金的 0→1",
    detail: "先看完整路线，再选银行、券商与第一笔交易，少在单篇长文里绕路。",
    href: getSeriesOverviewHref("us-stock-zero-to-one"),
    action: "开始美股路线",
    icon: CandlestickChart,
  },
  {
    id: "crypto",
    title: "我想了解加密",
    description: "先分清币、交易所与钱包",
    detail: "五课讲清买什么、去哪买、怎样入金与转账，再进注册教程。",
    href: getSeriesOverviewHref("crypto-basics"),
    action: "开始加密五课",
    icon: Coins,
  },
  {
    id: "existing",
    title: "我已有账户",
    description: "找工具、福利与进阶教程",
    detail: "跳过入门课，直接去福利中心查返佣、开户入口与出海工具。",
    href: "/perk",
    action: "去福利与工具",
    icon: Wrench,
  },
] as const;

export function PathChooser() {
  return (
    <section className={styles.pathChooser} aria-labelledby="path-chooser-title">
      <div className={styles.container}>
        <div className={styles.pathChooserIntro}>
          <p className={styles.chapterMarker}>入口</p>
          <h2 id="path-chooser-title" className={styles.chapterTitle}>
            你现在想解决哪一步？
          </h2>
          <p className={styles.description}>先选路径，再读文章，少绕路</p>
        </div>
        <div className={styles.pathChooserGrid}>
          {paths.map((path) => {
            const Icon = path.icon;
            return (
              <article key={path.id} className={styles.pathCard}>
                <span className={styles.pathCardIcon} aria-hidden="true">
                  <Icon size={22} strokeWidth={1.6} />
                </span>
                <h3>{path.title}</h3>
                <p className={styles.pathCardLead}>{path.description}</p>
                <p className={styles.pathCardDetail}>{path.detail}</p>
                <HomeAction href={path.href} primary>
                  {path.action}
                </HomeAction>
              </article>
            );
          })}
        </div>
        <p className={styles.pathChooserContinue}>
          <ArrowDown size={16} strokeWidth={1.8} aria-hidden="true" />
          也可以继续往下看 ETF / 美股 / 加密 / 出海 / VIP 章节
        </p>
      </div>
    </section>
  );
}
