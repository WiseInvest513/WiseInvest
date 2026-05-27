"use client";

import { useState, useEffect, useRef } from "react";
import { TrendingUp, DollarSign, BarChart2, Award, Users, Zap, Shield, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ── 微信弹窗组件 ───────────────────────────────────────────────────────────────
function WxDialog({ id, title, desc }: { id: string; title: string; desc: string }) {
  return (
    <div id={id}
      className="hidden fixed inset-0 z-50 items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).style.display = "none"; }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center shadow-2xl max-w-lg w-[90vw]">
        <p className="text-base font-bold text-slate-900 dark:text-white mb-1">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{desc}</p>
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 mx-auto" style={{ maxWidth: 320 }}>
          <img src="/images/wx.jpg" alt="微信二维码" className="w-full h-auto block" />
        </div>
        <p className="text-xs text-slate-400 mt-3">长按或扫码识别二维码</p>
      </div>
    </div>
  );
}

// ── 数据统计 ──────────────────────────────────────────────────────────────────
const stats = [
  { label: "待申购", value: "1", accent: false, countUp: null },
  { label: "中签待上市", value: "0", accent: false, countUp: null },
  { label: "待上市市值", value: "0", accent: false, countUp: null },
  { label: "本月总分红", value: "2,817,849", accent: true, countUp: 2817849 },
  { label: "今年总分红", value: "4,008,132", accent: true, countUp: 4008132 },
  { label: "近2年分红", value: "6,416,927", accent: true, countUp: 6416927 },
];

const rankMoney = [
  { name: "长进光子", value: "1,040,845", rank: 1 },
  { name: "维通利", value: "825,097", rank: 2 },
  { name: "摩尔线程", value: "277,782", rank: 3 },
];
const rankRate = [
  { name: "长进光子", value: "1270%", rank: 1 },
  { name: "电科蓝天", value: "584%", rank: 2 },
  { name: "江南新材", value: "583%", rank: 3 },
];
const rankCount = [
  { name: "华电新能", value: "44,500", rank: 1 },
  { name: "维通利", value: "8,000", rank: 2 },
  { name: "惠康科技", value: "5,000", rank: 3 },
];

// ── 参与流程（横向） ──────────────────────────────────────────────────────────
const steps = [
  {
    num: "01",
    emoji: "📋",
    title: "确认持仓资质",
    short: "持有≥1万A股市值",
    desc: "沪市或深市均可，每5000元对应1个配号。",
    color: "amber",
  },
  {
    num: "02",
    emoji: "🖱️",
    title: "自行申购新股",
    short: "券商App一键申购",
    desc: "在自己的证券账户App里，每日可免费申购新股。",
    color: "blue",
  },
  {
    num: "03",
    emoji: "📤",
    title: "上报配号",
    short: "提交到专属小程序",
    desc: "申购后获取配号，当天上报到工作人员发送的小程序。",
    color: "violet",
  },
  {
    num: "04",
    emoji: "🎯",
    title: "等待中签结果",
    short: "T+2日公布中签",
    desc: "中签由公司垫资缴款，无需自行操作，坐等上市。",
    color: "emerald",
  },
  {
    num: "05",
    emoji: "💰",
    title: "上市卖出分红",
    short: "当周/下周五结算",
    desc: "股票上市后卖出，按配号数量分配60%集体收益。",
    color: "rose",
  },
];

// ── FAQ 数据（带高亮标签） ────────────────────────────────────────────────────
const faqs = [
  {
    tag: "收益分配",
    tagColor: "amber",
    q: "中签者除了10%奖励，还能参与60%分红吗？",
    a: "可以。中签者同时享有两份收益：",
    highlights: [
      { label: "中签专属奖励", value: "10%", desc: "中签新股结算收益的10%直接奖励给中签本人" },
      { label: "集体配号分红", value: "60%", desc: "按配号数量参与全体集合收益的60%分配" },
    ],
    note: null,
  },
  {
    tag: "市值与配号",
    tagColor: "blue",
    q: "1万市值和10万市值有什么区别？",
    a: "区别只在配号数量，以长进光子为例：",
    highlights: [
      { label: "1万市值", value: "≈¥120", desc: "对应2个配号，约分红120元" },
      { label: "10万市值", value: "≈¥600", desc: "对应20个配号，约分红600元" },
    ],
    note: "每5000元市值 = 1个配号，配号越多分红越多。",
  },
  {
    tag: "合规安全",
    tagColor: "emerald",
    q: "配号上报合规吗？资金安全吗？",
    a: "完全合法合规，资金全程受保护：",
    highlights: [
      { label: "账户独立", value: "✓", desc: "不涉及账户出借，资金始终在个人证券账户" },
      { label: "三方存管", value: "✓", desc: "资金受券商三方存管保护，公司无法直接触碰" },
    ],
    note: "转出资金只转至本人绑定银行卡，不存在资金被他人控制的情况。",
  },
  {
    tag: "收益预期",
    tagColor: "violet",
    q: "年化收益大概能有多少？",
    a: "基于近两年历史数据的收益区间：",
    highlights: [
      { label: "常规行情", value: "3%～5%", desc: "年化阿尔法收益，叠加在持仓涨跌之上" },
      { label: "极端行情", value: "6%～10%", desc: "新股大量上市、溢价高时可达此区间" },
    ],
    note: "这是「阿尔法收益」——持有股票本身涨跌之外的额外收益，适合已有持仓者提升资金利用效率。",
  },
  {
    tag: "风险提示",
    tagColor: "rose",
    q: "有哪些核心风险需要注意？",
    a: "两类风险需要特别关注：",
    highlights: [
      { label: "正股亏损风险", value: "⚠️", desc: "最大风险是持仓股票下跌，严禁为打新专门买入不熟悉的股票" },
      { label: "协议违约风险", value: "⚠️", desc: "中签后须配合操作，拒不配合将通过法务途径追偿" },
    ],
    note: "建议仅用现有持仓参与，切勿加杠杆或购买不熟悉标的。",
  },
  {
    tag: "操作流程",
    tagColor: "slate",
    q: "中签后需要做什么？分红什么时候到账？",
    a: "中签后流程全程有人指引：",
    highlights: [
      { label: "缴款时间", value: "T+2", desc: "公司垫资缴款，资金路径：公司→银行卡→证券账户" },
      { label: "分红到账", value: "T+7～14", desc: "上市后当周或下周五统一结算，转至绑定银行卡" },
    ],
    note: "卖出后需将垫付的缴款资金转回公司账户，收益部分按规则保留。",
  },
  {
    tag: "银行风控",
    tagColor: "blue",
    q: "个人收到大额转账会触发银行风控吗？",
    a: "收款与转出的风控情况不同：",
    highlights: [
      { label: "收款方", value: "无风险", desc: "收款基本无风控风险，账户不会因此被限制" },
      { label: "转出方", value: "注意限额", desc: "转出方可能有单日限额（如10万或50万），超额分批转出即可" },
    ],
    note: null,
  },
  {
    tag: "卖出策略",
    tagColor: "emerald",
    q: "中签后必须当天卖出吗？用什么策略？",
    a: "没有强制规定，但有推荐策略：",
    highlights: [
      { label: "首日卖出", value: "推荐", desc: "开盘后即卖出，锁定确定性收益，不追求最高点" },
      { label: "回落条件单", value: "稳健", desc: "设置条件单，价格回落一定幅度自动卖出，兼顾弹性与安全" },
    ],
    note: "通常采用分批卖出策略，降低单笔操作的时机风险。",
  },
  {
    tag: "合同说明",
    tagColor: "violet",
    q: "签合同是几年？不想参加某一期怎么办？",
    a: "合同默认签订 3 年，参与完全弹性：",
    highlights: [
      { label: "合同期限", value: "3年", desc: "默认签订3年合作协议，协议保障双方共同利益" },
      { label: "参与方式", value: "按期自选", desc: "每期是否参与由你决定——上传配号即参与当期分红，不上传则不计入，不视为违约" },
    ],
    note: "打新了就上传配号，我们这一期就给你算钱；不想参加某期，不上传配号即可，完全没有强制要求。",
  },
  {
    tag: "破发应对",
    tagColor: "rose",
    q: "新股破发了怎么办？损失由谁承担？",
    a: "破发风险有兜底机制：",
    highlights: [
      { label: "近两年", value: "0次", desc: "A股近两年无破发案例，整体新股溢价率较高" },
      { label: "若破发", value: "自动覆盖", desc: "当期亏损由后续新股收益持续覆盖，确保总盘子盈利" },
    ],
    note: "破发亏损不会对参与者造成永久性损失，整体盘子长期保持盈利。",
  },
];

// ── 奖牌样式 ──────────────────────────────────────────────────────────────────
const medalStyle: Record<number, string> = {
  1: "bg-amber-400 text-amber-950",
  2: "bg-slate-300 dark:bg-slate-500 text-slate-700 dark:text-slate-100",
  3: "bg-amber-700 text-amber-50",
};

const tagColorMap: Record<string, string> = {
  amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400",
  rose: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
  slate: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
};

const highlightAccentMap: Record<string, string> = {
  amber: "border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20",
  blue: "border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20",
  emerald: "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20",
  violet: "border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-900/20",
  rose: "border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-900/20",
  slate: "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50",
};

const valueColorMap: Record<string, string> = {
  amber: "text-amber-600 dark:text-amber-400",
  blue: "text-blue-600 dark:text-blue-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  violet: "text-violet-600 dark:text-violet-400",
  rose: "text-rose-600 dark:text-rose-400",
  slate: "text-slate-600 dark:text-slate-400",
};

const stepColorMap: Record<string, { ring: string; bg: string; text: string; connector: string }> = {
  amber: { ring: "ring-amber-400 dark:ring-amber-500", bg: "bg-amber-400 dark:bg-amber-500", text: "text-amber-600 dark:text-amber-400", connector: "via-amber-400" },
  blue: { ring: "ring-blue-400 dark:ring-blue-500", bg: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", connector: "via-blue-400" },
  violet: { ring: "ring-violet-400 dark:ring-violet-500", bg: "bg-violet-500", text: "text-violet-600 dark:text-violet-400", connector: "via-violet-400" },
  emerald: { ring: "ring-emerald-400 dark:ring-emerald-500", bg: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", connector: "via-emerald-400" },
  rose: { ring: "ring-rose-400 dark:ring-rose-500", bg: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", connector: "via-rose-400" },
};

// ── CountUp 组件 ──────────────────────────────────────────────────────────────
function CountUp({ target, duration = 1800, pauseAfter = 5000 }: {
  target: number; duration?: number; pauseAfter?: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const runCycle = () => {
      setDisplay(0);
      const startTime = performance.now();
      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setDisplay(Math.floor(ease * target));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          // 到达目标后等待 pauseAfter ms 再重新开始
          timerRef.current = setTimeout(runCycle, pauseAfter);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          runCycle();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timerRef.current);
    };
  }, [target, duration, pauseAfter]);

  return (
    <span ref={ref}>
      {display.toLocaleString("zh-CN")}
    </span>
  );
}

function RankCard({ title, unit, data, icon }: {
  title: string; unit: string;
  data: { name: string; value: string; rank: number }[];
  icon: React.ReactNode;
}) {
  const ordered = [data[1], data[0], data[2]];
  const heights = { 1: "h-14", 2: "h-9", 3: "h-7" };
  const bgHeights = { 2: "bg-slate-200/60 dark:bg-slate-700/40", 1: "bg-amber-300/20 dark:bg-amber-400/10", 3: "bg-amber-700/10 dark:bg-amber-700/10" };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex-1 min-w-0 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <span className="text-base font-bold text-slate-800 dark:text-slate-200">{title}</span>
        <span className="text-xs text-slate-500">（{unit}）</span>
      </div>
      <div className="flex items-end justify-center gap-4">
        {ordered.map((item) => (
          <div key={item.rank} className="flex flex-col items-center gap-1.5">
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-sm", medalStyle[item.rank])}>
              {item.rank}
            </div>
            <div className={cn("w-16 rounded-t-lg", heights[item.rank as 1|2|3], bgHeights[item.rank as 1|2|3])} />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 text-center leading-tight">{item.name}</span>
            <span className={cn("text-sm font-black", item.rank === 1 ? "text-amber-500" : "text-slate-700 dark:text-slate-200")}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IpoPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative dot-grid dot-grid-subtle">

      <div className="relative z-[1] max-w-6xl mx-auto px-4 md:px-6 pt-10 pb-0 space-y-10">

        {/* ── HERO ── */}
        <div className="pb-8 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-semibold">
              <Zap className="w-3 h-3" />
              A 股集合打新
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">创富支点 · WiseInvest</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2">
            集合打新，获取超额财富
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 max-w-xl">
            利用现有 A 股持仓参与集合申购，在股票涨跌之外获取稳定的阿尔法超额收益，年化预期 3%～10%。
          </p>
        </div>

        {/* ── 实时数据看板 ── */}
        <section>
          <SectionTitle>实时收益数据</SectionTitle>

          {/* 6格统计 */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
            {stats.map((s) => (
              <div key={s.label} className={cn(
                "rounded-xl p-3 text-center border shadow-sm",
                s.accent
                  ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              )}>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{s.label}</div>
                <div className={cn(
                  "text-xl md:text-2xl font-black leading-none tabular-nums",
                  s.accent ? "text-amber-600 dark:text-amber-400" : "text-slate-800 dark:text-white"
                )}>
                  {s.countUp != null
                    ? <CountUp target={s.countUp} />
                    : s.value}
                </div>
              </div>
            ))}
          </div>

          {/* 中签率 + 三个排行榜 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* 今年中签率 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-blue-500" />
                <span className="text-base font-bold text-slate-800 dark:text-slate-200">今年中签率</span>
              </div>
              <div>
                <div className="text-5xl font-black text-slate-900 dark:text-white mb-3">88%</div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: "88%" }} />
                </div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">当前 28 &nbsp;|&nbsp; 目标 32</div>
              </div>
            </div>

            <RankCard title="最赚钱排行榜" unit="元" data={rankMoney} icon={<DollarSign className="w-4 h-4 text-amber-500" />} />
            <RankCard title="收益率排行榜" unit="%" data={rankRate} icon={<TrendingUp className="w-4 h-4 text-emerald-500" />} />
            <RankCard title="中签最多排行榜" unit="股" data={rankCount} icon={<Award className="w-4 h-4 text-violet-500" />} />
          </div>
        </section>

        {/* ── 整体逻辑 ── */}
        <section>
          <SectionTitle>整体逻辑</SectionTitle>

          {/* 一句话核心 */}
          <div className="mb-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5">
            <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-relaxed mb-2">
              用你已有的 A 股持仓，<span className="text-amber-500">零占用额外资金</span>，集合放大中签概率，共享新股上市超额收益。
            </p>
            <p className="text-base text-slate-600 dark:text-slate-300">
              这是一种「阿尔法」策略——收益叠加在你持仓涨跌之上，而非替代它。
            </p>
          </div>

          {/* 资金流向图 */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 mb-4">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">资金与配号流向</p>
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-0">
              {[
                { icon: "🏦", label: "持有A股市值", sub: "≥1万元（沪/深市）", color: "amber" },
                { icon: "🔢", label: "生成配号", sub: "每5000元 = 1个配号", color: "blue" },
                { icon: "📦", label: "集合申购", sub: "规模效应提升中签率", color: "violet" },
                { icon: "🎯", label: "中签缴款", sub: "公司垫资，无需自付", color: "emerald" },
                { icon: "💸", label: "上市卖出分红", sub: "按配号数量瓜分60%", color: "rose" },
              ].map((node, i, arr) => (
                <div key={node.label} className="flex md:flex-row flex-col items-center flex-1 min-w-0 w-full md:w-auto">
                  <div className={cn(
                    "flex flex-col items-center text-center px-3 py-2 rounded-xl w-full md:w-auto",
                    node.color === "amber" && "bg-amber-50 dark:bg-amber-900/20",
                    node.color === "blue" && "bg-blue-50 dark:bg-blue-900/20",
                    node.color === "violet" && "bg-violet-50 dark:bg-violet-900/20",
                    node.color === "emerald" && "bg-emerald-50 dark:bg-emerald-900/20",
                    node.color === "rose" && "bg-rose-50 dark:bg-rose-900/20",
                  )}>
                    <span className="text-2xl mb-1">{node.icon}</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{node.label}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{node.sub}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <>
                      {/* 桌面：横向箭头 */}
                      <div className="hidden md:flex flex-col items-center w-8 shrink-0">
                        <div className="relative w-full h-[2px] bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="animate-flow-dot absolute inset-y-0 w-6 bg-gradient-to-r from-transparent via-amber-400 to-transparent" style={{ animationDelay: `${i * 0.35}s` }} />
                        </div>
                        <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-amber-400 -mt-0.5 ml-auto mr-0.5" />
                      </div>
                      {/* 移动：竖向箭头 */}
                      <div className="md:hidden flex flex-col items-center py-1">
                        <div className="relative h-5 w-[2px] bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-400 to-transparent animate-flow-dot-vertical" style={{ animationDelay: `${i * 0.35}s` }} />
                        </div>
                        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-amber-400 -mt-0.5" />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 收益分配 + 三大保障 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            {/* 圆盘图 */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 flex flex-col">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">中签收益分配</p>

              <div className="flex-1 flex flex-col items-center justify-center gap-6 py-4">
                {/* SVG Donut — r=80, circumference≈502.65 */}
                <div className="relative w-52 h-52 shrink-0">
                  <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                    {/* 60% 全体参与者 — red */}
                    <circle cx="100" cy="100" r="80"
                      fill="none" stroke="#ef4444" strokeWidth="28"
                      strokeDasharray="301.59 502.65"
                      strokeDashoffset="0"
                      strokeLinecap="butt"
                    />
                    {/* 30% 创富支点 — yellow */}
                    <circle cx="100" cy="100" r="80"
                      fill="none" stroke="#facc15" strokeWidth="28"
                      strokeDasharray="150.80 502.65"
                      strokeDashoffset="-301.59"
                      strokeLinecap="butt"
                    />
                    {/* 10% 中签奖励 — green */}
                    <circle cx="100" cy="100" r="80"
                      fill="none" stroke="#22c55e" strokeWidth="28"
                      strokeDasharray="50.27 502.65"
                      strokeDashoffset="-452.39"
                      strokeLinecap="butt"
                    />
                  </svg>
                  {/* 中心文字 */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">总收益</span>
                    <span className="text-2xl font-black text-slate-800 dark:text-white">100%</span>
                  </div>
                </div>

                {/* 图例 */}
                <div className="w-full space-y-3">
                  {[
                    { color: "bg-red-500", pct: "60%", label: "全体参与者", desc: "按配号数量比例分配，未中签者同样享有" },
                    { color: "bg-yellow-400", pct: "30%", label: "创富支点团队", desc: "运营维护、垫资服务、法务风控等运营费用" },
                    { color: "bg-green-500", pct: "10%", label: "中签者专属奖励", desc: "奖励中签账户，叠加在60%分红之上" },
                  ].map((row) => (
                    <div key={row.pct} className="flex items-center gap-3">
                      <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", row.color)} />
                      <span className="text-base font-black text-slate-800 dark:text-white w-10 shrink-0">{row.pct}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{row.label}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">{row.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 三大保障 + 退出机制 */}
            <div className="flex flex-col gap-3">
              {[
                {
                  icon: "⚖️",
                  title: "法律合规",
                  items: ["严格遵守证券法，不涉及账户出借", "资金始终在个人证券账户内，公司仅提供配号收集与垫资服务", "收益分配为个人对个人转账，目前无税务风险"],
                },
                {
                  icon: "🔒",
                  title: "资金安全",
                  items: ["受券商三方存管保护，公司无法直接触碰", "转出资金只转至本人绑定银行卡", "若拒绝配合，公司将通过法务途径追偿"],
                },
                {
                  icon: "🚪",
                  title: "退出机制",
                  items: ["合同期内可随时退出，灵活无锁定", "退出后不再参与后续分红", "已中签的收益归个人所有，不视为违约"],
                },
              ].map((block) => (
                <div key={block.title} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{block.icon}</span>
                    <span className="text-base font-bold text-slate-800 dark:text-slate-200">{block.title}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {block.items.map((item, ii) => (
                      <li key={ii} className="flex items-start gap-1.5">
                        <span className="mt-[6px] shrink-0 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* 服务支持 */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: "👥", title: "专属服务群", desc: "每位参与者建立专属小群（含主讲人、项目负责人、助理及本人），提供全流程一对一指导。" },
              { icon: "📄", title: "文档支持", desc: "提供详细打新流程文件，从申购到分红全流程操作指引，新手也能独立完成。" },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 flex gap-3">
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">{item.title}</div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 参与流程（横向流动） ── */}
        <section>
          <SectionTitle>参与流程</SectionTitle>

          {/* 桌面端：横向流 */}
          <div className="hidden md:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 shadow-sm">
            <div className="flex items-stretch gap-0">
              {steps.map((step, i) => {
                const c = stepColorMap[step.color];
                return (
                  <div key={step.num} className="flex items-center flex-1 min-w-0">
                    {/* 步骤卡片 */}
                    <div className="flex-1 flex flex-col items-center text-center px-2">
                      {/* 圆圈编号 */}
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm mb-2 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow",
                        c.bg, c.ring
                      )}>
                        {step.num}
                      </div>
                      {/* emoji */}
                      <div className="text-2xl mb-1.5">{step.emoji}</div>
                      {/* 标题 */}
                      <div className="text-base font-bold text-slate-900 dark:text-white mb-1 leading-snug">{step.title}</div>
                      {/* 短标签 */}
                      <div className={cn("text-sm font-semibold mb-1.5", c.text)}>{step.short}</div>
                      {/* 描述 */}
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                    </div>

                    {/* 流动连接线 */}
                    {i < steps.length - 1 && (
                      <div className="flex flex-col items-center justify-center w-10 shrink-0 self-center -mt-8">
                        <div className="relative w-full h-[3px] bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={cn("animate-flow-dot absolute inset-y-0 w-8 bg-gradient-to-r from-transparent to-transparent", `via-${steps[i].color}-400`)}
                            style={{ animationDelay: `${i * 0.4}s` }}
                          />
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 -mt-0.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 移动端：竖向时间线 */}
          <div className="md:hidden space-y-3">
            {steps.map((step, i) => {
              const c = stepColorMap[step.color];
              return (
                <div key={step.num} className="relative flex gap-4">
                  {/* 时间线轴 */}
                  <div className="flex flex-col items-center">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow ring-2 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950 shrink-0", c.bg, c.ring)}>
                      {step.num}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="relative w-[3px] flex-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden min-h-[24px]">
                        <div className="absolute inset-0 w-full bg-gradient-to-b from-transparent via-amber-400 to-transparent animate-flow-dot-vertical" style={{ animationDelay: `${i * 0.4}s` }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xl">{step.emoji}</span>
                      <span className="font-bold text-slate-900 dark:text-white text-base">{step.title}</span>
                    </div>
                    <div className={cn("text-sm font-semibold mb-1", c.text)}>{step.short}</div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section>
          <SectionTitle>常见问题</SectionTitle>
          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-2xl border transition-all duration-200 overflow-hidden",
                    isOpen
                      ? "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-md"
                      : "border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
                  )}
                >
                  {/* 问题行 */}
                  <button
                    className="w-full flex items-center gap-3 px-4 py-4 text-left"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                  >
                    <span className={cn("shrink-0 text-[10px] font-bold px-2 py-1 rounded-full", tagColorMap[faq.tagColor])}>
                      {faq.tag}
                    </span>
                    <span className="flex-1 text-base font-semibold text-slate-800 dark:text-slate-100 leading-snug">{faq.q}</span>
                    <div className={cn(
                      "shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-transform",
                      isOpen
                        ? "bg-slate-800 dark:bg-slate-200 rotate-90"
                        : "bg-slate-100 dark:bg-slate-800"
                    )}>
                      <ChevronRight className={cn("w-3 h-3", isOpen ? "text-white dark:text-slate-900" : "text-slate-500")} />
                    </div>
                  </button>

                  {/* 答案展开 */}
                  {isOpen && (
                    <div className="px-4 pb-5 pt-0 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-base text-slate-600 dark:text-slate-300 mt-3 mb-3">{faq.a}</p>

                      {/* 高亮数据卡 */}
                      <div className={cn("grid gap-3", faq.highlights.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
                        {faq.highlights.map((h, hi) => (
                          <div key={hi} className={cn("rounded-xl border p-3", highlightAccentMap[faq.tagColor])}>
                            <div className={cn("text-2xl font-black leading-none mb-1", valueColorMap[faq.tagColor])}>{h.value}</div>
                            <div className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-0.5">{h.label}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{h.desc}</div>
                          </div>
                        ))}
                      </div>

                      {/* 补充说明 */}
                      {faq.note && (
                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 px-3 py-2.5">
                          <Shield className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{faq.note}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 没有A股账户？开银河证券 ── */}
        <section>
          <SectionTitle>还没有 A 股账户？</SectionTitle>
          <div className="rounded-2xl border-l-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
            style={{ borderLeftColor: "#C8102E" }}>
            {/* 顶部色条 */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #C8102E60, transparent)" }} />
            <div className="p-5 md:p-6">
              {/* 头部 */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <img src="https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/9c/33/30/9c3330e7-b543-f9e6-65c3-bceeeac2d132/AppIcon-0-0-1x_U007emarketing-0-6-0-85-220.png/512x512bb.jpg"
                    alt="银河证券" className="w-11 h-11 rounded-xl object-cover shadow-sm" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-base">银河证券</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950">
                        ⭐ 编辑推荐
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">A股大型券商，ETF永久免五，多品种低佣</p>
                  </div>
                </div>
              </div>

              {/* 高亮福利 */}
              <div className="text-3xl font-black mb-0.5" style={{ color: "#C8102E" }}>永久免五</div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">入金 1.5 万放 2 个月，ETF 永久免五</p>

              {/* 费率明细 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                {[
                  {
                    title: "交易费率",
                    color: "#C8102E",
                    items: ["ETF/LOF：万0.5，1毛起（免五）", "股票：万0.86，50万↑万0.8，5元起", "可转债：万0.5，沪0.1元/深0.2元起", "北交所：万2，港股通：万0.8（不免五）", "国债逆回购：1折，500万以上0.1折", "LOF申购1折，赎回5折"],
                  },
                  {
                    title: "融资利率",
                    color: "#C8102E",
                    items: ["50~100万：3.98%", "100~200万：3.78%", "200~400万：3.58%", "400~700万：3.38%", "700~1000万：3.18%", "1000万以上：3%以下"],
                  },
                  {
                    title: "其他权益",
                    color: "#C8102E",
                    items: ["新客理财：6%，5万28天", "Level2+智能交易VIP：新客3个月"],
                  },
                ].map((group) => (
                  <div key={group.title} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 p-3">
                    <p className="text-xs font-bold mb-2" style={{ color: group.color }}>{group.title}</p>
                    <div className="space-y-1">
                      {group.items.map((item, ii) => (
                        <div key={ii} className="flex items-start gap-1.5">
                          <span className="mt-[5px] shrink-0 w-1 h-1 rounded-full bg-red-300 dark:bg-red-700" />
                          <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 按钮 */}
              <button
                onClick={() => {
                  const wx = document.getElementById("ipo-wx-dialog");
                  if (wx) wx.style.display = "flex";
                }}
                className="h-10 px-6 rounded-xl text-sm font-bold hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-2 text-white"
                style={{ backgroundColor: "#C8102E" }}
              >
                立即领取 <span className="text-base leading-none">💬</span>
              </button>
            </div>
          </div>

          <WxDialog id="ipo-wx-dialog" title="扫码添加微信" desc="发送「银河证券」获取专属开户费率协助" />
        </section>

        {/* ── 核心理念 ── */}
        <section>
          <SectionTitle>我们的初心</SectionTitle>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* 渐变背景头部 */}
            <div className="bg-gradient-to-br from-amber-50 to-white dark:from-slate-800 dark:to-slate-900 px-6 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="text-4xl mb-3">🌱</div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-snug">
                在你现有的基础上，<br />
                <span className="text-amber-500">持续叠加财富复利</span>
              </h3>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                就像投资纳斯达克和标普 500 的人，不需要每天盯盘，只是把钱放在那里，让时间和复利替你工作——我希望带你做的，也是同一件事。
              </p>
            </div>

            {/* 三列理念 */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
              {[
                {
                  icon: "📈",
                  title: "在现有基础上叠加",
                  desc: "你不需要改变任何投资习惯。用你已有的 A 股持仓，额外赚取一层阿尔法收益——是「加法」，不是「替代」。",
                },
                {
                  icon: "🔄",
                  title: "让收益自动复利",
                  desc: "每一期的分红，都可以继续投入、继续产生配号、继续参与下一期。小钱滚大钱，时间是最好的杠杆。",
                },
                {
                  icon: "🤝",
                  title: "一起赚，才是真的赚",
                  desc: "我希望创富支点不只是一个信息平台，而是真正陪着大家把钱赚到手、落进口袋的一个团队。",
                },
              ].map((item) => (
                <div key={item.title} className="p-5">
                  <div className="text-2xl mb-3">{item.icon}</div>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">{item.title}</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 text-center">
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">立即加入集合打新</h3>
          <p className="text-base text-slate-600 dark:text-slate-300 mb-5 max-w-md mx-auto">
            联系群主或管理员登记信息，获取专属编码后即可参与每期申购，用现有持仓赚取超额收益。
          </p>
          <button
            onClick={() => {
              const el = document.getElementById("ipo-cta-wx-dialog");
              if (el) el.style.display = "flex";
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-base transition-colors shadow-md shadow-amber-200 dark:shadow-amber-900/40"
          >
            <Users className="w-4 h-4" />
            联系 WiseInvest 进行登记
          </button>
        </section>

        <WxDialog id="ipo-cta-wx-dialog" title="扫码添加 WiseInvest" desc="发送「集合打新」完成登记，获取专属编码" />

      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
      <span className="w-4 h-px bg-slate-300 dark:bg-slate-700" />
      {children}
      <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
    </h2>
  );
}
