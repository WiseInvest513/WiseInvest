import Image from "next/image";
import { BarChart3, Calculator, CalendarDays, FileText, LayoutGrid, NotebookText } from "lucide-react";
import { getToolRoute } from "@/lib/tool-routes";
import { ChapterMarker, ChapterTransition, HomeAction, LearningSteps, ToolLinks, wiseSites } from "./primitives";
import styles from "./home.module.css";

const etfMarkets = ["A 股市场", "美股市场", "全球市场", "行业主题", "债券市场"];
const etfIdeas = ["更广泛的市场覆盖", "分散投资风险", "简单高效的工具", "了解长期配置", "连接全球机会"];
const etfTools = [
  { label: "复利计算器", href: getToolRoute("compound-calc"), icon: Calculator },
  { label: "定投工具", href: "/DCA", icon: CalendarDays },
  { label: "长期持有 · Wise Hold", href: wiseSites.hold, icon: BarChart3 },
];
const stockTools = [
  { label: "美联储日历", href: getToolRoute("fomc-calendar") },
  { label: "仓位计算器", href: getToolRoute("position-calculator") },
  { label: "投资工具合集", href: "/tools" },
];
const cryptoTools = [
  { label: "BTC / ETH 定投记录", href: "/practice/dca-investment", icon: NotebookText },
  { label: "仓位计算器", href: getToolRoute("position-calculator"), icon: Calculator },
  { label: "合约计算器", href: getToolRoute("contract-calculator"), icon: FileText },
  { label: "更多投资工具", href: "/tools", icon: LayoutGrid },
];

export function EtfChapter() {
  return <section id="etf" className={styles.etfChapter} aria-labelledby="etf-title">
    <div className={styles.container}>
      <div className={styles.etfHeading}>
        <div>
          <ChapterMarker number="01">ETF 入门</ChapterMarker>
          <h2 id="etf-title" className={styles.chapterTitle}>刚接触投资？<br />从理解 ETF 开始。</h2>
        </div>
        <div className={styles.etfRoute}>
          <LearningSteps steps={["认识指数", "理解分散投资", "建立定投习惯"]} />
          <p className={styles.description}>先弄明白是什么，再决定适不适合自己。</p>
        </div>
      </div>
    </div>
    <figure className={styles.etfVisual} aria-label="ETF 市场覆盖与学习要点示意">
      <Image src="/images/home/journey-etf.webp" alt="" fill sizes="(min-width: 1376px) 1280px, (min-width: 900px) calc(100vw - 96px), (min-width: 600px) calc(100vw - 56px), 720px" className={styles.etfArt} />
      <ul className={`${styles.etfLabels} ${styles.etfMarketLabels}`}>{etfMarkets.map((label) => <li key={label}>{label}</li>)}</ul>
      <span className={styles.etfCenter}>ETF</span>
      <ul className={`${styles.etfLabels} ${styles.etfIdeaLabels}`}>{etfIdeas.map((label) => <li key={label}>{label}</li>)}</ul>
    </figure>
    <div className={styles.container}>
      <div className={styles.etfChoices}>
        <div>
          <h3>想先了解 ETF</h3>
          <p className={styles.description}>指数是什么？ETF 如何分散投资？从基础开始。</p>
          <div className={styles.actions}>
            <HomeAction href={wiseSites.etf} primary>去 Wise ETF 学习</HomeAction>
            <HomeAction href="/roadmap">查看学习路线</HomeAction>
          </div>
        </div>
        <div>
          <h3>想准备自己的账户</h3>
          <p className={styles.description}>了解场内 ETF 与海外 ETF 的账户准备、费用和条件。</p>
          <div className={styles.actions}>
            <HomeAction href="/perk/broker#a-share-broker">A 股券商开户教程</HomeAction>
            <HomeAction href="/perk/broker#us-broker">港美股券商开户教程</HomeAction>
          </div>
        </div>
      </div>
      <ToolLinks title="边学边算" items={etfTools} />
      <ChapterTransition number="02" href="#stocks">美股探索</ChapterTransition>
    </div>
  </section>;
}

export function StocksChapter() {
  return <section id="stocks" className={styles.stocksChapter} aria-labelledby="stocks-title">
    <div className={styles.stockScene}>
      <Image src="/images/home/journey-stocks.webp" alt="科技公司与半导体产业研究主题示意，非真实交易数据" fill sizes="(min-width: 1376px) 1280px, (min-width: 900px) calc(100vw - 96px), (min-width: 600px) calc(100vw - 56px), calc(100vw - 32px)" className={styles.stockArt} />
      <div className={`${styles.container} ${styles.stockIntro}`}>
        <ChapterMarker number="02">美股探索</ChapterMarker>
        <h2 id="stocks-title" className={styles.chapterTitle}><span>对美股感兴趣？</span><span>从熟悉的公司，走进真实的产业。</span></h2>
        <p>从纳斯达克、标普 500，到英伟达、特斯拉和谷歌。</p>
        <p>学习公司与产业链，再了解如何准备自己的证券账户。</p>
      </div>
      <div className={styles.companyLabels} aria-label="美股研究示例公司">
        <span>英伟达 <b>NVDA</b></span><span>特斯拉 <b>TSLA</b></span><span>谷歌 <b>GOOGL</b></span>
      </div>
    </div>
    <div className={styles.container}>
      <div className={styles.stockChoices}>
        <div>
          <p className={styles.choiceMarker}><span>01</span>先认识市场</p>
          <h3>指数与公司</h3>
          <p className={styles.description}>理解纳斯达克、标普 500 与上市公司的区别。</p>
          <HomeAction href="/roadmap">查看学习路线</HomeAction>
        </div>
        <div>
          <p className={styles.choiceMarker}><span>02</span>再深入研究</p>
          <h3>产业链与新股</h3>
          <p className={styles.description}>从公司业务到产业关系，继续探索 IPO 信息。</p>
          <div className={styles.stackedActions}>
            <HomeAction href={wiseSites.chain}>进入 Wise Chain</HomeAction>
            <HomeAction href={wiseSites.ipo}>查看 Wise IPO</HomeAction>
          </div>
        </div>
        <div>
          <p className={styles.choiceMarker}><span>03</span>准备参与</p>
          <h3>传统券商开户</h3>
          <p className={styles.description}>比较开户条件、入金方式与费用，再选择合适的渠道。</p>
          <HomeAction href="/perk/broker#us-broker" primary>查看券商开户教程</HomeAction>
        </div>
      </div>
      <ToolLinks title="继续探索" items={stockTools} />
      <ChapterTransition number="03" href="#crypto">加密入门</ChapterTransition>
    </div>
  </section>;
}

export function CryptoChapter() {
  return <section id="crypto" className={styles.cryptoChapter} aria-labelledby="crypto-title">
    <div className={styles.container}>
      <div className={styles.cryptoIntro}>
        <div className={styles.cryptoCopy}>
          <ChapterMarker number="03">加密入门</ChapterMarker>
          <h2 id="crypto-title" className={styles.chapterTitle}>想了解加密？<br />从 BTC 与 ETH 开始。</h2>
          <p className={styles.description}>先认识资产，再理解风险。<br />从基础知识走向注册教程与定投实践。</p>
          <HomeAction href={wiseSites.crypto} primary>探索 Wise Crypto</HomeAction>
          <div className={styles.cryptoQuestions}>
            <div><h3>第一次接触加密</h3><HomeAction href={wiseSites.crypto}>从基础知识开始</HomeAction></div>
            <div><h3>想了解注册与福利</h3><HomeAction href="/perk/crypto#uex-exchange">查看交易所注册教程</HomeAction></div>
          </div>
        </div>
        <div className={styles.cryptoVisual}>
          <Image src="/images/home/journey-crypto.webp" alt="BTC 与 ETH 银白色科技主题示意" fill sizes="(min-width: 900px) 540px, (min-width: 600px) calc(100vw - 112px), calc(100vw - 40px)" className={styles.cryptoArt} />
        </div>
      </div>
      <div className={styles.cryptoPractice}>
        <h3>让学习，有真实的实践参照。</h3>
        <ToolLinks items={cryptoTools} />
        <p className={styles.notice}>加密资产波动较大；注册福利与适用条件以平台说明为准。</p>
      </div>
      <ChapterTransition number="04" href="#global">出海服务</ChapterTransition>
    </div>
  </section>;
}
