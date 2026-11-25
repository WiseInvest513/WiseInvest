import Image from "next/image";
import { ArrowRight, ArrowUpRight, Crown } from "lucide-react";
import styles from "./article-vip-footer.module.css";

// Shared article footer: ordinary articles, series reading, and future articles use the same compact directory.
type Partner = {
  name: string;
  logo: string;
  benefit: string;
  tutorial: string;
  registration?: string;
  action?: string;
  rebate?: string;
};

const brokers: Partner[] = [
  {
    name: "银河证券", logo: "/images/capital-flow/china-galaxy.jpeg",
    benefit: "ETF 免五",
    tutorial: "/articles/domestic/o0RA5e1p", action: "开户说明",
  },
  {
    name: "腾达证券", logo: "/images/capital-flow/tengda.jpeg",
    benefit: "入金等值 1 万港币，港美股免佣",
    tutorial: "/articles/broker/4k1kTctf",
    registration: "https://gigamoney.app.wbrks.com/session/login?app_id=winner&org_id=1&account_channel=hk_winner&channel=kol&invite-code=XDG74RHG",
  },
  {
    name: "致富证券", logo: "/images/capital-flow/chief.jpeg",
    benefit: "入金等值 1 万港币，美股免佣",
    tutorial: "/articles/broker/GaobLP0X",
    registration: "https://service.chiefgroup.com.hk/account-open/login?PromoCode=HN7787",
  },
  {
    name: "复星证券", logo: "/images/capital-flow/fosun.jpeg",
    benefit: "入金等值 1 万港币，解锁免佣",
    tutorial: "/articles/broker/sQSbLRe8",
    registration: "https://h5.fotechwealth.com/pages/startAccount.html?channel=030005&aeCode=B2&invitationCode=AGVPK3&langType=zhCn",
  },
  {
    name: "BBAE 证券", logo: "/images/registration/bbae.jpg",
    benefit: "首次入金 2,000 美元，奖励 20 美元",
    tutorial: "/articles/broker/I0AIBXus", action: "开户指引",
  },
];

const exchanges: Partner[] = [
  {
    name: "币安 Binance", logo: "/images/perks/overview/binance.svg",
    benefit: "交易手续费返佣",
    tutorial: "/articles/crypto/GaM38JYk",
    registration: "https://www.bsmkweb.cc/register?ref=WISEBNB1", rebate: "20%",
  },
  {
    name: "Bitget", logo: "/images/capital-flow/bitget.jpeg",
    benefit: "交易手续费返佣",
    tutorial: "/articles/crypto/k3RVVcw4",
    registration: "https://partner.bitget.cafe/bg/8ax9wf4r", rebate: "20%",
  },
  {
    name: "OKX 欧易", logo: "/images/capital-flow/okx.jpeg",
    benefit: "交易手续费返佣",
    tutorial: "/articles/crypto/mAPQm7WZ",
    registration: "https://www.vmutkhamuut.com/join/WISE6666", rebate: "20%",
  },
  {
    name: "Kraken 海妖", logo: "/images/registration/kraken.webp",
    benefit: "默认返佣；私信 UID 可升级至 40%",
    tutorial: "/articles/crypto/QWWO6E4L",
    registration: "https://proinvite.kraken.com/rrru/4qmk2mx6", rebate: "20%",
  },
  {
    name: "Gate", logo: "/images/registration/gate.jpg",
    benefit: "交易手续费返佣 · 邀请码 WISEGGGG",
    tutorial: "/articles/vcard/GUhygjYV", action: "注册指引", rebate: "20%",
  },
];

function PartnerRow({ partner }: { partner: Partner }) {
  return (
    <li className={styles.partner} data-vip-partner={partner.name}>
      <div className={styles.logo}>
        <Image src={partner.logo} alt={`${partner.name} 标志`} width={30} height={30} sizes="30px" />
      </div>
      <div className={styles.partnerCopy}>
        <div className={styles.partnerHeading}>
          <h4 className={styles.partnerName}>{partner.name}</h4>
          {partner.rebate && <span className={styles.rebate}>{partner.rebate}<small>返佣</small></span>}
        </div>
        <p className={styles.partnerBenefit}>{partner.benefit}</p>
        <div className={styles.partnerLinks}>
          <a href={partner.tutorial} target="_blank" rel="noopener noreferrer" aria-label={`${partner.name} ${partner.rebate ? "注册" : "开户"}教程`}>
            {partner.rebate ? "注册教程" : "开户教程"}
          </a>
          <a className={styles.register} href={partner.registration ?? partner.tutorial} target="_blank" rel="noopener noreferrer" aria-label={`${partner.name} ${partner.action ?? "专属注册"}`}>
            {partner.action ?? "专属注册"}<ArrowUpRight size={12} aria-hidden="true" />
          </a>
        </div>
      </div>
    </li>
  );
}

export function ArticleVipFooter() {
  return (
    <div id="article-vip-footer" className={styles.root} data-article-vip-footer data-reading-chrome>
      <section className={`${styles.panel} not-prose`} aria-labelledby="article-vip-footer-title">
        <header>
          <div className={styles.headingRow}>
            <h2 id="article-vip-footer-title" className={styles.title}><Crown size={17} strokeWidth={1.5} aria-hidden="true" />加入 Wise VIP</h2>
            <div className={styles.actions}>
              <a href="https://vip.wise-invest.org/join" target="_blank" rel="noopener noreferrer">了解权益<ArrowUpRight size={12} aria-hidden="true" /></a>
              <a className={styles.primary} href="/account/vip?apply=1">提交申请<ArrowRight size={13} aria-hidden="true" /></a>
            </div>
          </div>
          <p className={styles.intro}>社群交流 · 市场投研 · 专属工具。使用以下合作产品，满足条件后提交 UID / 账户 ID，核验通过即可加入。</p>
        </header>
        <div className={styles.directory}>
          <section className={styles.column} aria-labelledby="article-vip-footer-brokers">
            <div className={styles.columnHeading}><h3 id="article-vip-footer-brokers">券商账户</h3><span>开户福利</span></div>
            <ul >{brokers.map(partner => <PartnerRow key={partner.name} partner={partner} />)}</ul>
          </section>
          <section className={styles.column} aria-labelledby="article-vip-footer-exchanges">
            <div className={styles.columnHeading}><h3 id="article-vip-footer-exchanges">交易所账户</h3><span>专属返佣</span></div>
            <ul >{exchanges.map(partner => <PartnerRow key={partner.name} partner={partner} />)}</ul>
          </section>
        </div>
        <footer className={styles.note}>产品优惠与 VIP 资格分别核验。免佣不含平台费及其他交易费用；开户、入金与免五条件请查看对应教程。</footer>
      </section>
    </div>
  );
}
