import type { Metadata } from "next";
import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { EtfChapter, StocksChapter, CryptoChapter } from "@/components/home/investment-chapters";
import { GlobalChapter, VipChapter, ExploreWise } from "@/components/home/service-chapters";
import { HomeAction } from "@/components/home/primitives";
import styles from "@/components/home/home.module.css";

export const metadata: Metadata = {
  title: "Wise Invest - 欢迎来到新的世界",
  description: "从认识投资到管理自己的资产，探索 Wise 的 ETF、美股、加密投资、出海服务与 VIP 学习体系。",
};

const directions = [
  { label: "ETF", href: "#etf" },
  { label: "美股", href: "#stocks" },
  { label: "加密投资", href: "#crypto" },
  { label: "出海服务", href: "#global" },
  { label: "VIP 学习", href: "#vip" },
] as const;

export default function Home() {
  return (
    <div className={styles.home}>
      <section className={styles.hero} aria-labelledby="home-title">
        <Image src="/images/home/journey-hero.webp" alt="" fill priority sizes="(min-width: 1376px) 1280px, (min-width: 900px) calc(100vw - 96px), (min-width: 600px) calc(100vw - 56px), 960px" className={styles.heroArt} />
        <div className={styles.heroContent}>
          <h1 id="home-title">Wise <span>Invest</span></h1>
          <h2>欢迎来到新的世界</h2>
          <p>在这里，认识投资，学会管理自己的资产。</p>
          <nav className={styles.directions} aria-label="探索 Wise 体系">
            {directions.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
          </nav>
          <div className={styles.actions}>
            <HomeAction href="#etf" primary icon={ArrowDown}>开始探索</HomeAction>
            <HomeAction href="#vip">了解 VIP</HomeAction>
          </div>
        </div>
      </section>
      <EtfChapter />
      <StocksChapter />
      <CryptoChapter />
      <GlobalChapter />
      <VipChapter />
      <ExploreWise />
    </div>
  );
}
