import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

function useIsMobile() {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.innerWidth <= 768);
  useEffect(() => {
    const fn = () => setM(window.innerWidth <= 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return m;
}

// 基于固定时钟格计算距离下一次刷新的秒数
// 盘前 16:00 起、盘中 21:30 起、盘后 04:00 起，每 15 分钟一个格
function clockCountdown(session) {
  if (session === "a_share" || session === "weekend") return null;
  const now = new Date();
  const hkt = new Date(now.getTime() + (8 * 60 + now.getTimezoneOffset()) * 60000);
  const totalSec = hkt.getHours() * 3600 + hkt.getMinutes() * 60 + hkt.getSeconds();
  const DAY = 24 * 3600;
  // 盘中 10 分钟一格，其他时段 15 分钟
  const INTERVAL = session === "us_open" ? 5 * 60 : 15 * 60;
  const anchor = { pre_market: 16 * 3600, us_open: 21 * 3600 + 30 * 60, post_market: 4 * 3600 }[session] ?? 0;
  const elapsed = (totalSec - anchor + DAY) % DAY;
  return INTERVAL - (elapsed % INTERVAL); // 距离下一个格的秒数
}

function sessionInterval(session) {
  return session === "us_open" ? 5 * 60 : 15 * 60;
}

// 判断当前市场时段（与后端 _current_session() 保持一致，基于 HKT）
function getMarketSession() {
  const now = new Date();
  // 转为 HKT（UTC+8）
  const hkt = new Date(now.getTime() + (8 * 60 + now.getTimezoneOffset()) * 60000);
  const day = hkt.getDay(); // 0=Sun, 1=Mon … 5=Fri, 6=Sat
  const h   = hkt.getHours() + hkt.getMinutes() / 60;

  // 周六：前半段美股周五仍在交易，后半段盘后，08:00+ 才是真正休市
  if (day === 6) {
    if (h < 4)  return "us_open";      // Fri 12:00-16:00 ET
    if (h < 8)  return "post_market";  // Fri 16:00-20:00 ET
    return "weekend";
  }
  // 周日：全天休市
  if (day === 0) return "weekend";
  // 周一 00:00-08:00：美股周日未交易，仍是休市
  if (day === 1 && h < 8) return "weekend";

  // 正常工作日逻辑（周一 08:00 至周五 24:00）
  if (h >= 8   && h < 16)  return "a_share";    // HKT 08:00-16:00
  if (h >= 16  && h < 21.5) return "pre_market"; // HKT 16:00-21:30
  if (h >= 21.5 || h < 4)   return "us_open";    // HKT 21:30-04:00
  return "post_market";                           // HKT 04:00-08:00
}

const SESSION_INFO = {
  a_share:     { label:"A股时段",  valLabel:"收盘估值", desc:"昨日收盘涨跌幅加权，数据已固定",      color:"#ffffff", bg:"rgba(5,150,105,0.85)",   dot:"#6ee7b7" },
  pre_market:  { label:"美股盘前", valLabel:"盘前估值", desc:"盘前涨跌幅实时加权，15分钟刷新",       color:"#ffffff", bg:"rgba(234,88,12,0.85)",   dot:"#fdba74" },
  us_open:     { label:"美股盘中", valLabel:"盘中估值", desc:"实时股价加权估值，5分钟刷新",          color:"#ffffff", bg:"rgba(37,99,235,0.85)",   dot:"#93c5fd" },
  post_market: { label:"美股盘后", valLabel:"盘后估值", desc:"盘后涨跌幅实时加权，15分钟刷新",       color:"#ffffff", bg:"rgba(124,58,237,0.85)",  dot:"#c4b5fd" },
  weekend:     { label:"周末休市", valLabel:"收盘估值", desc:"周五收盘数据，周一美股开盘前保持不变", color:"#ffffff", bg:"rgba(107,114,128,0.75)", dot:"#d1d5db" },
};

// ─── 颜色 ─────────────────────────────────────────────────────────────────────
const C = {
  accent:      "#0071e3",
  red:         "#d93025",
  green:       "#1a9e5a",
  text:        "#1d1d1f",
  textMuted:   "#6e6e73",
  textDim:     "#aeaeb2",
  bg:          "#f5f5f7",
  card:        "#ffffff",
  stripe:      "#f5f5f7",
  border:      "#e0e0e5",
  borderLight: "#f0f0f5",
};
const DARK = {
  accent:      "#60a5fa",
  red:         "#f87171",
  green:       "#34d399",
  text:        "#f3f4f6",
  textMuted:   "#d1d5db",
  textDim:     "#9ca3af",
  bg:          "#16171d",
  card:        "#1f2028",
  stripe:      "#12131a",
  border:      "#2e303a",
  borderLight: "#252630",
};

// ─── 基金数据 ─────────────────────────────────────────────────────────────────
const QDII_FUNDS = [
  { code:"017436", name:"华宝纳斯达克精选股票(QDII)A",         fee_rate:1.40, scale:46.2,  ytd_return:26.08,  daily_limit:"3000元",   buy_status:"open" },
  { code:"006555", name:"浦银安盛全球智能科技股票(QDII)A",      fee_rate:1.40, scale:8.7,   ytd_return:43.81,  daily_limit:"500元",    buy_status:"open" },
  { code:"270023", name:"广发全球精选股票(QDII)A",              fee_rate:1.40, scale:104.5, ytd_return:32.39,  daily_limit:"5000元",   buy_status:"open" },
  { code:"017730", name:"嘉实全球产业升级股票(QDII)A",          fee_rate:1.40, scale:7.2,   ytd_return:75.36,  daily_limit:"100元",    buy_status:"open" },
  { code:"012920", name:"易方达全球成长精选混合(QDII)A",         fee_rate:1.40, scale:28.3,  ytd_return:107.95, daily_limit:"50元",     buy_status:"open" },
  { code:"539002", name:"建信新兴市场优选混合(QDII)A",           fee_rate:1.40, scale:4.6,   ytd_return:92.11,  daily_limit:"50元",     buy_status:"open" },
  { code:"006373", name:"国富全球科技互联混合(QDII)人民币A",     fee_rate:1.40, scale:24.3,  ytd_return:53.48,  daily_limit:"100元",    buy_status:"open" },
  { code:"001668", name:"汇添富全球移动互联混合(QDII)A",         fee_rate:1.40, scale:8.2,   ytd_return:43.29,  daily_limit:"5000元",   buy_status:"open" },
  { code:"005698", name:"华夏全球科技先锋混合(QDII)",            fee_rate:1.40, scale:26.3,  ytd_return:52.49,  daily_limit:"10000元",  buy_status:"open" },
  { code:"002891", name:"华夏移动互联灵活配置混合(QDII)A",       fee_rate:1.40, scale:3.1,   ytd_return:120.50, daily_limit:"1000元",   buy_status:"open" },
  { code:"016701", name:"银华海外数字经济量化选股混合(QDII)A",   fee_rate:1.40, scale:11.2,  ytd_return:27.21,  daily_limit:"50000元",  buy_status:"open" },
  { code:"501226", name:"长城全球新能源汽车股票(QDII-LOF)A",    fee_rate:1.40, scale:4.7,   ytd_return:48.21,  daily_limit:"100元",    buy_status:"open" },
  { code:"017144", name:"华宝海外新能源汽车股票(QDII)A",         fee_rate:1.40, scale:2.6,   ytd_return:24.08,  daily_limit:"10000元",  buy_status:"open" },
  { code:"008253", name:"华宝致远混合(QDII)A",                  fee_rate:1.40, scale:1.7,   ytd_return:47.82,  daily_limit:"3000元",   buy_status:"open" },
  { code:"457001", name:"国富亚洲机会股票(QDII)A",               fee_rate:1.40, scale:3.2,   ytd_return:143.79, daily_limit:"200元",    buy_status:"open" },
  { code:"100055", name:"富国全球科技互联网股票(QDII)A",          fee_rate:1.40, scale:10.2,  ytd_return:37.81,  daily_limit:"暂停申购",  buy_status:"suspended" },
  // ── 新增主题型主动 QDII ──
  { code:"004877", name:"汇添富全球医疗混合(QDII)人民币",          fee_rate:1.40, scale:0,     ytd_return:0,      daily_limit:"不限额",    buy_status:"open" },
  { code:"006308", name:"汇添富全球消费混合(QDII)人民币A",          fee_rate:1.40, scale:0,     ytd_return:0,      daily_limit:"不限额",    buy_status:"open" },
  { code:"006309", name:"汇添富全球消费混合(QDII)人民币C",          fee_rate:1.40, scale:0,     ytd_return:0,      daily_limit:"不限额",    buy_status:"open" },
  { code:"018155", name:"创金合信全球医药生物股票发起式(QDII)A",    fee_rate:1.40, scale:0,     ytd_return:0,      daily_limit:"不限额",    buy_status:"open" },
  { code:"018156", name:"创金合信全球医药生物股票发起式(QDII)C",    fee_rate:1.40, scale:0,     ytd_return:0,      daily_limit:"不限额",    buy_status:"open" },
  // ── C 类份额补全 ──
  { code:"017437", name:"华宝纳斯达克精选股票发起式(QDII)C",        fee_rate:1.40, scale:0,     ytd_return:0,      daily_limit:"不限额",    buy_status:"open" },
  { code:"017731", name:"嘉实全球产业升级股票发起式(QDII)C",        fee_rate:1.40, scale:0,     ytd_return:0,      daily_limit:"不限额",    buy_status:"open" },
  { code:"022184", name:"富国全球科技互联网股票(QDII)C",             fee_rate:1.40, scale:0,     ytd_return:0,      daily_limit:"不限额",    buy_status:"open" },
  { code:"016702", name:"银华海外数字经济量化选股混合(QDII)C",       fee_rate:1.40, scale:0,     ytd_return:0,      daily_limit:"不限额",    buy_status:"open" },
  { code:"016823", name:"天弘全球新能源汽车股票(QDII-LOF)C",        fee_rate:1.40, scale:0,     ytd_return:0,      daily_limit:"不限额",    buy_status:"open" },
  { code:"018036", name:"长城全球新能源车股票发起式(QDII)C",         fee_rate:1.40, scale:0,     ytd_return:0,      daily_limit:"不限额",    buy_status:"open" },
  { code:"017145", name:"华宝海外新能源汽车股票发起式(QDII)C",       fee_rate:1.40, scale:0,     ytd_return:0,      daily_limit:"不限额",    buy_status:"open" },
];

// ─── 持仓占位数据 ─────────────────────────────────────────────────────────────
const HOLDINGS_PLACEHOLDER = {
  "017436": [
    { name:"奈飞",               symbol:"NFLX",  weight:9.32,  change:null },
    { name:"英伟达",              symbol:"NVDA",  weight:9.28,  change:null },
    { name:"苹果",               symbol:"AAPL",  weight:7.76,  change:null },
    { name:"微软",               symbol:"MSFT",  weight:7.50,  change:null },
    { name:"博通",               symbol:"AVGO",  weight:7.43,  change:null },
    { name:"特斯拉",              symbol:"TSLA",  weight:7.33,  change:null },
    { name:"谷歌-C",              symbol:"GOOGL", weight:6.82,  change:null },
    { name:"亚马逊",              symbol:"AMZN",  weight:6.34,  change:null },
    { name:"Meta Platforms",    symbol:"META",  weight:5.77,  change:null },
    { name:"迈威尔科技",           symbol:"MRVL",  weight:4.96,  change:null },
  ],
};

// ─── 净值走势占位 ─────────────────────────────────────────────────────────────
function genNavHistory() {
  const data = [];
  let nav = 1.0;
  for (let i = 180; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    nav *= (1 + (Math.random() - 0.46) * 0.015);
    data.push({ date: `${d.getMonth()+1}/${d.getDate()}`, nav: parseFloat(nav.toFixed(4)) });
  }
  return data;
}

// ─── 指数迷你卡片（Hero 右侧）────────────────────────────────────────────────
function MiniIndexCard({ label, value, subValue }) {
  const isPos = value !== null && value >= 0;
  return (
    <div style={{
      width: 120, textAlign: "center",
      padding: "8px 10px",
      background: "rgba(255,255,255,0.10)",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.15)",
    }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginBottom: 5, fontWeight: 500 }}>{label}</div>
      <div style={{
        fontSize: 20, fontWeight: 800, letterSpacing: -0.5,
        color: value === null ? "rgba(255,255,255,0.4)" : isPos ? "#ff6b6b" : "#6ee7b7",
      }}>
        {value === null ? "—" : `${isPos ? "+" : ""}${value.toFixed(2)}%`}
      </div>
      {subValue != null && (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>{subValue}</div>
      )}
    </div>
  );
}

// ─── 表格样式 ─────────────────────────────────────────────────────────────────
function mkTh(cc) {
  return {
    padding: "13px 14px", textAlign: "center",
    fontSize: 15, fontWeight: 800, color: cc.text,
    letterSpacing: 0.3,
    borderBottom: `1px solid ${cc.border}`,
    background: cc.card,
    whiteSpace: "nowrap",
    position: "sticky", top: 0, zIndex: 1,
  };
}
function mkTd(cc) {
  return {
    padding: "13px 14px", fontSize: 13,
    color: cc.text, fontWeight: 500, borderBottom: `1px solid ${cc.borderLight}`,
  };
}

// ─── 状态 ─────────────────────────────────────────────────────────────────────
function getSessionStatus(session) {
  if (session === "a_share")     return { label:"A股交易中", color:"#059669", bg:"#d1fae5", border:"#6ee7b7" };
  if (session === "pre_market")  return { label:"美股盘前",  color:"#ea580c", bg:"#fff7ed", border:"#fdba74" };
  if (session === "us_open")     return { label:"美股交易中", color:"#1d4ed8", bg:"#dbeafe", border:"#93c5fd" };
  if (session === "post_market") return { label:"美股盘后",  color:"#7c3aed", bg:"#ede9fe", border:"#c4b5fd" };
  return                                { label:"休市",      color:"#6b7280", bg:"#f3f4f6", border:"#d1d5db" };
}

// 圆环图色盘
const DONUT_COLORS = [
  "#4f46e5","#7c3aed","#2563eb","#0891b2","#0d9488",
  "#059669","#d97706","#dc2626","#db2777","#9333ea",
];

// ─── 基金行 ───────────────────────────────────────────────────────────────────
function FundRow({ fund, onClick, isEven, isMobile, cc, session, watched, onToggleWatch }) {
  const ytd = fund.ytd_return;
  const val = fund.valuation;
  const isOpen = fund.buy_status === "open";
  const status = getSessionStatus(session);

  return (
    <tr
      onClick={() => onClick(fund)}
      style={{ background: isEven ? (cc.stripe ?? cc.bg) : cc.card, cursor: "pointer", transition: "background 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
      onMouseLeave={e => e.currentTarget.style.background = isEven ? (cc.stripe ?? cc.bg) : cc.card}
    >
      {/* 五角星 */}
      <td style={{ ...mkTd(cc), width:32, padding:"0 4px 0 12px", textAlign:"center" }}>
        <span
          onClick={e => onToggleWatch(fund.code, e)}
          title={watched ? "移出自选" : "加入自选"}
          style={{ fontSize:16, cursor:"pointer", color: watched ? "#f59e0b" : cc.textDim, lineHeight:1, userSelect:"none" }}
        >
          {watched ? "★" : "☆"}
        </span>
      </td>
      {isMobile ? (
        <td style={{ ...mkTd(cc), maxWidth: 200, padding:"10px 8px 10px 4px" }}>
          <div style={{ fontWeight:600, color:cc.text, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{fund.name}</div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3, flexWrap:"nowrap" }}>
            <span style={{ fontFamily:"monospace", fontSize:10, color:"#4f46e5", fontWeight:700, whiteSpace:"nowrap" }}>代码：{fund.code}</span>
            {fund.nav != null && (
              <span style={{ fontSize:10, color:cc.red, fontFamily:"monospace", fontWeight:600, whiteSpace:"nowrap" }}>净值：{fund.nav.toFixed(4)}</span>
            )}
            <span style={{ fontSize:10, fontWeight:700, color:status.color, whiteSpace:"nowrap" }}>{status.label}</span>
          </div>
        </td>
      ) : (
        <>
          <td style={mkTd(cc)}>
            <span style={{ fontFamily:"monospace", fontSize:12, color:"#4f46e5", fontWeight:700 }}>{fund.code}</span>
          </td>
          <td style={{ ...mkTd(cc), maxWidth:260, fontWeight:500, color:cc.text }}>
            <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{fund.name}</div>
          </td>
        </>
      )}
      {!isMobile && <td style={{ ...mkTd(cc), textAlign:"center" }}>
        {fund.scale > 0 ? `${fund.scale.toFixed(1)}` : "—"}
      </td>}
      {!isMobile && <td style={{ ...mkTd(cc), textAlign:"right" }}>
        {ytd != null && ytd !== 0 ? (
          <span style={{ color: ytd >= 0 ? cc.red : cc.green, fontWeight:600 }}>
            {ytd >= 0 ? "+" : ""}{ytd.toFixed(2)}%
          </span>
        ) : "—"}
      </td>}
      {!isMobile && <td style={{ ...mkTd(cc), textAlign:"center" }}>
        <span style={{
          padding:"2px 8px", borderRadius:6, fontSize:12,
          background: isOpen ? "#1a9e5a12" : "#e0e0e510",
          color: isOpen ? cc.green : cc.textDim,
          border: `1px solid ${isOpen ? cc.green+"30" : cc.border}`,
          whiteSpace:"nowrap",
        }}>
          {fund.daily_limit}
        </span>
      </td>}
      {!isMobile && <td style={{ ...mkTd(cc), textAlign:"center" }}>
        <span style={{
          padding:"3px 10px", borderRadius:6, fontSize:12, fontWeight:700,
          color: status.color, background: status.bg, border:`1px solid ${status.border}`,
          whiteSpace:"nowrap",
        }}>
          {status.label}
        </span>
      </td>}
      {!isMobile && <td style={{ ...mkTd(cc), textAlign:"center" }}>
        {fund.nav != null ? (
          <span style={{
            fontWeight:600, fontSize:13, fontFamily:"monospace",
            color: fund.nav_published ? "#059669" : cc.text,
          }} title={fund.nav_published ? `最新净值已公布（${fund.nav_date}）` : undefined}>
            {fund.nav.toFixed(4)}
            {fund.nav_published && <span style={{ fontSize:9, marginLeft:3, color:"#059669" }}>✓新</span>}
          </span>
        ) : (
          <span style={{ color:cc.textDim, fontSize:12 }}>—</span>
        )}
      </td>}
      {session === "a_share" && !isMobile && (
        <td style={{ ...mkTd(cc), textAlign:"center", fontWeight:700 }}>
          {fund.post_valuation != null ? (
            <span style={{ color: fund.post_valuation >= 0 ? cc.red : cc.green, fontSize:15 }}>
              {fund.post_valuation >= 0 ? "+" : ""}{fund.post_valuation.toFixed(2)}%
            </span>
          ) : (
            <span style={{ color:cc.textDim, fontSize:13 }}>—</span>
          )}
        </td>
      )}
      <td style={{ ...mkTd(cc), textAlign:"center", fontWeight:700 }}>
        {val != null ? (
          <span style={{ color: val >= 0 ? cc.red : cc.green, fontSize:15 }}>
            {val >= 0 ? "+" : ""}{val.toFixed(2)}%
          </span>
        ) : (
          <span style={{ color:"#a5b4fc", fontSize:13 }}>计算中…</span>
        )}
      </td>
    </tr>
  );
}

// ─── 详情面板 ─────────────────────────────────────────────────────────────────
function DetailPanel({ fund, onClose, cc, session }) {
  // 优先用 API 实时持仓，无数据时显示占位
  const holdings = (fund.holdings && fund.holdings.length > 0)
    ? fund.holdings
    : (HOLDINGS_PLACEHOLDER[fund.code] || []);
  const navHistory = useMemo(() => genNavHistory(), [fund.code]);
  const ytd = fund.ytd_return;
  const val = fund.valuation;
  const status = getSessionStatus(session || "weekend");
  const [showAll, setShowAll] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.45)", backdropFilter:"blur(6px)", display:"flex", justifyContent:"flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width:"min(620px,100%)", height:"100%", background:cc.card,
        overflowY:"auto", boxShadow:"-8px 0 48px rgba(0,0,0,0.18)",
        borderRadius:"20px 0 0 20px",
        animation:"slideInRight 0.28s ease", display:"flex", flexDirection:"column",
      }}>
        {/* 顶部渐变 Header */}
        <div style={{
          background:"linear-gradient(135deg,#1a56db,#7c3aed)",
          padding:"28px 28px 24px", color:"#fff", position:"sticky", top:0, zIndex:10,
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:11, opacity:0.65, marginBottom:4, fontFamily:"monospace", letterSpacing:1 }}>{fund.code}</div>
              <div style={{ fontSize:18, fontWeight:800, lineHeight:1.3 }}>{fund.name}</div>
            </div>
            <button onClick={onClose} style={{
              width:32, height:32, borderRadius:"50%", border:"none",
              background:"rgba(255,255,255,0.15)", color:"#fff",
              fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
            }}>×</button>
          </div>

          {val != null && (
            <div style={{ marginTop:16, display:"flex", alignItems:"flex-end", gap:20, flexWrap:"wrap" }}>
              {session === "a_share" && fund.post_valuation != null && (
                <div>
                  <div style={{ fontSize:30, fontWeight:900, letterSpacing:-1, color: fund.post_valuation >= 0 ? "#ff6b6b" : "#6ee7b7" }}>
                    {fund.post_valuation >= 0 ? "+" : ""}{fund.post_valuation.toFixed(2)}%
                  </div>
                  <div style={{ fontSize:11, opacity:0.65, marginTop:2 }}>盘后估值<br/>盘后涨跌加权</div>
                </div>
              )}
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ fontSize:36, fontWeight:900, letterSpacing:-1, color: val >= 0 ? "#ff6b6b" : "#6ee7b7" }}>
                  {val >= 0 ? "+" : ""}{val.toFixed(2)}%
                </div>
                <div style={{ fontSize:12, opacity:0.7, lineHeight:1.5 }}>
                  {SESSION_INFO[session]?.valLabel ?? "今日估值"}涨跌幅<br/>
                  {fund.data_source === "gszzl"           ? "fundgz 全仓实时估值" :
                   fund.data_source === "gszzl_fallback"  ? "gszzl 兜底数据" :
                   fund.data_source === "us_open_calc"    ? "实时股价加权" :
                   fund.data_source === "pre_market_calc" ? "盘前涨跌幅加权" :
                   fund.data_source === "post_market_calc"? "盘后涨跌幅加权" :
                   fund.data_source === "a_share_post_calc"? "收盘涨跌加权" :
                   "季报持仓加权"}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding:"24px 28px", flex:1 }}>

          {/* 基本信息 */}
          <SectionTitle icon="📋" cc={cc}>基本信息</SectionTitle>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:28 }}>
            {[
              { label:"基金规模", value: fund.scale > 0 ? `${fund.scale.toFixed(1)} 亿元` : "—" },
              { label:"2025年涨幅", value: ytd != null && ytd !== 0 ? `${ytd >= 0 ? "+" : ""}${ytd.toFixed(2)}%` : "—" },
              { label:"每日限额", value: fund.daily_limit },
              { label:"申购状态", value: fund.buy_status === "open" ? "✅ 开放申购" : "⛔ 暂停申购" },
              { label:"当前状态", value: status.label, color: status.color },
              ...(fund.nav_date ? [{ label:"净值日期", value: fund.nav_published ? `${fund.nav_date} ✓已公布` : fund.nav_date, color: fund.nav_published ? "#059669" : undefined }] : []),
            ].map(item => (
              <div key={item.label} style={{ padding:"10px 14px", borderRadius:10, background:cc.bg, border:`1px solid ${cc.border}` }}>
                <div style={{ fontSize:11, color:cc.textDim, marginBottom:3 }}>{item.label}</div>
                <div style={{ fontSize:14, fontWeight:600, color: item.color || cc.text }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* 估值说明 */}
          <SectionTitle icon="🧮" cc={cc}>估值计算说明</SectionTitle>
          <div style={{ padding:"14px 16px", borderRadius:12, background:"#eff6ff", border:"1px solid #bfdbfe", marginBottom:28 }}>
            {fund.data_source === "gszzl" || fund.data_source === "gszzl_fallback" ? (
              <>
                <div style={{ fontSize:13, color:"#1e40af", lineHeight:1.8 }}>
                  数据来源：<strong>天天基金 fundgz 接口</strong>（基金公司官方全仓实时估值）
                </div>
                <div style={{ fontSize:12, color:"#3b82f6", marginTop:6, lineHeight:1.7 }}>
                  fundgz 涵盖基金全部持仓（非仅前十），数据每 15 分钟由基金公司更新一次，
                  精准度远高于持仓加权计算。A股交易时段（08:00-16:00 HKT）实时可用。
                  {fund.gszzl_time && <span>（最后更新：{fund.gszzl_time}）</span>}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize:13, color:"#1e40af", lineHeight:1.8 }}>
                  估值涨跌幅 ≈ <strong>Σ（持仓占比 × 股票涨跌幅）</strong> + <strong>汇率变动</strong>
                </div>
                <div style={{ fontSize:12, color:"#3b82f6", marginTop:6, lineHeight:1.7 }}>
                  基于季报前十重仓股加权计算。
                  {fund.data_source === "pre_market_calc"  ? "使用盘前涨跌幅（Yahoo+Nasdaq）。" :
                   fund.data_source === "us_open_calc"     ? "使用实时股价（Yahoo）。" :
                   fund.data_source === "post_market_calc" ? "使用盘后涨跌幅（Yahoo+Nasdaq）。" :
                   fund.data_source === "a_share_post_calc"? "使用昨日盘后涨跌幅（冻结）。" :
                   "使用收盘价缓存。"}
                  {" "}前十覆盖率越高，估值越接近真实净值变动。非美股（港股/欧股）暂无法获取实时价格，会影响覆盖率。
                </div>
              </>
            )}
          </div>

          {/* 持仓圆环图 */}
          {holdings.length > 0 && (() => {
            const top10 = holdings.slice(0, 10);
            const top10Weight = top10.reduce((s, h) => s + h.weight, 0);
            const otherWeight = Math.max(0, 100 - top10Weight);
            const pieData = [
              ...top10.map((h, i) => ({ name: h.name, symbol: h.symbol, value: h.weight, color: DONUT_COLORS[i % DONUT_COLORS.length] })),
              ...(otherWeight > 0.5 ? [{ name:"其他持仓", symbol:"", value: parseFloat(otherWeight.toFixed(1)), color:"#e2e8f0" }] : []),
            ];
            return (
              <div style={{ marginBottom:28 }}>
                <SectionTitle icon="🍩" cc={cc}>前十大持仓结构</SectionTitle>
                <div style={{ borderRadius:14, border:`1px solid ${cc.border}`, padding:"16px", background:cc.card }}>
                  <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                    {/* 圆环 */}
                    <div style={{ position:"relative", flexShrink:0 }}>
                      <PieChart width={160} height={160}>
                        <Pie
                          data={pieData}
                          cx={75} cy={75}
                          innerRadius={50} outerRadius={75}
                          dataKey="value"
                          strokeWidth={1.5}
                          stroke="#fff"
                        >
                          {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip
                          formatter={(v, n, p) => [`${v.toFixed(1)}%`, p.payload.name]}
                          contentStyle={{ borderRadius:8, fontSize:12 }}
                        />
                      </PieChart>
                      {/* 中心文字 */}
                      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center", pointerEvents:"none" }}>
                        <div style={{ fontSize:16, fontWeight:800, color:cc.text }}>{top10Weight.toFixed(0)}%</div>
                        <div style={{ fontSize:9, color:cc.textDim }}>前十</div>
                      </div>
                    </div>
                    {/* 图例 */}
                    <div style={{ flex:1, display:"flex", flexDirection:"column", gap:5, minWidth:0 }}>
                      {pieData.map((d, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11 }}>
                          <div style={{ width:8, height:8, borderRadius:2, background:d.color, flexShrink:0 }} />
                          <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color: d.symbol ? cc.text : cc.textDim }}>{d.name || d.symbol}</span>
                          <span style={{ fontWeight:600, color: d.symbol ? cc.text : cc.textDim, flexShrink:0 }}>{d.value.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 持仓明细 */}
          <SectionTitle icon="🏢" cc={cc}>
            {showAll ? `全部持仓明细（${holdings.length}只）` : `前十大持仓`}
          </SectionTitle>
          {holdings.length > 0 ? (
            <div style={{ borderRadius:12, border:`1px solid ${cc.border}`, overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize: isMobile ? 12 : 13 }}>
                {(() => {
                    const changeLabel = { pre_market:"盘前", us_open:"盘中", post_market:"盘后", a_share:"昨涨跌", weekend:"昨涨跌" }[session] ?? "涨跌";
                    const maxW = holdings.reduce((m, x) => Math.max(m, x.weight), 1);
                    const displayed = showAll ? holdings : holdings.slice(0, 10);
                    const tdP = isMobile ? "8px 6px" : "13px 14px";
                    const thStyle = { ...mkTh(cc), position:"static", color:"rgba(255,255,255,0.8)", background:"transparent",
                      padding: isMobile ? "8px 6px" : "13px 14px", fontSize: isMobile ? 11 : 15 };
                    return (<>
                <thead>
                  <tr style={{ background:"linear-gradient(135deg,#1a56db,#7c3aed)" }}>
                    <th style={{ ...thStyle, textAlign:"left" }}>名称</th>
                    <th style={{ ...thStyle, textAlign:"center" }}>占比</th>
                    <th style={{ ...thStyle, textAlign:"right" }}>{changeLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((h, i) => {
                    const dotColor = i < 10 ? DONUT_COLORS[i] : "#d1d5db";
                    return (
                      <tr key={h.symbol || i} style={{ background: i % 2 ? cc.bg : cc.card }}>
                        <td style={{ ...mkTd(cc), padding: tdP }}>
                          <div style={{ display:"flex", alignItems:"center", gap: isMobile ? 4 : 6 }}>
                            <div style={{ width:6, height:6, borderRadius:2, background:dotColor, flexShrink:0 }} />
                            <div>
                              <div style={{ fontWeight:500, color:cc.text, fontSize: isMobile ? 12 : 13 }}>{h.name || h.symbol}</div>
                              {!isMobile && <div style={{ fontSize:11, color:cc.textDim, fontFamily:"monospace" }}>{h.symbol}</div>}
                              {isMobile && <div style={{ fontSize:10, color:cc.textDim, fontFamily:"monospace" }}>{h.symbol}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ ...mkTd(cc), textAlign:"center", padding: tdP }}>
                          {isMobile ? (
                            <span style={{ fontSize:12, fontWeight:600, color:cc.text }}>{h.weight.toFixed(1)}%</span>
                          ) : (
                            <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"center" }}>
                              <div style={{ width:50, height:4, borderRadius:2, background:cc.borderLight, overflow:"hidden" }}>
                                <div style={{ width:`${(h.weight / maxW) * 100}%`, height:"100%", background: dotColor, borderRadius:2 }} />
                              </div>
                              <span style={{ fontSize:12, fontWeight:600, color:cc.text }}>{h.weight.toFixed(2)}%</span>
                            </div>
                          )}
                        </td>
                        <td style={{ ...mkTd(cc), textAlign:"right", padding: tdP }}>
                          {h.change != null ? (
                            <span style={{ color: h.change >= 0 ? cc.red : cc.green, fontWeight:600, fontSize: isMobile ? 12 : 13 }}>
                              {h.change >= 0 ? "+" : ""}{h.change.toFixed(2)}%
                            </span>
                          ) : (
                            <span style={{ color:cc.textDim, fontSize: isMobile ? 11 : 12 }} title="非美股或暂无报价">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                    </>);
                  })()}
              </table>
              {holdings.length > 10 && (
                <div style={{ textAlign:"center", padding:"12px 0", borderTop:`1px solid ${cc.borderLight}` }}>
                  <button
                    onClick={() => setShowAll(v => !v)}
                    style={{
                      padding:"6px 20px", borderRadius:8, border:`1px solid ${cc.border}`,
                      background:cc.card, color:"#4f46e5", fontSize:12, fontWeight:600,
                      cursor:"pointer",
                    }}
                  >
                    {showAll ? "收起" : `展示全部 ${holdings.length} 只持仓`}
                  </button>
                </div>
              )}
              <div style={{ padding:"10px 14px", fontSize:11, color:cc.textDim, borderTop:`1px solid ${cc.border}`, background:cc.bg, display:"flex", justifyContent:"space-between" }}>
                <span>
                  数据来源：基金季报
                  {fund.holdings_date ? `（截至 ${fund.holdings_date}）` : ""}
                  {fund.holdings_source && fund.holdings_source !== "quarterly" && fund.holdings_source !== "quarterly+annual"
                    ? <span style={{ color:"#ef4444", marginLeft:4 }}>⚠️ 季报拉取失败，数据仅供参考</span>
                    : ""}
                </span>
                <span>「—」表示非美股或暂无报价，不计入估值</span>
              </div>
            </div>
          ) : (
            <div style={{ padding:"48px 0", textAlign:"center", color:cc.textDim, fontSize:13, background:cc.bg, borderRadius:12 }}>
              持仓数据加载中…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, children, cc }) {
  const col = cc || C;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
      <span style={{ fontSize:16 }}>{icon}</span>
      <div style={{ fontSize:13, fontWeight:700, color:col.textMuted, letterSpacing:0.3, textTransform:"uppercase" }}>{children}</div>
    </div>
  );
}

// ─── Canvas 辅助函数 ──────────────────────────────────────────────────────────
const _QDII_F = '"PingFang SC","Microsoft YaHei","Helvetica Neue",Arial,sans-serif';
function _qdiiRR(c,x,y,w,h,r=8){
  c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.arcTo(x+w,y,x+w,y+r,r);
  c.lineTo(x+w,y+h-r);c.arcTo(x+w,y+h,x+w-r,y+h,r);c.lineTo(x+r,y+h);
  c.arcTo(x,y+h,x,y+h-r,r);c.lineTo(x,y+r);c.arcTo(x,y,x+r,y,r);c.closePath();
}
function _qdiiFit(c,v,maxW){
  if(v==null)return'—';const s=String(v);
  if(c.measureText(s).width<=maxW)return s;
  let t=s;while(t.length>1&&c.measureText(t+'…').width>maxW)t=t.slice(0,-1);
  return t+'…';
}

function drawQDIIExportCanvas(rows, session, logoImg=null){
  const W=1200, SC=2, PX=32;
  const F=_QDII_F;
  const BRAND_H=82, TITLE_H=132, CH=66, FH=148;
  const RH=70;
  const H=BRAND_H+TITLE_H+CH+rows.length*RH+FH;

  const cvs=document.createElement('canvas');
  cvs.width=W*SC; cvs.height=H*SC;
  const c=cvs.getContext('2d'); c.scale(SC,SC);

  c.fillStyle='#f0f4ff'; c.fillRect(0,0,W,H);

  // Top accent bar
  const ag=c.createLinearGradient(0,0,W,0);
  ag.addColorStop(0,'#1a56db'); ag.addColorStop(0.5,'#7c3aed'); ag.addColorStop(1,'#4f46e5');
  c.fillStyle=ag; c.fillRect(0,0,W,14);

  // Brand header
  c.fillStyle='#e8eeff'; c.fillRect(0,14,W,BRAND_H-14);
  const brandY=Math.round((14+BRAND_H)/2+28*0.38);
  c.font=`bold 30px ${F}`; c.fillStyle='#1a56db'; c.fillText('Wise',PX,brandY);
  const wW=c.measureText('Wise').width;
  c.font=`bold 30px ${F}`; c.fillStyle='#7c3aed'; c.fillText('ETF',PX+wW,brandY);
  const eW=c.measureText('ETF').width;
  c.font=`18px ${F}`; c.fillStyle='#475569'; c.fillText('  @WiseInvest 整理',PX+wW+eW,brandY);
  c.textAlign='right';
  c.font=`bold 18px ${F}`; c.fillStyle='#1a56db'; c.fillText('wise-etf.com',W-PX,brandY);
  c.textAlign='left';

  // Title section
  c.fillStyle='#ffffff'; c.fillRect(0,BRAND_H,W,TITLE_H);
  const lsg=c.createLinearGradient(0,BRAND_H,0,BRAND_H+TITLE_H);
  lsg.addColorStop(0,'#1a56db'); lsg.addColorStop(1,'#7c3aed');
  c.fillStyle=lsg; c.fillRect(0,BRAND_H,7,TITLE_H);
  const TY=BRAND_H+70;
  c.font=`bold 50px ${F}`; c.fillStyle='#111827'; c.fillText('主动型 ',PX+18,TY);
  const t1w=c.measureText('主动型 ').width;
  c.font=`bold 50px ${F}`; c.fillStyle='#1a56db'; c.fillText('QDII',PX+18+t1w,TY);
  const t2w=c.measureText('QDII').width;
  c.font=`bold 50px ${F}`; c.fillStyle='#7c3aed'; c.fillText(' 基金',PX+18+t1w+t2w,TY);
  const t3w=c.measureText(' 基金').width;
  // session label
  const si=SESSION_INFO[session]||SESSION_INFO.weekend;
  c.font=`bold 32px ${F}`; c.fillStyle='#7c3aed';
  c.fillText(`  ·  ${si.valLabel}`,PX+18+t1w+t2w+t3w,TY);
  const today=new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'});
  const dd=today.replace(/\//g,'.');
  c.font=`17px ${F}`; c.fillStyle='#64748b';
  c.fillText('数据仅供参考，不构成投资建议',PX+18,BRAND_H+106);
  c.textAlign='right';
  c.font=`bold 17px ${F}`; c.fillStyle='#7c3aed';
  c.fillText('wise-etf.com 查看实时数据 →',W-PX,BRAND_H+106);
  c.textAlign='left';

  // Table cols
  const cols=[
    {key:'code',      label:'代码',     w:80,  align:'left'},
    {key:'name',      label:'基金名称', w:330, align:'left'},
    {key:'scale',     label:'规模(亿)', w:90,  align:'right'},
    {key:'ytd_return',label:'25年涨幅', w:110, align:'right'},
    {key:'daily_limit',label:'每日限额',w:120, align:'center'},
    {key:'valuation', label: si.valLabel, w:160, align:'center'},
  ];
  const totalColW=cols.reduce((s,col)=>s+col.w,0);
  const colSc=(W-PX*2)/totalColW;
  const sCols=cols.map(col=>({...col,w:col.w*colSc}));
  const xp=[]; let cx2=PX; sCols.forEach(col=>{xp.push(cx2);cx2+=col.w;});

  const tableY=BRAND_H+TITLE_H;

  // Table header
  const hg=c.createLinearGradient(0,tableY,W,tableY);
  hg.addColorStop(0,'#102099'); hg.addColorStop(1,'#1a56db');
  c.fillStyle=hg; c.fillRect(0,tableY,W,CH);
  c.font=`bold 17px ${F}`;
  sCols.forEach((col,i)=>{
    c.fillStyle='#e8f0ff'; c.textAlign=col.align;
    const tx=col.align==='right'?xp[i]+col.w-12:col.align==='center'?xp[i]+col.w/2:xp[i]+12;
    c.fillText(col.label,tx,tableY+CH/2+6);
  }); c.textAlign='left';

  // Table rows
  rows.forEach((row,ri)=>{
    const ry=tableY+CH+ri*RH;
    c.fillStyle=ri%2===0?'#ffffff':'#dde8ff'; c.fillRect(0,ry,W,RH);
    c.fillStyle=ri%2===0?'#c5d8ff':'#a8c4f8'; c.fillRect(0,ry,5,RH);
    c.strokeStyle='#b8c8f0'; c.lineWidth=0.7;
    c.beginPath(); c.moveTo(0,ry+RH); c.lineTo(W,ry+RH); c.stroke();
    const tyR=ry+RH/2+7;
    sCols.forEach((col,ci)=>{
      const v=row[col.key];
      c.textAlign=col.align;
      const tx=col.align==='right'?xp[ci]+col.w-12:col.align==='center'?xp[ci]+col.w/2:xp[ci]+12;
      switch(col.key){
        case 'code':
          c.font=`bold 19px ${F}`; c.fillStyle='#1a56db'; c.fillText(v??'—',tx,tyR); break;
        case 'name':
          c.font=`18px ${F}`; c.fillStyle='#111827'; c.fillText(_qdiiFit(c,v??'—',col.w-16),tx,tyR); break;
        case 'scale':
          c.font=`bold 18px ${F}`; c.fillStyle='#1e3a5f';
          c.fillText(v!=null&&v>0?`${parseFloat(v).toFixed(1)}`:'—',tx,tyR); break;
        case 'ytd_return':{
          const n=v!=null?parseFloat(v):null;
          c.font=`bold 19px ${F}`;
          c.fillStyle=n!=null?(n>0?'#b91c1c':'#15803d'):'#9ca3af';
          c.fillText(n!=null?`${n>0?'+':''}${n.toFixed(1)}%`:'—',tx,tyR); break;}
        case 'daily_limit':
          c.font=`17px ${F}`; c.fillStyle='#334155';
          c.fillText(_qdiiFit(c,v??'—',col.w-14),tx,tyR); break;
        case 'valuation':{
          const val=v!=null?parseFloat(v):null;
          if(val==null){
            c.font=`17px ${F}`; c.fillStyle='#a5b4fc'; c.fillText('计算中…',tx,tyR);
          } else {
            const pW=Math.round(110), pH=Math.round(36);
            const px2=xp[ci]+(col.w-pW)/2, py2=ry+(RH-pH)/2;
            _qdiiRR(c,px2,py2,pW,pH,pH/2);
            c.fillStyle=val>0?'#fee2e2':val<0?'#dcfce7':'#f1f5f9'; c.fill();
            c.strokeStyle=val>0?'#dc2626':val<0?'#16a34a':'#d1d5db'; c.lineWidth=1.5;
            _qdiiRR(c,px2,py2,pW,pH,pH/2); c.stroke();
            c.font=`bold 19px ${F}`;
            c.fillStyle=val>0?'#b91c1c':val<0?'#15803d':'#475569';
            c.textAlign='center'; c.fillText(`${val>0?'+':''}${val.toFixed(2)}%`,px2+pW/2,py2+24);
          }
          break;}
        default:
          c.font=`16px ${F}`; c.fillStyle='#374151';
          c.fillText(v!=null?String(v):'—',tx,tyR);
      }
      c.textAlign='left';
    });
  });

  // Footer
  const fy=tableY+CH+rows.length*RH;
  const fg=c.createLinearGradient(0,0,W,0);
  fg.addColorStop(0,'#1a56db'); fg.addColorStop(1,'#7c3aed');
  c.fillStyle=fg; c.fillRect(0,fy,W,FH);

  const midY=fy+FH/2;
  if(logoImg){
    const logoH=Math.round(FH*0.32);
    const logoW=Math.round(logoImg.naturalWidth/logoImg.naturalHeight*logoH);
    c.textAlign='center';
    c.font=`bold 28px ${F}`; c.fillStyle='#ffffff';
    const blockTop=midY-28-3-logoH/2;
    c.fillText('@WiseInvest',W/2,blockTop+28);
    c.drawImage(logoImg,(W-logoW)/2,blockTop+28+6,logoW,logoH);
    c.font=`bold 17px ${F}`; c.fillStyle='rgba(255,255,255,0.85)';
    c.fillText('以上平台同名',W/2,blockTop+28+6+logoH+17+2);
    c.font=`13px ${F}`; c.fillStyle='rgba(255,255,255,0.55)';
    c.fillText('数据仅供参考，不构成投资建议',W/2,blockTop+28+6+logoH+17+2+6+13);
    c.font=`bold 22px ${F}`; c.fillStyle='#ffffff';
    c.textAlign='left'; c.fillText('wise-etf.com',PX,midY+22*0.35);
    c.textAlign='right'; c.fillText(dd,W-PX,midY+22*0.35);
  } else {
    c.textAlign='center';
    c.font=`bold 20px ${F}`; c.fillStyle='#ffffff';
    c.fillText(`wise-etf.com  ·  @WiseInvest 整理  ·  ${dd}`,W/2,midY);
    c.font=`14px ${F}`; c.fillStyle='rgba(255,255,255,0.6)';
    c.fillText('数据仅供参考，不构成投资建议',W/2,midY+24);
  }
  c.textAlign='left';
  return cvs;
}

// ─── 主页面 ───────────────────────────────────────────────────────────────────
export default function QDIIPage() {
  const isMobile = useIsMobile();
  const [selected, setSelected]       = useState(null);
  const [search, setSearch]           = useState("");
  const [sortKey, setSortKey]         = useState(null);
  const [sortDir, setSortDir]         = useState("desc");

  // ── API 数据 ──
  const [valuations, setValuations]   = useState(() => {
    // 从 localStorage 恢复上次成功的估值，避免页面刷新时"计算中…"闪烁
    try {
      const saved = localStorage.getItem("qdii_val_cache");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });   // { code -> {valuation, holdings, coverage, nav} }
  const [usActive, setUsActive]       = useState({});   // { code -> {scale, ytd_return, daily_limit, buy_status} }
  const [fxPrice, setFxPrice]         = useState(null);
  const [indexData, setIndexData]     = useState([
    { label:"纳斯达克",    value: null },
    { label:"纳指100",     value: null },
    { label:"标普500",     value: null },
    { label:"美元/人民币", value: null },
  ]);
  const [loading, setLoading]         = useState(() => {
    // 有 localStorage 缓存时不显示初始 loading，避免遮盖旧数据
    try { return !localStorage.getItem("qdii_val_cache"); } catch { return true; }
  });
  const [updatedAt, setUpdatedAt]     = useState(null);
  const [session, setSession]         = useState(() => getMarketSession());
  const [countdown, setCountdown]     = useState(null);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("qdii_dark") === "1"; } catch { return false; }
  });
  const [simpleMode, setSimpleMode] = useState(false);
  const [watchlistMode, setWatchlistMode] = useState(false);
  const [watchlist, setWatchlist] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("qdii_watchlist") || "[]")); } catch { return new Set(); }
  });
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "open" | "suspended"
  const [showDonate, setShowDonate] = useState(false);
  const [exportImg, setExportImg] = useState(null);   // { url, filename } | null
  const [exporting, setExporting] = useState(false);

  function toggleWatch(code, e) {
    e.stopPropagation();
    setWatchlist(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      try { localStorage.setItem("qdii_watchlist", JSON.stringify([...next])); } catch {}
      return next;
    });
  }
  const CC = dark ? DARK : C;

  function toggleDark() {
    setDark(d => {
      const next = !d;
      try { localStorage.setItem("qdii_dark", next ? "1" : "0"); } catch {}
      return next;
    });
  }

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function handleExport() {
    setExporting(true);
    const rows = filtered;
    const today = new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'}).replace(/\//g,'-');
    const logoImg = new Image();
    const proceed = (logo) => {
      try {
        const cvs = drawQDIIExportCanvas(rows, session, logo);
        setExportImg({ url: cvs.toDataURL('image/png'), filename: `wise-etf-qdii-${today}.png` });
      } finally {
        setExporting(false);
      }
    };
    logoImg.onload = () => proceed(logoImg);
    logoImg.onerror = () => proceed(null);
    logoImg.src = encodeURI('/@Wise 投资有术 (2).png');
  }

  // 拉估值数据（可被自动刷新复用）
  function fetchValuations(showLoading = false) {
    if (showLoading) setLoading(true);
    return fetch("/api/qdii/valuations", { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        const map = {};
        (data.funds || []).forEach(f => { map[f.code] = f; });
        setValuations(map);
        try { localStorage.setItem("qdii_val_cache", JSON.stringify(map)); } catch {}
        setUpdatedAt(data.updated_at || null);
        setSession(data.session || getMarketSession());
        const fx = data.fx_change ?? null;
        const fp = data.fx_price  ?? null;
        setFxPrice(fp);
        setIndexData(prev => prev.map(d =>
          d.label === "美元/人民币" ? { ...d, value: fx } : d
        ));
      })
      .catch(e => console.warn("[qdii] valuations fetch failed", e))
      .finally(() => { if (showLoading) setLoading(false); });
  }

  // 初始拉取
  useEffect(() => {
    fetchValuations(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 每秒刷新倒计时 + 预热 + 整点 UI 刷新
  useEffect(() => {
    const timer = setInterval(() => {
      const s = getMarketSession();
      setSession(s);
      const secs = clockCountdown(s);
      setCountdown(secs);
      if (s === "weekend" || s === "a_share") return;
      const interval = sessionInterval(s);
      // T-90s：静默预热（只清顶层+股价缓存，持仓保留）→ 后台重算，约 3-5s 完成
      if (secs === 90) {
        fetch("/api/qdii/valuations?light=true", { cache: "no-store" }).catch(() => {});
      }
      // T=0（新格开始）：UI 正式刷新，此时数据已在 Redis 中
      if (secs === interval) {
        fetchValuations(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 拉美股主动数据（scale/ytd_return/daily_limit/buy_status）
  useEffect(() => {
    fetch("/api/funds/us_active")
      .then(r => r.json())
      .then(data => {
        const map = {};
        (data.data || []).forEach(f => { map[f.code] = f; });
        setUsActive(map);
      })
      .catch(() => {});
  }, []);

  // 拉指数数据（market-sentiment）
  useEffect(() => {
    fetch("/api/market-sentiment")
      .then(r => r.json())
      .then(data => {
        const d   = data?.data ?? {};
        const ndx = d?.ndx_price?.change_pct ?? null;
        const spx = d?.spx_price?.change_pct ?? null;
        setIndexData(prev => prev.map(item => {
          if (item.label === "纳斯达克")  return { ...item, value: ndx };
          if (item.label === "纳指100")   return { ...item, value: ndx };
          if (item.label === "标普500")   return { ...item, value: spx };
          return item;
        }));
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    // 将 API 估值数据 + 美股主动数据合并进静态基金列表
    let list = QDII_FUNDS.map(f => {
      const api = valuations[f.code] || {};
      const ua  = usActive[f.code]  || {};
      return {
        ...f,
        // 美股主动 live 数据优先 > QDII valuation API > 静态兜底
        scale:       ua.scale       ?? api.scale       ?? (f.scale      > 0 ? f.scale      : null),
        ytd_return:  ua.ytd_return  ?? api.ytd_return  ?? (f.ytd_return > 0 ? f.ytd_return : null),
        daily_limit: ua.daily_limit ?? f.daily_limit,
        buy_status:  ua.buy_status  ?? f.buy_status,
        valuation:     api.valuation     ?? null,
        coverage:      api.coverage      ?? null,
        holdings:        api.holdings        ?? null,
        holdings_date:   api.holdings_date   ?? null,
        holdings_source: api.holdings_source ?? null,
        nav:             api.nav             ?? null,
        nav_date:      api.nav_date      ?? null,
        nav_published: api.nav_published ?? false,
        data_source:   api.data_source   ?? null,
        gszzl_time:    api.gszzl_time    ?? null,
      };
    });

    if (q) list = list.filter(f => f.name.toLowerCase().includes(q) || f.code.includes(q));
    if (statusFilter === "open")      list = list.filter(f => f.buy_status === "open");
    if (statusFilter === "suspended") list = list.filter(f => f.buy_status === "suspended");

    if (sortKey) {
      list.sort((a, b) => {
        let av, bv;
        if (sortKey === "daily_limit") {
          const parse = s => s === "暂停申购" ? -1 : parseInt(s.replace(/\D/g, ""), 10) || 0;
          av = parse(a.daily_limit); bv = parse(b.daily_limit);
        } else {
          av = a[sortKey] ?? -Infinity; bv = b[sortKey] ?? -Infinity;
        }
        return sortDir === "desc" ? bv - av : av - bv;
      });
    }
    return list;
  }, [search, sortKey, sortDir, valuations, usActive, statusFilter]);

  return (
    <div style={{ minHeight:"100vh", background:CC.bg, paddingBottom:60, transition:"background 0.2s" }}>

      {/* ── 升级弹窗 ──────────────────────────────────────────────────────────── */}
      <div style={{
        position:"fixed", inset:0, zIndex:9999,
        background:"rgba(0,0,0,0.6)", backdropFilter:"blur(8px)",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <div style={{
          background:"#fff", borderRadius:20, padding:"40px 48px",
          textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.25)",
          maxWidth:360, width:"90%",
        }}>
          <div style={{ fontSize:40, marginBottom:16 }}>🔧</div>
          <div style={{ fontSize:18, fontWeight:800, color:"#1e293b", marginBottom:10 }}>
            功能升级中
          </div>
          <div style={{ fontSize:14, color:"#64748b", lineHeight:1.7 }}>
            此功能正在升级，请稍后再访问
          </div>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div style={{ background:"linear-gradient(135deg,#1a56db,#7c3aed)", color:"#fff", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", width:320, height:320, borderRadius:"50%", background:"rgba(255,255,255,0.04)", top:-80, right:-60, pointerEvents:"none" }} />
        <div style={{ position:"absolute", width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.05)", bottom:-40, left:120, pointerEvents:"none" }} />

        <div style={{ maxWidth:1440, margin:"0 auto", padding: isMobile ? "14px 16px 18px" : "18px 40px 20px" }}>
          {/* 返回首页 */}
          <a href="/" style={{ display:"inline-flex", alignItems:"center", gap:6, color:"rgba(255,255,255,0.75)", fontSize:12, textDecoration:"none", marginBottom:12, padding:"4px 0" }}>
            <span style={{ fontSize:14 }}>←</span> 返回首页
          </a>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:20, flexWrap: isMobile ? "wrap" : "nowrap" }}>
            {/* 左：标题区 */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.15)", borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:600, letterSpacing:"0.05em", marginBottom:8 }}>
                QDII VALUATION
              </div>
              <h1 style={{ fontSize: isMobile ? 18 : 23, fontWeight:800, margin:"0 0 6px", letterSpacing:"-0.02em" }}>
                主动 QDII 基金估值
              </h1>
              <p style={{ fontSize: isMobile ? 11 : 12, opacity:0.85, margin:"0 0 10px", lineHeight:1.6, maxWidth:560 }}>
                官方净值延迟 T+1/T+2 公布，美股收盘后用季报十大重仓股加权估算今日涨跌幅，帮你在 3PM 申购截止前提前决策。
              </p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {[
                  { icon:"🧮", text:"持仓加权估算" },
                  { icon:"💱", text:"含汇率变动" },
                  { icon:"🎯", text:"仅主动型 QDII" },
                ].map(tag => (
                  <div key={tag.text} style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,255,255,0.12)", borderRadius:20, padding:"3px 10px", fontSize:11 }}>
                    {tag.icon} {tag.text}
                  </div>
                ))}
                {/* 动态时段状态徽章 */}
                {(() => {
                  const si = SESSION_INFO[session] || SESSION_INFO.weekend;
                  return (
                    <div style={{ display:"flex", alignItems:"center", gap:5, background: si.bg, border:`1px solid ${si.color}40`, borderRadius:20, padding:"3px 10px", fontSize:11, color: si.color, fontWeight:600 }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background: si.dot || si.color, display:"inline-block",
                        ...(session !== "weekend" ? { animation:"pulse 1.5s infinite" } : {}) }} />
                      {si.label} · {si.desc}
                    </div>
                  );
                })()}
              </div>

              {/* 手机端：2×2 指数卡片（替代 说明条） */}
              {isMobile && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:14 }}>
                  {indexData.map(d => {
                    const isPos = d.value !== null && d.value >= 0;
                    const sub = d.label === "美元/人民币" && fxPrice != null ? `¥${fxPrice.toFixed(4)}` : undefined;
                    return (
                      <div key={d.label} style={{ textAlign:"center", padding:"8px 10px", background:"rgba(255,255,255,0.10)", borderRadius:10, border:"1px solid rgba(255,255,255,0.15)" }}>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.65)", marginBottom:4, fontWeight:500 }}>{d.label}</div>
                        <div style={{ fontSize:18, fontWeight:800, letterSpacing:-0.5, color: d.value === null ? "rgba(255,255,255,0.4)" : isPos ? "#ff6b6b" : "#6ee7b7" }}>
                          {d.value === null ? "—" : `${isPos ? "+" : ""}${d.value.toFixed(2)}%`}
                        </div>
                        {sub && <div style={{ fontSize:10, color:"rgba(255,255,255,0.55)", marginTop:2 }}>{sub}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 右：更新策略 + 2×2 指数卡片 */}
            {!isMobile && (
              <div style={{ display:"flex", gap:10, flexShrink:0, alignItems:"stretch" }}>

                {/* 更新策略 */}
                <div style={{
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.10)",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.22)",
                  display: "flex", flexDirection:"column", justifyContent:"center", gap:6,
                }}>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.55)", fontWeight:700, letterSpacing:"0.05em", marginBottom:1 }}>数据更新策略</div>
                  {[
                    { dot:"#9ca3af", label:"休市 / 周末",      time:"数据冻结" },
                    { dot:"#fdba74", label:"盘前 16:00–21:30", time:"15分钟刷新" },
                    { dot:"#93c5fd", label:"盘中 21:30–04:00", time:"10分钟刷新" },
                    { dot:"#c4b5fd", label:"盘后 04:00–08:00", time:"15分钟刷新" },
                  ].map(r => (
                    <div key={r.label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:r.dot, flexShrink:0 }} />
                      <span style={{ fontSize:11, color:"rgba(255,255,255,0.85)", whiteSpace:"nowrap" }}>
                        {r.label}
                        <span style={{ color:"rgba(255,255,255,0.4)", marginLeft:4, fontSize:10 }}>{r.time}</span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* 2×2 指数卡片 */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {indexData.map(d => (
                    <MiniIndexCard
                      key={d.label} {...d}
                      subValue={d.label === "美元/人民币" && fxPrice != null ? `¥${fxPrice.toFixed(4)}` : undefined}
                    />
                  ))}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 说明条（仅桌面）────────────────────────────────────────────────────── */}
      {!isMobile && <div style={{ background:CC.card, borderBottom:`1px solid ${CC.border}` }}>
        <div style={{ maxWidth:1440, margin:"0 auto", padding: isMobile ? "10px 16px" : "12px 40px" }}>
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 10 : 20 }}>
            {[
              { icon:"⏰", title:"提前决策", desc:"官方净值 T+1/T+2 才公布，估值帮你在 3PM 截止前做判断" },
              { icon:"🧮", title:"双源估算", desc:"A股时段用昨日盘后涨跌加权估算；美股时段用 Yahoo 实时股价加权" },
              { icon:"💱", title:"含汇率", desc:"人民币/美元汇率变动同步纳入计算，影响约 ±0.3%" },
              { icon:"⚠️", title:"仅供参考", desc:"持仓数据滞后 1-2 个月，实际净值以基金公司公告为准" },
            ].map(item => (
              <div key={item.title} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <span style={{ fontSize:22, lineHeight:1, flexShrink:0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:CC.text, marginBottom:3 }}>{item.title}</div>
                  <div style={{ fontSize:11, color:CC.textMuted, lineHeight:1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>}

      {/* ── 基金表格 ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth:1440, margin:"28px auto", padding: isMobile ? "0 16px" : "0 40px" }}>
        {/* 标题 + 搜索 */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", width: isMobile ? "100%" : "auto", gap:8 }}>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:CC.text, marginBottom:2 }}>
                {QDII_FUNDS.length} 只主动型 QDII 场外基金
              </div>
              <div style={{ fontSize:12, color:CC.textDim, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                <span>点击任意行查看持仓明细</span>
                {updatedAt && (
                  <span style={{ color:CC.textDim }}>
                    · 更新于 {new Date(updatedAt).toLocaleString("zh-CN", {month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})}
                  </span>
                )}
                {countdown != null && session !== "weekend" && session !== "a_share" && (
                  <span style={{
                    color: countdown <= 60 ? (dark ? "#34d399" : "#059669") : CC.textDim,
                    fontWeight: countdown <= 60 ? 600 : 400,
                  }}>
                    · {countdown <= 0 ? "即将更新…" : countdown < 60 ? `${countdown}秒后更新` : `${Math.ceil(countdown/60)}分钟后更新`}
                  </span>
                )}
              </div>
            </div>
            {/* 手机端赞赏，放标题右侧 */}
            {isMobile && (
              <button
                onClick={() => setShowDonate(true)}
                title="赞赏作者"
                style={{
                  flexShrink:0, height:34, borderRadius:10, border:"1.5px solid #f59e0b",
                  background:"linear-gradient(135deg,#fef3c7,#fde68a)",
                  color:"#92400e", fontSize:12, fontWeight:700,
                  cursor:"pointer", display:"flex", alignItems:"center",
                  gap:4, padding:"0 10px", whiteSpace:"nowrap",
                }}
              >
                ☕ 赞赏
              </button>
            )}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:"auto" }}>
            {/* 导出按钮 */}
            <button
              onClick={handleExport}
              disabled={exporting}
              title="导出估值图片"
              style={{
                height:34, borderRadius:10,
                border:"1.5px solid #1a56db",
                background: exporting ? "#e8eeff" : "linear-gradient(135deg,#e8eeff,#ede9fe)",
                color:"#1a56db", fontSize:12, fontWeight:700,
                cursor: exporting ? "not-allowed" : "pointer",
                display:"flex", alignItems:"center",
                gap:4, padding:"0 12px", whiteSpace:"nowrap", flexShrink:0,
                opacity: exporting ? 0.7 : 1,
              }}
            >
              {exporting ? "生成中…" : "↓ 导出"}
            </button>
            {/* 搜索框 */}
            <div style={{ position:"relative" }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索基金名称或代码…"
                style={{
                  width:220, padding:"8px 14px 8px 34px",
                  borderRadius:10, border:`1.5px solid ${CC.border}`,
                  fontSize:13, color:CC.text, background:CC.card,
                  outline:"none", boxSizing:"border-box", transition:"border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#4f46e5"}
                onBlur={e => e.target.style.borderColor = CC.border}
              />
              <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:14, color:CC.textDim }}>🔍</span>
            </div>
            {/* 赞赏按钮（仅桌面，手机版在标题行）*/}
            {!isMobile && (
              <button
                onClick={() => setShowDonate(true)}
                title="赞赏作者"
                style={{
                  height:34, borderRadius:10, border:"1.5px solid #f59e0b",
                  background:"linear-gradient(135deg,#fef3c7,#fde68a)",
                  color:"#92400e", fontSize:12, fontWeight:700,
                  cursor:"pointer", display:"flex", alignItems:"center",
                  gap:4, padding:"0 10px", whiteSpace:"nowrap", flexShrink:0,
                }}
              >
                ☕ 赞赏
              </button>
            )}
            {/* 暗夜模式 */}
            <button
              onClick={toggleDark}
              title={dark ? "切换日间模式" : "切换夜间模式"}
              style={{
                width:34, height:34, borderRadius:10, border:`1.5px solid ${CC.border}`,
                background: CC.card, color: CC.textMuted,
                fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all 0.18s", flexShrink:0,
              }}
            >
              {dark ? "☀️" : "🌙"}
            </button>
            {/* 自选（桌面文字；手机图标，和搜索同行）*/}
            <button
              onClick={() => setWatchlistMode(m => !m)}
              title={watchlistMode ? "返回全部" : "查看自选"}
              style={{
                height:34, borderRadius:10,
                border:`1.5px solid ${watchlistMode ? "#f59e0b" : CC.border}`,
                background: watchlistMode ? "#fef3c710" : CC.card,
                color: watchlistMode ? "#d97706" : CC.textMuted,
                fontSize: isMobile ? 16 : 12, fontWeight:600, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                gap:4, padding: isMobile ? "0" : "0 12px",
                width: isMobile ? 34 : "auto",
                whiteSpace:"nowrap", transition:"all 0.18s", flexShrink:0,
              }}
            >
              {isMobile ? (watchlistMode ? "★" : "☆") : (watchlistMode ? "★ 自选" : "☆ 自选")}
            </button>
            {/* 简约模式（仅桌面）*/}
            {!isMobile && (
              <button
                onClick={() => setSimpleMode(s => !s)}
                title={simpleMode ? "退出简约模式" : "简约模式"}
                style={{
                  padding:"7px 12px", borderRadius:10, border:`1.5px solid ${simpleMode ? "#4f46e5" : CC.border}`,
                  background: simpleMode ? "#4f46e510" : CC.card,
                  color: simpleMode ? "#4f46e5" : CC.textMuted,
                  fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap",
                  transition:"all 0.18s",
                }}
              >
                {simpleMode ? "☰ 完整" : "≡ 简约"}
              </button>
            )}
          </div>
        </div>

        {/* 表格 / 简约模式 / 自选模式 */}
        {watchlistMode ? (
          // ── 自选模式 ──────────────────────────────────────────────────────────
          watchlist.size === 0 ? (
            <div style={{ borderRadius:16, border:`1px solid ${CC.border}`, background:CC.card, padding:"60px 0", textAlign:"center", boxShadow:"0 2px 16px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>☆</div>
              <div style={{ fontSize:15, color:CC.textDim, marginBottom:6 }}>还没有自选基金</div>
              <div style={{ fontSize:12, color:CC.textDim }}>点击列表左侧的 ☆ 收藏基金</div>
            </div>
          ) : isMobile ? (
            // 手机自选：卡片列表
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {filtered.filter(f => watchlist.has(f.code)).map(fund => {
                const val = fund.valuation;
                return (
                  <div key={fund.code}
                    style={{ borderRadius:14, border:`1px solid ${CC.border}`, background:CC.card, padding:"14px 16px", boxShadow:"0 1px 8px rgba(0,0,0,0.05)", display:"flex", alignItems:"center", gap:12 }}
                  >
                    <span
                      onClick={e => toggleWatch(fund.code, e)}
                      style={{ fontSize:20, color:"#f59e0b", cursor:"pointer", flexShrink:0, lineHeight:1 }}
                    >★</span>
                    <div style={{ flex:1, minWidth:0, cursor:"pointer" }} onClick={() => setSelected(fund)}>
                      <div style={{ fontWeight:700, fontSize:14, color:CC.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{fund.name}</div>
                      <div style={{ fontFamily:"monospace", fontSize:11, color:"#4f46e5", marginTop:2 }}>{fund.code}</div>
                    </div>
                    <div style={{ fontSize:18, fontWeight:800, color: val == null ? "#a5b4fc" : val >= 0 ? CC.red : CC.green, flexShrink:0, cursor:"pointer" }} onClick={() => setSelected(fund)}>
                      {val == null ? "—" : `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`}
                    </div>
                  </div>
                );
              })}
              {filtered.filter(f => watchlist.has(f.code)).length === 0 && (
                <div style={{ borderRadius:14, border:`1px solid ${CC.border}`, background:CC.card, padding:"40px 0", textAlign:"center", color:CC.textDim, fontSize:14 }}>搜索结果中无自选基金</div>
              )}
            </div>
          ) : (
            // 桌面自选：简约3列 + 星号
            <div style={{ borderRadius:16, border:`1px solid ${CC.border}`, background:CC.card, overflow:"hidden", boxShadow:"0 2px 16px rgba(0,0,0,0.06)" }}>
              <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 2fr 1fr", background: dark ? "#252630" : "#f4f4f8", borderBottom:`1px solid ${CC.border}`, padding:"12px 20px 12px 16px" }}>
                <div/>
                {[{ label:"代码" }, { label:"基金名称" }, { label: SESSION_INFO[session]?.valLabel ?? "今日估值", align:"center" }].map(h => (
                  <div key={h.label} style={{ fontSize:14, fontWeight:800, color:CC.text, textAlign: h.align ?? "left" }}>{h.label}</div>
                ))}
              </div>
              {filtered.filter(f => watchlist.has(f.code)).map((fund, i, arr) => {
                const val = fund.valuation;
                const hoverBg = dark ? "#2a2d3a" : "#eff6ff";
                const bg = i % 2 === 0 ? CC.card : CC.bg;
                return (
                  <div key={fund.code}
                    onClick={() => setSelected(fund)}
                    style={{ display:"grid", gridTemplateColumns:"40px 1fr 2fr 1fr", alignItems:"center", padding:"14px 20px 14px 16px", cursor:"pointer", background:bg, borderBottom: i < arr.length-1 ? `1px solid ${CC.borderLight}` : "none", transition:"background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background=hoverBg}
                    onMouseLeave={e => e.currentTarget.style.background=bg}
                  >
                    <span onClick={e => toggleWatch(fund.code, e)} style={{ fontSize:16, color:"#f59e0b", cursor:"pointer", userSelect:"none" }}>★</span>
                    <div style={{ fontFamily:"monospace", fontSize:13, color: dark ? "#818cf8" : "#4f46e5", fontWeight:800 }}>{fund.code}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:CC.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:16 }}>{fund.name}</div>
                    <div style={{ fontSize:16, fontWeight:800, textAlign:"center", color: val == null ? (dark ? "#818cf8" : "#a5b4fc") : val >= 0 ? CC.red : CC.green }}>
                      {val == null ? "计算中…" : `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`}
                    </div>
                  </div>
                );
              })}
              {filtered.filter(f => watchlist.has(f.code)).length === 0 && (
                <div style={{ padding:"60px 0", textAlign:"center", color:CC.textDim, fontSize:14 }}>搜索结果中无自选基金</div>
              )}
            </div>
          )
        ) : simpleMode && !isMobile ? (
          // ── 简约模式：代码 | 基金名称 | 今日估值 三列平分 ──
          <div style={{ borderRadius:16, border:`1px solid ${CC.border}`, background:CC.card, overflow:"hidden", boxShadow:"0 2px 16px rgba(0,0,0,0.06)" }}>
            <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 2fr 1fr", background: dark ? "#252630" : "#f4f4f8", borderBottom:`1px solid ${CC.border}`, padding:"12px 20px 12px 16px" }}>
              <div/>
              {[{ label:"代码" }, { label:"基金名称" }, { label: SESSION_INFO[session]?.valLabel ?? "今日估值", align:"center" }].map(h => (
                <div key={h.label} style={{ fontSize:14, fontWeight:800, color:CC.text, textAlign: h.align ?? "left" }}>{h.label}</div>
              ))}
            </div>
            {filtered.map((fund, i) => {
              const val = fund.valuation;
              const hoverBg = dark ? "#2a2d3a" : "#eff6ff";
              const bg = i % 2 === 0 ? CC.card : CC.bg;
              return (
                <div key={fund.code}
                  onClick={() => setSelected(fund)}
                  style={{ display:"grid", gridTemplateColumns:"40px 1fr 2fr 1fr", alignItems:"center", padding:"14px 20px 14px 16px", cursor:"pointer", background:bg, borderBottom: i < filtered.length-1 ? `1px solid ${CC.borderLight}` : "none", transition:"background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background=hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background=bg}
                >
                  <span onClick={e => toggleWatch(fund.code, e)} title={watchlist.has(fund.code) ? "移出自选" : "加入自选"} style={{ fontSize:16, cursor:"pointer", color: watchlist.has(fund.code) ? "#f59e0b" : CC.textDim, userSelect:"none" }}>
                    {watchlist.has(fund.code) ? "★" : "☆"}
                  </span>
                  <div style={{ fontFamily:"monospace", fontSize:13, color: dark ? "#818cf8" : "#4f46e5", fontWeight:800 }}>{fund.code}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:CC.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:16 }}>{fund.name}</div>
                  <div style={{ fontSize:16, fontWeight:800, textAlign:"center", color: val == null ? (dark ? "#818cf8" : "#a5b4fc") : val >= 0 ? CC.red : CC.green }}>
                    {val == null ? "计算中…" : `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding:"60px 0", textAlign:"center", color:CC.textDim, fontSize:14 }}>未找到相关基金</div>
            )}
          </div>
        ) : (
          // ── 完整表格（原有逻辑）──
          <div style={{ borderRadius:16, border:`1px solid ${CC.border}`, background:CC.card, overflow:"hidden", boxShadow:"0 2px 16px rgba(0,0,0,0.06)" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  {/* 星号列 */}
                  <th style={{ ...mkTh(CC), width:32, padding:"0 4px 0 12px" }}/>
                  {isMobile ? (
                    <th style={{ ...mkTh(CC), minWidth:180 }}>基金</th>
                  ) : (
                    <>
                      <th style={mkTh(CC)}>代码</th>
                      <th style={{ ...mkTh(CC), minWidth:200, textAlign:"left" }}>基金名称</th>
                    </>
                  )}
                  {(isMobile ? [
                    { key:"valuation", label: SESSION_INFO[session]?.valLabel ?? "今日估值", align:"center" },
                  ] : [
                    { key:"scale",       label:"规模(亿)", align:"center" },
                    { key:"ytd_return",  label:"25年涨幅", align:"right"  },
                    { key:"daily_limit", label:"每日限额", align:"center" },
                    { key:"status",      label:"状态",     align:"center", noSort:true },
                    { key:"nav",         label:"最新净值", align:"center" },
                    ...(session === "a_share" ? [{ key:"post_valuation", label:"盘后估值", align:"center" }] : []),
                    { key:"valuation",   label: SESSION_INFO[session]?.valLabel ?? "今日估值", align:"center" },
                  ]).map(({ key, label, align, noSort }) => {
                    const active = sortKey === key;
                    const arrow = active ? (sortDir === "desc" ? " ▼" : " ▲") : " ↕";
                    return (
                      <th key={key}
                        style={{ ...mkTh(CC), textAlign: align, cursor: noSort ? "default" : "pointer", userSelect:"none",
                          color: active ? "#4f46e5" : CC.textMuted,
                          background: CC.card,
                        }}
                        onClick={() => !noSort && toggleSort(key)}
                      >
                        {label}
                        {!noSort && <span style={{ fontSize:10, opacity: active ? 1 : 0.4 }}>{arrow}</span>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filtered.map((fund, i) => (
                  <FundRow key={fund.code} fund={fund} isEven={i % 2 === 0} onClick={setSelected} isMobile={isMobile} cc={CC} session={session} watched={watchlist.has(fund.code)} onToggleWatch={toggleWatch} />
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={isMobile ? 3 : 9} style={{ padding:"60px 0", textAlign:"center", color:CC.textDim, fontSize:14 }}>
                      未找到相关基金
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ padding:"12px 16px", borderTop:`1px solid ${CC.border}`, fontSize:12, color:CC.textDim, display:"flex", justifyContent:"space-between", alignItems:"center", background:CC.card }}>
              <span>共 {filtered.length} 只{loading ? " · 估值加载中…" : ""}</span>
              <span>
                {session === "a_share"    ? "收盘估值 + 盘后估值加权" :
                 session === "us_open"    ? "Yahoo 实时股价加权" :
                 session === "pre_market" ? "Yahoo 盘前价格加权" :
                 session === "post_market"? "Yahoo 盘后价格加权" :
                 "季报持仓 × 收盘涨跌 + 汇率"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 详情面板 */}
      {selected && <DetailPanel fund={selected} onClose={() => setSelected(null)} cc={CC} session={session} />}

      {/* 导出弹窗 */}
      {exportImg && createPortal(
        <div
          onClick={() => setExportImg(null)}
          style={{
            position:"fixed", inset:0, zIndex:9999,
            background:"rgba(0,0,0,0.65)", backdropFilter:"blur(6px)",
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:"20px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background:"#fff", borderRadius:20, padding:"20px",
              maxWidth:680, width:"100%",
              boxShadow:"0 24px 60px rgba(0,0,0,0.3)",
              position:"relative", display:"flex", flexDirection:"column", gap:14,
              maxHeight:"90vh", overflow:"auto",
            }}
          >
            <button
              onClick={() => setExportImg(null)}
              style={{
                position:"absolute", top:12, right:12,
                width:28, height:28, borderRadius:"50%", border:"none",
                background:"#f3f4f6", color:"#6b7280",
                fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              }}
            >×</button>
            <div style={{ fontSize:15, fontWeight:800, color:"#1d1d1f", paddingRight:36 }}>估值导出图片</div>
            <img
              src={exportImg.url}
              alt="估值导出图"
              style={{ width:"100%", borderRadius:12, display:"block", border:"1px solid #e5e7eb" }}
            />
            <div style={{ display:"flex", gap:10 }}>
              <a
                href={exportImg.url}
                download={exportImg.filename}
                style={{
                  flex:1, height:40, borderRadius:10,
                  background:"linear-gradient(135deg,#1a56db,#7c3aed)",
                  color:"#fff", fontSize:13, fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  textDecoration:"none", gap:6,
                }}
              >
                ↓ 下载图片
              </a>
              <button
                onClick={() => {
                  fetch(exportImg.url)
                    .then(r => r.blob())
                    .then(blob => {
                      const item = new ClipboardItem({ "image/png": blob });
                      navigator.clipboard.write([item]).catch(() => {});
                    })
                    .catch(() => {});
                }}
                style={{
                  flex:1, height:40, borderRadius:10,
                  border:"1.5px solid #1a56db",
                  background:"#fff", color:"#1a56db",
                  fontSize:13, fontWeight:700, cursor:"pointer", gap:6,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}
              >
                复制图片
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 赞赏弹窗 */}
      {showDonate && createPortal(
        <div
          onClick={() => setShowDonate(false)}
          style={{
            position:"fixed", inset:0, zIndex:9999,
            background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background:"#fff", borderRadius:20, padding:"28px 24px",
              maxWidth:320, width:"90%", textAlign:"center",
              boxShadow:"0 24px 60px rgba(0,0,0,0.25)",
              position:"relative",
            }}
          >
            <button
              onClick={() => setShowDonate(false)}
              style={{
                position:"absolute", top:12, right:12,
                width:28, height:28, borderRadius:"50%", border:"none",
                background:"#f3f4f6", color:"#6b7280",
                fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              }}
            >×</button>
            <div style={{ fontSize:22, marginBottom:6 }}>☕</div>
            <div style={{ fontSize:16, fontWeight:800, color:"#1d1d1f", marginBottom:6 }}>感谢赞赏</div>
            <div style={{ fontSize:13, color:"#6e6e73", lineHeight:1.7, marginBottom:16, fontWeight:600, textAlign:"center" }}>
              如果这个工具对你有帮助<br/>欢迎赞赏支持作者持续迭代更多功能
            </div>
            <img
              src="/donate.jpg"
              alt="收款码"
              style={{ width:"100%", borderRadius:12, display:"block", marginBottom:16 }}
            />
            <div style={{ fontSize:13, color:"#6e6e73", lineHeight:1.9, textAlign:"center", fontWeight:600 }}>
              💡 赞赏用于支付服务器和数据接口费用<br/>Wise 会记住每一个赞赏的朋友
              <div style={{ marginTop:8, color:"#92400e" }}>
                一元两元也是爱 ❤️<br/>五元十元就大爱 🔥
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer style={{ background: CC.card, borderTop:`1px solid ${CC.border}`, marginTop:40 }}>
        <div style={{ maxWidth:1440, margin:"0 auto", padding: isMobile ? "28px 16px 20px" : "48px 40px 40px",
          display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto auto", gap: isMobile ? 28 : "48px 72px" }}>

          {/* 品牌介绍 */}
          <div style={{ maxWidth:320 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#1a56db,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:13, color:"#fff" }}>W</div>
              <span style={{ fontSize:18, fontWeight:800, letterSpacing:-0.5, color:CC.text }}>Wise<span style={{ color:"#1a56db" }}>ETF</span></span>
            </div>
            <p style={{ fontSize:13, color:CC.textMuted, lineHeight:1.85, marginBottom:8 }}>
              中国投资者的美股ETF与QDII基金追踪平台，提供实时估值、费率对比、溢价监控与申购状态追踪。
            </p>
            <p style={{ fontSize:12, color:CC.textDim }}>wise-etf.com</p>
          </div>

          {/* 快速导航 */}
          <div style={{ minWidth:160 }}>
            <div style={{ fontSize:14, fontWeight:700, color:CC.text, marginBottom:16 }}>本站导航</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                { label:"← 返回首页",    href:"/" },
                { label:"ETF 溢价监控",  href:"/" },
                { label:"基金费率对比",  href:"/" },
              ].map(l => (
                <a key={l.label} href={l.href}
                  style={{ fontSize:13, color:CC.textMuted, textDecoration:"none", transition:"color 0.15s" }}
                  onMouseEnter={e => e.target.style.color = "#1a56db"}
                  onMouseLeave={e => e.target.style.color = CC.textMuted}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          {/* 其他平台 */}
          <div style={{ minWidth:160 }}>
            <div style={{ fontSize:14, fontWeight:700, color:CC.text, marginBottom:16 }}>Wise 旗下</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                { label:"投资主站",     href:"https://www.wise-invest.org",  icon:"🌐" },
                { label:"Wise-Witness", href:"https://www.wise-witness.com",  icon:"🏦" },
                { label:"Wise-Hold",    href:"https://www.wise-hold.com",     icon:"📈" },
                { label:"Wise-SIM",     href:"https://www.wise-sim.org",      icon:"📱" },
              ].map(l => (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize:13, color:CC.textMuted, textDecoration:"none", display:"flex", alignItems:"center", gap:7, transition:"color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#1a56db"}
                  onMouseLeave={e => e.currentTarget.style.color = CC.textMuted}>
                  <span>{l.icon}</span>{l.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop:`1px solid ${CC.border}` }} />
        <div style={{ maxWidth:1440, margin:"0 auto", padding: isMobile ? "12px 16px" : "16px 40px",
          display:"flex", justifyContent:"center", flexDirection:"column", alignItems:"center", gap:4 }}>
          <div style={{ fontSize:11, color:CC.textDim }}>© 2026 wise-etf.com · All rights reserved</div>
          <div style={{ fontSize:11, color:CC.textDim }}>仅提供信息参考，不构成任何投资建议</div>
        </div>
      </footer>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
