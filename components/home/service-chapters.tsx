import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, Users } from "lucide-react";
import { ChapterMarker, HomeAction, LearningSteps, wiseSites } from "./primitives";
import styles from "./home.module.css";

const services = [
  {
    title: "海外手机卡",
    description: "海外通信、保号与 eSIM，先了解适用地区与使用条件。",
    actions: [{ label: "去 Wise Sim 选卡", href: wiseSites.sim, primary: true }, { label: "查看通信教程", href: "/perk/global-access" }],
  },
  {
    title: "银行与见证开户",
    description: "了解香港与海外账户的准备材料、费用和申请流程。",
    actions: [{ label: "查看银行开户指南", href: "/perk/bank" }, { label: "了解 Wise Witness", href: wiseSites.witness }],
  },
  {
    title: "支付卡与订阅工具",
    description: "了解虚拟 U 卡、订阅支付和其他出海工具的使用方式。",
    actions: [{ label: "查看虚拟 U 卡", href: "/card" }, { label: "浏览其他资源", href: "/perk/other-resources" }],
  },
] as const;

const vipBenefits = [
  { title: "研究与复盘", description: "理解判断过程，积累自己的观察框架。", icon: BookOpen },
  { title: "专属工具", description: "按会员权限使用对应内容与工具。", icon: BarChart3 },
  { title: "社群交流", description: "与同行者讨论问题，分享学习与实践。", icon: Users },
] as const;

const exploreLinks = [
  { label: "投资文集", href: "/anthology" },
  { label: "投资工具", href: "/tools" },
  { label: "实盘记录", href: "/practice" },
  { label: "福利中心", href: "/perk" },
  { label: "全部网站", href: "/website" },
  { label: "关于我", href: "/aboutme" },
] as const;

export function GlobalChapter() {
  return <section id="global" className={styles.globalChapter} aria-labelledby="global-title">
    <div className={styles.container}>
      <div className={styles.centerIntro}>
        <ChapterMarker number="04">出海服务</ChapterMarker>
        <h2 id="global-title" className={styles.chapterTitle}>想走向更大的世界？<br />把出海准备做好。</h2>
        <p className={styles.description}>手机卡、海外账户与支付工具，找到适合自己的使用方式。</p>
      </div>
      <div className={styles.globalVisual}>
        <Image src="/images/home/journey-global.webp" alt="全球通信与服务连接主题示意，非服务覆盖范围地图" fill quality={60} sizes="(min-width: 1312px) 1120px, (min-width: 1200px) calc(100vw - 192px), (min-width: 900px) calc(100vw - 152px), (min-width: 600px) calc(100vw - 112px), calc(100vw - 40px)" className={styles.globalArt} />
      </div>
      <div className={styles.services}>
        {services.map((service, index) => <div className={styles.serviceRow} key={service.title}>
          <span className={styles.serviceNumber} aria-hidden="true">0{index + 1}</span>
          <h3>{service.title}</h3>
          <p>{service.description}</p>
          <div className={styles.serviceActions}>
            {service.actions.map((action) => <HomeAction key={action.href} href={action.href} primary={"primary" in action && action.primary}>{action.label}</HomeAction>)}
          </div>
        </div>)}
      </div>
      <p className={styles.notice}>服务范围、费用与申请条件以各平台说明为准。</p>
    </div>
  </section>;
}

export function VipChapter() {
  return <section id="vip" className={styles.vipChapter} aria-labelledby="vip-title">
    <div className={`${styles.container} ${styles.centerIntro}`}>
      <ChapterMarker number="05">Wise VIP</ChapterMarker>
      <p className={styles.vipBrand}>Wise <span>VIP</span></p>
      <h2 id="vip-title" className={styles.chapterTitle}>让投资学习，<span>不再只有一个人。</span></h2>
      <p className={styles.description}>研究内容、专属工具与社群交流。</p>
    </div>
    <div className={styles.vipVisual}>
      <Image src="/images/home/journey-hero.webp" alt="" fill sizes="(min-width: 1376px) 1280px, (min-width: 900px) calc(100vw - 96px), (min-width: 600px) calc(100vw - 56px), calc(100vw - 32px)" className={styles.vipArt} />
    </div>
    <div className={styles.container}>
      <div className={styles.vipBenefits}>
        {vipBenefits.map(({ title, description, icon: Icon }) => <div className={styles.vipBenefit} key={title}>
          <Icon size={34} strokeWidth={1.5} aria-hidden="true" />
          <div><h3>{title}</h3><p>{description}</p></div>
        </div>)}
      </div>
      <div className={styles.joining}>
        <h3>如何加入 Wise VIP？</h3>
        <LearningSteps steps={["注册 Wise ID", "查看并完成申请条件", "提交资料核验", "审核通过后查看权益"]} />
        <div className={styles.actions}>
          <HomeAction href={wiseSites.vip} primary>了解权益与加入方式</HomeAction>
          <HomeAction href="/account">已有 Wise ID？前往账户中心</HomeAction>
        </div>
        <p className={styles.notice}>资格与权益以 VIP 网站说明为准；不承诺投资收益。</p>
      </div>
    </div>
  </section>;
}

export function ExploreWise() {
  return <section className={styles.exploreBand} aria-labelledby="explore-wise-title">
    <div className={styles.container}>
      <h2 id="explore-wise-title">继续探索 Wise</h2>
      <nav className={styles.exploreLinks} aria-label="Wise 内容与功能">
        <Link href="/roadmap" prefetch={false}>学习路线<ArrowRight size={16} aria-hidden="true" /></Link>
        <div className={styles.courseLinks}>
          <Link href="/articles" prefetch={false} aria-label="文字教程">教程</Link><span>与</span><Link href="/videos" prefetch={false} aria-label="视频教程">视频<ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        {exploreLinks.map((item) => <Link key={item.href} href={item.href} prefetch={false}>{item.label}<ArrowRight size={16} aria-hidden="true" /></Link>)}
      </nav>
    </div>
  </section>;
}
