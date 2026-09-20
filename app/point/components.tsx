import Link from "next/link";
import { ArrowUpRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { POINT_DISCLAIMER, POINT_RISK_NOTE } from "@/lib/point/presentation";
import s from "./point.module.css";

export function DemoNotice() {
  return (
    <div className={s.notice} role="status">
      本地调试 ·
      当前计划与报价为隔离演示数据，不是实际行情或正式发布内容；不会写入正式数据库。
    </div>
  );
}
export function Disclaimer() {
  return (
    <section className={s.disclaimer} aria-label="风险与报价说明">
      <h2>参考，不是指令</h2>
      <p>{POINT_DISCLAIMER}</p>
      <p>{POINT_RISK_NOTE}</p>
      <p>
        报价来自 Binance USDⓈ-M 合约最新成交价，约每 5
        分钟刷新。它不是美股现货价，也不是标记价格。采样报价无法证明两次更新之间是否触及点位，不自动判定成交、止盈或止损。所有时间为北京时间（UTC+8）。
      </p>
    </section>
  );
}
export function VipGate() {
  return (
    <section className={s.gate}>
      <div>
        <h2>把观察，放进完整的上下文。</h2>
        <p>
          所有 VIP 均可查看完整参考位、分析条件与历史版本。
          <br />
          普通用户可先阅读最新 3 条公开摘要。
        </p>
      </div>
      <Link href="/vip#how-it-works" className={s.button}>
        <LockKeyhole size={15} />
        了解如何加入 VIP
        <ArrowUpRight size={15} />
      </Link>
    </section>
  );
}
export function ReferralRail() {
  return (
    <aside className={s.rail} aria-label="账户与阅读说明">
      <div>
        <h2>还没有交易账户？</h2>
        <p>先了解平台、费用和适用地区，再决定是否注册。</p>
        <Link className={s.button} href="/perk/crypto#product-binance">
          Binance 币安
          <ArrowUpRight size={14} />
        </Link>
        <Link className={s.button} href="/perk/crypto#product-gate">
          Gate
          <ArrowUpRight size={14} />
        </Link>
        <Link className={s.button} href="/perk/crypto#product-okx">
          OKX 欧易
          <ArrowUpRight size={14} />
        </Link>
        <Link className={s.button} href="/perk/crypto#uex-exchange">
          查看全部交易所
          <ArrowUpRight size={14} />
        </Link>
        <Link className={s.button} href="/perk/broker#product-bbae">
          BBAE 券商开户教程
          <ArrowUpRight size={14} />
        </Link>
        <p className={s.small}>
          部分入口包含合作邀请关系。注册不代表适合交易，也不保证获利。
        </p>
      </div>
      <div className={s.railSection}>
        <ShieldCheck size={18} className={s.muted} />
        <h2 style={{ marginTop: 12 }}>先看时间，再看点位</h2>
        <p>
          只参考有效期内的最新版本。价格接近参考位时，仍需结合行情判断。过期记录保留用于复盘。
        </p>
        <Link className={s.textLink} href="/vip" style={{ marginTop: 18 }}>
          了解 VIP 服务
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </aside>
  );
}
