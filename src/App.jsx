import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Area, AreaChart, ReferenceLine, ComposedChart, Line, LineChart, PieChart, Pie, Cell } from "recharts";
import { Analytics } from "@vercel/analytics/react";
import LazyPage from "./LazyPage.jsx";
import QDIIPage from "./QDIIPage.jsx";

// ─── Community Mode ───────────────────────────────────────────────────────────
// "telegram" → 弹窗显示电报图片 + 点击加入群聊按钮
// "wechat"   → 弹窗显示微信群聊二维码（原有逻辑）
const COMMUNITY_MODE = "telegram";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
async function apiFetch(path) {
  try { const r = await fetch(`${API_BASE}${path}`); if (r.ok) return await r.json(); } catch {}
  return null;
}

// ─── Static Data ──────────────────────────────────────────────────────────────
// ⚠️  FALLBACK 中的 ytd_return（25年涨幅）为写死的 2025 全年收益率，禁止动态覆盖。
// ⚠️  如需修改 ytd_return，必须直接编辑此处，并征得用户同意后才能改动。
const FALLBACK = {
  nasdaq_passive: [
    { code:"019524",name:"华泰柏瑞纳斯达克100ETF联接(QDII)A",  fee_rate:0.65,scale:6.8,  ytd_return:16.66,track_error:1.65,daily_limit:"100元",  buy_status:"open",     code_c:"019525"},
    { code:"019547",name:"招商纳斯达克100ETF联接(QDII)A",      fee_rate:0.65,scale:15.8, ytd_return:16.22,track_error:1.72,daily_limit:"100元",  buy_status:"open",     code_c:"019548"},
    { code:"539001",name:"建信纳斯达克100指数QDIIA",            fee_rate:1.00,scale:13.2, ytd_return:16.21,track_error:2.17,daily_limit:"100元",  buy_status:"open",     code_c:"012752"},
    { code:"018966",name:"汇添富纳斯达克100ETF联接(QDII)A",    fee_rate:0.65,scale:11.3, ytd_return:15.49,track_error:2.08,daily_limit:"100元",  buy_status:"open",     code_c:"018967"},
    { code:"016452",name:"南方纳斯达克100指数(QDII)A",          fee_rate:0.65,scale:33.3, ytd_return:17.26,track_error:1.64,daily_limit:"200元",  buy_status:"open",     code_c:"016453"},
    { code:"000834",name:"大成纳斯达克100指数(QDII)A",          fee_rate:1.00,scale:38.8, ytd_return:16.76,track_error:1.51,daily_limit:"50元",   buy_status:"open",     code_c:"008971"},
    { code:"019172",name:"摩根纳斯达克100指数(QDII)A",          fee_rate:0.60,scale:26.1, ytd_return:17.66,track_error:2.15,daily_limit:"10元",   buy_status:"open",     code_c:"019173"},
    { code:"270042",name:"广发纳斯达克100ETF联接(QDII)",        fee_rate:1.00,scale:108.4,ytd_return:17.04,track_error:1.10,daily_limit:"10元",   buy_status:"open",     code_c:"006479"},
    { code:"019441",name:"万家纳斯达克100指数发起式(QDII)",     fee_rate:0.65,scale:5.0,  ytd_return:16.86,track_error:1.75,daily_limit:"10元",   buy_status:"open",     code_c:"019442"},
    { code:"161130",name:"易方达纳斯达克100ETF联接(QDII-LOF)A",fee_rate:0.60,scale:16.1, ytd_return:16.58,track_error:1.55,daily_limit:"10元",   buy_status:"open",     code_c:"012870"},
    { code:"040046",name:"华安纳斯达克100指数(QDII)",           fee_rate:0.80,scale:55.2, ytd_return:15.37,track_error:2.06,daily_limit:"10元",   buy_status:"open",     code_c:"014978"},
    { code:"160213",name:"国泰纳斯达克100指数(QDII)",           fee_rate:1.00,scale:18.6, ytd_return:17.58,track_error:1.03,daily_limit:"暂停申购",buy_status:"suspended",code_c:null},
    { code:"016055",name:"博时纳斯达克100ETF联接(QDII)A",       fee_rate:0.65,scale:15.6, ytd_return:17.32,track_error:1.52,daily_limit:"暂停申购",buy_status:"suspended",code_c:"016057"},
    { code:"018043",name:"天弘纳斯达克100指数(QDII)A",          fee_rate:0.60,scale:26.2, ytd_return:17.49,track_error:1.55,daily_limit:"暂停申购",buy_status:"suspended",code_c:"018044"},
    { code:"019736",name:"宝盈纳斯达克100指数(QDII)A",          fee_rate:0.65,scale:6.8,  ytd_return:17.19,track_error:1.55,daily_limit:"暂停申购",buy_status:"suspended",code_c:"019737"},
    { code:"016532",name:"嘉实纳斯达克100联接(QDII)A",          fee_rate:0.60,scale:21.1, ytd_return:16.4, track_error:1.60,daily_limit:"暂停申购",buy_status:"suspended",code_c:"016533"},
    { code:"015299",name:"华夏纳斯达克100ETF联接(QDII)A",       fee_rate:0.80,scale:3.8,  ytd_return:15.74,track_error:2.69,daily_limit:"暂停申购",buy_status:"suspended",code_c:"015300"},
    { code:"017091",name:"景顺长城纳斯达克科技市值加权ETF联接A", fee_rate:1.00,scale:25.8, ytd_return:24.22,track_error:3.11,daily_limit:"100元",  buy_status:"open",     code_c:"017093"},
  ],
  sp500_passive: [
    { code:"017641",name:"摩根标普500指数(QDII)A",           fee_rate:0.65,scale:31.6,ytd_return:11.75,track_error:2.57, daily_limit:"50元",   buy_status:"open",     code_c:"019305"},
    { code:"161125",name:"易方达标普500指数(QDII-LOF)A",     fee_rate:1.00,scale:14.7,ytd_return:11.74,track_error:2.39, daily_limit:"10元",   buy_status:"open",     code_c:"012860"},
    { code:"017028",name:"国泰标普500ETF联接(QDII)A",        fee_rate:0.75,scale:1.6, ytd_return:11.71,track_error:1.87, daily_limit:"暂停申购",buy_status:"suspended",code_c:"017030"},
    { code:"050025",name:"博时标普500ETF联接(QDII)A",        fee_rate:0.80,scale:67.6,ytd_return:12.14,track_error:1.31, daily_limit:"暂停申购",buy_status:"suspended",code_c:"006075"},
    { code:"007721",name:"天弘标普500(QDII-FOF)A",           fee_rate:0.80,scale:26.5,ytd_return:11.16,track_error:null, daily_limit:"暂停申购",buy_status:"suspended",code_c:"007722"},
    { code:"018064",name:"华夏标普500ETF联接(QDII)A",        fee_rate:0.75,scale:4.1, ytd_return:10.38,track_error:1.10, daily_limit:"暂停申购",buy_status:"suspended",code_c:"018065"},
    { code:"096001",name:"大成标普500等权重指数(QDII)A",     fee_rate:1.20,scale:6.1, ytd_return:7.17, track_error:1.69, daily_limit:"50元",   buy_status:"open",     code_c:"008401"},
    { code:"161128",name:"易方达标普信息科技指数(QDII-FOF)A",fee_rate:1.00,scale:36.8,ytd_return:22.13,track_error:10.85,daily_limit:"10元",   buy_status:"open",     code_c:null},
  ],
  us_active: [
    { code:"100055",name:"富国全球科技互联网股票(QDII)A",fee_rate:1.40,scale:10.2,ytd_return:37.81,daily_limit:"不限额",buy_status:"open"},
    { code:"016701",name:"银华海外数字经济量化选股混合(QDII)A",fee_rate:1.40,scale:11.2,ytd_return:27.21,daily_limit:"50000元",buy_status:"open"},
    { code:"005698",name:"华夏全球科技先锋混合(QDII)",fee_rate:1.40,scale:26.3,ytd_return:52.49,daily_limit:"10000元",buy_status:"open"},
    { code:"017144",name:"华宝海外新能源汽车股票(QDII)A",fee_rate:1.40,scale:2.6,ytd_return:24.08,daily_limit:"10000元",buy_status:"open"},
    { code:"270023",name:"广发全球精选股票(QDII)A",fee_rate:1.40,scale:104.5,ytd_return:32.39,daily_limit:"5000元",buy_status:"open"},
    { code:"008253",name:"华宝致远混合(QDII)A",fee_rate:1.40,scale:1.7,ytd_return:47.82,daily_limit:"3000元",buy_status:"open"},
    { code:"017436",name:"华宝纳斯达克精选股票(QDII)A",fee_rate:1.40,scale:46.2,ytd_return:26.08,daily_limit:"3000元",buy_status:"open"},
    { code:"501312",name:"华宝海外科技股票(QDII-FOF-LOF)A",fee_rate:1.20,scale:8.1,ytd_return:31.04,daily_limit:"2000元",buy_status:"open"},
    { code:"501226",name:"长城全球新能源汽车股票(QDII-LOF)A",fee_rate:1.40,scale:4.7,ytd_return:48.21,daily_limit:"1000元",buy_status:"open"},
    { code:"006555",name:"浦银安盛全球智能科技股票(QDII)A",fee_rate:1.40,scale:8.7,ytd_return:43.81,daily_limit:"500元",buy_status:"open"},
    { code:"017730",name:"嘉实全球产业升级股票(QDII)A",fee_rate:1.40,scale:7.2,ytd_return:75.36,daily_limit:"100元",buy_status:"open"},
    { code:"006373",name:"国富全球科技互联混合(QDII)人民币A",fee_rate:1.40,scale:24.3,ytd_return:53.48,daily_limit:"100元",buy_status:"open"},
    { code:"000043",name:"嘉实美国成长股票(QDII)",fee_rate:1.40,scale:50.1,ytd_return:20.01,daily_limit:"100元",buy_status:"open"},
    { code:"012920",name:"易方达全球成长精选混合(QDII)A",fee_rate:1.40,scale:28.3,ytd_return:107.95,daily_limit:"50元",buy_status:"open"},
    { code:"539002",name:"建信新兴市场优选混合(QDII)A",fee_rate:1.40,scale:4.6,ytd_return:92.11,daily_limit:"50元",buy_status:"open"},
    { code:"001668",name:"汇添富全球移动互联混合(QDII)A",fee_rate:1.40,scale:0.0,ytd_return:43.29,daily_limit:"不限额",buy_status:"open"},
    { code:"016664",name:"天弘全球高端制造混合(QDII)A",fee_rate:1.40,scale:0.0,ytd_return:0,daily_limit:"不限额",buy_status:"open"},
    { code:"002891",name:"华夏移动互联灵活配置混合(QDII)A",fee_rate:1.40,scale:0.0,ytd_return:120.50,daily_limit:"不限额",buy_status:"open"},
    { code:"457001",name:"国富亚洲机会股票(QDII)A",fee_rate:1.40,scale:0.0,ytd_return:143.79,daily_limit:"不限额",buy_status:"open"},
    { code:"004877",name:"汇添富全球医疗混合(QDII)人民币",fee_rate:1.40,scale:0.0,ytd_return:27.85,daily_limit:"不限额",buy_status:"open"},
    { code:"006308",name:"汇添富全球消费混合(QDII)人民币A",fee_rate:1.40,scale:0.0,ytd_return:11.6,daily_limit:"不限额",buy_status:"open"},
    { code:"006309",name:"汇添富全球消费混合(QDII)人民币C",fee_rate:1.40,scale:0.0,ytd_return:10.5,daily_limit:"不限额",buy_status:"open"},
    { code:"018155",name:"创金合信全球医药生物股票发起式(QDII)A",fee_rate:1.40,scale:0.0,ytd_return:89.49,daily_limit:"不限额",buy_status:"open"},
    { code:"018156",name:"创金合信全球医药生物股票发起式(QDII)C",fee_rate:1.40,scale:0.0,ytd_return:88.8,daily_limit:"不限额",buy_status:"open"},
    { code:"017437",name:"华宝纳斯达克精选股票发起式(QDII)C",fee_rate:1.40,scale:0.0,ytd_return:16.7,daily_limit:"不限额",buy_status:"open"},
    { code:"017731",name:"嘉实全球产业升级股票发起式(QDII)C",fee_rate:1.40,scale:0.0,ytd_return:53.78,daily_limit:"不限额",buy_status:"open"},
    { code:"022184",name:"富国全球科技互联网股票(QDII)C",fee_rate:1.40,scale:0.0,ytd_return:43.99,daily_limit:"不限额",buy_status:"open"},
    { code:"016702",name:"银华海外数字经济量化选股混合(QDII)C",fee_rate:1.40,scale:0.0,ytd_return:23.74,daily_limit:"不限额",buy_status:"open"},
    { code:"016823",name:"天弘全球新能源汽车股票(QDII-LOF)C",fee_rate:1.40,scale:0.0,ytd_return:35.54,daily_limit:"不限额",buy_status:"open"},
    { code:"018036",name:"长城全球新能源车股票发起式(QDII)C",fee_rate:1.40,scale:0.0,ytd_return:29.8,daily_limit:"不限额",buy_status:"open"},
    { code:"017145",name:"华宝海外新能源汽车股票发起式(QDII)C",fee_rate:1.40,scale:0.0,ytd_return:26.14,daily_limit:"不限额",buy_status:"open"},
  ],
  // 场内ETF — 名称经 fundgz 实测验证，premium 为实际市场水平
  etfs: [
    { code:"513100",name:"国泰纳斯达克100ETF",           tracking_index:"纳斯达克100",         scale:167.9,ytd_return:16.99,premium:4.94,volume:3.6, change_pct:0.0,fee_rate:0.80,track_error:1.07},
    { code:"513110",name:"华泰柏瑞纳斯达克100ETF",       tracking_index:"纳斯达克100",         scale:41.6, ytd_return:16.60,premium:3.32,volume:1.5, change_pct:0.0,fee_rate:1.00,track_error:1.04},
    { code:"159941",name:"广发纳斯达克100ETF",           tracking_index:"纳斯达克100",         scale:297.8,ytd_return:16.41,premium:4.35,volume:7.8, change_pct:0.0,fee_rate:1.00,track_error:1.03},
    { code:"513300",name:"华夏纳斯达克100ETF(QDII)",     tracking_index:"纳斯达克100",         scale:112.5,ytd_return:14.72,premium:3.73,volume:3.1, change_pct:0.0,fee_rate:0.80,track_error:2.53},
    { code:"159659",name:"招商纳斯达克100ETF(QDII)",     tracking_index:"纳斯达克100",         scale:79.3, ytd_return:17.42,premium:3.62,volume:1.3, change_pct:0.0,fee_rate:0.65,track_error:1.08},
    { code:"159632",name:"华安纳斯达克100ETF(QDII)",     tracking_index:"纳斯达克100",         scale:97.8, ytd_return:16.28,premium:3.27,volume:1.9, change_pct:0.0,fee_rate:0.80,track_error:1.24},
    { code:"513870",name:"富国纳斯达克100ETF(QDII)",     tracking_index:"纳斯达克100",         scale:20.2, ytd_return:17.41,premium:3.39,volume:0.3, change_pct:0.0,fee_rate:0.63,track_error:0.86},
    { code:"159696",name:"易方达纳斯达克100ETF(QDII)",   tracking_index:"纳斯达克100",         scale:39.7, ytd_return:17.37,premium:3.79,volume:0.5, change_pct:0.0,fee_rate:0.63,track_error:0.86},
    { code:"159660",name:"汇添富纳斯达克100ETF(QDII)",   tracking_index:"纳斯达克100",         scale:37.7, ytd_return:17.24,premium:3.52,volume:0.4, change_pct:0.0,fee_rate:0.66,track_error:0.88},
    { code:"159501",name:"嘉实纳斯达克100ETF(QDII)",     tracking_index:"纳斯达克100",         scale:100.7,ytd_return:17.14,premium:3.52,volume:1.2, change_pct:0.0,fee_rate:0.61,track_error:0.86},
    { code:"513390",name:"博时纳斯达克100ETF(QDII)",     tracking_index:"纳斯达克100",         scale:35.6, ytd_return:17.12,premium:3.52,volume:0.4, change_pct:0.0,fee_rate:0.69,track_error:0.91},
    { code:"159513",name:"大成纳斯达克100ETF(QDII)",     tracking_index:"纳斯达克100",         scale:59.7, ytd_return:16.50,premium:3.52,volume:0.8, change_pct:0.0,fee_rate:1.01,track_error:0.88},
    { code:"159509",name:"景顺长城纳斯达克科技ETF(QDII)", tracking_index:"纳斯达克科技市值加权",scale:123.3,ytd_return:27.55,premium:16.9,volume:5.3, change_pct:0.0,fee_rate:1.00,track_error:1.88},
    { code:"513500",name:"博时标普500ETF",               tracking_index:"标普500",             scale:223.2,ytd_return:13.89,premium:4.54,volume:2.3, change_pct:0.0,fee_rate:0.80,track_error:1.07},
    { code:"159612",name:"国泰标普500ETF(QDII)",         tracking_index:"标普500",             scale:7.9,  ytd_return:13.74,premium:4.63,volume:0.1, change_pct:0.0,fee_rate:0.75,track_error:1.01},
    { code:"513650",name:"南方标普500ETF(QDII)",         tracking_index:"标普500",             scale:46.8, ytd_return:13.82,premium:3.06,volume:1.0, change_pct:0.0,fee_rate:0.75,track_error:1.05},
  ],
};

// 过去12个月月度收益（来源：Yahoo Finance，2025-05 ~ 2026-04，美元口径，NDX/GSPC 月收盘价计算）
const MONTHLY_12M = [
  {month:"5月",  nasdaq: 9.04, sp500: 6.15},
  {month:"6月",  nasdaq: 6.27, sp500: 4.96},
  {month:"7月",  nasdaq: 2.38, sp500: 2.17},
  {month:"8月",  nasdaq: 0.85, sp500: 1.91},
  {month:"9月",  nasdaq: 5.40, sp500: 3.53},
  {month:"10月", nasdaq: 4.77, sp500: 2.27},
  {month:"11月", nasdaq:-1.64, sp500: 0.13},
  {month:"12月", nasdaq:-0.73, sp500:-0.05},
  {month:"1月",  nasdaq: 1.20, sp500: 1.37},
  {month:"2月",  nasdaq:-2.32, sp500:-0.87},
  {month:"3月",  nasdaq:-4.89, sp500:-5.09},
  {month:"4月",  nasdaq:15.60, sp500:10.40},
];

// ─── FX / Index Historical Data ───────────────────────────────────────────────
// USD/CNY 年末汇率（来源：中国外汇交易中心 / Wind 公开数据）
// 格式：[年初汇率, 年末汇率]
const FX_ANNUAL = {
  2015:[6.2078,6.4936], 2016:[6.4936,6.9448], 2017:[6.9448,6.5063],
  2018:[6.5063,6.8775], 2019:[6.8775,6.9762], 2020:[6.9762,6.5249],
  2021:[6.5249,6.3726], 2022:[6.3726,6.8972], 2023:[6.8972,7.1001],
  2024:[7.1001,7.2996], 2025:[7.2996,7.0059],
};
// 年度涨跌幅（来源：Slickcharts，纳指100价格口径，标普500总回报含股息，1990-2025）
const INDEX_ANNUAL = {
  nasdaq:{
    1990:-10.41,1991:64.99,1992:8.87,1993:10.58,1994:1.50,
    1995:42.54,1996:42.54,1997:20.63,1998:85.31,1999:101.95,
    2000:-36.84,2001:-32.65,2002:-37.58,2003:49.12,2004:10.44,
    2005:1.49,2006:6.79,2007:18.67,2008:-41.89,2009:53.54,
    2010:19.22,2011:2.70,2012:16.82,2013:34.99,2014:17.94,
    2015:8.43,2016:5.89,2017:31.52,2018:-1.04,2019:37.96,
    2020:47.58,2021:26.63,2022:-32.97,2023:53.81,2024:24.88,2025:20.17,
  },
  sp500:{
    1990:-3.10,1991:30.47,1992:7.62,1993:10.08,1994:1.32,
    1995:37.58,1996:22.96,1997:33.36,1998:28.58,1999:21.04,
    2000:-9.10,2001:-11.89,2002:-22.10,2003:28.68,2004:10.88,
    2005:4.91,2006:15.79,2007:5.49,2008:-37.00,2009:26.46,
    2010:15.06,2011:2.11,2012:16.00,2013:32.39,2014:13.69,
    2015:1.38,2016:11.96,2017:21.83,2018:-4.38,2019:31.49,
    2020:18.40,2021:28.71,2022:-18.11,2023:26.29,2024:25.02,2025:17.88,
  },
};

// 关键周期年化复合收益率 CAGR（来源：Slickcharts，截至2025年）
const INDEX_CAGR = {
  nasdaq:{ "36年\n1990-2025":14.03, "15年\n2011-2025":17.60, "10年\n2016-2025":18.58, "5年\n2021-2025":14.40 },
  sp500: { "36年\n1990-2025":10.80, "15年\n2011-2025":14.07, "10年\n2016-2025":14.82, "5年\n2021-2025":14.43 },
};

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:"#f5f5f7", surface:"#ffffff", surfaceHover:"#f9f9fb",
  card:"#ffffff", border:"#e0e0e5", borderLight:"#ebebf0",
  text:"#1d1d1f", textMuted:"#3d3d42", textDim:"#6e6e73",
  accent:"#0071e3", accentDim:"#005bbf", accentBg:"#0071e308",
  green:"#1a9e4a", greenBg:"#1a9e4a0d",
  red:"#d93025",   redBg:"#d930250d",
  orange:"#c4570a", orangeBg:"#c4570a0d",
  purple:"#6e3de8", purpleBg:"#6e3de80d",
  cyan:"#0077a8",  cyanBg:"#0077a80d",
  bgAlt:"#f5f5f7",
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useCountUp(target, duration=900) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(()=>{
    const n = parseFloat(String(target).replace(/[^0-9.]/g,""))||0;
    const start = performance.now();
    cancelAnimationFrame(raf.current);
    const tick = now => {
      const t = Math.min((now-start)/duration,1);
      const ease = 1-Math.pow(1-t,3);
      setVal(+(n*ease).toFixed(1));
      if(t<1) raf.current=requestAnimationFrame(tick);
    };
    raf.current=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(raf.current);
  },[target]);
  return val;
}

function useScrollReveal(threshold=0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(()=>{
    const obs = new IntersectionObserver(([e])=>{
      if(e.isIntersecting){setVisible(true);obs.disconnect();}
    },{threshold});
    if(ref.current) obs.observe(ref.current);
    return ()=>obs.disconnect();
  },[]);
  return [ref, visible];
}

function useWindowWidth() {
  const [width, setWidth] = useState(typeof window!=="undefined"?window.innerWidth:1280);
  useEffect(()=>{
    const h=()=>setWidth(window.innerWidth);
    window.addEventListener("resize",h,{passive:true});
    return ()=>window.removeEventListener("resize",h);
  },[]);
  return width;
}

function useHover() {
  const [hovered, setHovered] = useState(false);
  return [hovered, {onMouseEnter:()=>setHovered(true), onMouseLeave:()=>setHovered(false)}];
}

// ─── Base Card with hover lift ─────────────────────────────────────────────────
function Card({children, style={}, className="", onClick}) {
  const [h,hProps] = useHover();
  return (
    <div {...hProps} onClick={onClick}
      className={`lift-card ${className}`}
      style={{
        background:C.card, border:`1px solid ${C.border}`, borderRadius:18,
        boxShadow: h?"0 12px 40px rgba(0,0,0,0.11)":"0 2px 16px rgba(0,0,0,0.06)",
        transform: h?"translateY(-4px)":"translateY(0)",
        transition:"box-shadow 0.28s ease, transform 0.28s ease, border-color 0.28s ease",
        borderColor: h ? C.borderLight : C.border,
        cursor: onClick?"pointer":"default",
        ...style,
      }}>
      {children}
    </div>
  );
}

// ─── Reveal wrapper ───────────────────────────────────────────────────────────
function Reveal({children, delay=0}) {
  const [ref,vis] = useScrollReveal();
  return (
    <div ref={ref} style={{
      opacity: vis?1:0,
      transform: vis?"translateY(0)":"translateY(22px)",
      transition:`opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({label,value,sub,color=C.accent,index=0}) {
  const numStr = String(value).replace(/[^0-9.]/g,"");
  const prefix = String(value).startsWith("+") ? "+" : "";
  const suffix = String(value).replace(/^[+\-]?[\d.]+/,"");
  const counted = useCountUp(numStr,900);
  const [h,hProps] = useHover();
  return (
    <div {...hProps} className="stat-card"
      style={{
        background:C.card, border:`1px solid ${h?C.borderLight:C.border}`,
        borderRadius:18, padding:"24px 28px", flex:1, minWidth:180,
        position:"relative", overflow:"hidden",
        boxShadow:h?"0 12px 40px rgba(0,0,0,0.10)":"0 2px 16px rgba(0,0,0,0.06)",
        transform:h?"translateY(-4px)":"translateY(0)",
        transition:"all 0.28s ease",
        animationDelay:`${index*0.08}s`,
      }}>
      <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:color+"08"}}/>
      <div style={{position:"absolute",bottom:0,left:0,height:2,width:h?"100%":"0%",background:`linear-gradient(90deg,${color},${color}60)`,transition:"width 0.4s ease",borderRadius:"0 0 0 18px"}}/>
      <div style={{fontSize:11,color:C.textDim,marginBottom:8,letterSpacing:0.8,textTransform:"uppercase",fontWeight:600}}>{label}</div>
      <div style={{fontSize:30,fontWeight:800,color,letterSpacing:-1}}>
        {prefix}{isNaN(parseFloat(numStr)) ? value : `${counted}${suffix}`}
      </div>
      {sub&&<div style={{fontSize:12,color:C.textMuted,marginTop:5}}>{sub}</div>}
    </div>
  );
}

// ─── SentimentCard ────────────────────────────────────────────────────────────
function SentimentCard({title, value, label, sub, color, barPct, index=0}) {
  const [h,hProps] = useHover();
  return (
    <div {...hProps} style={{
      background:C.card, border:`1px solid ${h?C.borderLight:C.border}`,
      borderRadius:18, padding:"20px 24px", flex:1, minWidth:200,
      position:"relative", overflow:"hidden",
      boxShadow:h?"0 12px 40px rgba(0,0,0,0.10)":"0 2px 16px rgba(0,0,0,0.06)",
      transform:h?"translateY(-4px)":"translateY(0)",
      transition:"all 0.28s ease",
      animationDelay:`${index*0.08}s`,
    }}>
      <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:color+"08"}}/>
      <div style={{position:"absolute",bottom:0,left:0,height:2,width:h?"100%":"0%",background:`linear-gradient(90deg,${color},${color}60)`,transition:"width 0.4s ease",borderRadius:"0 0 0 18px"}}/>
      <div style={{fontSize:11,color:C.textDim,marginBottom:8,letterSpacing:0.8,textTransform:"uppercase",fontWeight:600}}>{title}</div>
      <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:10}}>
        <div style={{fontSize:28,fontWeight:800,color,letterSpacing:-1}}>{value??'--'}</div>
        {label&&<div style={{fontSize:13,fontWeight:700,color,background:color+"18",padding:"2px 10px",borderRadius:20}}>{label}</div>}
      </div>
      {barPct!=null&&(
        <div style={{marginBottom:8}}>
          <div style={{height:5,background:C.borderLight,borderRadius:3,overflow:"hidden",position:"relative"}}>
            <div style={{position:"absolute",left:0,top:0,height:"100%",borderRadius:3,width:`${Math.min(Math.max(barPct,0),100)}%`,background:`linear-gradient(90deg,${C.green},${C.orange} 50%,${C.red})`,transition:"width 0.8s ease"}}/>
            <div style={{position:"absolute",top:-2,height:9,width:3,borderRadius:2,background:color,left:`calc(${Math.min(Math.max(barPct,0),100)}% - 1.5px)`,transition:"left 0.8s ease",boxShadow:`0 0 6px ${color}`}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:10,color:C.textDim}}>
            <span>0</span><span>50</span><span>100</span>
          </div>
        </div>
      )}
      {sub&&<div style={{fontSize:12,color:C.textMuted,marginTop:2}}>{sub}</div>}
    </div>
  );
}

// ─── 美国地标 SVG 剪影（卡片背景装饰）────────────────────────────────────────
/* 自由女神像剪影 —— 用于标普500卡片 */
const StatueOfLiberty = ({color}) => (
  <svg viewBox="0 0 130 240" width="104" height="192" style={{display:"block"}} fill={color}>
    <defs>
      <linearGradient id="sol-fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="1"/>
        <stop offset="100%" stopColor={color} stopOpacity="0.7"/>
      </linearGradient>
    </defs>
    {/* 火焰 */}
    <path d="M95 22 C92 16 90 10 93 4 C95 0 97 0 99 4 C101 0 103 0 105 4 C108 10 106 16 103 22 C102 18 101 14 99 12 C97 14 96 18 95 22 Z" fill="url(#sol-fade)"/>
    {/* 火炬杆 */}
    <path d="M96 22 C94 24 93 28 94 32 L97 32 L97 40 L101 40 L101 32 L104 32 C105 28 104 24 102 22 Z"/>
    {/* 举右臂 */}
    <path d="M99 38 C96 42 90 50 82 58 C78 62 74 62 72 58 C74 52 82 44 90 38 Z"/>
    {/* 右臂连肩 */}
    <path d="M74 60 C70 66 68 72 70 78 L78 76 C76 70 78 64 82 60 Z"/>
    {/* 王冠 */}
    <path d="M34 82 L38 66 L42 80 L46 62 L50 78 L54 62 L58 78 L62 64 L66 80 L70 66 L74 82 Z"/>
    {/* 头部 */}
    <ellipse cx="54" cy="94" rx="17" ry="19"/>
    {/* 脖颈 */}
    <path d="M48 112 C48 114 50 116 54 116 C58 116 60 114 60 112 L58 108 L50 108 Z"/>
    {/* 右肩斗篷 */}
    <path d="M60 112 C68 108 76 102 80 92 C82 86 80 80 76 80 C74 86 72 96 66 106 Z"/>
    {/* 主体长袍（流畅曲线） */}
    <path d="M34 116 C28 138 22 162 18 188 C16 202 16 214 18 224 L90 224 C92 214 92 202 90 188 C86 162 80 138 74 116 C66 112 56 110 48 112 C42 112 38 114 34 116 Z"/>
    {/* 左臂 + 石板 */}
    <path d="M34 116 C28 112 20 112 14 118 C10 124 12 134 20 136 L32 130 Z"/>
    <path d="M6 108 C4 108 2 110 2 114 L2 130 C2 134 4 136 8 136 L24 136 C28 136 30 134 30 130 L30 114 C30 110 28 108 24 108 Z" opacity="0.9"/>
    {/* 底座 */}
    <path d="M14 224 C12 226 10 228 10 232 L110 232 C110 228 108 226 106 224 Z"/>
    <rect x="6" y="232" width="108" height="8" rx="2"/>
  </svg>
);

/* 国会大厦剪影 —— 用于纳斯达克100卡片 */
const CapitolBuilding = ({color}) => (
  <svg viewBox="0 0 300 178" width="272" height="162" style={{display:"block"}} fill={color}>
    {/* 地基 */}
    <rect x="0" y="170" width="300" height="8" rx="2"/>
    <rect x="8" y="162" width="284" height="8" rx="1"/>
    <rect x="22" y="155" width="256" height="7"/>
    {/* 左翼 */}
    <path d="M22 155 L22 120 C22 116 26 114 30 114 L96 114 L96 120 L30 120 L30 155 Z"/>
    {/* 右翼 */}
    <path d="M204 114 L270 114 C274 114 278 116 278 120 L278 155 L272 155 L272 120 L204 120 Z"/>
    {/* 主楼 */}
    <rect x="90" y="110" width="120" height="45"/>
    {/* 柱廊（主楼用渐变暗示列柱，不用矩形） */}
    <path d="M96 110 L96 155 M103 110 L103 155 M110 110 L110 155 M117 110 L117 155 M124 110 L124 155 M131 110 L131 155 M138 110 L138 155 M145 110 L145 155 M152 110 L152 155 M159 110 L159 155 M166 110 L166 155 M173 110 L173 155 M180 110 L180 155 M187 110 L187 155 M194 110 L194 155 M201 110 L201 155 M208 110 L208 155"
      stroke={color} strokeWidth="3" strokeOpacity="0.45" fill="none"/>
    {/* 左翼柱廊 */}
    <path d="M30 120 L30 155 M37 120 L37 155 M44 120 L44 155 M51 120 L51 155 M58 120 L58 155 M65 120 L65 155 M72 120 L72 155 M79 120 L79 155 M86 120 L86 155 M93 120 L93 155"
      stroke={color} strokeWidth="2.5" strokeOpacity="0.4" fill="none"/>
    {/* 右翼柱廊 */}
    <path d="M207 120 L207 155 M214 120 L214 155 M221 120 L221 155 M228 120 L228 155 M235 120 L235 155 M242 120 L242 155 M249 120 L249 155 M256 120 L256 155 M263 120 L263 155 M270 120 L270 155"
      stroke={color} strokeWidth="2.5" strokeOpacity="0.4" fill="none"/>
    {/* 山花（三角楣） */}
    <path d="M90 110 L150 96 L210 110 Z"/>
    {/* 圆顶鼓座 */}
    <rect x="124" y="88" width="52" height="14"/>
    {/* 鼓座小柱 */}
    <path d="M128 88 L128 102 M133 88 L133 102 M138 88 L138 102 M143 88 L143 102 M148 88 L148 102 M153 88 L153 102 M158 88 L158 102 M163 88 L163 102 M168 88 L168 102"
      stroke={color} strokeWidth="2" strokeOpacity="0.5" fill="none"/>
    {/* 圆顶主体（平滑贝塞尔） */}
    <path d="M124 88 C124 58 134 38 150 32 C166 38 176 58 176 88 Z"/>
    {/* 圆顶腰线装饰 */}
    <path d="M130 72 C132 62 138 54 150 50 C162 54 168 62 170 72 Z" opacity="0.5"/>
    {/* 灯笼 */}
    <rect x="143" y="24" width="14" height="10" rx="3"/>
    <rect x="146" y="16" width="8" height="10" rx="2"/>
    {/* 旗杆 + 旗 */}
    <rect x="149" y="2" width="2.5" height="16"/>
    <path d="M151.5 3 L163 8 L151.5 13 Z"/>
  </svg>
);

function ReturnTag({label, value, color}) {
  if (value==null) return null;
  const c = value>=0 ? C.green : C.red;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"6px 14px",borderRadius:12,background:c+"12",border:`1px solid ${c}22`}}>
      <div style={{fontSize:10,color:C.textDim,fontWeight:500,whiteSpace:"nowrap"}}>{label}</div>
      <div style={{fontSize:13,fontWeight:700,color:c}}>{value>=0?"+":""}{value}%</div>
    </div>
  );
}

function IndexPriceCard({title, ticker, price, changePct, returns={}, color, index=0}) {
  const [h,hProps] = useHover();
  const fmt = v => v==null ? '--' : v.toLocaleString('en-US', {maximumFractionDigits:2});
  const chgColor = changePct==null ? C.textDim : changePct>=0 ? C.green : C.red;
  const isNasdaq = index === 0;
  return (
    <div {...hProps} style={{
      background:C.card, border:`1px solid ${h?C.borderLight:C.border}`,
      borderRadius:18, padding:"22px 28px", flex:1,
      position:"relative", overflow:"hidden",
      boxShadow:h?"0 12px 40px rgba(0,0,0,0.10)":"0 2px 16px rgba(0,0,0,0.06)",
      transform:h?"translateY(-2px)":"translateY(0)",
      transition:"all 0.28s ease",
      animationDelay:`${index*0.08}s`,
    }}>
      {/* 背景地标剪影 */}
      <div style={{
        position:"absolute",
        bottom: isNasdaq ? -6 : -10,
        right: isNasdaq ? 0 : -2,
        opacity: h ? 0.20 : 0.10,
        transition:"opacity 0.35s ease",
        pointerEvents:"none",
        filter:`blur(0.6px) saturate(0.2) brightness(0.55)`,
      }}>
        {isNasdaq
          ? <CapitolBuilding color={color}/>
          : <StatueOfLiberty color={color}/>
        }
      </div>
      {/* 渐变遮罩：右边保留，左边自然淡出 */}
      <div style={{
        position:"absolute", top:0, left:0, bottom:0, right:0,
        background:`linear-gradient(to right, ${C.card} 0%, ${C.card} 28%, transparent 62%)`,
        pointerEvents:"none",
      }}/>
      <div style={{position:"absolute",bottom:0,left:0,height:2,width:h?"100%":"0%",background:`linear-gradient(90deg,${color},${color}60)`,transition:"width 0.4s ease",borderRadius:"0 0 0 18px"}}/>

      {/* 内容层 */}
      <div style={{position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:13,color:C.textMuted,fontWeight:600}}>{title}</div>
            <div style={{fontSize:11,color:C.textDim,fontWeight:400}}>{ticker}</div>
          </div>
          {changePct!=null&&(
            <div style={{fontSize:12,fontWeight:700,color:chgColor,background:chgColor+"15",padding:"3px 10px",borderRadius:20}}>
              今日 {changePct>=0?"+":""}{changePct}%
            </div>
          )}
        </div>
        <div style={{fontSize:34,fontWeight:800,color,letterSpacing:-1,marginBottom:16}}>{price==null?'--':fmt(price)}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <ReturnTag label="近1年" value={returns.yr1}/>
          <ReturnTag label="近半年" value={returns.mo6}/>
          <ReturnTag label="近1月" value={returns.mo1}/>
          <ReturnTag label="近15日" value={returns.d15}/>
        </div>
      </div>
    </div>
  );
}

// ─── 市场 AI 解读（DeepSeek API）─────────────────────────────────────────────
const LEVEL_COLOR = {bullish: C.green, bearish: C.red, neutral: C.orange};

function MarketAISummary({aiInsight, aiLoading, ndx, spx}) {
  const insights = aiInsight?.insights;
  const generatedAt = aiInsight?.generated_at;

  // 没有 API Key 时的降级规则文案
  const fallbackInsights = useMemo(() => {
    if (!ndx || !spx) return [];
    const p = (v, s="") => v==null ? '--' : `${v>=0?'+':''}${v}${s}`;
    const out = [];
    const ndxStreak = ndx.streak || 0;
    const spxStreak = spx.streak || 0;
    const ndxAtHigh = (ndx.pct_from_high||0) >= -0.5;
    const spxAtHigh = (spx.pct_from_high||0) >= -0.5;
    if (ndxAtHigh && spxAtHigh)
      out.push({icon:"🚀",tag:"双指数创年内新高",level:"bullish",text:`纳指100（${ndx.price?.toLocaleString('en-US')}）与标普500（${spx.price?.toLocaleString('en-US')}）均触及近一年高位，多头格局强势。`});
    if (ndxStreak >= 7)
      out.push({icon:"🔥",tag:`纳指连涨${ndxStreak}天`,level:"bullish",text:`纳指100已连续 ${ndxStreak} 个交易日收涨，历史上10连涨以上概率不足3%，为罕见逼空行情，15日累计 ${p(ndx.returns?.d15,'%')}。`});
    else if (ndxStreak >= 3)
      out.push({icon:"📈",tag:`纳指连涨${ndxStreak}天`,level:"bullish",text:`纳指100连续 ${ndxStreak} 日上涨，短期动能强劲，15日涨幅 ${p(ndx.returns?.d15,'%')}。`});
    if ((ndx.returns?.yr1||0) > 35)
      out.push({icon:"⚡",tag:"年度回报罕见",level:"bullish",text:`纳指100近一年涨 ${p(ndx.returns?.yr1,'%')}，远超历史均值（约+15%），科技股溢价明显；标普500同期 ${p(spx.returns?.yr1,'%')}。`});
    if (spxStreak >= 5)
      out.push({icon:"💪",tag:`标普连涨${spxStreak}天`,level:"bullish",text:`标普500同步连涨 ${spxStreak} 天，近15日 ${p(spx.returns?.d15,'%')}，大盘走强信号明确。`});
    return out.slice(0,2);
  }, [ndx, spx]);

  const items = insights?.length ? insights : fallbackInsights;
  const isAI = !!(insights?.length);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10,height:"100%"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text}}>市场解读</div>
        <div style={{fontSize:10,color: isAI ? C.green : C.textDim,
          background: isAI ? C.green+"15" : C.bgAlt,
          border: isAI ? `1px solid ${C.green}30` : "none",
          padding:"2px 8px",borderRadius:10}}>
          {isAI ? "DeepSeek AI" : "规则引擎"}
        </div>
        {aiLoading && <div style={{fontSize:10,color:C.textDim}}>AI 分析中…</div>}
      </div>
      {items.length === 0 ? (
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:C.textDim}}>
          {aiLoading ? "正在调用 DeepSeek 生成分析…" : "数据加载中…"}
        </div>
      ) : items.slice(0,2).map((item, i) => {
        const color = LEVEL_COLOR[item.level] || C.textMuted;
        return (
          <div key={i} style={{
            padding:"11px 14px", borderRadius:12, flex:1,
            background: color+"0a", border:`1px solid ${color}20`,
          }}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
              <span style={{fontSize:13}}>{item.icon}</span>
              <span style={{fontSize:11,fontWeight:700,color,background:color+"18",padding:"1px 8px",borderRadius:8}}>{item.tag}</span>
            </div>
            <div style={{fontSize:12,color:C.textMuted,lineHeight:1.75}}>{item.text}</div>
          </div>
        );
      })}
      <div style={{fontSize:10,color:C.textDim,paddingTop:4}}>
        {isAI && generatedAt ? `DeepSeek · ${generatedAt}` : "数据来源：Yahoo Finance"}
      </div>
    </div>
  );
}

function IndexPriceRow({sentiment, aiInsight, aiLoading, isMobile}) {
  const ndx = sentiment?.ndx_price;
  const spx = sentiment?.spx_price;
  const round2 = v => Math.round(v * 100) / 100;
  const fmtNum = v => v==null ? '--' : v.toLocaleString('en-US',{maximumFractionDigits:2});

  // 合并图表数据
  const buildPct = (history=[]) => {
    if (history.length < 2) return {};
    const base = history[0].close;
    const map = {};
    history.forEach(d => { map[d.date] = {close: d.close, pct: base ? round2((d.close-base)/base*100) : 0}; });
    return map;
  };
  const ndxMap = buildPct(ndx?.history);
  const spxMap = buildPct(spx?.history);
  const allDates = [...new Set([...Object.keys(ndxMap), ...Object.keys(spxMap)])].sort();
  const merged = allDates.map(date => ({
    date,
    ndx: ndxMap[date]?.pct ?? null,
    ndxClose: ndxMap[date]?.close,
    spx: spxMap[date]?.pct ?? null,
    spxClose: spxMap[date]?.close,
  }));
  const hasData = merged.length > 1;

  return (
    <div style={{marginBottom: isMobile?16:24}}>
      {/* 顶部数据卡 */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:isMobile?10:16,marginBottom:isMobile?10:16}}>
        <IndexPriceCard title="纳斯达克100" ticker="^NDX" price={ndx?.price} changePct={ndx?.change_pct} returns={ndx?.returns||{}} color={C.accent} index={0}/>
        <IndexPriceCard title="标普500" ticker="^GSPC" price={spx?.price} changePct={spx?.change_pct} returns={spx?.returns||{}} color={C.cyan} index={1}/>
      </div>

      {/* 图表 + AI解读 */}
      <Card style={{padding:"16px 20px"}}>
        <div style={{display:"grid", gridTemplateColumns: isMobile ? "1fr" : "3fr 2fr", gap: 0, alignItems: "stretch"}}>
          {/* 左：走势图 */}
          <div style={{paddingRight: isMobile?0:24, display:"flex", flexDirection:"column", minHeight:0}}>
            <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:2}}>近15日走势对比</div>
            <div style={{fontSize:10,color:C.textDim,marginBottom:8}}>以区间首日为基准 · 累计涨幅（%）</div>
            {hasData ? (
              <div style={{flex:1, minHeight:130}}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={merged} margin={{top:2,right:4,left:-20,bottom:0}}>
                  <defs>
                    <linearGradient id="ndx-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.accent} stopOpacity={0.18}/>
                      <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="spx-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.orange} stopOpacity={0.18}/>
                      <stop offset="95%" stopColor={C.orange} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke={C.borderLight} vertical={false}/>
                  <XAxis dataKey="date" tick={{fill:C.textDim,fontSize:9}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
                  <YAxis tick={{fill:C.textDim,fontSize:9}} axisLine={false} tickLine={false} unit="%" tickFormatter={v=>`${v>0?"+":""}${v}`}/>
                  <ReferenceLine y={0} stroke={C.border} strokeDasharray="3 3"/>
                  <Tooltip content={({active,payload,label})=>active&&payload?.length?(
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 12px",fontSize:11,minWidth:160}}>
                      <div style={{color:C.textDim,marginBottom:4,fontWeight:600}}>{label}</div>
                      {payload.filter(p=>p.value!=null).map(p=>(
                        <div key={p.dataKey} style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:p.color,flexShrink:0}}/>
                          <span style={{color:C.textMuted,flex:1}}>{p.dataKey==='ndx'?'纳指100':'标普500'}</span>
                          <span style={{color:p.color,fontWeight:700}}>{p.value>=0?"+":""}{p.value}%</span>
                        </div>
                      ))}
                    </div>
                  ):null}/>
                  <Area type="monotone" dataKey="ndx" name="纳指100" stroke={C.accent} strokeWidth={1.5} fill="url(#ndx-grad)" dot={false} activeDot={{r:3,fill:C.accent}} connectNulls/>
                  <Area type="monotone" dataKey="spx" name="标普500" stroke={C.orange} strokeWidth={1.5} fill="url(#spx-grad)" dot={false} activeDot={{r:3,fill:C.orange}} connectNulls/>
                  <Legend wrapperStyle={{fontSize:10,paddingTop:4}}/>
                </AreaChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div style={{flex:1,minHeight:130,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:C.textDim}}>数据加载中…</div>
            )}
          </div>

          {/* 右：AI解读（左边框分隔） */}
          <div style={{borderLeft: isMobile?'none':`1px solid ${C.borderLight}`, paddingLeft: isMobile?0:24, paddingTop: isMobile?12:0}}>
            <MarketAISummary aiInsight={aiInsight} aiLoading={aiLoading} ndx={ndx} spx={spx}/>
          </div>
        </div>
      </Card>
    </div>
  );
}

function MarketSentimentRow({sentiment, isMobile}) {
  const vix = sentiment?.vix;
  const fg  = sentiment?.fear_greed;
  const pe  = sentiment?.pe;
  const vixColor = !vix ? C.textDim : vix.value>=40 ? C.red : vix.value>=30 ? "#ff6b35" : vix.value>=20 ? C.orange : C.green;
  const vixLabel = !vix ? '--' : vix.value>=40 ? '极度恐慌' : vix.value>=30 ? '高度恐慌' : vix.value>=20 ? '市场警惕' : vix.value>=12 ? '相对平静' : '极度平静';
  const vixChg = vix?.change_pct;
  const vixSub = vix ? `CBOE官方 · ${vixChg!=null?(vixChg>=0?'+':'')+vixChg+'%':''} 今日` : '数据加载中…';
  const fgScore = fg?.score;
  const fgColor = fgScore==null ? C.textDim : fgScore<=25 ? C.red : fgScore<=45 ? C.orange : fgScore<=55 ? C.textMuted : fgScore<=75 ? C.green : "#1a9e4a";
  const fgLabelMap = {'extreme fear':'极度恐慌','fear':'恐慌','neutral':'中性','greed':'贪婪','extreme greed':'极度贪婪'};
  const fgLabel = fg ? (fgLabelMap[(fg.rating||'').toLowerCase()]||fg.rating) : '--';
  const fgSub = fg?.previous_close!=null ? `昨收 ${fg.previous_close} · 上周 ${fg.previous_1_week??'--'}` : '数据加载中…';
  const peColor = !pe ? C.textDim : pe.percentile>=85 ? C.red : pe.percentile>=70 ? C.orange : pe.percentile>=45 ? C.textMuted : C.green;
  const peLabel = !pe ? '--' : pe.percentile>=85 ? '高估' : pe.percentile>=70 ? '偏高' : pe.percentile>=45 ? '合理' : '低估';
  const peSub = pe ? `历史${pe.percentile}%分位 · 来源 multpl.com` : '数据加载中…';
  const nqPe = sentiment?.nasdaq_pe;
  const nqPeColor = !nqPe ? C.textDim : nqPe.percentile>=85 ? C.red : nqPe.percentile>=70 ? C.orange : nqPe.percentile>=45 ? C.textMuted : C.green;
  const nqPeLabel = !nqPe ? '--' : nqPe.percentile>=85 ? '高估' : nqPe.percentile>=70 ? '偏高' : nqPe.percentile>=45 ? '合理' : '低估';
  const nqPeSub = nqPe ? `历史${nqPe.percentile}%分位 · 来源 gurufocus.com` : '数据加载中…';
  return (
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",gap:isMobile?10:16,marginBottom:isMobile?20:28}}>
      <SentimentCard title="VIX 恐慌指数" value={vix?vix.value:'--'} label={vixLabel} color={vixColor} barPct={vix?Math.min(vix.value/60*100,100):null} sub={vixSub} index={0}/>
      <SentimentCard title="CNN 恐慌贪婪指数" value={fgScore!=null?fgScore:'--'} label={fgLabel} color={fgColor} barPct={fgScore!=null?fgScore:null} sub={fgSub} index={1}/>
      <SentimentCard title="标普500 PE分位" value={pe?`${pe.pe}x`:'--'} label={peLabel} color={peColor} barPct={pe?pe.percentile:null} sub={peSub} index={2}/>
      <SentimentCard title="纳斯达克100 PE分位" value={nqPe?`${nqPe.pe}x`:'--'} label={nqPeLabel} color={nqPeColor} barPct={nqPe?nqPe.percentile:null} sub={nqPeSub} index={3}/>
    </div>
  );
}

// ─── 历史PE参考数据（静态） ────────────────────────────────────────────────────
// 标普500
// 标普500（恢复时长 = 从最高点下跌后重回该最高点所用时间）
const PE_HIST_REFS_SP = [
  {period:"2000年 科网泡沫顶部",  pe:"~44x", note:"互联网泡沫极值",    next1y:"-9%",  maxDD:"-49%", ddColor:C.red,      recovery:"约7年"},   // 2000-03峰→2007-05回
  {period:"2007年 金融危机前夕",  pe:"~25x", note:"次贷危机爆发前",    next1y:"-37%", maxDD:"-56%", ddColor:C.red,      recovery:"约5年"},   // 2007-10峰→2013-03回
  {period:"2018年底 加息冲击",    pe:"~22x", note:"美联储激进加息",    next1y:"+22%", maxDD:"-20%", ddColor:"#ff6b35",  recovery:"约7个月"}, // 2018-09峰→2019-04回
  {period:"2021年末 流动性退潮",  pe:"~28x", note:"通胀+缩表预期",    next1y:"-19%", maxDD:"-27%", ddColor:C.red,      recovery:"约2年"},   // 2022-01峰→2024-01回
  {period:"当前 (2026)",          pe:null,   note:"AI热潮+高利率环境", next1y:"?",    maxDD:"?",    ddColor:C.textDim,  recovery:"?", isCurrent:true},
];
// 纳指100（恢复时长 = 从最高点下跌后重回该最高点所用时间）
const PE_HIST_REFS_NQ = [
  {period:"2000年 科网泡沫顶部",  pe:"~102x", note:"互联网极端泡沫",   next1y:"-36%", maxDD:"-83%", ddColor:C.red,      recovery:"约15年"},  // 2000-03峰→2015-10回
  {period:"2007年 金融危机前夕",  pe:"~24x",  note:"次贷危机蔓延",     next1y:"-40%", maxDD:"-54%", ddColor:C.red,      recovery:"约3年半"}, // 2007-10峰→2011-03回
  {period:"2018年底 加息冲击",    pe:"~23x",  note:"美联储激进加息",   next1y:"+30%", maxDD:"-24%", ddColor:"#ff6b35",  recovery:"约6个月"}, // 2018-10峰→2019-04回
  {period:"2021年末 流动性退潮",  pe:"~38x",  note:"通胀+缩表预期",   next1y:"-33%", maxDD:"-35%", ddColor:C.red,      recovery:"约20个月"},// 2021-11峰→2023-07回
  {period:"当前 (2026)",          pe:null,    note:"AI热潮+高利率环境", next1y:"?",    maxDD:"?",    ddColor:C.textDim,  recovery:"?", isCurrent:true},
];

// ─── 标普500 + 纳指100 历史PE走势图 ──────────────────────────────────────────
const PE_RANGES = ["5Y","10Y","全部"];

function PEHistoryChart({peHistory, currentPE, currentNQPE, isMobile}) {
  const [range, setRange] = useState("10Y");

  const sp500Data   = peHistory?.sp500    || [];
  const nasdaqData  = peHistory?.nasdaq100 || [];

  // 合并两条数据为 recharts 格式 {date, sp500, nasdaq}
  const merged = useMemo(() => {
    const map = {};
    sp500Data.forEach(d  => { map[d.date] = {date:d.date, sp500:d.pe}; });
    nasdaqData.forEach(d => {
      if (map[d.date]) map[d.date].nasdaq = d.pe;
      else map[d.date] = {date:d.date, nasdaq:d.pe};
    });
    return Object.values(map).sort((a,b)=>a.date<b.date?-1:1);
  }, [sp500Data, nasdaqData]);

  // 按时间范围过滤
  const filtered = useMemo(() => {
    if (!merged.length) return [];
    const now = new Date();
    const yr  = now.getFullYear();
    const mo  = String(now.getMonth()+1).padStart(2,"0");
    const cutoff = range==="5Y"  ? `${yr-5}-${mo}`
                 : range==="10Y" ? `${yr-10}-${mo}`
                 : "1990-01";
    const raw = merged.filter(d=>d.date>=cutoff);
    // 全部视图：按季度聚合（月均值→季代表点），避免点过密
    if (range==="全部" && raw.length>120) {
      const qMap = {};
      raw.forEach(d=>{
        const [y,m] = d.date.split("-").map(Number);
        const key = `${y}-Q${Math.ceil(m/3)}`;
        if (!qMap[key]) qMap[key] = {date:d.date, sp500s:[], nasdaqs:[]};
        if (d.sp500  != null) qMap[key].sp500s.push(d.sp500);
        if (d.nasdaq != null) qMap[key].nasdaqs.push(d.nasdaq);
      });
      return Object.values(qMap).map(q=>({
        date:    q.date,
        sp500:   q.sp500s.length  ? +(q.sp500s.reduce((a,b)=>a+b,0)/q.sp500s.length).toFixed(1)   : null,
        nasdaq:  q.nasdaqs.length ? +(q.nasdaqs.reduce((a,b)=>a+b,0)/q.nasdaqs.length).toFixed(1) : null,
      })).sort((a,b)=>a.date<b.date?-1:1);
    }
    return raw;
  }, [merged, range]);

  // X 轴刻度：仅保留整年首月，步长按范围控制
  const xTicks = useMemo(() => {
    const step = range==="5Y"?1 : range==="10Y"?2 : 5;
    const seen = new Set();
    const ticks = [];
    filtered.forEach(d=>{
      const yr = parseInt(d.date.slice(0,4));
      if (yr%step===0 && !seen.has(yr)) { seen.add(yr); ticks.push(d.date); }
    });
    return ticks;
  }, [filtered, range]);

  const PETooltip = ({active, payload, label}) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,
        padding:"10px 14px",fontSize:12,boxShadow:"0 4px 20px rgba(0,0,0,0.1)",minWidth:140}}>
        <div style={{color:C.textDim,marginBottom:6}}>{label}</div>
        {payload.map(p=>(
          <div key={p.dataKey} style={{display:"flex",justifyContent:"space-between",gap:16,marginBottom:3}}>
            <span style={{color:p.color,fontWeight:600}}>{p.name}</span>
            <span style={{fontWeight:800,color:p.color}}>{p.value}x</span>
          </div>
        ))}
      </div>
    );
  };

  const hasData = filtered.length > 0;

  return (
    <Card style={{padding:isMobile?"20px 18px":"24px 28px", marginBottom:isMobile?20:28}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4,flexWrap:"wrap"}}>
        <div style={{fontSize:14,fontWeight:700,color:C.text}}>标普500 vs 纳指100 · PE历史走势</div>
        <div style={{fontSize:11,color:C.textDim,flexShrink:0}}>1990年至今 · 月度数据</div>
        {/* 时间范围切换 */}
        <div style={{marginLeft:"auto",display:"flex",gap:4}}>
          {PE_RANGES.map(r=>(
            <button key={r} onClick={()=>setRange(r)} style={{
              padding:"3px 12px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",
              border:`1px solid ${range===r?C.accent:C.border}`,
              background:range===r?C.accent:"transparent",
              color:range===r?"#fff":C.textDim,
              transition:"all 0.18s"
            }}>{r}</button>
          ))}
        </div>
      </div>
      {/* 图例 + 当前值 */}
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:C.textMuted}}>
          <div style={{width:16,height:3,borderRadius:2,background:C.accent}}/> 标普500
          {currentPE&&<span style={{fontWeight:700,color:currentPE>=30?C.red:"#ff6b35",marginLeft:4}}>当前{currentPE}x</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:C.textMuted}}>
          <div style={{width:16,height:3,borderRadius:2,background:C.purple}}/> 纳指100
          {currentNQPE&&<span style={{fontWeight:700,color:currentNQPE>=30?C.red:"#ff6b35",marginLeft:4}}>当前{currentNQPE}x</span>}
        </div>
        <div style={{fontSize:11,color:C.textDim,marginLeft:"auto"}}>
          {range==="全部"?"季度均值":"月度数据"}
        </div>
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={isMobile?200:260}>
          <LineChart data={filtered} margin={{top:8,right:16,left:0,bottom:0}}>
            <defs>
              <linearGradient id="spGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor={C.accent} stopOpacity={0.15}/>
                <stop offset="100%" stopColor={C.accent} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke={C.borderLight} vertical={false}/>
            <XAxis dataKey="date" ticks={xTicks}
              tick={{fill:C.textDim,fontSize:10}} axisLine={false} tickLine={false}
              tickFormatter={v=>v.slice(0,4)} interval={0}/>
            <YAxis tick={{fill:C.textDim,fontSize:11}} axisLine={false} tickLine={false}
              tickFormatter={v=>`${v}x`} domain={[0,"auto"]} width={36}/>
            <Tooltip content={<PETooltip/>}/>
            {/* 关键参考线 */}
            <ReferenceLine y={25} stroke={C.green}  strokeDasharray="4 3" strokeWidth={1}
              label={{value:"25x",fill:C.green, fontSize:10,position:"insideTopLeft"}}/>
            <ReferenceLine y={30} stroke={C.orange} strokeDasharray="4 3" strokeWidth={1}
              label={{value:"30x",fill:C.orange,fontSize:10,position:"insideTopLeft"}}/>
            <ReferenceLine y={40} stroke={C.red}    strokeDasharray="4 3" strokeWidth={1}
              label={{value:"40x",fill:C.red,   fontSize:10,position:"insideTopLeft"}}/>
            {/* 数据线 */}
            <Line type="monotone" dataKey="sp500"  name="标普500"
              stroke={C.accent}  strokeWidth={1.8} dot={false}
              activeDot={{r:4,fill:C.accent}}  connectNulls/>
            <Line type="monotone" dataKey="nasdaq" name="纳指100"
              stroke={C.purple}  strokeWidth={1.8} dot={false}
              activeDot={{r:4,fill:C.purple}}  connectNulls/>
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center",color:C.textDim,fontSize:14}}>
          数据加载中…
        </div>
      )}
      <div style={{marginTop:10,fontSize:11,color:C.textDim}}>
        标普500来源：multpl.com 月度实际值（Trailing PE）· 纳指100：gurufocus.com 口径，2009年前数据为估算
      </div>
    </Card>
  );
}

// ─── 历史PE高位回调参考卡片 ───────────────────────────────────────────────────
function PEHistoryReference({pe, nqPe, isMobile}) {
  const [tab, setTab] = useState("sp500");
  const isSP   = tab === "sp500";
  const refs   = isSP ? PE_HIST_REFS_SP : PE_HIST_REFS_NQ;
  const curPE  = isSP ? pe : nqPe;
  const thPE   = isSP ? "标普PE" : "纳指PE";
  const accent = isSP ? C.accent : C.purple;

  return (
    <Card style={{padding:isMobile?"20px 18px":"24px 28px", marginBottom:isMobile?20:28}}>
      {/* Header + Tab */}
      <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:6, flexWrap:"wrap"}}>
        <div style={{fontSize:14, fontWeight:700, color:C.text}}>历史PE高位 → 后续表现</div>
        <div style={{fontSize:11, color:C.textDim, background:C.borderLight, padding:"2px 10px", borderRadius:20, flexShrink:0}}>仅供参考</div>
        <div style={{marginLeft:"auto", display:"flex", gap:4}}>
          {[["sp500","标普500"],["nasdaq","纳指100"]].map(([key,label])=>(
            <button key={key} onClick={()=>setTab(key)} style={{
              padding:"3px 12px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer",
              border:`1px solid ${tab===key?(isSP?C.accent:C.purple):C.border}`,
              background:tab===key?(isSP?C.accent:C.purple):"transparent",
              color:tab===key?"#fff":C.textDim, transition:"all 0.18s"
            }}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{fontSize:12, color:C.textDim, marginBottom:18}}>
        {isSP?"标普500":"纳指100"} PE处于高位后，历史上的实际表现
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%", borderCollapse:"collapse", fontSize:13}}>
          <thead>
            <tr style={{borderBottom:`2px solid ${C.border}`}}>
              {["时期", thPE, "背景", "后续1年", "最大回调", "恢复时长"].map(h=>(
                <th key={h} style={{padding:"8px 12px", textAlign:"left", fontSize:11, color:C.textDim, fontWeight:600, letterSpacing:0.5, whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {refs.map((row,i)=>(
              <tr key={i} style={{borderBottom:`1px solid ${C.borderLight}`, background:row.isCurrent?accent+"0a":"transparent"}}>
                <td style={{padding:"11px 12px", fontWeight:row.isCurrent?700:400, color:row.isCurrent?accent:C.text, whiteSpace:"nowrap"}}>{row.period}</td>
                <td style={{padding:"11px 12px", fontWeight:800, color:row.isCurrent?(curPE?.pe>=30?C.red:C.orange):i<2?C.red:"#ff6b35", whiteSpace:"nowrap"}}>
                  {row.isCurrent ? (curPE ? `${curPE.pe}x` : "--") : row.pe}
                </td>
                <td style={{padding:"11px 12px", color:C.textMuted, whiteSpace:"nowrap"}}>{row.note}</td>
                <td style={{padding:"11px 12px", fontWeight:700, color:row.next1y==="?"?C.textDim:row.next1y.startsWith("-")?C.red:C.green, whiteSpace:"nowrap"}}>{row.next1y}</td>
                <td style={{padding:"11px 12px", fontWeight:800, color:row.ddColor, whiteSpace:"nowrap"}}>{row.maxDD}</td>
                <td style={{padding:"11px 12px", fontWeight:600, color:row.recovery==="?"?C.textDim:C.textMuted, whiteSpace:"nowrap"}}>{row.recovery}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:14, fontSize:11, color:C.textDim, display:"flex", alignItems:"flex-start", gap:6}}>
        <span style={{color:C.orange, flexShrink:0}}>⚠</span>
        历史规律不能预测未来，高PE可维持数年。数据来源历史实际值，不构成投资建议。
      </div>
    </Card>
  );
}

// ─── 综合市场温度卡片 ─────────────────────────────────────────────────────────
function MarketTemperature({sentiment, isMobile}) {
  const pe   = sentiment?.pe;
  const nqPe = sentiment?.nasdaq_pe;
  const fg   = sentiment?.fear_greed;
  const vix  = sentiment?.vix;

  // 风险得分：正=风险高，负=恐慌/机会
  // 标普PE / 纳指PE 各 -1~+2，取平均作为 peAvg（-1~+2）
  // 恐慌贪婪 -2~+2，VIX -2~+1，合计范围约 -5~+5
  const spScore  = !pe   ? null : pe.percentile>=85?2   : pe.percentile>=70?1   : pe.percentile>=45?0 : -1;
  const nqScore  = nqPe?.percentile==null ? null : nqPe.percentile>=85?2 : nqPe.percentile>=70?1 : nqPe.percentile>=45?0 : -1;
  const fgScore  = fg?.score==null ? null : fg.score>=75?2 : fg.score>=55?1 : fg.score>=45?0 : fg.score>=25?-1 : -2;
  const vixScore = !vix  ? null : vix.value>=40?-2 : vix.value>=30?-1 : vix.value>=12?0 : 1;

  // 两个 PE 都有才用平均，只有一个就用那个
  const peAvg = spScore!==null && nqScore!==null ? (spScore+nqScore)/2
              : spScore!==null ? spScore : nqScore;

  const hasData = peAvg!==null && fgScore!==null && vixScore!==null;
  const total   = hasData ? Math.round(peAvg+fgScore+vixScore) : null;

  const signal = total===null ? null
    : total>=4 ? {label:"极度危险",   sub:"两大指数PE极端高估 + 情绪极度贪婪，历史上接近阶段顶部", color:C.red}
    : total>=2 ? {label:"偏高风险",   sub:"估值偏贵、情绪乐观，建议谨慎加仓",                    color:"#ff6b35"}
    : total>=0 ? {label:"中性偏谨慎", sub:"信号混合，维持正常仓位，注意止损",                    color:C.orange}
    : total>=-2? {label:"中性",       sub:"估值合理或恐慌情绪偏高，可正常操作",                  color:C.textMuted}
    :            {label:"潜在机会区", sub:"多项指标显示市场恐慌，历史上往往是左侧机会",            color:C.green};

  const barPct = total!==null ? Math.round((total+5)/10*100) : null;

  const scoreColor = s => s===null?C.textDim:s>=2?C.red:s>=1?"#ff6b35":s===0?C.textMuted:C.green;

  const indicators = [
    {name:"标普500 PE", score:spScore,
     desc:spScore===null?"--":spScore>=2?"极度高估":spScore>=1?"偏高":"合理/低估",
     detail:pe?`${pe.percentile}%分位 · ${pe.pe}x`:""},
    {name:"纳指100 PE", score:nqScore,
     desc:nqScore===null?"--":nqScore>=2?"极度高估":nqScore>=1?"偏高":"合理/低估",
     detail:nqPe?.pe!=null?`${nqPe.percentile}%分位 · ${nqPe.pe}x`:""},
    {name:"恐慌贪婪",   score:fgScore,
     desc:fgScore===null?"--":fgScore>=2?"极度贪婪":fgScore>=1?"贪婪":fgScore<=(-1)?"恐慌":"中性",
     detail:fg?.score!=null?`${fg.score}分`:""},
    {name:"VIX 波动",   score:vixScore,
     desc:vixScore===null?"--":vixScore<=(-2)?"极度恐慌":vixScore<=(-1)?"高度恐慌":vixScore>=1?"过度平静":"正常",
     detail:vix?`${vix.value}`:""},
  ];

  return (
    <Card style={{
      padding:isMobile?"20px 18px":"24px 28px",
      marginBottom:isMobile?20:28,
      display:"flex", flexDirection:"column",
    }}>
      {/* 标题行 */}
      <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:20, flexWrap:"wrap"}}>
        <div style={{fontSize:14, fontWeight:700, color:C.text}}>综合市场温度</div>
        <div style={{fontSize:11, color:C.textDim}}>标普/纳指PE分位 + 恐慌贪婪 + VIX 四因子合并信号</div>
      </div>

      {/* 上：信号标题居中 + 温度条 */}
      <div style={{textAlign:"center", marginBottom:20}}>
        {signal ? (
          <>
            <div style={{fontSize:30, fontWeight:800, color:signal.color, letterSpacing:-0.5, marginBottom:4}}>
              {signal.label}
            </div>
            <div style={{fontSize:12, color:C.textMuted, marginBottom:16, lineHeight:1.5}}>
              {signal.sub}
            </div>
            <div style={{height:8, background:C.borderLight, borderRadius:4, overflow:"visible", position:"relative", marginBottom:6}}>
              <div style={{position:"absolute", left:0, top:0, height:"100%", borderRadius:4,
                width:`${barPct??0}%`,
                background:"linear-gradient(90deg,#1a9e4a,#c4570a 50%,#d93025)",
                transition:"width 0.8s ease"}}/>
              {barPct!=null&&<div style={{position:"absolute", top:-2, height:12, width:4, borderRadius:2,
                background:signal.color, left:`calc(${barPct}% - 2px)`,
                transition:"left 0.8s ease", boxShadow:`0 0 8px ${signal.color}`}}/>}
            </div>
            <div style={{display:"flex", justifyContent:"space-between", fontSize:10, color:C.textDim}}>
              <span>机会区</span><span>中性</span><span>危险区</span>
            </div>
          </>
        ) : (
          <div style={{color:C.textDim, fontSize:14}}>数据加载中…</div>
        )}
      </div>

      {/* 下：四因子 2列网格，flex:1 撑满剩余高度 */}
      <div style={{
        flex:1,
        display:"grid",
        gridTemplateColumns:isMobile?"1fr":"1fr 1fr",
        gridTemplateRows:"1fr 1fr",
        gap:8,
      }}>
        {indicators.map(ind=>(
          <div key={ind.name} style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"10px 14px", background:C.bgAlt, borderRadius:10,
          }}>
            <div style={{fontSize:13, color:C.textMuted, fontWeight:500, flexShrink:0}}>{ind.name}</div>
            <div style={{display:"flex", alignItems:"center", gap:6}}>
              {ind.detail&&<span style={{fontSize:11, color:C.textDim}}>{ind.detail}</span>}
              <span style={{fontSize:13, fontWeight:700, color:scoreColor(ind.score)}}>{ind.desc}</span>
              <div style={{width:8, height:8, borderRadius:"50%", background:scoreColor(ind.score), flexShrink:0}}/>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Mini bar for table ───────────────────────────────────────────────────────
function MiniBar({value, max, color}) {
  const pct = Math.min(Math.abs(value)/max*100,100);
  return (
    <div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"flex-end"}}>
      <div style={{width:48,height:4,borderRadius:2,background:C.borderLight,overflow:"hidden",flexShrink:0}}>
        <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:2,transition:"width 0.6s ease"}}/>
      </div>
      <span style={{color,fontWeight:700,minWidth:52,textAlign:"right"}}>{value>0?"+":""}{value}%</span>
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────
const StatusBadge = ({status}) => {
  const ok = status==="open";
  const color = ok?C.green:C.red;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:ok?C.greenBg:C.redBg,color,border:`1px solid ${color}22`}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:color,animation:ok?"statusPulse 2s infinite":"none"}}/>
      {ok?"开放":"暂停"}
    </span>
  );
};

function PremiumBadge({value}) {
  const danger = value>3, high = value>2, mid = value>1;
  const color = danger?C.red:high?"#ff6b35":mid?C.orange:C.green;
  const bg    = danger?C.redBg:high?"#ff6b3512":mid?C.orangeBg:C.greenBg;
  const label = danger?"极高":high?"偏高":mid?"注意":"正常";
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:700,background:bg,color,border:`1px solid ${color}30`,animation:danger?"premiumAlert 1.8s ease infinite":"none"}}>
      {value>0?"+":""}{value}% <span style={{fontSize:10,opacity:0.8}}>{label}</span>
    </span>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({title,subtitle,count,color=C.accent,timestamp,sortable}) {
  return (
    <div style={{marginBottom:24}}>
      <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",minWidth:0}}>
        <div style={{width:3,height:20,borderRadius:2,background:`linear-gradient(180deg,${color},${color}60)`,flexShrink:0}}/>
        <h2 style={{fontSize:20,fontWeight:800,color:C.text,margin:0,letterSpacing:-0.4,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</h2>
        {count!=null&&<span style={{background:color+"18",color,padding:"2px 10px",borderRadius:20,fontSize:12,fontWeight:700,flexShrink:0}}>{count}只</span>}
        {timestamp&&<span style={{fontSize:11,color:C.textDim,flexShrink:0}}>行情更新：{timestamp}</span>}
      </div>
      {(subtitle||sortable)&&(
        <p style={{fontSize:13,color:C.textDim,margin:"7px 0 0 15px",display:"flex",alignItems:"center",gap:8}}>
          {subtitle}
          {sortable&&<span style={{color:C.textDim}}>· 如何排序：点击列标题，再次点击切换升序／降序</span>}
        </p>
      )}
    </div>
  );
}

// ─── ColTip ───────────────────────────────────────────────────────────────────
function ColTip({tip,label}) {
  const [pos,setPos] = useState(null);
  const ref = useRef(null);
  useEffect(()=>{
    if(!pos) return;
    const handler=(e)=>{ if(ref.current&&!ref.current.contains(e.target)) setPos(null); };
    document.addEventListener("mousedown",handler);
    return()=>document.removeEventListener("mousedown",handler);
  },[pos]);
  const show = !!pos;
  const toggle = e => {
    e.stopPropagation();
    if(pos){setPos(null);return;}
    const r = ref.current.getBoundingClientRect();
    setPos({top: r.bottom+6, left: r.left});
  };
  return (
    <span ref={ref} style={{position:"relative",display:"inline-flex"}}
      onClick={toggle}>
      {label
        ? <span style={{fontSize:10,color:show?C.accent:C.textDim,fontWeight:600,cursor:"pointer",letterSpacing:0.3,transition:"color 0.15s",textTransform:"none",borderBottom:`1px dashed ${show?C.accent:C.textDim}`}}>{label}</span>
        : <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:14,height:14,borderRadius:"50%",background:show?C.accent:C.borderLight,color:show?"#fff":C.textDim,fontSize:9,fontWeight:700,cursor:"pointer",flexShrink:0,transition:"background 0.15s"}}>?</span>
      }
      {pos&&<div style={{position:"fixed",top:pos.top,left:pos.left,background:"#1a1a2e",color:"#e8e8f0",fontSize:12,lineHeight:1.6,padding:"8px 12px",borderRadius:8,whiteSpace:"normal",width:200,zIndex:9999,boxShadow:"0 4px 20px rgba(0,0,0,0.25)",pointerEvents:"none"}}>
        {tip}
      </div>}
    </span>
  );
}

// ─── Data Table ───────────────────────────────────────────────────────────────
function DataTable({columns,data,sortKey,sortDir,onSort}) {
  return (
    <div style={{overflowX:"auto",borderRadius:14,border:`1px solid ${C.border}`,background:C.card,boxShadow:"0 2px 16px rgba(0,0,0,0.06)"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead>
          <tr>
            {columns.map((col)=>(
              <th key={col.key} onClick={()=>col.sortable!==false&&onSort?.(col.key)}
                style={{padding:"10px 10px",textAlign:col.align||"left",color:sortKey===col.key?C.accent:C.textDim,fontWeight:600,fontSize:11,letterSpacing:0.6,textTransform:"uppercase",whiteSpace:"nowrap",borderBottom:`1px solid ${C.border}`,background:"#fafafa",cursor:col.sortable!==false?"pointer":"default",userSelect:"none",position:"sticky",top:0,zIndex:1,transition:"color 0.15s"}}>
                <span style={{display:"inline-flex",alignItems:"center",gap:4}}>
                  {col.label}
                  {col.tip&&<ColTip tip={col.tip}/>}
                  {col.sortable!==false&&(sortKey===col.key?<span style={{marginLeft:2}}>{sortDir==="asc"?"↑":"↓"}</span>:<span style={{marginLeft:2,opacity:0.25}}>↕</span>)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row,i)=>(
            <TableRow key={row.code} row={row} columns={columns} i={i}/>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableRow({row,columns,i}) {
  const [h,hProps] = useHover();
  return (
    <tr {...hProps} className="table-row" style={{
      background:h?"#f0f5ff":i%2===0?"transparent":"#fafafa",
      transition:"background 0.15s",
      borderLeft:h?`3px solid ${C.accent}`:"3px solid transparent",
    }}>
      {columns.map(col=>(
        <td key={col.key} style={{padding:"10px 10px",whiteSpace:"nowrap",borderBottom:`1px solid ${C.border}30`,textAlign:col.align||"left",color:C.text}}>
          {col.render?col.render(row[col.key],row):row[col.key]}
        </td>
      ))}
    </tr>
  );
}

// ─── Tip Box ──────────────────────────────────────────────────────────────────
// ─── Search Bar ───────────────────────────────────────────────────────────────
function SearchBar({value, onChange, color=C.accent}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{marginBottom:16,position:"relative"}}>
      <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:focused?color:C.textDim,transition:"color 0.2s"}}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>
      <input
        value={value}
        onChange={e=>onChange(e.target.value)}
        onFocus={()=>setFocused(true)}
        onBlur={()=>setFocused(false)}
        placeholder="搜索基金名称或代码..."
        style={{
          width:"100%", boxSizing:"border-box",
          padding:"10px 40px 10px 40px",
          fontSize:14, color:C.text,
          background:C.surface,
          border:`1.5px solid ${focused?color:C.border}`,
          borderRadius:10, outline:"none",
          boxShadow: focused?`0 0 0 3px ${color}12`:"none",
          transition:"border-color 0.2s, box-shadow 0.2s",
        }}
      />
      {value&&(
        <button onClick={()=>onChange("")}
          style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.textDim,padding:2,display:"flex",alignItems:"center"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  );
}

function EmptyResult({query}) {
  return (
    <div style={{textAlign:"center",padding:"48px 0",color:C.textDim}}>
      <div style={{fontSize:32,marginBottom:12}}>🔍</div>
      <div style={{fontSize:15,fontWeight:600,color:C.textMuted,marginBottom:6}}>未找到匹配结果</div>
      <div style={{fontSize:13}}>没有找到包含「{query}」的基金，请尝试其他关键词</div>
    </div>
  );
}


// ─── A/C 类说明框 ─────────────────────────────────────────────────────────────
function AcInfoBox() {
  const [open,setOpen]=useState(false);
  return (
    <div style={{marginTop:12,borderRadius:12,border:`1px solid ${C.borderLight}`,overflow:"hidden",fontSize:13}}>
      <div onClick={()=>setOpen(o=>!o)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",cursor:"pointer",background:C.cardBg,userSelect:"none"}}>
        <span style={{color:C.textMuted,fontWeight:600}}>A类 vs C类 — 如何选择？</span>
        <span style={{color:C.textDim,fontSize:11,transition:"transform 0.2s",display:"inline-block",transform:open?"rotate(180deg)":"rotate(0deg)"}}>▼</span>
      </div>
      {open&&(
        <div style={{padding:"14px 20px",background:C.bg,lineHeight:2,color:C.textMuted}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${C.borderLight}`}}>
                <th style={{textAlign:"left",padding:"4px 8px",color:C.textDim,fontWeight:600}}>对比项</th>
                <th style={{textAlign:"center",padding:"4px 8px",color:C.accent,fontWeight:600}}>A 类</th>
                <th style={{textAlign:"center",padding:"4px 8px",color:C.cyan,fontWeight:600}}>C 类</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["申购费","有（0.1%~1.5%，持有越长越低）","无"],
                ["销售服务费","无","年化 0.2%~0.4%（每日计提）"],
                ["赎回费","短期持有有赎回费","短期持有有赎回费"],
                ["适合持有期","＞1 年（长期省费）","≤1 年（免申购费更灵活）"],
                ["临界点","通常约 1~2 年后 A 类总费更低","不频繁赎回时可选 C 类"],
              ].map(([k,a,c],i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${C.borderLight}22`,background:i%2===0?"transparent":C.cardBg+"66"}}>
                  <td style={{padding:"5px 8px",color:C.textDim,fontWeight:500}}>{k}</td>
                  <td style={{padding:"5px 8px",textAlign:"center",color:C.text}}>{a}</td>
                  <td style={{padding:"5px 8px",textAlign:"center",color:C.text}}>{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{marginTop:10,fontSize:11,color:C.textDim}}>
            同一基金 A/C 类底层持仓完全相同，仅收费结构不同。
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({active,payload,label,unit="%"}) {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:"rgba(255,255,255,0.96)",border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",fontSize:12,boxShadow:"0 8px 24px rgba(0,0,0,0.12)"}}>
      <div style={{color:C.textDim,marginBottom:6,fontWeight:600}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
          <span style={{width:8,height:8,borderRadius:2,background:p.color,display:"inline-block"}}/>
          <span style={{color:C.textMuted}}>{p.name}</span>
          <span style={{fontWeight:700,color:C.text,marginLeft:"auto",paddingLeft:12}}>{p.value>0?"+":""}{p.value}{unit}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Disclaimer Modal ─────────────────────────────────────────────────────────
// ─── Daily Briefing Modal ─────────────────────────────────────────────────────
function TelegramGroupChatModal({onClose}) {
  const [tab, setTab] = useState("telegram");
  const handleClose = () => {
    localStorage.setItem("group_chat_last_shown", String(Date.now()));
    onClose();
  };
  const handleNoShow = () => {
    localStorage.setItem("group_chat_no_show", new Date().toDateString());
    onClose();
  };
  const isTelegram = tab === "telegram";
  return (
    <div style={{position:"fixed",inset:0,zIndex:1100,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={e=>e.target===e.currentTarget&&handleClose()}>
      <div style={{background:"#fff",borderRadius:22,width:"100%",maxWidth:360,boxShadow:"0 32px 80px rgba(0,0,0,0.2)",animation:"fadeInUp 0.3s ease both",overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"20px 20px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:11,color:isTelegram?"#229ED9":"#07c160",fontWeight:700,letterSpacing:0.5,marginBottom:3}}>WISEINVEST 社区</div>
            <div style={{fontSize:17,fontWeight:800,color:C.text,letterSpacing:-0.4}}>加入我们的社群</div>
          </div>
          <button onClick={handleClose}
            style={{width:32,height:32,borderRadius:"50%",border:"none",background:C.bg,color:C.textMuted,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>
        </div>
        {/* Tabs */}
        <div style={{margin:"0 20px 16px",display:"flex",background:C.bg,borderRadius:12,padding:4,gap:4}}>
          <button onClick={()=>setTab("telegram")}
            style={{flex:1,padding:"9px 0",borderRadius:9,border:"none",background:isTelegram?"#229ED9":"transparent",color:isTelegram?"#fff":C.textMuted,fontSize:14,fontWeight:600,cursor:"pointer",transition:"all 0.2s"}}>
            电报群聊
          </button>
          <button onClick={()=>setTab("wechat")}
            style={{flex:1,padding:"9px 0",borderRadius:9,border:"none",background:!isTelegram?"#07c160":"transparent",color:!isTelegram?"#fff":C.textMuted,fontSize:14,fontWeight:600,cursor:"pointer",transition:"all 0.2s"}}>
            微信群聊
          </button>
        </div>
        {/* Content */}
        {isTelegram ? (
          <div style={{padding:"0 20px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
            <div style={{borderRadius:16,overflow:"hidden",border:`1px solid ${C.borderLight}`,width:"100%"}}>
              <img src="/电报图片.png" alt="WiseInvest Telegram 群聊"
                style={{width:"100%",height:"auto",display:"block"}}
                onError={e=>{e.currentTarget.parentElement.style.display="none";}}/>
            </div>
            <div style={{fontSize:13,color:C.textDim,textAlign:"center",lineHeight:1.7}}>
              这张图片是 WiseInvest Telegram 社群入口，适合关注美股 ETF、QDII 基金和跨市场投资讨论的用户加入交流。
            </div>
          </div>
        ) : (
          <div style={{margin:"0 16px 8px",border:"2px solid #07c160",borderRadius:14,overflow:"hidden"}}>
            <img src="/草料图片.png" alt="WiseInvest 微信群聊二维码"
              style={{width:"100%",height:"auto",display:"block"}}
              onError={e=>{e.currentTarget.style.display="none";}}/>
          </div>
        )}
        {/* Footer */}
        <div style={{padding:"12px 20px 20px",display:"flex",flexDirection:"column",gap:10}}>
          {isTelegram ? (
            <a href="https://t.me/WiseInvest513Chat" target="_blank" rel="noopener noreferrer"
              style={{display:"block",width:"100%",padding:"13px 0",borderRadius:12,border:"none",background:"#229ED9",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",letterSpacing:0.2,textAlign:"center",textDecoration:"none",boxSizing:"border-box"}}
              onClick={handleClose}>
              点击加入群聊 →
            </a>
          ) : null}
          <button onClick={handleNoShow}
            style={{background:"none",border:"none",fontSize:12,color:C.textDim,cursor:"pointer",textDecoration:"none",textAlign:"center"}}>
            今天不再展示
          </button>
        </div>
      </div>
    </div>
  );
}

function GroupChatModal({onClose}) {
  const handleClose = () => {
    localStorage.setItem("group_chat_last_shown", String(Date.now()));
    onClose();
  };
  const handleNoShow = () => {
    localStorage.setItem("group_chat_no_show", new Date().toDateString());
    onClose();
  };
  return (
    <div style={{position:"fixed",inset:0,zIndex:1100,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={e=>e.target===e.currentTarget&&handleClose()}>
      <div style={{background:"#fff",borderRadius:22,width:"100%",maxWidth:400,boxShadow:"0 32px 80px rgba(0,0,0,0.2)",animation:"fadeInUp 0.3s ease both",overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"22px 24px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${C.borderLight}`}}>
          <div>
            <div style={{fontSize:11,color:"#07c160",fontWeight:700,letterSpacing:0.5,marginBottom:3}}>WISEINVEST 社区</div>
            <div style={{fontSize:17,fontWeight:800,color:C.text,letterSpacing:-0.4}}>欢迎加入官方微信群聊</div>
          </div>
          <button onClick={handleClose}
            style={{width:32,height:32,borderRadius:"50%",border:"none",background:C.bg,color:C.textMuted,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>
        </div>
        {/* QR Code */}
        <div style={{padding:"24px 24px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
          <div style={{borderRadius:16,overflow:"hidden",border:`1px solid ${C.borderLight}`,width:"100%"}}>
            <img src="/群聊.png" alt="WiseInvest 微信群聊二维码"
              style={{width:"100%",height:"auto",display:"block"}}
              onError={e=>{e.currentTarget.parentElement.style.display="none";}}/>
          </div>
          <div style={{fontSize:13,color:C.textDim,textAlign:"center",lineHeight:1.7}}>
            扫码加入群聊，与志同道合的投资者一起交流
          </div>
        </div>
        {/* Footer */}
        <div style={{padding:"12px 24px 24px",display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={handleClose}
            style={{width:"100%",padding:"12px 0",borderRadius:12,border:"none",background:"#07c160",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",letterSpacing:0.2}}>
            进入平台
          </button>
          <button onClick={handleNoShow}
            style={{background:"none",border:"none",fontSize:12,color:C.textDim,cursor:"pointer",textDecoration:"underline",textDecorationStyle:"dotted",textUnderlineOffset:3}}>
            今日不再提示
          </button>
        </div>
      </div>
    </div>
  );
}

function GalaxyCard({isMobile}) {
  const [showWx, setShowWx] = useState(false);
  const fees = [
    {label:"ETF / LOF",  value:"万0.5，1毛起",  highlight:true,  note:"免五"},
    {label:"股票",        value:"万0.86，5元起",  highlight:false, note:"50万↑万0.8"},
    {label:"可转债",      value:"万0.5",          highlight:false, note:"沪0.1元/深0.2元起"},
    {label:"北交所",      value:"万2",            highlight:false, note:""},
    {label:"港股通",      value:"万0.8",          highlight:false, note:"不免五"},
    {label:"国债逆回购",  value:"1折",            highlight:false, note:"500万以上0.1折"},
    {label:"LOF申购/赎回",value:"1折 / 5折",      highlight:false, note:""},
  ];
  return (
    <>
    <Card style={{padding:"22px 24px",border:`1.5px solid #e8400020`,position:"relative",overflow:"hidden"}}>
      {/* 编辑推荐 badge */}
      <div style={{position:"absolute",top:0,right:0,background:"linear-gradient(135deg,#e84000,#ff6a00)",color:"#fff",fontSize:10,fontWeight:700,padding:"4px 12px",borderBottomLeftRadius:10,letterSpacing:0.5}}>
        编辑推荐
      </div>

      {/* 头部 */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <div style={{width:36,height:36,borderRadius:10,background:"#e8400015",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🏦</div>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:C.text}}>场内ETF · A股账户</div>
          <div style={{fontSize:11,color:C.textDim}}>人民币买入 · 无需外汇额度 · 银河证券</div>
        </div>
      </div>

      {/* 永久免五 横幅 */}
      <div style={{background:"linear-gradient(135deg,#e8400012,#ff6a0008)",border:"1.5px solid #e8400030",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
        <div>
          <div style={{fontSize:20,fontWeight:900,color:"#e84000",letterSpacing:-0.5}}>永久免五</div>
          <div style={{fontSize:11,color:C.textMuted,marginTop:2}}>入金 1.5 万放 2 个月，ETF 永久免五</div>
        </div>
        <button onClick={()=>setShowWx(true)}
          style={{flexShrink:0,padding:"9px 18px",borderRadius:20,border:"none",background:"linear-gradient(135deg,#e84000,#ff6a00)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",boxShadow:"0 4px 12px #e8400040"}}>
          立即领取 →
        </button>
      </div>

      {/* 费率表 */}
      <div style={{display:"flex",flexDirection:"column",gap:0,marginBottom:14,borderRadius:10,overflow:"hidden",border:`1px solid ${C.border}`}}>
        {fees.map((f,i)=>(
          <div key={f.label} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 12px",background:f.highlight?"#e8400008":i%2===0?C.bg:C.bgAlt,borderBottom:i<fees.length-1?`1px solid ${C.border}30`:"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              {f.highlight&&<span style={{fontSize:9,fontWeight:700,color:"#e84000",background:"#e8400015",padding:"1px 5px",borderRadius:4}}>免五</span>}
              <span style={{fontSize:12,color:f.highlight?C.text:C.textMuted,fontWeight:f.highlight?700:400}}>{f.label}</span>
            </div>
            <div style={{textAlign:"right"}}>
              <span style={{fontSize:12,fontWeight:700,color:f.highlight?"#e84000":C.text}}>{f.value}</span>
              {f.note&&<span style={{fontSize:10,color:C.textDim,marginLeft:4}}>({f.note})</span>}
            </div>
          </div>
        ))}
      </div>

      <div style={{padding:"9px 12px",borderRadius:10,background:C.accent+"10",border:`1px solid ${C.accent}25`,fontSize:11,color:C.textDim}}>
        ⚠️ 建议关注溢价率，本站「场内ETF」标签页实时监控
      </div>
    </Card>

    {/* 微信弹窗：用 portal 挂到 body，避免父级 transform 影响 fixed 定位 */}
    {showWx && createPortal(
      <div onClick={()=>setShowWx(false)}
        style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div onClick={e=>e.stopPropagation()}
          style={{background:"#fff",borderRadius:20,padding:"20px 20px 16px",maxWidth:280,width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,0.25)",display:"flex",flexDirection:"column",alignItems:"center",gap:8,animation:"fadeInUp 0.25s ease both"}}>
          <div style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:14,fontWeight:800,color:"#1d1d1f"}}>添加微信，获取开户支持</div>
            <button onClick={()=>setShowWx(false)}
              style={{background:"none",border:"none",fontSize:18,color:"#999",cursor:"pointer",lineHeight:1,padding:0}}>✕</button>
          </div>
          <div style={{fontSize:11,color:"#6e6e73",textAlign:"center",lineHeight:1.5}}>
            扫码添加，发送「银河证券」获取专属费率
          </div>
          <div style={{borderRadius:12,overflow:"hidden",border:"1px solid #e5e5ea",width:240,flexShrink:0}}>
            <img src="/WX.jpg" alt="微信二维码"
              style={{width:"100%",height:"auto",display:"block"}}
              onError={e=>{e.currentTarget.parentElement.style.display="none";}}/>
          </div>
          <div style={{fontSize:11,color:"#aaa",textAlign:"center"}}>长按或扫码识别</div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}

function DisclaimerModal({onClose}) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:"#fff",borderRadius:20,padding:"36px 32px",maxWidth:460,width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,0.22)",animation:"fadeInUp 0.35s ease both"}}>
        <div style={{fontSize:28,marginBottom:14,textAlign:"center"}}>⚠️</div>
        <h3 style={{fontSize:19,fontWeight:800,color:"#1d1d1f",margin:"0 0 12px",letterSpacing:-0.4,textAlign:"center"}}>投资风险声明</h3>
        <p style={{fontSize:14,color:"#6e6e73",lineHeight:1.9,margin:"0 0 24px"}}>
          本平台所展示的数据、分析及内容仅供<strong style={{color:"#1d1d1f"}}>信息参考</strong>，
          <strong style={{color:"#d93025"}}>不构成任何投资建议</strong>。投资有风险，入市须谨慎。
          QDII 基金及场内 ETF 涉及汇率风险、额度限制等因素，请在充分了解产品特征和风险后，
          结合个人风险承受能力，做出<strong style={{color:"#1d1d1f"}}>独立投资决策</strong>。
        </p>
        <button onClick={onClose}
          style={{width:"100%",padding:"13px 0",borderRadius:10,border:"none",background:"linear-gradient(135deg,#0071e3,#005bbf)",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",letterSpacing:0.2}}>
          我已了解，继续浏览
        </button>
      </div>
    </div>
  );
}

// ─── Skeleton Table ────────────────────────────────────────────────────────────
function SkeletonTable({rows=7,cols=7}) {
  const widths=[0.5,2.5,0.7,0.7,1,0.7,0.7];
  return (
    <div style={{borderRadius:14,border:"1px solid #e0e0e5",background:"#fff",overflow:"hidden",boxShadow:"0 2px 16px rgba(0,0,0,0.06)"}}>
      <div style={{height:44,background:"#fafafa",borderBottom:"1px solid #e0e0e5",display:"flex",alignItems:"center",gap:16,padding:"0 16px"}}>
        {Array.from({length:cols}).map((_,j)=>(
          <div key={j} style={{height:10,borderRadius:4,background:"#ebebf0",flex:widths[j]||1,animation:"skeletonPulse 1.4s ease infinite",animationDelay:`${j*0.06}s`}}/>
        ))}
      </div>
      {Array.from({length:rows}).map((_,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 10px",borderBottom:i<rows-1?"1px solid #e0e0e530":"",background:i%2?"#fafafa":"#fff"}}>
          {Array.from({length:cols}).map((_,j)=>(
            <div key={j} style={{height:12,borderRadius:4,background:"#f0f0f5",flex:widths[j]||1,animation:"skeletonPulse 1.4s ease infinite",animationDelay:`${i*0.04+j*0.06}s`}}/>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Status Filter Bar ────────────────────────────────────────────────────────
function StatusFilterBar({value, onChange, color}) {
  const opts=[{id:"all",label:"全部"},{id:"open",label:"仅开放申购"},{id:"suspended",label:"暂停申购"}];
  return (
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
      {opts.map(o=>(
        <button key={o.id} onClick={()=>onChange(o.id)}
          style={{padding:"5px 14px",borderRadius:20,border:`1.5px solid ${value===o.id?color:"#e0e0e5"}`,background:value===o.id?color+"14":"none",color:value===o.id?color:"#6e6e73",fontSize:12,fontWeight:value===o.id?700:400,cursor:"pointer",transition:"all 0.18s",lineHeight:1.5}}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Back To Top Button ───────────────────────────────────────────────────────
function BackToTop({visible, offset=32}) {
  return (
    <button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}
      style={{position:"fixed",bottom:offset,right:32,width:40,height:40,borderRadius:"50%",
        border:"none",background:C.accent,color:"#fff",fontSize:18,cursor:"pointer",
        boxShadow:"0 4px 16px rgba(0,122,255,0.35)",zIndex:200,
        opacity:visible?1:0,pointerEvents:visible?"auto":"none",
        transition:"opacity 0.25s ease",display:"flex",alignItems:"center",justifyContent:"center"}}>
      ↑
    </button>
  );
}

// ─── FX Analysis Card ────────────────────────────────────────────────────────
// ─── 负收益年原因 ──────────────────────────────────────────────────────────────
const CRASH_REASONS = {
  1990: { title:"海湾战争 + 储贷危机",       tag:"经济衰退", color:"#e8a020",
    desc:"伊拉克入侵科威特引发海湾战争，油价急升推高通胀，美国陷入衰退。美国储贷协会危机持续冲击金融体系，联储被迫大幅加息。" },
  2000: { title:"科网泡沫破裂（第一年）",     tag:"泡沫崩溃", color:"#d93025",
    desc:"互联网泡沫从2000年3月纳指高点开始崩溃，大量.com公司估值严重虚高。纳指跌近37%，科技股受创远重于大盘。" },
  2001: { title:"9·11恐袭 + 科网泡沫持续",   tag:"黑天鹅", color:"#d93025",
    desc:"9月11日恐袭震惊全球，纽交所停市4天。科网泡沫继续破裂，安然公司财务丑闻爆发，市场信心持续低迷。" },
  2002: { title:"科网泡沫尾声 + 会计丑闻",   tag:"连续熊市", color:"#d93025",
    desc:"安然、世通等巨型会计造假案接连曝光，《萨班斯-奥克斯利法案》应运而生。纳指三年累计跌幅超80%，为有史以来最惨熊市之一。" },
  2008: { title:"全球金融危机",               tag:"系统性危机", color:"#d93025",
    desc:"次贷危机引爆全球金融海啸。雷曼兄弟9月宣告破产，贝尔斯登被收购，AIG获政府紧急救助2000亿，全球信贷市场几近冻结。" },
  2018: { title:"美联储加息 + 中美贸易战",   tag:"政策收紧", color:"#e8a020",
    desc:"美联储全年4次加息，联邦基金利率升至2.5%。中美贸易摩擦升级互加关税，科技股四季度暴跌，纳指Q4单季跌逾17%。" },
  2022: { title:"史上最快加息周期 + 通胀危机", tag:"利率冲击", color:"#d93025",
    desc:"美国通胀触及40年高点（CPI 9.1%），美联储全年7次加息合计425bp，10年期美债从1.5%飙至4%+。高估值成长股和纳指科技股遭毁灭性重估。" },
};

// 自定义 Bar shape — 必须定义在组件外，避免每次渲染创建新引用
function NasdaqBar(props) {
  const { x, y, width, height, value } = props;
  const fill = value >= 0 ? C.accent : C.red;
  const h = Math.abs(height);
  const yPos = value >= 0 ? y : y + height;
  return <rect x={x} y={yPos} width={Math.max(width,1)} height={h} fill={fill} rx={2} opacity={0.85}/>;
}
function Sp500Bar(props) {
  const { x, y, width, height, value } = props;
  const fill = value >= 0 ? C.cyan : "#e8704a";
  const h = Math.abs(height);
  const yPos = value >= 0 ? y : y + height;
  return <rect x={x} y={yPos} width={Math.max(width,1)} height={h} fill={fill} rx={2} opacity={0.85}/>;
}

// ─── Index History Card ───────────────────────────────────────────────────────
function IndexHistoryCard() {
  const [mode, setMode] = useState("compare"); // "nasdaq" | "sp500" | "compare"
  const [selectedYear, setSelectedYear] = useState(null);

  // 构建年度数据数组
  const annualRows = useMemo(() => {
    const years = Object.keys(INDEX_ANNUAL.nasdaq).map(Number).sort((a,b)=>a-b);
    return years.map(y => ({
      year: String(y),
      nasdaq: INDEX_ANNUAL.nasdaq[y],
      sp500:  INDEX_ANNUAL.sp500[y],
    }));
  }, []);

  // 累计增长曲线（以100为起点，1989年末=100）
  const cumulativeRows = useMemo(() => {
    const years = Object.keys(INDEX_ANNUAL.nasdaq).map(Number).sort((a,b)=>a-b);
    let nq = 100, sp = 100;
    return years.map(y => {
      nq = +(nq * (1 + INDEX_ANNUAL.nasdaq[y] / 100)).toFixed(1);
      sp = +(sp * (1 + INDEX_ANNUAL.sp500[y]  / 100)).toFixed(1);
      return { year: String(y), nasdaq: nq, sp500: sp };
    });
  }, []);

  const cagrEntries = Object.entries(INDEX_CAGR.nasdaq).map(([label, nq], i) => ({
    label,
    nasdaq: nq,
    sp500: Object.values(INDEX_CAGR.sp500)[i],
  }));

  const handleBarClick = useCallback((data) => {
    if (!data?.payload) return;
    const yr = parseInt(data.payload.year);
    if (CRASH_REASONS[yr]) setSelectedYear(prev => prev === yr ? null : yr);
  }, []);

  const tabs = [{id:"compare",label:"对比"},{id:"nasdaq",label:"纳指100"},{id:"sp500",label:"标普500"}];

  return (
    <Reveal delay={0.06}>
      <Card style={{padding:"24px 26px",marginBottom:28}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:4}}>纳指100 vs 标普500 · 历年回报（1990-2025）</div>
            <div style={{fontSize:12,color:C.textDim}}>纳指100价格口径 · 标普500总回报含股息 · 来源：Slickcharts</div>
          </div>
          <div style={{display:"flex",gap:6}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setMode(t.id)}
                style={{padding:"5px 12px",borderRadius:8,border:`1.5px solid ${mode===t.id?C.accent:C.border}`,background:mode===t.id?C.accent+"12":"none",color:mode===t.id?C.accent:C.textMuted,fontSize:12,fontWeight:mode===t.id?700:400,cursor:"pointer",transition:"all 0.18s"}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={annualRows} barGap={2} barCategoryGap="18%" margin={{top:16,right:8,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="2 4" stroke={C.borderLight} vertical={false}/>
            <XAxis dataKey="year" tick={{fill:C.textDim,fontSize:10}} axisLine={false} tickLine={false}
              tickFormatter={v=>v.slice(2)} interval={1}/>
            <YAxis tick={{fill:C.textDim,fontSize:11}} axisLine={false} tickLine={false} unit="%" domain={[-50,110]}/>
            <ReferenceLine y={0} stroke={C.border} strokeWidth={1.5}/>
            <Tooltip content={<ChartTooltip unit="%"/>} cursor={{fill:"rgba(0,0,0,0.04)",rx:3}}/>
            {(mode==="compare"||mode==="nasdaq")&&
              <Bar dataKey="nasdaq" name="纳指100" shape={<NasdaqBar/>} onClick={handleBarClick} style={{cursor:"pointer"}}/>}
            {(mode==="compare"||mode==="sp500")&&
              <Bar dataKey="sp500"  name="标普500" shape={<Sp500Bar/>} onClick={handleBarClick} style={{cursor:"pointer"}}/>}
            {mode==="compare"&&<Legend wrapperStyle={{fontSize:11,paddingTop:10}}/>}
          </BarChart>
        </ResponsiveContainer>

        {/* 点击负收益年显示原因面板 */}
        {selectedYear && CRASH_REASONS[selectedYear] && (()=>{
          const r = CRASH_REASONS[selectedYear];
          const nq = INDEX_ANNUAL.nasdaq[selectedYear];
          const sp = INDEX_ANNUAL.sp500[selectedYear];
          return (
            <div style={{margin:"16px 0 0",padding:"18px 22px",borderRadius:14,background:r.color+"0c",border:`1.5px solid ${r.color}30`,position:"relative",animation:"fadeSlideIn 0.22s ease"}}>
              <button onClick={()=>setSelectedYear(null)}
                style={{position:"absolute",top:12,right:14,background:"none",border:"none",fontSize:18,color:C.textDim,cursor:"pointer",lineHeight:1}}>×</button>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <span style={{fontSize:20,fontWeight:800,color:r.color}}>{selectedYear}</span>
                <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:r.color+"18",color:r.color}}>{r.tag}</span>
                <span style={{fontSize:15,fontWeight:700,color:C.text}}>{r.title}</span>
              </div>
              <p style={{fontSize:13,color:C.textMuted,lineHeight:1.7,margin:"0 0 14px"}}>{r.desc}</p>
              <div style={{display:"flex",gap:20}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{width:10,height:10,borderRadius:2,background:C.accent,display:"inline-block"}}/>
                  <span style={{fontSize:12,color:C.textDim}}>纳指100</span>
                  <span style={{fontSize:15,fontWeight:800,color:nq<0?C.red:C.green}}>{nq>0?"+":""}{nq}%</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{width:10,height:10,borderRadius:2,background:C.cyan,display:"inline-block"}}/>
                  <span style={{fontSize:12,color:C.textDim}}>标普500</span>
                  <span style={{fontSize:15,fontWeight:800,color:sp<0?C.red:C.green}}>{sp>0?"+":""}{sp}%</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 提示文字：有负收益年时提示可点击 */}
        <div style={{textAlign:"center",marginTop:8,fontSize:11,color:C.textDim}}>
          点击红色柱（负收益年）查看原因
        </div>

        {/* 累计增长曲线 */}
        {(()=>{
          const NQ_COLOR = "#6366f1"; // 靛紫 — 纳指
          const SP_COLOR = "#10b981"; // 翠绿 — 标普
          const last = cumulativeRows[cumulativeRows.length-1];
          return (
            <div style={{marginTop:28,paddingTop:24,borderTop:`1px solid ${C.borderLight}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:16}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:3}}>累计增长曲线（1990–2025）</div>
                  <div style={{fontSize:12,color:C.textDim}}>以100为起点 · 对数坐标轴 · 36年持有结果：
                    {(mode==="compare"||mode==="nasdaq")&&<span style={{color:NQ_COLOR,fontWeight:700}}> 纳指×{(last.nasdaq/100).toFixed(0)}</span>}
                    {mode==="compare"&&<span style={{color:C.textDim}}> vs</span>}
                    {(mode==="compare"||mode==="sp500")&&<span style={{color:SP_COLOR,fontWeight:700}}> 标普×{(last.sp500/100).toFixed(0)}</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:16,fontSize:12}}>
                  {(mode==="compare"||mode==="nasdaq")&&(
                    <span style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{width:24,height:3,borderRadius:2,background:NQ_COLOR,display:"inline-block"}}/>
                      <span style={{color:C.textMuted}}>纳指100</span>
                    </span>
                  )}
                  {(mode==="compare"||mode==="sp500")&&(
                    <span style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{width:24,height:3,borderRadius:2,background:SP_COLOR,display:"inline-block"}}/>
                      <span style={{color:C.textMuted}}>标普500</span>
                    </span>
                  )}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={cumulativeRows} margin={{top:8,right:8,left:0,bottom:0}}>
                  <defs>
                    <linearGradient id="cumulNQ" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor={NQ_COLOR} stopOpacity={0.22}/>
                      <stop offset="100%" stopColor={NQ_COLOR} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="cumulSP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor={SP_COLOR} stopOpacity={0.18}/>
                      <stop offset="100%" stopColor={SP_COLOR} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke={C.borderLight} vertical={false}/>
                  <XAxis dataKey="year" tick={{fill:C.textDim,fontSize:10}} axisLine={false} tickLine={false}
                    tickFormatter={v=>v.slice(2)} interval={3}/>
                  <YAxis scale="log" domain={["auto","auto"]} allowDataOverflow
                    tick={{fill:C.textDim,fontSize:11}} axisLine={false} tickLine={false}
                    tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:String(v)}
                    ticks={[100,200,500,1000,2000,5000,10000]}/>
                  <Tooltip content={({active,payload,label})=>{
                    if(!active||!payload?.length) return null;
                    return (
                      <div style={{background:"rgba(255,255,255,0.97)",border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",fontSize:12,boxShadow:"0 8px 24px rgba(0,0,0,0.12)"}}>
                        <div style={{color:C.textDim,marginBottom:6,fontWeight:600}}>{label}年</div>
                        {payload.map((p,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                            <span style={{width:8,height:8,borderRadius:"50%",background:p.color,display:"inline-block"}}/>
                            <span style={{color:C.textMuted}}>{p.name}</span>
                            <span style={{fontWeight:700,color:p.color,marginLeft:"auto",paddingLeft:12}}>
                              {p.value?.toLocaleString()}
                              <span style={{fontSize:10,color:C.textDim,fontWeight:400}}> ×{(p.value/100).toFixed(1)}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}/>
                  {(mode==="compare"||mode==="nasdaq")&&
                    <Area type="monotone" dataKey="nasdaq" name="纳指100" stroke={NQ_COLOR} fill="url(#cumulNQ)" strokeWidth={2.5} dot={false}/>}
                  {(mode==="compare"||mode==="sp500")&&
                    <Area type="monotone" dataKey="sp500"  name="标普500" stroke={SP_COLOR} fill="url(#cumulSP)" strokeWidth={2.5} dot={false}/>}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* CAGR cards */}
        <div style={{display:"flex",gap:12,marginTop:20,flexWrap:"wrap"}}>
          {cagrEntries.map(({label,nasdaq,sp500},i)=>{
            const colors=[C.accent,C.green,"#e8a020",C.purple];
            const col=colors[i];
            const periods=["36年 (1990-2025)","15年 (2011-2025)","10年 (2016-2025)","5年 (2021-2025)"];
            return (
              <div key={label} style={{flex:1,minWidth:140,borderRadius:14,border:`1px solid ${col}22`,background:col+"08",padding:"16px 18px"}}>
                <div style={{fontSize:11,color:C.textDim,marginBottom:8,whiteSpace:"nowrap"}}>{periods[i]}</div>
                {(mode==="compare"||mode==="nasdaq")&&(
                  <div style={{marginBottom:mode==="compare"?6:0}}>
                    {mode==="compare"&&<div style={{fontSize:10,color:C.textDim,marginBottom:2}}>纳指100</div>}
                    <div style={{fontSize:24,fontWeight:800,color:col,letterSpacing:-0.5}}>{nasdaq}%</div>
                    <div style={{fontSize:10,color:C.textDim,marginTop:2}}>年化复合收益</div>
                  </div>
                )}
                {(mode==="compare"||mode==="sp500")&&(
                  <div style={{marginTop:mode==="compare"?4:0}}>
                    {mode==="compare"&&<div style={{fontSize:10,color:C.textDim,marginBottom:2}}>标普500</div>}
                    <div style={{fontSize:mode==="compare"?16:24,fontWeight:mode==="compare"?600:800,color:mode==="compare"?C.textMuted:col,letterSpacing:-0.5}}>{sp500}%</div>
                    {mode==="sp500"&&<div style={{fontSize:10,color:C.textDim,marginTop:2}}>年化复合收益</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </Reveal>
  );
}

function FXAnalysisCard() {
  const [strategy,setStrategy]=useState("nasdaq");
  const [rawData,setRawData]=useState(null);
  const [apiLoading,setApiLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      try{
        const r=await fetch(`${API_BASE}/fx-index-history`);
        if(r.ok){const d=await r.json();if(d.data?.length>10)setRawData(d.data);}
      }catch{}
      setApiLoading(false);
    })();
  },[]);

  // Monthly cumulative returns computed from raw close prices
  const monthlyData=useMemo(()=>{
    if(!rawData||rawData.length<2) return null;
    const key=strategy==="nasdaq"?"ndx_close":"spx_close";
    let usdV=1,cnyV=1;
    const result=[];
    for(let i=1;i<rawData.length;i++){
      const prev=rawData[i-1],curr=rawData[i];
      if(!prev[key]||!curr[key]||!prev.usdcny||!curr.usdcny) continue;
      const indexReturn=curr[key]/prev[key]-1;
      const fxFactor=curr.usdcny/prev.usdcny;
      usdV*=(1+indexReturn);
      cnyV*=(1+indexReturn)*fxFactor;
      result.push({month:curr.month,usd:+(usdV*100).toFixed(1),cny:+(cnyV*100).toFixed(1),fx:+curr.usdcny.toFixed(4)});
    }
    return result.length>0?result:null;
  },[rawData,strategy]);

  // Annual fallback when backend unavailable
  const annualData=useMemo(()=>{
    if(monthlyData) return null;
    const ret=INDEX_ANNUAL[strategy];
    let usdV=1,cnyV=1;
    return Object.entries(FX_ANNUAL).map(([y,[startFX,endFX]])=>{
      const yr=parseInt(y);
      usdV*=(1+(ret[yr]||0)/100);
      cnyV*=(1+(ret[yr]||0)/100)*(endFX/startFX);
      return {month:y,usd:+(usdV*100).toFixed(1),cny:+(cnyV*100).toFixed(1),fx:+endFX.toFixed(4)};
    });
  },[strategy,monthlyData]);

  const data=monthlyData||annualData||[];
  const isMonthly=!!monthlyData;
  const last=data[data.length-1]||{usd:100,cny:100,fx:7.3};
  const usdGain=+(last.usd-100).toFixed(1);
  const cnyGain=+(last.cny-100).toFixed(1);
  const fxContrib=+(cnyGain-usdGain).toFixed(1);
  const color1=strategy==="nasdaq"?C.accent:C.cyan;

  // Only show tick labels for January of each year (monthly mode)
  const yearTicks=useMemo(()=>{
    if(!isMonthly) return undefined;
    return data.filter(d=>d.month?.slice(5,7)==="01").map(d=>d.month);
  },[data,isMonthly]);

  return (
    <Reveal delay={0.12}>
      <Card style={{padding:"24px 26px",marginBottom:36}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <div style={{fontSize:15,fontWeight:700,color:C.text}}>汇率影响剥离分析</div>
              <span style={{padding:"2px 8px",borderRadius:10,background:C.orangeBg,color:C.orange,fontSize:11,fontWeight:600}}>USD/CNY</span>
              {isMonthly&&<span style={{padding:"2px 8px",borderRadius:10,background:C.accentBg,color:C.accent,fontSize:11,fontWeight:600}}>月度粒度</span>}
              {!isMonthly&&!apiLoading&&<span style={{padding:"2px 8px",borderRadius:10,background:C.bg,color:C.textDim,fontSize:11}}>年度数据（后端离线）</span>}
            </div>
            <div style={{fontSize:12,color:C.textDim}}>人民币持有者 vs 美元持有者 · 2015年起累计，以100为基准 · 间距即为汇率净贡献</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {[{id:"nasdaq",label:"纳指100",color:C.accent},{id:"sp500",label:"标普500",color:C.cyan}].map(s=>(
              <button key={s.id} onClick={()=>setStrategy(s.id)}
                style={{padding:"5px 12px",borderRadius:8,border:`1.5px solid ${strategy===s.id?s.color:C.border}`,background:strategy===s.id?s.color+"12":"none",color:strategy===s.id?s.color:C.textMuted,fontSize:12,fontWeight:strategy===s.id?700:400,cursor:"pointer",transition:"all 0.18s"}}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary stats */}
        <div style={{display:"flex",gap:0,marginBottom:22,background:C.bg,borderRadius:14,overflow:"hidden",border:`1px solid ${C.border}`}}>
          {[
            {label:"美元累计涨幅",value:`+${usdGain}%`,sub:"纯美元口径",color:color1},
            {label:"人民币累计涨幅",value:`${cnyGain>=0?"+":""}${cnyGain}%`,sub:"含汇率折算",color:C.green},
            {label:"汇率累计贡献",value:`${fxContrib>0?"+":""}${fxContrib}%`,sub:fxContrib>0?"人民币贬值增厚收益":"人民币升值侵蚀收益",color:fxContrib>0?C.orange:C.red},
            {label:"当前 USD/CNY",value:last.fx,sub:isMonthly?"最新月度汇率":"年末汇率",color:C.textMuted},
          ].map((s,i)=>(
            <div key={s.label} style={{flex:1,padding:"16px 20px",borderRight:i<3?`1px solid ${C.border}`:"none",textAlign:"center"}}>
              <div style={{fontSize:11,color:C.textDim,marginBottom:6}}>{s.label}</div>
              <div style={{fontSize:22,fontWeight:800,color:s.color,letterSpacing:-0.5}}>{s.value}</div>
              <div style={{fontSize:11,color:C.textDim,marginTop:4}}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Chart or loading */}
        {apiLoading&&!data.length?(
          <div style={{height:280,display:"flex",alignItems:"center",justifyContent:"center",color:C.textDim,fontSize:13}}>
            正在加载月度历史数据…
          </div>
        ):(
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data} margin={{top:8,right:54,left:4,bottom:0}}>
              <defs>
                <linearGradient id="fxCnyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.green}  stopOpacity={0.18}/>
                  <stop offset="95%" stopColor={C.green}  stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="fxUsdGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color1}   stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={color1}   stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={C.borderLight} vertical={false}/>
              <XAxis dataKey="month" tick={{fill:C.textDim,fontSize:11}} axisLine={false} tickLine={false}
                ticks={yearTicks}
                tickFormatter={v=>isMonthly?v?.slice(0,4):v}/>
              <YAxis yAxisId="ret" tick={{fill:C.textDim,fontSize:10}} axisLine={false} tickLine={false}
                tickFormatter={v=>`${v}`} domain={["auto","auto"]} width={38}
                label={{value:"基准=100",angle:-90,position:"insideLeft",fill:C.textDim,fontSize:10,dy:30}}/>
              <YAxis yAxisId="fx" orientation="right" tick={{fill:C.orange,fontSize:10}} axisLine={false} tickLine={false}
                domain={[5.8,7.8]} tickFormatter={v=>`¥${v.toFixed(1)}`} width={46}/>
              <Tooltip
                formatter={(v,name)=>{
                  if(name==="USD/CNY汇率") return [`¥${v}`,name];
                  return [`${v}（基准100）`,name];
                }}
                labelFormatter={v=>isMonthly?v:v+"年"}
                contentStyle={{borderRadius:10,fontSize:12,border:`1px solid ${C.border}`,boxShadow:"0 4px 20px rgba(0,0,0,0.08)"}}/>
              <Legend wrapperStyle={{fontSize:11,paddingTop:10}}/>
              <ReferenceLine yAxisId="ret" y={100} stroke={C.border} strokeDasharray="3 3"/>
              <Area yAxisId="ret" type="monotone" dataKey="cny" name="人民币口径" stroke={C.green} fill="url(#fxCnyGrad)" strokeWidth={2.5} dot={false}/>
              <Area yAxisId="ret" type="monotone" dataKey="usd" name="美元口径" stroke={color1} fill="url(#fxUsdGrad)" strokeWidth={2} dot={false}/>
              <Line yAxisId="fx" type="monotone" dataKey="fx" name="USD/CNY汇率" stroke={C.orange} strokeWidth={1.5} dot={false} strokeDasharray="5 3"/>
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {/* Insight text */}
        <div style={{marginTop:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{padding:"12px 16px",borderRadius:10,background:C.accentBg,border:`1px solid ${C.accent}18`,fontSize:12,color:C.textMuted,lineHeight:1.8}}>
            <strong style={{color:C.accent}}>绿线 {">"} 蓝线：</strong>
            人民币贬值期（汇率↑），在国内持有QDII的你比纯美元持有者<strong style={{color:C.text}}>多赚</strong>了这段"缺口"——因为净值折算回人民币时会自然增厚。
          </div>
          <div style={{padding:"12px 16px",borderRadius:10,background:C.orangeBg,border:`1px solid ${C.orange}18`,fontSize:12,color:C.textMuted,lineHeight:1.8}}>
            <strong style={{color:C.orange}}>绿线 {"<"} 蓝线：</strong>
            人民币升值期（汇率↓），如2017、2020–2021年，CNY口径收益低于美元口径，汇率会<strong style={{color:C.text}}>侵蚀</strong>部分收益，需特别留意。
          </div>
        </div>
      </Card>
    </Reveal>
  );
}

// ─── Watchlist Empty State ────────────────────────────────────────────────────
function WatchlistEmpty({onGo}) {
  return (
    <div style={{textAlign:"center",padding:"80px 0",color:C.textDim}}>
      <div style={{fontSize:52,marginBottom:16,opacity:0.4}}>☆</div>
      <div style={{fontSize:17,fontWeight:600,color:C.textMuted,marginBottom:8}}>暂无自选基金</div>
      <div style={{fontSize:14,marginBottom:28}}>在各板块点击 ☆ 图标，将感兴趣的基金加入自选列表</div>
      <button onClick={onGo}
        style={{padding:"10px 28px",borderRadius:20,border:`1.5px solid ${C.accent}`,background:C.accent+"12",color:C.accent,fontSize:14,fontWeight:600,cursor:"pointer",transition:"all 0.2s"}}>
        去挑选基金 →
      </button>
    </div>
  );
}

// ─── Compare Bar (floating) ───────────────────────────────────────────────────
function CompareBar({list,onOpen,onRemove,onClear}) {
  if(list.length===0) return null;
  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:150,background:"rgba(255,255,255,0.96)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderTop:`1px solid ${C.border}`,boxShadow:"0 -4px 24px rgba(0,0,0,0.09)",padding:"12px 40px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",animation:"slideUp 0.3s ease both"}}>
      <span style={{fontSize:12,color:C.textDim,flexShrink:0,fontWeight:600}}>对比 {list.length}/4</span>
      <div style={{display:"flex",gap:8,flex:1,flexWrap:"wrap"}}>
        {list.map(f=>(
          <div key={f.code} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px 4px 12px",borderRadius:20,background:C.accentBg,border:`1.5px solid ${C.accent}40`,fontSize:13}}>
            <span style={{fontFamily:"monospace",fontWeight:700,color:C.accent,fontSize:12}}>{f.code}</span>
            <span style={{fontSize:12,color:C.textMuted,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name.replace(/\(.*\)/,"").slice(0,8)}</span>
            <button onClick={()=>onRemove(f.code)} style={{background:"none",border:"none",cursor:"pointer",color:C.textDim,padding:"0 2px",fontSize:14,lineHeight:1,display:"flex",alignItems:"center"}}>×</button>
          </div>
        ))}
      </div>
      <button onClick={onClear} style={{padding:"7px 14px",borderRadius:18,border:`1.5px solid ${C.border}`,background:"none",color:C.textMuted,fontSize:13,cursor:"pointer",flexShrink:0}}>清除</button>
      <button onClick={onOpen} disabled={list.length<2}
        style={{padding:"8px 22px",borderRadius:18,border:"none",background:list.length>=2?`linear-gradient(135deg,${C.accent},${C.accentDim})`:"#e0e0e5",color:list.length>=2?"#fff":C.textDim,fontSize:13,fontWeight:700,cursor:list.length>=2?"pointer":"default",flexShrink:0,transition:"all 0.2s"}}>
        开始对比 {list.length>=2?`(${list.length})`:""} →
      </button>
    </div>
  );
}

// ─── Compare Modal ────────────────────────────────────────────────────────────
function CompareModal({list,onClose}) {
  const COLORS=["#0071e3","#0077a8","#6e3de8","#c4570a"];
  const [view,setView]=useState("chart"); // "chart" | "table"

  // ── visual chart panels ──────────────────────────────────────────────────
  const metrics=[
    {label:"近1年涨幅",key:"ytd_return",unit:"%",higher:"better",color:C.green},
    {label:"年费率",   key:"fee_rate",  unit:"%",higher:"worse", color:C.orange},
    {label:"规模(亿)", key:"scale",     unit:"亿",higher:"better",color:C.accent},
    {label:"跟踪误差", key:"track_error",unit:"%",higher:"worse",color:C.red},
  ];

  const rows=[
    {label:"分类",          fmt:f=>f._cat||"—"},
    {label:"年费率",        fmt:f=>f.fee_rate!=null?<span style={{color:f.fee_rate>1?C.orange:C.green,fontWeight:700}}>{f.fee_rate}%</span>:"—"},
    {label:"规模(亿)",      fmt:f=>f.scale!=null?`${f.scale}亿`:"—"},
    {label:"近1年涨幅",     fmt:f=>f.ytd_return!=null?<span style={{color:f.ytd_return>0?C.green:C.red,fontWeight:700}}>{f.ytd_return>0?"+":""}{f.ytd_return}%</span>:"—"},
    {label:"跟踪误差",      fmt:f=>f.track_error!=null?<span style={{color:f.track_error>2?C.orange:C.textMuted}}>{f.track_error}%</span>:"—"},
    {label:"申购/交易上限",  fmt:f=>f.daily_limit||"场内交易"},
    {label:"溢价率",        fmt:f=>f.premium!=null?<PremiumBadge value={f.premium}/>:"—"},
    {label:"申购状态",      fmt:f=>f.buy_status?<StatusBadge status={f.buy_status}/>:<span style={{color:C.cyan,fontSize:12}}>场内交易</span>},
  ];

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.42)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:"#fff",borderRadius:22,width:"100%",maxWidth:Math.min(260+list.length*210,980),maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 28px 90px rgba(0,0,0,0.22)",animation:"fadeInUp 0.3s ease both"}}>

        {/* Header */}
        <div style={{padding:"22px 28px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div>
            <h3 style={{fontSize:18,fontWeight:800,color:C.text,margin:0,letterSpacing:-0.4}}>基金横向对比</h3>
            <p style={{fontSize:12,color:C.textDim,margin:"3px 0 0"}}>已选 {list.length} 只 · 点击空白处关闭</p>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {/* view toggle */}
            {["chart","table"].map(v=>(
              <button key={v} onClick={()=>setView(v)}
                style={{padding:"6px 14px",borderRadius:8,border:`1.5px solid ${view===v?C.accent:C.border}`,background:view===v?C.accent:"#fff",color:view===v?"#fff":C.textMuted,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.18s"}}>
                {v==="chart"?"📊 图表":"☰ 详情"}
              </button>
            ))}
            <button onClick={onClose}
              style={{background:C.bg,border:"none",borderRadius:8,padding:"7px 14px",cursor:"pointer",color:C.textMuted,fontSize:13,fontWeight:500,marginLeft:4}}>✕</button>
          </div>
        </div>

        <div style={{overflowY:"auto",padding:"20px 28px 28px"}}>

          {/* Fund name header row */}
          <div style={{display:"grid",gridTemplateColumns:`repeat(${list.length},1fr)`,gap:12,marginBottom:20}}>
            {list.map((f,i)=>(
              <div key={f.code} style={{textAlign:"center",padding:"14px 12px",background:COLORS[i]+"08",borderRadius:14,border:`1.5px solid ${COLORS[i]}22`}}>
                <div style={{width:28,height:3,background:COLORS[i],borderRadius:2,margin:"0 auto 8px"}}/>
                <div style={{fontSize:10,color:COLORS[i],fontFamily:"monospace",fontWeight:700,marginBottom:4}}>{f.code}</div>
                <div style={{fontSize:12,fontWeight:700,color:C.text,lineHeight:1.4}}>{f.name}</div>
                {f._cat&&<span style={{marginTop:6,display:"inline-block",padding:"1px 8px",borderRadius:10,fontSize:10,background:COLORS[i]+"14",color:COLORS[i],fontWeight:600}}>{f._cat}</span>}
              </div>
            ))}
          </div>

          {view==="chart"?(
            /* ── Chart view ── */
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {metrics.map(({label,key,unit,higher,color})=>{
                const vals=list.map(f=>f[key]);
                const defined=vals.filter(v=>v!=null);
                if(defined.length===0) return null;
                const maxAbs=Math.max(...defined.map(v=>Math.abs(v)));
                const best=higher==="better"?Math.max(...defined):Math.min(...defined);
                return (
                  <div key={key} style={{background:C.bg,borderRadius:14,padding:"16px 18px",border:`1px solid ${C.border}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:color,flexShrink:0}}/>
                      <span style={{fontSize:12,fontWeight:700,color:C.textMuted}}>{label}</span>
                      <span style={{marginLeft:"auto",fontSize:10,color:C.textDim}}>{higher==="better"?"↑ 越高越好":"↓ 越低越好"}</span>
                    </div>
                    {list.map((f,i)=>{
                      const val=f[key];
                      if(val==null) return (
                        <div key={f.code} style={{marginBottom:12}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,alignItems:"center"}}>
                            <span style={{fontSize:11,color:COLORS[i],fontWeight:600}}>{f.code}</span>
                            <span style={{fontSize:11,color:C.textDim}}>—</span>
                          </div>
                          <div style={{height:7,background:C.borderLight,borderRadius:4}}/>
                        </div>
                      );
                      const pct=maxAbs>0?Math.abs(val)/maxAbs*100:0;
                      const isWinner=val===best;
                      const barColor=isWinner?color:COLORS[i];
                      return (
                        <div key={f.code} style={{marginBottom:i<list.length-1?14:0}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,alignItems:"center"}}>
                            <span style={{fontSize:11,color:COLORS[i],fontWeight:600,maxWidth:"60%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.code}</span>
                            <span style={{fontSize:13,fontWeight:800,color:isWinner?color:C.textMuted}}>
                              {val>0&&key==="ytd_return"?"+":""}{val}{unit}
                              {isWinner&&<span style={{marginLeft:4,fontSize:10,color:color}}>★</span>}
                            </span>
                          </div>
                          <div style={{height:7,background:C.borderLight,borderRadius:4,overflow:"hidden",position:"relative"}}>
                            <div style={{
                              position:"absolute",left:0,top:0,height:"100%",
                              width:`${pct}%`,
                              background:isWinner?`linear-gradient(90deg,${barColor}88,${barColor})`:`${barColor}66`,
                              borderRadius:4,
                              transition:"width 0.7s cubic-bezier(0.34,1.56,0.64,1)"
                            }}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Radar-style summary panel */}
              <div style={{gridColumn:"1/-1",background:`linear-gradient(135deg,${C.accent}08,${C.accentBg})`,borderRadius:14,padding:"18px 20px",border:`1.5px solid ${C.accent}18`}}>
                <div style={{fontSize:12,fontWeight:700,color:C.accent,marginBottom:14}}>综合评分对比</div>
                <div style={{display:"grid",gridTemplateColumns:`repeat(${list.length},1fr)`,gap:12}}>
                  {list.map((f,i)=>{
                    // Score: ytd_return (40%) + fee_rate invert (25%) + scale (15%) + track_error invert (20%)
                    const allYtd=list.map(x=>x.ytd_return||0), maxYtd=Math.max(...allYtd)||1;
                    const allFee=list.map(x=>x.fee_rate||0).filter(v=>v>0), maxFee=Math.max(...allFee)||1;
                    const allScale=list.map(x=>x.scale||0), maxScale=Math.max(...allScale)||1;
                    const allTE=list.map(x=>x.track_error||0).filter(v=>v>0), maxTE=Math.max(...allTE)||1;
                    const ytdScore=(f.ytd_return||0)/maxYtd*40;
                    const feeScore=f.fee_rate?((maxFee-(f.fee_rate||maxFee))/maxFee)*25:0;
                    const scaleScore=(f.scale||0)/maxScale*15;
                    const teScore=f.track_error?((maxTE-(f.track_error||maxTE))/maxTE)*20:0;
                    const total=Math.round(ytdScore+feeScore+scaleScore+teScore);
                    const allScores=list.map(g=>{
                      const ys=(g.ytd_return||0)/maxYtd*40;
                      const fs=g.fee_rate?((maxFee-(g.fee_rate||maxFee))/maxFee)*25:0;
                      const ss=(g.scale||0)/maxScale*15;
                      const ts=g.track_error?((maxTE-(g.track_error||maxTE))/maxTE)*20:0;
                      return Math.round(ys+fs+ss+ts);
                    });
                    const isTop=total===Math.max(...allScores);
                    return (
                      <div key={f.code} style={{textAlign:"center",padding:"16px 10px",background:isTop?COLORS[i]+"14":"#fff",borderRadius:12,border:`1.5px solid ${isTop?COLORS[i]:C.border}`,position:"relative"}}>
                        {isTop&&<div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:COLORS[i],color:"#fff",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:10}}>推荐</div>}
                        <div style={{fontSize:11,color:COLORS[i],fontWeight:700,marginBottom:8}}>{f.code}</div>
                        <div style={{fontSize:32,fontWeight:900,color:isTop?COLORS[i]:C.textMuted,lineHeight:1,marginBottom:4}}>{total}</div>
                        <div style={{fontSize:10,color:C.textDim}}>综合得分</div>
                        <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:3,textAlign:"left"}}>
                          {[
                            {n:"收益",v:Math.round(ytdScore),t:40},
                            {n:"费率",v:Math.round(feeScore),t:25},
                            {n:"规模",v:Math.round(scaleScore),t:15},
                            {n:"误差",v:Math.round(teScore),t:20},
                          ].map(({n,v,t})=>(
                            <div key={n} style={{display:"flex",alignItems:"center",gap:4}}>
                              <span style={{fontSize:9,color:C.textDim,width:22,flexShrink:0}}>{n}</span>
                              <div style={{flex:1,height:4,background:C.borderLight,borderRadius:2,overflow:"hidden"}}>
                                <div style={{height:"100%",width:`${v/t*100}%`,background:COLORS[i],borderRadius:2,opacity:0.7}}/>
                              </div>
                              <span style={{fontSize:9,color:C.textDim,width:18,textAlign:"right"}}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{fontSize:10,color:C.textDim,marginTop:12}}>
                  综合得分 = 近1年收益(40%) + 费率优势(25%) + 规模实力(15%) + 跟踪精度(20%)，仅供参考
                </div>
              </div>
            </div>
          ):(
            /* ── Table view ── */
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{borderBottom:`2px solid ${C.border}`}}>
                  <th style={{width:120,padding:"10px 12px",textAlign:"left",fontSize:11,fontWeight:600,color:C.textDim,letterSpacing:0.5,textTransform:"uppercase"}}>指标</th>
                  {list.map((f,i)=>(
                    <th key={f.code} style={{padding:"10px 12px",textAlign:"center",minWidth:180}}>
                      <div style={{fontSize:11,color:C.textDim,fontFamily:"monospace",marginBottom:4}}>{f.code}</div>
                      <div style={{fontSize:12,fontWeight:700,color:C.text,lineHeight:1.35,maxWidth:175,margin:"0 auto"}}>{f.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row,ri)=>(
                  <tr key={row.label} style={{background:ri%2===0?"#fafafa":"#fff"}}>
                    <td style={{padding:"11px 12px",fontSize:12,color:C.textMuted,fontWeight:600}}>{row.label}</td>
                    {list.map(f=>(
                      <td key={f.code} style={{padding:"11px 12px",textAlign:"center",fontSize:13,color:C.text}}>{row.fmt(f)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────

// ─── Admin Page ───────────────────────────────────────────────────────────────
function AdminPage() {
  const [status,setStatus]=useState(null);
  const [loading,setLoading]=useState(false);
  const [log,setLog]=useState([]);
  const trigger = async()=>{
    setLoading(true); setStatus(null);
    const t0=Date.now();
    const r=await apiFetch("/update");
    const elapsed=((Date.now()-t0)/1000).toFixed(1);
    if(r){setStatus({ok:r.status==="success",msg:r.message,elapsed});setLog(p=>[{time:new Date().toLocaleTimeString("zh-CN"),msg:r.message,ok:r.status==="success"},...p.slice(0,9)]);}
    else{setStatus({ok:false,msg:"无法连接后端 API",elapsed});}
    setLoading(false);
  };
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'SF Pro Display',-apple-system,sans-serif"}}>
      <div style={{width:"100%",maxWidth:520,padding:"0 24px"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:36,marginBottom:12}}>⚙️</div>
          <h1 style={{fontSize:22,fontWeight:800,color:C.text,margin:"0 0 6px",letterSpacing:-0.5}}>Wise<span style={{color:C.accent}}>ETF</span> 数据管理</h1>
          <p style={{color:C.textDim,fontSize:13,margin:0}}>手动触发数据更新，从天天基金网拉取最新数据</p>
        </div>
        <Card style={{padding:28,marginBottom:20}}>
          <div style={{fontSize:13,color:C.textMuted,marginBottom:20,lineHeight:1.9}}>
            <div>· 更新场外基金净值、涨幅、申购状态（41 只）</div>
            <div>· 更新场内 ETF 行情与溢价率</div>
            <div>· 预计耗时 2–3 分钟</div>
          </div>
          <button onClick={trigger} disabled={loading}
            style={{width:"100%",padding:"13px 0",borderRadius:10,border:"none",background:loading?C.borderLight:`linear-gradient(135deg,${C.accent},${C.accentDim})`,color:loading?C.textDim:"#fff",fontSize:15,fontWeight:700,cursor:loading?"wait":"pointer",transition:"all 0.2s",letterSpacing:0.3}}>
            {loading?"更新中，请稍候...":"立即更新数据"}
          </button>
        </Card>
        {status&&(
          <div style={{background:status.ok?C.greenBg:C.redBg,border:`1px solid ${status.ok?C.green:C.red}22`,borderRadius:12,padding:"12px 16px",marginBottom:16,fontSize:13}}>
            <span style={{color:status.ok?C.green:C.red,fontWeight:700}}>{status.ok?"✓ 成功":"✗ 失败"}</span>
            <span style={{color:C.textMuted,marginLeft:10}}>{status.msg} · {status.elapsed}s</span>
          </div>
        )}
        {log.length>0&&(
          <Card style={{padding:"16px 18px"}}>
            <div style={{fontSize:11,color:C.textDim,marginBottom:10,letterSpacing:0.6,textTransform:"uppercase",fontWeight:600}}>操作记录</div>
            {log.map((e,i)=>(
              <div key={i} style={{fontSize:12,color:C.textMuted,padding:"5px 0",borderBottom:i<log.length-1?`1px solid ${C.border}`:"none",display:"flex",gap:10}}>
                <span style={{color:C.textDim,fontFamily:"monospace"}}>{e.time}</span>
                <span style={{color:e.ok?C.green:C.red}}>{e.ok?"✓":"✗"}</span>
                <span>{e.msg}</span>
              </div>
            ))}
          </Card>
        )}
        <div style={{textAlign:"center",marginTop:20}}>
          <a href="/" style={{color:C.accent,fontSize:13,textDecoration:"none"}}>← 返回主站</a>
        </div>
      </div>
      <style>{`*{box-sizing:border-box}`}</style>
    </div>
  );
}

// ─── Guide Tab ────────────────────────────────────────────────────────────────
// 数据来源：stockanalysis.com · QQQ 截至 2026-04-16，VOO 截至 2026-03-31
const NDX_HOLDINGS = [
  {name:"英伟达",    ticker:"NVDA", pct:8.90, color:"#a04cf5"},
  {name:"苹果",      ticker:"AAPL", pct:7.14, color:"#3d82ff"},
  {name:"微软",      ticker:"MSFT", pct:5.76, color:"#14c8b4"},
  {name:"亚马逊",    ticker:"AMZN", pct:4.95, color:"#ff9a00"},
  {name:"Meta",      ticker:"META", pct:3.68, color:"#ff6b35"},
  {name:"谷歌A",     ticker:"GOOGL",pct:3.61, color:"#ffd60a"},
  {name:"特斯拉",    ticker:"TSLA", pct:3.58, color:"#ff3b30"},
  {name:"博通",      ticker:"AVGO", pct:3.49, color:"#26c258"},
  {name:"谷歌C",     ticker:"GOOG", pct:3.34, color:"#30d158"},
  {name:"沃尔玛",    ticker:"WMT",  pct:3.11, color:"#64d2ff"},
  {name:"其他",      ticker:"—",    pct:52.44,color:"#3a3f52"},
];
// 数据来源：stockanalysis.com · VOO 截至 2026-03-31
const SPX_HOLDINGS = [
  {name:"英伟达",    ticker:"NVDA", pct:7.58, color:"#a04cf5"},
  {name:"苹果",      ticker:"AAPL", pct:6.67, color:"#3d82ff"},
  {name:"微软",      ticker:"MSFT", pct:4.92, color:"#14c8b4"},
  {name:"亚马逊",    ticker:"AMZN", pct:3.64, color:"#ff9a00"},
  {name:"谷歌A",     ticker:"GOOGL",pct:3.00, color:"#ffd60a"},
  {name:"博通",      ticker:"AVGO", pct:2.63, color:"#26c258"},
  {name:"谷歌C",     ticker:"GOOG", pct:2.40, color:"#30d158"},
  {name:"Meta",      ticker:"META", pct:2.24, color:"#ff6b35"},
  {name:"特斯拉",    ticker:"TSLA", pct:1.87, color:"#ff3b30"},
  {name:"伯克希尔",  ticker:"BRK.B",pct:1.57, color:"#64d2ff"},
  {name:"其他",      ticker:"—",    pct:63.48,color:"#3a3f52"},
];
const INVEST_METHODS = [
  {
    id:"qdii",
    label:"场外QDII",
    sublabel:"支付宝/天天基金",
    icon:"📱",
    color:"#ff9a00",
    ndx:{product:"161130 易方达纳指联接(QDII)",fee:"0.60%/年 + 申购费1.2%",limit:"日限额仅10元",premium:"T+3到账，价格滞后",minBuy:"10元起"},
    spx:{product:"161125 易方达标普500(QDII)",fee:"0.70%/年 + 申购费1.2%",limit:"日限额受限",premium:"T+3到账，价格滞后",minBuy:"10元起"},
    pros:["门槛极低10元起","支付宝/天天基金直接操作","无需开股票账户"],
    cons:["日限额极低（仅10元），实际可买入极少","T+3到账，价格滞后无法实时买卖","综合持有成本最高"],
    cta:{label:"天天基金 / 支付宝",url:null,tip:"搜索「161130」或「161125」直接购买"},
  },
  {
    id:"exchange",
    label:"场内ETF",
    sublabel:"A股证券账户交易",
    icon:"🏦",
    color:"#3d82ff",
    ndx:{product:"159659 招商纳斯达克100ETF",fee:"0.65%/年（管理0.50%+托管0.15%）",limit:"无限额，随时交易",premium:"溢价波动较大",minBuy:"约100元起"},
    spx:{product:"513500 博时标普500ETF",fee:"0.80%/年（管理0.60%+托管0.20%）",limit:"无限额，随时交易",premium:"溢价波动较大",minBuy:"约100元起"},
    pros:["人民币直接买入，无需外汇额度","无限额，随时交易","国内券商App操作简便"],
    cons:["溢价率波动大，溢价高时买入即亏损","费率偏高（0.65–0.80%/年）","需开通证券账户"],
    cta:{label:"开通国内券商",url:null,tip:"推荐华泰证券、东方财富，费率较低"},
  },
  {
    id:"us",
    label:"美股直购",
    sublabel:"QQQ / VOO",
    icon:"🚀",
    color:"#26c258",
    ndx:{product:"QQQ (Invesco)",fee:"0.20%/年",limit:"无限额，随时买卖",premium:"无溢价，实时净值",minBuy:"约¥3,200/股起"},
    spx:{product:"VOO (Vanguard)",fee:"0.03%/年",limit:"无限额，随时买卖",premium:"无溢价，实时净值",minBuy:"约¥3,700/股起"},
    pros:["费率最低（VOO仅0.03%）","无溢价无限额","直接拥有美股资产"],
    cons:["需开海外券商账户","需使用外汇额度（年5万美元）","需了解基本英文操作"],
    cta:{label:"开通复星证券",url:"https://www.fxiaoke.com",tip:"支持港股+美股，适合内地用户"},
  },
];

// 生成费率损耗数据：初始10000，毛收益10%，25年
function buildFeeDragData(upfront, annualFee) {
  const gross = 0.10;
  const data = [];
  for (let y = 0; y <= 25; y++) {
    const val = Math.round(10000 * (1 - upfront) * Math.pow(1 + gross - annualFee, y));
    data.push(val);
  }
  return data;
}
// ── DCA 模拟：首投10万 + 每月5000，持续20年，假设毛收益10%/年
// 场外QDII：5%备付金不参与投资（监管要求流动性储备），年费0.60%
// 场内ETF ：每笔买入溢价1.5%即时损耗，年费0.72%
// QQQ     ：全额投入，年费0.20%
// VOO     ：全额投入，年费0.03%
const DCA_STRATEGIES = {
  nasdaq: [
    {name:"场外QDII", key:"qdii", investRatio:0.95, annualFee:0.006,  premiumPerBuy:0,     color:"#ff9a00",
     note:"5%备付金不投入 + 0.60%/年管理费"},
    {name:"场内ETF",  key:"etf",  investRatio:1.0,  annualFee:0.0072, premiumPerBuy:0.015, color:"#3d82ff",
     note:"每笔买入溢价1.5%损耗 + 0.72%/年管理费"},
    {name:"QQQ",      key:"qqq",  investRatio:1.0,  annualFee:0.002,  premiumPerBuy:0,     color:"#26c258",
     note:"全额投入 + 0.20%/年管理费"},
  ],
  sp500: [
    {name:"场外QDII", key:"qdii", investRatio:0.95, annualFee:0.007,  premiumPerBuy:0,     color:"#ff9a00",
     note:"5%备付金不投入 + 0.70%/年管理费"},
    {name:"场内ETF",  key:"etf",  investRatio:1.0,  annualFee:0.008,  premiumPerBuy:0.015, color:"#3d82ff",
     note:"每笔买入溢价1.5%损耗 + 0.80%/年管理费"},
    {name:"VOO",      key:"voo",  investRatio:1.0,  annualFee:0.0003, premiumPerBuy:0,     color:"#14c8b4",
     note:"全额投入 + 0.03%/年管理费"},
  ],
};

const LUMP_SUM        = 100000; // 首投10万
const MONTHLY         = 5000;   // 每月定投5000
const GROSS_RATE      = { nasdaq: 0.13, sp500: 0.10 }; // 纳指13%，标普10%
const DCA_YEARS       = 20;

// 逐月模拟DCA，返回每年末资产值（含第0年=初始投入后）
function simulateDCA(strategy, grossRate) {
  const monthlyGross = Math.pow(1 + grossRate, 1/12) - 1;
  const monthlyFee   = strategy.annualFee / 12;
  const net          = monthlyGross - monthlyFee;
  // 首投：备付金比例 + 溢价损耗
  let value = LUMP_SUM * strategy.investRatio * (1 - strategy.premiumPerBuy);
  const result = [{ yr: 0, val: Math.round(value) }];
  for (let m = 1; m <= DCA_YEARS * 12; m++) {
    const contrib = MONTHLY * strategy.investRatio * (1 - strategy.premiumPerBuy);
    value = value * (1 + net) + contrib;
    if (m % 12 === 0) result.push({ yr: m / 12, val: Math.round(value) });
  }
  return result;
}

// 预计算所有策略的年度数据，合并为图表rows
const DCA_CHART_DATA = (() => {
  const rows = Array.from({length: DCA_YEARS + 1}, (_, y) => ({
    year: y === 0 ? "首投" : `${y}年`,
  }));
  ["nasdaq","sp500"].forEach(idx => {
    DCA_STRATEGIES[idx].forEach(s => {
      const series = simulateDCA(s, GROSS_RATE[idx]);
      series.forEach(({yr, val}) => { rows[yr][`${idx}_${s.key}`] = val; });
    });
  });
  // 实际投入本金参考线
  rows.forEach((r, y) => {
    r.invested = Math.round(LUMP_SUM + MONTHLY * 12 * y);
  });
  return rows;
})();

// 总投入本金
const TOTAL_INVESTED = LUMP_SUM + MONTHLY * 12 * DCA_YEARS;

function FeeDragChart({index, isMobile}) {
  const strategies = DCA_STRATEGIES[index];
  const title    = index === "nasdaq" ? "纳指100 · 定投20年资产对比" : "标普500 · 定投20年资产对比";
  const usLabel  = strategies[2].name;
  const fmtW     = v => `${(v / 10000).toFixed(1)}万`;

  const finalY   = DCA_YEARS;
  const best     = DCA_CHART_DATA[finalY][`${index}_${strategies[2].key}`];
  const worst    = DCA_CHART_DATA[finalY][`${index}_${strategies[0].key}`];
  const mid      = DCA_CHART_DATA[finalY][`${index}_${strategies[1].key}`];
  const diff     = best - worst;
  const diffPct  = Math.round(diff / worst * 100);

  return (
    <Card style={{padding:"22px 24px"}}>
      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:2}}>{title}</div>
      <div style={{fontSize:11,color:C.textDim,marginBottom:14}}>
        首投 10万 + 每月定投 5,000元 · 持续20年 · 假设毛收益 {index==="nasdaq"?"13%":"10%"}/年
      </div>

      {/* 20年末终值卡片 */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
        {strategies.map(s => {
          const val = DCA_CHART_DATA[finalY][`${index}_${s.key}`];
          const isBest = s.key === strategies[2].key;
          return (
            <div key={s.key} style={{padding:"10px 12px",borderRadius:10,
              background: isBest ? s.color+"18" : s.color+"0c",
              border:`1px solid ${s.color}${isBest?"50":"25"}`}}>
              <div style={{fontSize:11,fontWeight:700,color:s.color,marginBottom:2}}>{s.name}</div>
              <div style={{fontSize:18,fontWeight:800,color:s.color,letterSpacing:-0.5}}>{fmtW(val)}</div>
              <div style={{fontSize:9,color:C.textDim,marginTop:2}}>20年后</div>
            </div>
          );
        })}
      </div>

      {/* 成本说明 */}
      <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:14}}>
        {strategies.map(s => (
          <div key={s.key} style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:C.textMuted}}>
            <div style={{width:10,height:3,borderRadius:2,background:s.color,flexShrink:0}}/>
            <span style={{fontWeight:600,color:s.color}}>{s.name}</span>
            <span>{s.note}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={DCA_CHART_DATA} margin={{top:4,right:8,left:4,bottom:0}}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.borderLight} vertical={false}/>
          <XAxis dataKey="year" tick={{fill:C.textDim,fontSize:9}} axisLine={false} tickLine={false}
            ticks={["首投","5年","10年","15年","20年"]}/>
          <YAxis tick={{fill:C.textDim,fontSize:9}} axisLine={false} tickLine={false}
            tickFormatter={v=>`${(v/10000).toFixed(0)}万`} width={36}/>
          <Tooltip
            formatter={(v, n) => [`¥${v.toLocaleString()}`, n === "已投本金" ? n : n]}
            contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}}/>
          <Legend wrapperStyle={{fontSize:10,paddingTop:8}}/>
          {/* 已投本金参考线 */}
          <Line dataKey="invested" name="已投本金" stroke={C.borderLight} strokeWidth={1.5}
            strokeDasharray="4 3" dot={false} legendType="plainline"/>
          {strategies.map(s => (
            <Line key={s.key} type="monotone" dataKey={`${index}_${s.key}`}
              name={s.name} stroke={s.color} strokeWidth={2.5} dot={false}
              activeDot={{r:4, fill:s.color}}/>
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* 差距总结 */}
      <div style={{marginTop:12,padding:"12px 14px",borderRadius:10,
        background:`linear-gradient(135deg,${strategies[2].color}0a,${strategies[2].color}18)`,
        border:`1px solid ${strategies[2].color}30`}}>
        <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:4}}>
          20年后 {usLabel} 比场外QDII 多赚
          <span style={{color:strategies[2].color,fontSize:16,marginLeft:6}}>
            ¥{diff.toLocaleString()}
          </span>
          <span style={{color:C.textMuted,fontSize:11,marginLeft:4}}>（多 {diffPct}%）</span>
        </div>
        <div style={{fontSize:11,color:C.textMuted}}>
          总投入本金 {fmtW(TOTAL_INVESTED)} · 场外QDII到手 {fmtW(worst)} · 场内ETF到手 {fmtW(mid)}
        </div>
      </div>
    </Card>
  );
}

function HoldingsChart({data, title, isMobile}) {
  const top10 = data.slice(0, data.length);
  const maxPct = Math.max(...top10.filter(d=>d.ticker!=="—").map(d=>d.pct));
  return (
    <Card style={{padding:"20px 22px"}}>
      <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:2}}>{title} · 核心持仓</div>
      <div style={{fontSize:11,color:C.textDim,marginBottom:16}}>QQQ 截至 2026-04-16 · VOO 截至 2026-03-31 · 来源 stockanalysis.com</div>
      <div style={{display:"flex",gap:isMobile?12:20,alignItems:"flex-start",flexDirection:isMobile?"column":"row"}}>
        {/* Donut */}
        <div style={{flexShrink:0}}>
          <PieChart width={140} height={140}>
            <Pie data={top10} cx={65} cy={65} innerRadius={42} outerRadius={65}
              dataKey="pct" strokeWidth={1} stroke="transparent" paddingAngle={1}>
              {top10.map((d,i)=><Cell key={i} fill={d.color}/>)}
            </Pie>
            <Tooltip formatter={(v,n,p)=>[`${v}%`, p.payload.name]} contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}}/>
          </PieChart>
          <div style={{display:"flex",flexDirection:"column",gap:4,marginTop:4}}>
            {top10.slice(0,6).map(d=>(
              <div key={d.ticker} style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:8,height:8,borderRadius:2,background:d.color,flexShrink:0}}/>
                <span style={{fontSize:10,color:C.textMuted,flex:1}}>{d.name}</span>
                <span style={{fontSize:10,color:C.text,fontWeight:600}}>{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>
        {/* Bar list */}
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:7}}>
          {top10.slice(0,10).map(d=>(
            <div key={d.ticker}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:12,fontWeight:600,color:C.text}}>{d.name}</span>
                  <span style={{fontSize:10,color:C.textDim,fontFamily:"monospace"}}>{d.ticker}</span>
                </div>
                <span style={{fontSize:12,fontWeight:700,color:d.color}}>{d.pct}%</span>
              </div>
              <div style={{height:5,borderRadius:3,background:C.borderLight,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${d.pct/maxPct*100}%`,background:d.color,borderRadius:3,transition:"width 0.8s ease"}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function GuideTab({isMobile}) {
  const [activeMethod, setActiveMethod] = useState("us");
  return (
    <div>
      {/* ── Section 1: 指数简介 ── */}
      <SectionHeader title="指数诞生与发展" color={C.accent}/>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?12:20,marginBottom:isMobile?24:36}}>
        {/* NDX100 */}
        <Card style={{padding:"22px 24px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <div style={{width:36,height:36,borderRadius:10,background:C.accent+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📈</div>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:C.text}}>纳斯达克100</div>
              <div style={{fontSize:11,color:C.textDim}}>Nasdaq-100 · ^NDX</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            {[
              {label:"创立时间",value:"1985年1月31日"},
              {label:"指数年龄",value:"40年历史"},
              {label:"成份股数",value:"100只"},
              {label:"行业特征",value:"非金融科技"},
            ].map(s=>(
              <div key={s.label} style={{padding:"10px 12px",borderRadius:10,background:C.bgAlt}}>
                <div style={{fontSize:10,color:C.textDim,marginBottom:3}}>{s.label}</div>
                <div style={{fontSize:13,fontWeight:700,color:C.text}}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:12,color:C.textMuted,lineHeight:1.7,padding:"12px 14px",borderRadius:10,background:C.accent+"08",border:`1px solid ${C.accent}20`}}>
            由纳斯达克交易所于 1985 年创立，追踪在纳斯达克上市的 100 家最大非金融企业。以科技股为主，苹果、英伟达、微软等科技巨头贡献超过 35% 权重，是全球最具代表性的科技成长指数。代表性 ETF 为 <strong style={{color:C.accent}}>QQQ</strong>（1999年上市，管理规模超2000亿美元）。
          </div>
        </Card>
        {/* SPX500 */}
        <Card style={{padding:"22px 24px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <div style={{width:36,height:36,borderRadius:10,background:C.cyan+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🏛️</div>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:C.text}}>标准普尔500</div>
              <div style={{fontSize:11,color:C.textDim}}>S&P 500 · ^GSPC</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            {[
              {label:"创立时间",value:"1957年3月4日"},
              {label:"指数年龄",value:"68年历史"},
              {label:"成份股数",value:"500只"},
              {label:"行业特征",value:"全市场均衡"},
            ].map(s=>(
              <div key={s.label} style={{padding:"10px 12px",borderRadius:10,background:C.bgAlt}}>
                <div style={{fontSize:10,color:C.textDim,marginBottom:3}}>{s.label}</div>
                <div style={{fontSize:13,fontWeight:700,color:C.text}}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:12,color:C.textMuted,lineHeight:1.7,padding:"12px 14px",borderRadius:10,background:C.cyan+"08",border:`1px solid ${C.cyan}20`}}>
            由标准普尔公司于 1957 年创立（前身 S&P 90 可追溯到 1926 年），追踪美国 500 家大市值上市公司，覆盖全市场约 80% 市值。行业多元，科技、医疗、金融、消费均有涵盖，是衡量美国股市整体表现的黄金基准。代表性 ETF 为 <strong style={{color:C.cyan}}>VOO</strong>（2010年上市，费率仅 0.03%）。
          </div>
        </Card>
      </div>

      {/* ── Section 2: 核心持仓 ── */}
      <SectionHeader title="核心持仓占比" color={C.purple}/>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?12:20,marginBottom:isMobile?24:36}}>
        <HoldingsChart data={NDX_HOLDINGS} title="纳斯达克100" isMobile={isMobile}/>
        <HoldingsChart data={SPX_HOLDINGS} title="标普500" isMobile={isMobile}/>
      </div>

      {/* ── Section 3: 投资方式对比 ── */}
      <SectionHeader title="三种投资方式对比" subtitle="场外QDII · 场内ETF · 美股直购" color={C.green}/>

      {/* Method selector */}
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        {INVEST_METHODS.map(m=>(
          <button key={m.id} onClick={()=>setActiveMethod(m.id)}
            style={{padding:"8px 18px",borderRadius:20,border:`1px solid ${activeMethod===m.id?m.color:C.border}`,
              background:activeMethod===m.id?m.color+"18":"transparent",
              color:activeMethod===m.id?m.color:C.textMuted,
              fontSize:13,fontWeight:activeMethod===m.id?700:400,cursor:"pointer",transition:"all 0.2s"}}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Comparison cards */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:isMobile?12:16,marginBottom:isMobile?24:36,alignItems:"start"}}>
        {INVEST_METHODS.map(m=>{
          const isActive = activeMethod === m.id;
          return (
            <Card key={m.id} onClick={()=>setActiveMethod(m.id)} style={{
              padding:"20px 22px",cursor:"pointer",
              border:`1px solid ${isActive?m.color+"80":C.border}`,
              background:isActive?m.color+"08":C.card,
              transition:"transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, opacity 0.25s ease",
              transform: isActive?"translateY(-10px) scale(1.03)":"scale(0.97)",
              boxShadow: isActive?`0 12px 32px ${m.color}25`:"none",
              zIndex: isActive?1:0,
              position:"relative",
            }}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <span style={{fontSize:22}}>{m.icon}</span>
                <div>
                  <div style={{fontSize:16,fontWeight:700,color:isActive?m.color:C.text}}>{m.label}</div>
                  <div style={{fontSize:12,fontWeight:500,color:C.textMuted}}>{m.sublabel}</div>
                </div>
                {isActive&&<div style={{marginLeft:"auto",width:8,height:8,borderRadius:"50%",background:m.color}}/>}
              </div>
              {/* NDX row */}
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11,color:C.accent,fontWeight:700,marginBottom:5}}>纳指100</div>
                <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>{m.ndx.product}</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <span style={{fontSize:11,padding:"3px 8px",borderRadius:6,background:C.bgAlt,color:C.text,fontWeight:600}}>费率 {m.ndx.fee}</span>
                  <span style={{fontSize:11,padding:"3px 8px",borderRadius:6,background:C.bgAlt,color:C.text,fontWeight:600}}>起购 {m.ndx.minBuy}</span>
                </div>
              </div>
              {/* SPX row */}
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12,marginBottom:14}}>
                <div style={{fontSize:11,color:C.cyan,fontWeight:700,marginBottom:5}}>标普500</div>
                <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>{m.spx.product}</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <span style={{fontSize:11,padding:"3px 8px",borderRadius:6,background:C.bgAlt,color:C.text,fontWeight:600}}>费率 {m.spx.fee}</span>
                  <span style={{fontSize:11,padding:"3px 8px",borderRadius:6,background:C.bgAlt,color:C.text,fontWeight:600}}>起购 {m.spx.minBuy}</span>
                </div>
              </div>
              {/* Pros/Cons */}
              <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:16}}>
                {m.pros.map((p,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:6,fontSize:12,color:C.text,fontWeight:500}}>
                    <span style={{color:C.green,marginTop:1,flexShrink:0,fontWeight:700}}>✓</span>{p}
                  </div>
                ))}
                {m.cons.map((p,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:6,fontSize:12,color:C.textMuted,fontWeight:500}}>
                    <span style={{color:"#ff6b6b",marginTop:1,flexShrink:0,fontWeight:700}}>✗</span>{p}
                  </div>
                ))}
              </div>
              {/* CTA */}
              <div style={{padding:"12px 14px",borderRadius:10,background:m.color+"15",border:`1px solid ${m.color}40`}}>
                <div style={{fontSize:13,fontWeight:700,color:m.color,marginBottom:3}}>{m.cta.label}</div>
                <div style={{fontSize:11,fontWeight:500,color:C.text}}>{m.cta.tip}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Fee drag chart */}
      <SectionHeader title="定投20年资产对比" subtitle="首投10万 + 每月5,000元定投 · 持续20年 · 纳指假设13%/年 · 标普假设10%/年" color={C.orange}/>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?12:20,marginBottom:isMobile?24:36}}>
        <FeeDragChart index="nasdaq" isMobile={isMobile}/>
        <FeeDragChart index="sp500"  isMobile={isMobile}/>
      </div>

      {/* Broker CTA */}
      <SectionHeader title="开户引导" subtitle="选择适合你的投资渠道" color={C.accent}/>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?12:20,marginBottom:isMobile?24:40}}>
        <Card style={{padding:"22px 24px",border:`1px solid ${C.green}30`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <div style={{width:36,height:36,borderRadius:10,background:C.green+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🚀</div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:C.text}}>美股直购 · QQQ / VOO</div>
              <div style={{fontSize:11,color:C.textDim}}>费率最低 · 无限额 · 无溢价</div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:16}}>
            {[
              {icon:"🎯","text":"港股 · 美股终身零佣金"},
              {icon:"📜","text":"美债零佣金，平台费全免"},
              {icon:"₿", "text":"可交易加密 ETF（BTC/ETH 现货 ETF）"},
              {icon:"🇨🇳","text":"支持内地用户开户，港股 + 美股一体"},
              {icon:"💱","text":"每年外汇额度 5 万美元，长期定投足够"},
            ].map((t,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:500,color:C.text}}>
                <span style={{fontSize:14,width:20,textAlign:"center",flexShrink:0}}>{t.icon}</span>{t.text}
              </div>
            ))}
          </div>
          <a href="https://www.wise-invest.org/articles/broker/sQSbLRe8" target="_blank" rel="noopener noreferrer"
            style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"12px 16px",borderRadius:10,
              background:`linear-gradient(135deg,${C.green}15,${C.green}25)`,
              border:`1px solid ${C.green}50`,textDecoration:"none",cursor:"pointer",
              transition:"all 0.2s"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:16}}>📖</span>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:C.green}}>复星证券开户教程</div>
                <div style={{fontSize:11,color:C.textMuted,marginTop:1}}>手把手图文指南，10分钟完成开户</div>
              </div>
            </div>
            <span style={{fontSize:12,fontWeight:700,color:C.green,whiteSpace:"nowrap",marginLeft:12}}>查看教程 →</span>
          </a>
        </Card>
        <GalaxyCard isMobile={isMobile}/>
      </div>

      <div style={{padding:"14px 18px",borderRadius:12,background:C.bgAlt,border:`1px solid ${C.border}`,fontSize:11,color:C.textDim,lineHeight:1.7,marginBottom:8}}>
        ⚠️ 以上信息仅供参考，不构成投资建议。ETF 持仓权重随市场波动实时变化，实际费率以各产品最新公告为准。投资有风险，请在充分了解产品特征后谨慎决策。
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS=[
  {id:"guide",     label:"核心介绍"},
  {id:"nasdaq",    label:"纳指被动"},
  {id:"sp500",     label:"标普500"},
  {id:"etf",       label:"场内ETF"},
  {id:"active",    label:"美股主动"},
  {id:"lazy",      label:"懒人组合", href:"/lazy"},
  {id:"qdii",      label:"估值",     href:"/qdii"},
  {id:"export",    label:"导出数据", href:"/export"},
];

// ─── Canvas Export Utilities ──────────────────────────────────────────────────
const EC={
  bg:'#07090f',card:'#0d1320',dim:'#131d2e',border:'#182033',head:'#0b1524',
  blue:'#3d82ff',green:'#26c258',red:'#ff3b30',orange:'#ff9a00',
  purple:'#a04cf5',cyan:'#14c8b4',white:'#edf0f9',muted:'#5e6270',
  F:'"PingFang SC","Microsoft YaHei","Helvetica Neue",Arial,sans-serif',
};

function _rr(c,x,y,w,h,r=8){
  c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.arcTo(x+w,y,x+w,y+r,r);
  c.lineTo(x+w,y+h-r);c.arcTo(x+w,y+h,x+w-r,y+h,r);c.lineTo(x+r,y+h);
  c.arcTo(x,y+h,x,y+h-r,r);c.lineTo(x,y+r);c.arcTo(x,y,x+r,y,r);c.closePath();
}

function _fit(c,v,maxW){
  if(v==null)return'—';const s=String(v);
  if(c.measureText(s).width<=maxW)return s;
  let t=s;while(t.length>1&&c.measureText(t+'…').width>maxW)t=t.slice(0,-1);
  return t+'…';
}

// ─── Overview Canvas 1: 市场温度与估值 ─────────────────────────────────────
function drawOverviewCanvas1({sentiment, peHistory}){
  const W=1000,SC=2,PX=28,GAP=14;
  const F=EC.F;
  const L={
    bg:'#f8fafc',card:'#ffffff',headBg:'#f0f6ff',
    border:'#dde3f0',
    blue:'#1a56db',cyan:'#0369a1',green:'#16a34a',
    red:'#dc2626',orange:'#ea580c',purple:'#7c3aed',
    dark:'#0f172a',mid:'#374151',dim:'#6b7280',muted:'#9ca3af',
  };
  const vix=sentiment?.vix, fg=sentiment?.fear_greed, pe=sentiment?.pe, nqPe=sentiment?.nasdaq_pe;
  const BRAND_H=60,SENT_H=140,TEMP_H=230,REF_H=290,CHART_H=280,FOOTER_H=56;
  const H=BRAND_H+SENT_H+TEMP_H+REF_H+CHART_H+FOOTER_H;
  const cvs=document.createElement('canvas');
  cvs.width=W*SC;cvs.height=H*SC;
  const c=cvs.getContext('2d');c.scale(SC,SC);
  c.fillStyle=L.bg;c.fillRect(0,0,W,H);

  // ── Brand header ──
  const ag=c.createLinearGradient(0,0,W,0);
  ag.addColorStop(0,'#1a56db');ag.addColorStop(1,'#7c3aed');
  c.fillStyle=ag;c.fillRect(0,0,W,5);
  c.fillStyle=L.headBg;c.fillRect(0,5,W,BRAND_H-5);
  c.font=`bold 16px ${F}`;c.fillStyle=L.blue;c.fillText('Wise ETF',PX,34);
  c.font=`bold 14px ${F}`;c.fillStyle=L.mid;c.fillText('市场温度与估值',PX+88,34);
  const today=new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'});
  c.font=`12px ${F}`;c.fillStyle=L.muted;c.fillText(today,PX,52);

  // ── Section 1: 市场情绪4卡片 ──
  const sentY=BRAND_H+16;
  const ic4W=(W-PX*2-GAP*3)/4,ic4H=108;
  const drawSentCard=(x,y,w,h,title,value,label,col,barPct,sub)=>{
    _rr(c,x,y,w,h,10);c.fillStyle=L.card;c.fill();
    c.strokeStyle=L.border;c.lineWidth=0.5;c.stroke();
    const tg=c.createLinearGradient(x,y,x+w,y);
    tg.addColorStop(0,col);tg.addColorStop(1,col+'88');
    _rr(c,x,y,w,4,2);c.fillStyle=tg;c.fill();
    c.font=`bold 10px ${F}`;c.fillStyle=L.dim;c.textAlign='center';c.fillText(title,x+w/2,y+18);
    c.font=`bold 20px ${F}`;c.fillStyle=col;c.fillText(String(value??'--'),x+w/2,y+44);
    c.font=`bold 11px ${F}`;c.fillStyle=col;c.fillText(label||'--',x+w/2,y+60);
    if(barPct!=null){
      const bx=x+12,by=y+70,bw=w-24;
      _rr(c,bx,by,bw,4,2);c.fillStyle=L.border;c.fill();
      _rr(c,bx,by,bw*Math.min(barPct/100,1),4,2);c.fillStyle=col;c.fill();
    }
    if(sub){c.font=`9px ${F}`;c.fillStyle=L.muted;c.fillText(sub,x+w/2,y+h-8);}
    c.textAlign='left';
  };
  const vixVal=vix?.value;
  const vixCol=!vixVal?L.muted:vixVal>=40?L.red:vixVal>=30?'#ff6b35':vixVal>=20?L.orange:L.green;
  const vixLbl=!vixVal?'--':vixVal>=40?'极度恐慌':vixVal>=30?'高度恐慌':vixVal>=20?'市场警惕':vixVal>=12?'相对平静':'极度平静';
  const fgScore=fg?.score;
  const fgCol=fgScore==null?L.muted:fgScore<=25?L.red:fgScore<=45?L.orange:fgScore<=55?L.dim:fgScore<=75?L.green:'#15803d';
  const fgLblMap={'extreme fear':'极度恐慌','fear':'恐慌','neutral':'中性','greed':'贪婪','extreme greed':'极度贪婪'};
  const fgLbl=fgLblMap[(fg?.rating||'').toLowerCase()]||fg?.rating||'--';
  const peCol=!pe?L.muted:pe.percentile>=85?L.red:pe.percentile>=70?L.orange:pe.percentile>=45?L.dim:L.green;
  const peLbl=!pe?'--':pe.percentile>=85?'高估':pe.percentile>=70?'偏高':pe.percentile>=45?'合理':'低估';
  const nqPeCol=!nqPe?L.muted:nqPe.percentile>=85?L.red:nqPe.percentile>=70?L.orange:nqPe.percentile>=45?L.dim:L.green;
  const nqPeLbl=!nqPe?'--':nqPe.percentile>=85?'高估':nqPe.percentile>=70?'偏高':nqPe.percentile>=45?'合理':'低估';
  drawSentCard(PX,sentY,ic4W,ic4H,'VIX 恐慌指数',vixVal??'--',vixLbl,vixCol,vixVal?Math.min(vixVal/60*100,100):null,vixVal?`今日${vix.change_pct!=null?(vix.change_pct>=0?'+':'')+vix.change_pct+'%':''}`:null);
  drawSentCard(PX+ic4W+GAP,sentY,ic4W,ic4H,'CNN 恐慌贪婪',fgScore??'--',fgLbl,fgCol,fgScore,fg?.previous_close!=null?`昨收 ${fg.previous_close}`:null);
  drawSentCard(PX+(ic4W+GAP)*2,sentY,ic4W,ic4H,'标普500 PE分位',pe?`${pe.pe}x`:'--',peLbl,peCol,pe?.percentile,pe?`历史${pe.percentile}%分位`:null);
  drawSentCard(PX+(ic4W+GAP)*3,sentY,ic4W,ic4H,'纳指100 PE分位',nqPe?`${nqPe.pe}x`:'--',nqPeLbl,nqPeCol,nqPe?.percentile,nqPe?`历史${nqPe.percentile}%分位`:null);

  // ── Section 2: 综合市场温度 ──
  const tempY=BRAND_H+SENT_H;
  c.strokeStyle=L.border;c.lineWidth=1;c.beginPath();c.moveTo(0,tempY);c.lineTo(W,tempY);c.stroke();
  c.fillStyle=L.bg;c.fillRect(0,tempY,W,TEMP_H);
  c.fillStyle=L.blue;c.fillRect(PX,tempY+14,3,16);
  c.font=`bold 13px ${F}`;c.fillStyle=L.dark;c.fillText('综合市场温度',PX+10,tempY+26);
  c.font=`10px ${F}`;c.fillStyle=L.muted;c.fillText('标普/纳指PE分位 + 恐慌贪婪 + VIX 四因子合并信号',PX+10,tempY+42);
  const spScore=!pe?null:pe.percentile>=85?2:pe.percentile>=70?1:pe.percentile>=45?0:-1;
  const nqScore=nqPe?.percentile==null?null:nqPe.percentile>=85?2:nqPe.percentile>=70?1:nqPe.percentile>=45?0:-1;
  const fgScoreV=fgScore==null?null:fgScore>=75?2:fgScore>=55?1:fgScore>=45?0:fgScore>=25?-1:-2;
  const vixScoreV=!vix?null:vixVal>=40?-2:vixVal>=30?-1:vixVal>=12?0:1;
  const peAvg=spScore!==null&&nqScore!==null?(spScore+nqScore)/2:spScore!==null?spScore:nqScore;
  const total=peAvg!==null&&fgScoreV!==null&&vixScoreV!==null?Math.round(peAvg+fgScoreV+vixScoreV):null;
  const signal=total===null?null
    :total>=4?{label:"极度危险",   sub:"两大指数PE极端高估 + 情绪极度贪婪，历史上接近阶段顶部",color:L.red}
    :total>=2?{label:"偏高风险",   sub:"估值偏贵、情绪乐观，建议谨慎加仓",color:'#ff6b35'}
    :total>=0?{label:"中性偏谨慎", sub:"信号混合，维持正常仓位，注意止损",color:L.orange}
    :total>=-2?{label:"中性",      sub:"估值合理或恐慌情绪偏高，可正常操作",color:L.dim}
    :{label:"潜在机会区",sub:"多项指标显示市场恐慌，历史上往往是左侧机会",color:L.green};
  const barPctT=total!==null?Math.round((total+5)/10*100):null;
  if(signal){
    c.font=`bold 28px ${F}`;c.fillStyle=signal.color;c.textAlign='center';c.fillText(signal.label,W/2,tempY+78);
    c.font=`11px ${F}`;c.fillStyle=L.dim;c.fillText(signal.sub,W/2,tempY+96);
    c.textAlign='left';
    const bx=PX+60,by=tempY+112,bw=W-PX*2-120;
    _rr(c,bx,by,bw,10,5);
    const barGrad=c.createLinearGradient(bx,0,bx+bw,0);
    barGrad.addColorStop(0,'#1a9e4a');barGrad.addColorStop(0.5,'#c4570a');barGrad.addColorStop(1,'#d93025');
    c.fillStyle=barGrad;_rr(c,bx,by,bw,10,5);c.fill();
    if(barPctT!=null){
      const ix=bx+bw*(barPctT/100);
      _rr(c,ix-4,by-4,8,18,3);c.fillStyle='#fff';c.fill();
      c.strokeStyle=signal.color;c.lineWidth=2;_rr(c,ix-4,by-4,8,18,3);c.stroke();
    }
    c.font=`9px ${F}`;c.fillStyle=L.muted;
    c.textAlign='left';c.fillText('机会区',bx,by+26);
    c.textAlign='center';c.fillText('中性',bx+bw/2,by+26);
    c.textAlign='right';c.fillText('危险区',bx+bw,by+26);
    c.textAlign='left';
  }
  const scoreColor2=s=>s===null?L.muted:s>=2?L.red:s>=1?'#ff6b35':s===0?L.muted:L.green;
  const indicators2=[
    {name:"标普500 PE",score:spScore,desc:spScore===null?"--":spScore>=2?"极度高估":spScore>=1?"偏高":"合理/低估",detail:pe?`${pe.percentile}%分位 · ${pe.pe}x`:""},
    {name:"纳指100 PE",score:nqScore,desc:nqScore===null?"--":nqScore>=2?"极度高估":nqScore>=1?"偏高":"合理/低估",detail:nqPe?.pe!=null?`${nqPe.percentile}%分位 · ${nqPe.pe}x`:""},
    {name:"恐慌贪婪",  score:fgScoreV,desc:fgScoreV===null?"--":fgScoreV>=2?"极度贪婪":fgScoreV>=1?"贪婪":fgScoreV<=-1?"恐慌":"中性",detail:fgScore!=null?`${fgScore}分`:""},
    {name:"VIX 波动",  score:vixScoreV,desc:vixScoreV===null?"--":vixScoreV<=-2?"极度恐慌":vixScoreV<=-1?"高度恐慌":vixScoreV>=1?"过度平静":"正常",detail:vixVal?`${vixVal}`:""},
  ];
  const indW=(W-PX*2-GAP)/2,indH=32,ind0Y=tempY+148;
  indicators2.forEach((ind,i)=>{
    const ix=PX+(i%2)*(indW+GAP),iy=ind0Y+Math.floor(i/2)*(indH+6);
    _rr(c,ix,iy,indW,indH,6);c.fillStyle='#f1f5f9';c.fill();
    c.font=`11px ${F}`;c.fillStyle=L.mid;c.fillText(ind.name,ix+12,iy+20);
    c.textAlign='right';
    if(ind.detail){c.font=`10px ${F}`;c.fillStyle=L.muted;c.fillText(ind.detail,ix+indW-64,iy+20);}
    c.font=`bold 12px ${F}`;c.fillStyle=scoreColor2(ind.score);c.fillText(ind.desc,ix+indW-8,iy+20);
    c.textAlign='left';
  });

  // ── Section 3: 历史PE高位参考 ──
  const refY=BRAND_H+SENT_H+TEMP_H;
  c.strokeStyle=L.border;c.lineWidth=1;c.beginPath();c.moveTo(0,refY);c.lineTo(W,refY);c.stroke();
  c.fillStyle=L.bg;c.fillRect(0,refY,W,REF_H);
  c.fillStyle=L.blue;c.fillRect(PX,refY+14,3,16);
  c.font=`bold 13px ${F}`;c.fillStyle=L.dark;c.fillText('历史PE高位 → 后续表现',PX+10,refY+26);
  c.font=`10px ${F}`;c.fillStyle=L.muted;c.fillText('历史规律仅供参考，不构成投资建议',PX+10,refY+40);

  const drawPERefTable=(tX,tY,tW,refs,accent,label,curPE)=>{
    c.font=`bold 11px ${F}`;c.fillStyle=accent;c.fillText(label,tX,tY+14);
    if(curPE?.pe){
      c.font=`10px ${F}`;c.fillStyle=L.muted;
      const lw=c.measureText(label).width;
      c.fillText(`当前: ${curPE.pe}x (${curPE.percentile}%分位)`,tX+lw+8,tY+14);
    }
    const hdrs=['时期','PE','后1年','最大回调','恢复时长'];
    const cWs=[tW*0.30,tW*0.11,tW*0.15,tW*0.18,tW*0.26];
    const hY=tY+22;
    c.fillStyle='#f1f5f9';c.fillRect(tX,hY,tW,18);
    c.strokeStyle=L.border;c.lineWidth=0.5;c.strokeRect(tX,hY,tW,18);
    let hx=tX+4;
    hdrs.forEach((h,i)=>{
      c.font=`bold 9px ${F}`;c.fillStyle=L.muted;
      c.textAlign=i>0?'right':'left';
      c.fillText(h,i===0?hx:hx+cWs[i]-4,hY+12);
      hx+=cWs[i];
    });c.textAlign='left';
    refs.forEach((row,ri)=>{
      const ry=hY+18+ri*28;
      if(row.isCurrent){c.fillStyle=accent+'12';c.fillRect(tX,ry,tW,28);}
      else if(ri%2===0){c.fillStyle='#fafafa';c.fillRect(tX,ry,tW,28);}
      c.strokeStyle=L.border+'50';c.lineWidth=0.3;
      c.beginPath();c.moveTo(tX,ry+28);c.lineTo(tX+tW,ry+28);c.stroke();
      const peStr=row.isCurrent?(curPE?`${curPE.pe}x`:'--'):row.pe;
      const rowData=[row.period,peStr,row.next1y,row.maxDD,row.recovery];
      const rowCols=[row.isCurrent?accent:L.dark,row.isCurrent?(curPE?.pe>=30?L.red:L.orange):ri<2?L.red:'#ff6b35',row.next1y==='?'?L.muted:row.next1y.startsWith('-')?L.red:L.green,row.ddColor,L.muted];
      let rx=tX+4;
      rowData.forEach((val,i)=>{
        c.font=`${i===0&&row.isCurrent?'bold ':''}9px ${F}`;c.fillStyle=rowCols[i];
        c.textAlign=i>0?'right':'left';
        if(i===0){c.fillText(_fit(c,val,cWs[0]-8),rx,ry+18);}
        else{c.fillText(val,rx+cWs[i]-4,ry+18);}
        rx+=cWs[i];
      });c.textAlign='left';
    });
  };
  const refHalf=(W-PX*2-GAP*2)/2;
  drawPERefTable(PX,refY+48,refHalf,PE_HIST_REFS_SP,L.blue,'标普500',pe);
  drawPERefTable(PX+refHalf+GAP*2,refY+48,refHalf,PE_HIST_REFS_NQ,L.purple,'纳指100',nqPe);

  // ── Section 4: PE历史走势图 ──
  const chartY2=BRAND_H+SENT_H+TEMP_H+REF_H;
  c.strokeStyle=L.border;c.lineWidth=1;c.beginPath();c.moveTo(0,chartY2);c.lineTo(W,chartY2);c.stroke();
  c.fillStyle=L.bg;c.fillRect(0,chartY2,W,CHART_H);
  c.fillStyle=L.blue;c.fillRect(PX,chartY2+14,3,16);
  c.font=`bold 13px ${F}`;c.fillStyle=L.dark;c.fillText('PE历史走势（10年）',PX+10,chartY2+26);
  c.font=`10px ${F}`;c.fillStyle=L.muted;c.fillText('月度数据 · 标普500 vs 纳指100',PX+10,chartY2+40);
  c.fillStyle=L.blue;c.fillRect(W-PX-130,chartY2+18,14,3);
  c.font=`10px ${F}`;c.fillStyle=L.muted;c.textAlign='right';c.fillText('标普500',W-PX,chartY2+26);
  c.fillStyle=L.purple;c.fillRect(W-PX-58,chartY2+18,14,3);
  c.fillText('纳指100',W-PX-42,chartY2+26);
  c.textAlign='left';

  const sp500D=(peHistory?.sp500||[]);
  const nasdaqD=(peHistory?.nasdaq100||[]);
  const now2=new Date();
  const cutoff=`${now2.getFullYear()-10}-${String(now2.getMonth()+1).padStart(2,'0')}`;
  const sp500F=sp500D.filter(d=>d.date>=cutoff);
  const nasdaqF=nasdaqD.filter(d=>d.date>=cutoff);
  const pcX=PX+44,pcY=chartY2+54,pcW=W-PX*2-48,pcH=185;

  if(sp500F.length>1||nasdaqF.length>1){
    const allPE=[...sp500F.map(d=>d.pe),...nasdaqF.map(d=>d.pe)].filter(v=>v!=null);
    const pMin=Math.floor(Math.min(...allPE)*0.9/5)*5;
    const pMax=Math.ceil(Math.max(...allPE)*1.05/5)*5;
    const toY4=v=>pcY+pcH*(1-(v-pMin)/(pMax-pMin));
    [25,30,40].forEach(v=>{
      if(v<pMin||v>pMax)return;
      const yy=toY4(v);
      const col=v===25?L.green:v===30?L.orange:L.red;
      c.strokeStyle=col+'70';c.lineWidth=0.8;c.setLineDash([4,3]);
      c.beginPath();c.moveTo(pcX,yy);c.lineTo(pcX+pcW,yy);c.stroke();c.setLineDash([]);
      c.font=`9px ${F}`;c.fillStyle=col;c.textAlign='left';c.fillText(`${v}x`,PX,yy+3);
    });
    for(let v=Math.ceil(pMin/5)*5;v<=pMax;v+=5){
      const yy=toY4(v);
      if(yy<pcY-4||yy>pcY+pcH+4)continue;
      c.strokeStyle=L.border+'50';c.lineWidth=0.4;
      c.beginPath();c.moveTo(pcX,yy);c.lineTo(pcX+pcW,yy);c.stroke();
      c.font=`9px ${F}`;c.fillStyle=L.muted;c.textAlign='right';c.fillText(`${v}x`,pcX-4,yy+3);
    }c.textAlign='left';
    if(sp500F.length>1){
      c.strokeStyle=L.blue;c.lineWidth=2;c.beginPath();
      sp500F.forEach((d,i)=>{const xx=pcX+i/(sp500F.length-1)*pcW;const yy=toY4(d.pe);i===0?c.moveTo(xx,yy):c.lineTo(xx,yy);});
      c.stroke();
    }
    if(nasdaqF.length>1){
      c.strokeStyle=L.purple;c.lineWidth=2;c.setLineDash([6,3]);c.beginPath();
      nasdaqF.forEach((d,i)=>{const xx=pcX+i/(nasdaqF.length-1)*pcW;const yy=toY4(d.pe);i===0?c.moveTo(xx,yy):c.lineTo(xx,yy);});
      c.stroke();c.setLineDash([]);
    }
    const refArr=sp500F.length>=nasdaqF.length?sp500F:nasdaqF;
    const rn=refArr.length;
    [0,Math.floor(rn/4),Math.floor(rn/2),Math.floor(3*rn/4),rn-1].forEach(i=>{
      if(i>=rn)return;
      const xx=pcX+i/(rn-1)*pcW;
      c.font=`9px ${F}`;c.fillStyle=L.muted;c.textAlign='center';c.fillText(refArr[i].date.slice(0,7),xx,pcY+pcH+14);
    });c.textAlign='left';
  } else {
    c.font=`12px ${F}`;c.fillStyle=L.muted;c.textAlign='center';
    c.fillText('PE历史数据加载中…',W/2,pcY+pcH/2);c.textAlign='left';
  }

  // ── Footer ──
  const fy=H-FOOTER_H;
  c.fillStyle=L.headBg;c.fillRect(0,fy,W,FOOTER_H);
  c.strokeStyle=L.border;c.lineWidth=1;c.beginPath();c.moveTo(0,fy);c.lineTo(W,fy);c.stroke();
  c.font=`12px ${F}`;c.fillStyle=L.muted;c.textAlign='center';
  c.fillText('wise-etf.com  ·  数据仅供参考，不构成投资建议',W/2,fy+FOOTER_H/2+5);
  c.textAlign='left';
  return cvs;
}

function drawTableCanvas({titleParts,date,cols,rows}){
  const W=1080,SC=2,PX=20;
  const F=EC.F;
  const BRAND_H=46,TITLE_H=88,CH=44,RH=40,FH=44;
  const H=BRAND_H+TITLE_H+CH+rows.length*RH+FH;
  const cvs=document.createElement('canvas');
  cvs.width=W*SC;cvs.height=H*SC;
  const c=cvs.getContext('2d');c.scale(SC,SC);

  // White background
  c.fillStyle='#FFFFFF';c.fillRect(0,0,W,H);

  // Top accent bar
  const ag=c.createLinearGradient(0,0,W,0);
  ag.addColorStop(0,'#1a56db');ag.addColorStop(1,'#7c3aed');
  c.fillStyle=ag;c.fillRect(0,0,W,5);

  // Brand row
  c.fillStyle='#f0f6ff';c.fillRect(0,5,W,BRAND_H-5);
  c.font=`bold 15px ${F}`;c.fillStyle='#1a56db';
  c.fillText('Wise 定投致富 整理',PX+4,32);
  c.font=`12px ${F}`;c.fillStyle='#9ca3af';
  c.textAlign='right';c.fillText('wise-etf.com',W-PX,32);c.textAlign='left';

  // Title row
  c.fillStyle='#FFFFFF';c.fillRect(0,BRAND_H,W,TITLE_H);
  c.font=`bold 30px ${F}`;
  let tx=PX+4;
  const TY=BRAND_H+46;
  (titleParts||[]).forEach(p=>{
    c.fillStyle=p.color||'#0f172a';
    c.fillText(p.text,tx,TY);
    tx+=c.measureText(p.text).width;
  });
  // Date appended inline in blue
  c.font=`bold 22px ${F}`;c.fillStyle='#1a56db';
  // Format date for display: 2026/04/15 → 2026.4.15
  const dd=date.replace(/\//g,'.');c.fillText(`  (${dd})`,tx,TY);

  // Subtitle
  c.font=`12px ${F}`;c.fillStyle='#9ca3af';
  c.fillText('数据仅供参考，不构成投资建议',PX+4,BRAND_H+72);

  // Header separator
  c.strokeStyle='#dde3f0';c.lineWidth=1;
  c.beginPath();c.moveTo(0,BRAND_H+TITLE_H);c.lineTo(W,BRAND_H+TITLE_H);c.stroke();

  const tableY=BRAND_H+TITLE_H;
  const xp=[];let cx2=PX;for(const col of cols){xp.push(cx2);cx2+=col.w;}

  // Table header — blue gradient
  const hg=c.createLinearGradient(0,tableY,0,tableY+CH);
  hg.addColorStop(0,'#1e40af');hg.addColorStop(1,'#1a56db');
  c.fillStyle=hg;c.fillRect(0,tableY,W,CH);

  c.font=`bold 13px ${F}`;
  cols.forEach((col,i)=>{
    c.fillStyle='#FFFFFF';
    c.textAlign=col.right?'right':'left';
    c.fillText(col.label,col.right?xp[i]+col.w-8:xp[i]+8,tableY+CH/2+5);
  });
  c.textAlign='left';

  rows.forEach((row,ri)=>{
    const ry=tableY+CH+ri*RH;
    c.fillStyle=ri%2===0?'#FFFFFF':'#eef3ff';c.fillRect(0,ry,W,RH);
    c.strokeStyle='#dde3f0';c.lineWidth=0.5;
    c.beginPath();c.moveTo(0,ry+RH);c.lineTo(W,ry+RH);c.stroke();
    cols.forEach((col,ci)=>{
      const v=row[col.key];
      const cell=col.render?col.render(v,row):{text:v??'—'};
      const{text='—',color='#1a1a2e',bold=false,pill=false,pillBg=null}=cell;
      const cX=xp[ci],cW=col.w,ty=ry+RH/2+5;
      if(pill){
        c.font=`bold 11px ${F}`;
        const tw=c.measureText(text).width,pw=tw+20,ph=20;
        const px2=col.right?cX+cW-pw-6:cX+6,py2=ry+(RH-ph)/2;
        _rr(c,px2,py2,pw,ph,ph/2);c.fillStyle=pillBg||'#dbeafe';c.fill();
        c.fillStyle=color;c.textAlign='center';
        c.fillText(text,px2+pw/2,py2+14);c.textAlign='left';
      }else{
        c.font=`${bold?'bold ':''}13px ${F}`;
        c.textAlign=col.right?'right':'left';c.fillStyle=color;
        c.fillText(_fit(c,text,cW-10),col.right?cX+cW-8:cX+8,ty);
        c.textAlign='left';
      }
    });
  });

  const fy=tableY+CH+rows.length*RH;
  c.fillStyle='#f0f6ff';c.fillRect(0,fy,W,FH);
  c.strokeStyle='#dde3f0';c.lineWidth=1;
  c.beginPath();c.moveTo(0,fy);c.lineTo(W,fy);c.stroke();
  c.font=`12px ${F}`;c.fillStyle='#9ca3af';c.textAlign='center';
  c.fillText(`wise-etf.com  ·  @Wise 定投致富 整理  ·  ${dd}`,W/2,fy+FH/2+5);
  c.textAlign='left';
  return cvs;
}

// ─── Generic Fund Export Canvas Engine ──────────────────────────────────────
function _drawFundExportCanvas(rows, {titleParts, colors, cols}, logoImg=null){
  const W=1200,H=1600,SC=2,PX=32;
  const F=EC.F;
  const BRAND_H=82,TITLE_H=132,CH=66,FH=148;
  const FIXED=BRAND_H+TITLE_H+CH+FH;
  const RH=Math.floor((H-FIXED)/Math.max(rows.length,1));
  const FS=parseFloat(Math.min(1.3,Math.max(0.9,RH/68)).toFixed(2));
  const fs=n=>Math.round(n*FS)+'px';

  const cvs=document.createElement('canvas');
  cvs.width=W*SC;cvs.height=H*SC;
  const c=cvs.getContext('2d');c.scale(SC,SC);

  c.fillStyle='#f0f4ff';c.fillRect(0,0,W,H);

  // Top accent bar (14px)
  const ag=c.createLinearGradient(0,0,W,0);
  colors.topBar.forEach(([stop,col])=>ag.addColorStop(stop,col));
  c.fillStyle=ag;c.fillRect(0,0,W,14);

  // Brand header
  c.fillStyle='#e8eeff';c.fillRect(0,14,W,BRAND_H-14);
  const brandY=Math.round((14+BRAND_H)/2+Math.round(28*FS)*0.38);
  c.font=`bold ${fs(30)} ${F}`;c.fillStyle=colors.primary;c.fillText('Wise',PX,brandY);
  const wW=c.measureText('Wise').width;
  c.font=`bold ${fs(30)} ${F}`;c.fillStyle=colors.secondary;c.fillText('ETF',PX+wW,brandY);
  const eW=c.measureText('ETF').width;
  c.font=`${fs(18)} ${F}`;c.fillStyle='#475569';c.fillText('  @WiseInvest 整理',PX+wW+eW,brandY);
  c.textAlign='right';
  c.font=`bold ${fs(18)} ${F}`;c.fillStyle=colors.primary;c.fillText('wise-etf.com',W-PX,brandY);
  c.textAlign='left';

  // Title section
  c.fillStyle='#ffffff';c.fillRect(0,BRAND_H,W,TITLE_H);
  const lsg=c.createLinearGradient(0,BRAND_H,0,BRAND_H+TITLE_H);
  lsg.addColorStop(0,colors.primary);lsg.addColorStop(1,colors.accent);
  c.fillStyle=lsg;c.fillRect(0,BRAND_H,7,TITLE_H);
  let ttx=PX+18;
  c.font=`bold ${fs(50)} ${F}`;
  const TY=BRAND_H+70;
  titleParts.forEach(p=>{c.fillStyle=p.color;c.fillText(p.text,ttx,TY);ttx+=c.measureText(p.text).width;});
  const today=new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'});
  const dd=today.replace(/\//g,'.');
  c.font=`bold ${fs(32)} ${F}`;c.fillStyle=colors.primary;c.fillText(`  ${dd}`,ttx,TY);
  c.font=`${fs(17)} ${F}`;c.fillStyle='#64748b';
  c.fillText('数据仅供参考，不构成投资建议',PX+18,BRAND_H+106);
  c.textAlign='right';
  c.font=`bold ${fs(17)} ${F}`;c.fillStyle=colors.accent;
  c.fillText('wise-etf.com 查看实时数据 →',W-PX,BRAND_H+106);
  c.textAlign='left';

  const tableY=BRAND_H+TITLE_H;
  const totalColW=cols.reduce((s,col)=>s+col.w,0);
  const colSc=(W-PX*2)/totalColW;
  const sCols=cols.map(col=>({...col,w:col.w*colSc}));
  const xp=[];let cx2=PX;sCols.forEach(col=>{xp.push(cx2);cx2+=col.w;});

  // Table header
  const hg=c.createLinearGradient(0,tableY,W,tableY);
  hg.addColorStop(0,colors.headerDark);hg.addColorStop(1,colors.primary);
  c.fillStyle=hg;c.fillRect(0,tableY,W,CH);
  c.font=`bold ${fs(17)} ${F}`;
  sCols.forEach((col,i)=>{
    c.fillStyle='#e8f0ff';c.textAlign=col.align;
    const tx=col.align==='right'?xp[i]+col.w-12:col.align==='center'?xp[i]+col.w/2:xp[i]+12;
    c.fillText(col.label,tx,tableY+CH/2+6);
  });c.textAlign='left';

  // Table rows
  rows.forEach((row,ri)=>{
    const ry=tableY+CH+ri*RH;
    c.fillStyle=ri%2===0?'#ffffff':colors.rowAlt;c.fillRect(0,ry,W,RH);
    c.fillStyle=ri%2===0?colors.rowAccent1:colors.rowAccent2;c.fillRect(0,ry,5,RH);
    c.strokeStyle=colors.rowBorder;c.lineWidth=0.7;
    c.beginPath();c.moveTo(0,ry+RH);c.lineTo(W,ry+RH);c.stroke();
    const tyR=ry+RH/2+Math.round(7*FS);
    sCols.forEach((col,ci)=>{
      const v=row[col.key];
      c.textAlign=col.align;
      const tx=col.align==='right'?xp[ci]+col.w-12:col.align==='center'?xp[ci]+col.w/2:xp[ci]+12;
      switch(col.key){
        case 'code':
          c.font=`bold ${fs(19)} ${F}`;c.fillStyle=colors.primary;c.fillText(v??'—',tx,tyR);break;
        case 'name':case 'etf_name':
          c.font=`${fs(18)} ${F}`;c.fillStyle='#111827';c.fillText(_fit(c,v??'—',col.w-16),tx,tyR);break;
        case 'code_c':
          c.font=`bold ${fs(17)} ${F}`;c.fillStyle=v?'#6d1fc8':'#9ca3af';c.fillText(v??'—',tx,tyR);break;
        case 'fee_rate':
          c.font=`bold ${fs(18)} ${F}`;c.fillStyle=v>1?'#c2410c':'#1e3a5f';
          c.fillText(v!=null?`${v}%`:'—',tx,tyR);break;
        case 'scale':
          c.font=`bold ${fs(18)} ${F}`;c.fillStyle='#1e3a5f';c.fillText(v??'—',tx,tyR);break;
        case 'rolling_1y':
        case 'ytd_return':{
          const n=v!=null?parseFloat(v):null;
          c.font=`bold ${fs(19)} ${F}`;
          c.fillStyle=n!=null?(n>0?'#15803d':'#b91c1c'):'#9ca3af';
          c.fillText(n!=null?`${n>0?'+':''}${n.toFixed(1)}%`:'—',tx,tyR);break;}
        case 'day_change':
        case 'change_pct':{
          const cp=v!=null?parseFloat(v):null;
          c.font=`bold ${fs(18)} ${F}`;
          c.fillStyle=cp==null?'#9ca3af':cp>0?'#15803d':cp<0?'#b91c1c':'#475569';
          c.fillText(cp!=null?`${cp>0?'+':''}${cp.toFixed(2)}%`:'—',tx,tyR);break;}
        case 'daily_limit':
          c.font=`${fs(17)} ${F}`;c.fillStyle='#334155';
          c.fillText(_fit(c,v??'—',col.w-14),tx,tyR);break;
        case 'buy_status':{
          const isOpen=v==='open';
          const pW=Math.round(72*FS),pH=Math.round(36*FS);
          const px2=xp[ci]+(col.w-pW)/2,py2=ry+(RH-pH)/2;
          _rr(c,px2,py2,pW,pH,pH/2);c.fillStyle=isOpen?'#dcfce7':'#f1f5f9';c.fill();
          c.strokeStyle=isOpen?'#16a34a':'#d1d5db';c.lineWidth=1.5;_rr(c,px2,py2,pW,pH,pH/2);c.stroke();
          c.font=`bold ${fs(15)} ${F}`;c.fillStyle=isOpen?'#15803d':'#6b7280';
          c.textAlign='center';c.fillText(isOpen?'✓ 可申购':'暂停',px2+pW/2,py2+Math.round(23*FS));
          c.textAlign='left';break;}
        case 'tracking_index':
          c.font=`${fs(15)} ${F}`;c.fillStyle='#475569';
          c.fillText(_fit(c,v??'—',col.w-14),tx,tyR);break;
        case 'premium':{
          const pv=v!=null?parseFloat(v):null;
          c.font=`bold ${fs(18)} ${F}`;
          c.fillStyle=pv==null?'#9ca3af':pv>3?'#b91c1c':pv>1.5?'#c2410c':pv>0?'#475569':'#15803d';
          c.fillText(pv!=null?`${pv}%`:'—',tx,tyR);break;}
        case 'track_error':
          c.font=`${fs(17)} ${F}`;c.fillStyle=v>2?'#c2410c':v>1?'#b45309':'#475569';
          c.fillText(v!=null?`${v}%`:'—',tx,tyR);break;
        case 'volume':
          c.font=`bold ${fs(17)} ${F}`;c.fillStyle='#1e3a5f';c.fillText(v??'—',tx,tyR);break;
        default:
          c.font=`${fs(16)} ${F}`;c.fillStyle='#374151';
          c.fillText(v!=null?String(v):'—',tx,tyR);
      }
      c.textAlign='left';
    });
  });

  // Footer — fill to exact H
  const fy=tableY+CH+rows.length*RH;
  const footerH=H-fy;
  const fg2=c.createLinearGradient(0,0,W,0);
  colors.footerBar.forEach(([stop,col])=>fg2.addColorStop(stop,col));
  c.fillStyle=fg2;c.fillRect(0,fy,W,footerH);

  const midY = fy + footerH/2;  // vertical center of footer
  if(logoImg){
    // use raw pixel sizes for arithmetic
    const t1=Math.round(28*FS), t2=Math.round(17*FS), t3=Math.round(22*FS);
    const logoH=Math.round(footerH*0.32);
    const logoW=Math.round(logoImg.naturalWidth/logoImg.naturalHeight*logoH);
    const blockH = t1 + 6 + logoH + 6 + t2;
    const blockTop = midY - blockH/2;
    // Center column: @WiseInvest + logo + 以上平台同名 + disclaimer
    const t4=Math.round(13*FS);
    const blockH2=t1+6+logoH+6+t2+6+t4;
    const blockTop2=midY-blockH2/2;
    c.textAlign='center';
    c.font=`bold ${t1}px ${F}`;c.fillStyle='#ffffff';
    c.fillText('@WiseInvest',W/2,blockTop2+t1);
    c.drawImage(logoImg,(W-logoW)/2,blockTop2+t1+6,logoW,logoH);
    c.font=`bold ${t2}px ${F}`;c.fillStyle='rgba(255,255,255,0.85)';
    const subTextY=blockTop2+t1+6+logoH+t2+2;
    c.fillText('以上平台同名',W/2,subTextY);
    c.font=`${t4}px ${F}`;c.fillStyle='rgba(255,255,255,0.55)';
    c.fillText('数据仅供参考，不构成投资建议',W/2,subTextY+6+t4);
    // Left: wise-etf.com — vertically centered
    c.font=`bold ${t3}px ${F}`;c.fillStyle='#ffffff';
    c.textAlign='left';c.fillText('wise-etf.com',PX,midY+t3*0.35);
    // Right: date — vertically centered
    c.textAlign='right';c.fillText(dd,W-PX,midY+t3*0.35);
  }else{
    const t5=Math.round(20*FS), t6=Math.round(14*FS);
    c.textAlign='center';
    c.font=`bold ${t5}px ${F}`;c.fillStyle='#ffffff';
    c.fillText(`wise-etf.com  ·  @WiseInvest 整理  ·  ${dd}`,W/2,midY);
    c.font=`${t6}px ${F}`;c.fillStyle='rgba(255,255,255,0.6)';
    c.fillText('数据仅供参考，不构成投资建议',W/2,midY+24);
  }
  c.textAlign='left';
  return cvs;
}

function drawNasdaqExportCanvas(rows,logoImg=null){
  return _drawFundExportCanvas(rows,{
    titleParts:[{text:'场外 ',color:'#111827'},{text:'纳斯达克100',color:'#d44f00'},{text:' 被动型基金',color:'#111827'}],
    colors:{
      topBar:[[0,'#1533cc'],[0.5,'#7c22d4'],[1,'#d44f00']],
      primary:'#1533cc',secondary:'#7c22d4',accent:'#d44f00',headerDark:'#0f2499',
      rowAlt:'#dde8ff',rowAccent1:'#c5d8ff',rowAccent2:'#a8c4f8',rowBorder:'#b8c8f0',
      footerBar:[[0,'#1533cc'],[1,'#7c22d4']],
    },
    cols:[
      {key:'code',      label:'代码',     w:80,  align:'left'},
      {key:'name',      label:'基金名称', w:310, align:'left'},
      {key:'code_c',    label:'C类代码',  w:86,  align:'center'},
      {key:'fee_rate',  label:'运作费率', w:96,  align:'right'},
      {key:'scale',     label:'规模(亿)', w:90,  align:'right'},
      {key:'rolling_1y',label:'近1年涨幅',w:114, align:'right'},
      {key:'day_change',label:'昨日涨跌', w:100, align:'right'},
      {key:'daily_limit',label:'申购上限',w:110, align:'right'},
      {key:'buy_status',label:'申购状态', w:96,  align:'center'},
    ],
  },logoImg);
}

function drawSp500ExportCanvas(rows,logoImg=null){
  return _drawFundExportCanvas(rows,{
    titleParts:[{text:'场外 ',color:'#111827'},{text:'标普500',color:'#dc2626'},{text:' 被动型基金',color:'#111827'}],
    colors:{
      topBar:[[0,'#0c4a6e'],[0.5,'#0284c7'],[1,'#dc2626']],
      primary:'#0369a1',secondary:'#0ea5e9',accent:'#dc2626',headerDark:'#082f49',
      rowAlt:'#dbeafe',rowAccent1:'#bfdbfe',rowAccent2:'#93c5fd',rowBorder:'#bfdbfe',
      footerBar:[[0,'#0369a1'],[1,'#0284c7']],
    },
    cols:[
      {key:'code',      label:'代码',     w:80,  align:'left'},
      {key:'name',      label:'基金名称', w:310, align:'left'},
      {key:'code_c',    label:'C类代码',  w:86,  align:'center'},
      {key:'fee_rate',  label:'运作费率', w:96,  align:'right'},
      {key:'scale',     label:'规模(亿)', w:90,  align:'right'},
      {key:'rolling_1y',label:'近1年涨幅',w:114, align:'right'},
      {key:'day_change',label:'昨日涨跌', w:100, align:'right'},
      {key:'daily_limit',label:'申购上限',w:110, align:'right'},
      {key:'buy_status',label:'申购状态', w:96,  align:'center'},
    ],
  },logoImg);
}

function drawEtfExportCanvas(rows,logoImg=null){
  return _drawFundExportCanvas(rows,{
    titleParts:[{text:'场内 ',color:'#111827'},{text:'纳指/标普',color:'#b45309'},{text:' ETF 对比',color:'#111827'}],
    colors:{
      topBar:[[0,'#b45309'],[0.5,'#d97706'],[1,'#0369a1']],
      primary:'#b45309',secondary:'#d97706',accent:'#0369a1',headerDark:'#78350f',
      rowAlt:'#fef3c7',rowAccent1:'#fde68a',rowAccent2:'#fcd34d',rowBorder:'#fde68a',
      footerBar:[[0,'#b45309'],[1,'#d97706']],
    },
    cols:[
      {key:'code',          label:'代码',     w:80,  align:'left'},
      {key:'name',          label:'ETF名称',  w:280, align:'left'},
      {key:'tracking_index',label:'跟踪指数', w:180, align:'left'},
      {key:'scale',         label:'规模(亿)', w:90,  align:'right'},
      {key:'ytd_return',    label:'25年涨幅',  w:114, align:'right'},
      {key:'day_change',    label:'昨日涨跌', w:100, align:'right'},
      {key:'fee_rate',      label:'费率',     w:72,  align:'right'},
      {key:'track_error',   label:'跟踪误差', w:90,  align:'right'},
      {key:'premium',       label:'溢价率',   w:86,  align:'right'},
    ],
  },logoImg);
}

function drawActiveExportCanvas(rows,logoImg=null){
  return _drawFundExportCanvas(rows,{
    titleParts:[{text:'场外 ',color:'#111827'},{text:'美股主动型',color:'#7c3aed'},{text:' 基金对比',color:'#111827'}],
    colors:{
      topBar:[[0,'#581c87'],[0.5,'#7c3aed'],[1,'#b45309']],
      primary:'#6d28d9',secondary:'#8b5cf6',accent:'#b45309',headerDark:'#3b0764',
      rowAlt:'#ede9fe',rowAccent1:'#ddd6fe',rowAccent2:'#c4b5fd',rowBorder:'#ddd6fe',
      footerBar:[[0,'#6d28d9'],[1,'#7c3aed']],
    },
    cols:[
      {key:'code',       label:'代码',     w:80,  align:'left'},
      {key:'name',       label:'基金名称', w:340, align:'left'},
      {key:'fee_rate',   label:'运作费率', w:96,  align:'right'},
      {key:'scale',      label:'规模(亿)', w:90,  align:'right'},
      {key:'rolling_1y', label:'近1年涨幅',w:120, align:'right'},
      {key:'day_change', label:'昨日涨跌', w:100, align:'right'},
      {key:'daily_limit',label:'每日限额', w:120, align:'right'},
      {key:'buy_status', label:'申购状态', w:96,  align:'center'},
    ],
  },logoImg);
}

function drawOverviewCanvas({nasdaq,sp500,active,etfs,usdcny,sentiment}){
  const W=900,SC=2,PX=28,GAP=14;
  const F=EC.F;
  // Light theme palette
  const L={
    bg:'#f8fafc',card:'#ffffff',headBg:'#f0f6ff',
    border:'#dde3f0',
    blue:'#1a56db',cyan:'#0369a1',green:'#16a34a',
    red:'#dc2626',orange:'#ea580c',purple:'#7c3aed',
    dark:'#0f172a',mid:'#374151',dim:'#6b7280',muted:'#9ca3af',
  };

  const avg=(arr,k)=>{const vs=arr.map(e=>e[k]).filter(v=>v!=null);return vs.length?(vs.reduce((a,b)=>a+b,0)/vs.length).toFixed(2):'—';};
  const nasdaqAvg=avg(nasdaq,'ytd_return');
  const sp500Avg=avg(sp500,'ytd_return');
  const activeAvg=avg(active,'ytd_return');
  const etfAvg=avg(etfs,'premium');
  const openCount=[...nasdaq,...sp500,...active].filter(f=>f.buy_status==='open').length;
  const totalCount=nasdaq.length+sp500.length+active.length;

  const BRAND_H=60,STATS_H=168,INDEX_H=348,CHART_H=280,HIST_H=316,FX_H=268,FOOTER_H=56;
  const H=BRAND_H+STATS_H+INDEX_H+CHART_H+HIST_H+FX_H+FOOTER_H;

  const cvs=document.createElement('canvas');
  cvs.width=W*SC;cvs.height=H*SC;
  const c=cvs.getContext('2d');c.scale(SC,SC);

  c.fillStyle=L.bg;c.fillRect(0,0,W,H);

  // ── Brand header ──────────────────────────────────────────────────────────
  const ag=c.createLinearGradient(0,0,W,0);
  ag.addColorStop(0,'#1a56db');ag.addColorStop(1,'#7c3aed');
  c.fillStyle=ag;c.fillRect(0,0,W,5);
  c.fillStyle=L.headBg;c.fillRect(0,5,W,BRAND_H-5);
  c.font=`bold 16px ${F}`;c.fillStyle=L.blue;c.fillText('Wise ETF',PX,34);
  c.font=`bold 14px ${F}`;c.fillStyle=L.mid;c.fillText('每日市场快照',PX+88,34);
  const today=new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'});
  c.font=`12px ${F}`;c.fillStyle=L.muted;c.fillText(today,PX,52);
  if(usdcny){
    c.textAlign='right';
    c.font=`bold 20px ${F}`;c.fillStyle=L.orange;c.fillText(`¥${usdcny}`,W-PX,36);
    c.font=`11px ${F}`;c.fillStyle=L.muted;c.fillText('USD/CNY',W-PX,52);
    c.textAlign='left';
  }

  // ── Stat cards ────────────────────────────────────────────────────────────
  const statData=[
    {label:'纳指均涨幅',value:`+${nasdaqAvg}%`,sub:'近一年',color:L.blue},
    {label:'标普均涨幅',value:`+${sp500Avg}%`,sub:'近一年',color:L.cyan},
    {label:'主动均涨幅',value:`+${activeAvg}%`,sub:'近一年',color:L.purple},
    {label:'ETF均溢价',value:`${etfAvg}%`,sub:'当前',color:L.orange},
    {label:'可申购数',value:`${openCount}`,sub:`共${totalCount}只`,color:L.green},
  ];
  const cW=(W-PX*2-GAP*4)/5,cH=118,sy=BRAND_H+20;
  statData.forEach((s,i)=>{
    const cx=PX+i*(cW+GAP);
    _rr(c,cx,sy,cW,cH,10);c.fillStyle=L.card;c.fill();
    c.strokeStyle=L.border;c.lineWidth=0.5;c.stroke();
    const tg=c.createLinearGradient(cx,sy,cx+cW,sy);
    tg.addColorStop(0,s.color);tg.addColorStop(1,s.color+'88');
    _rr(c,cx,sy,cW,4,2);c.fillStyle=tg;c.fill();
    c.font=`bold 24px ${F}`;c.fillStyle=s.color;c.textAlign='center';
    c.fillText(s.value,cx+cW/2,sy+46);
    c.font=`11px ${F}`;c.fillStyle=L.dim;c.fillText(s.sub,cx+cW/2,sy+64);
    c.font=`bold 11px ${F}`;c.fillStyle=L.dark;c.fillText(s.label,cx+cW/2,sy+88);
    c.textAlign='left';
  });

  // ── Index data + sentiment + 15-day chart ─────────────────────────────────
  const indexY=BRAND_H+STATS_H;
  c.strokeStyle=L.border;c.lineWidth=1;
  c.beginPath();c.moveTo(0,indexY);c.lineTo(W,indexY);c.stroke();
  c.fillStyle=L.bg;c.fillRect(0,indexY,W,INDEX_H);

  c.fillStyle=L.blue;c.fillRect(PX,indexY+16,3,18);
  c.font=`bold 14px ${F}`;c.fillStyle=L.dark;
  c.fillText('指数实时点位  ·  近15日走势  ·  市场情绪',PX+10,indexY+29);

  const ndxD=sentiment?.ndx_price||{};
  const spxD=sentiment?.spx_price||{};
  const vixD=sentiment?.vix||{};
  const fgD=sentiment?.fear_greed||{};

  const ic4W=(W-PX*2-GAP*3)/4,ic4H=108,ic4Y=indexY+44;

  // Draw price card helper
  const drawPriceCard=(x,y,w,h,title,price,changePct,yr1,d15,col)=>{
    _rr(c,x,y,w,h,10);c.fillStyle=L.card;c.fill();
    c.strokeStyle=L.border;c.lineWidth=0.5;c.stroke();
    const tg2=c.createLinearGradient(x,y,x+w,y);
    tg2.addColorStop(0,col);tg2.addColorStop(1,col+'88');
    _rr(c,x,y,w,4,2);c.fillStyle=tg2;c.fill();
    c.font=`bold 11px ${F}`;c.fillStyle=L.dim;c.textAlign='center';c.fillText(title,x+w/2,y+20);
    const ps=price!=null?price.toLocaleString('en-US',{maximumFractionDigits:2}):'--';
    c.font=`bold 17px ${F}`;c.fillStyle=L.dark;c.fillText(ps,x+w/2,y+43);
    const chgStr=changePct!=null?`${changePct>=0?'+':''}${changePct}%`:'--';
    const chgCol=changePct==null?L.muted:changePct>=0?L.green:L.red;
    c.font=`bold 13px ${F}`;c.fillStyle=chgCol;c.fillText(chgStr,x+w/2,y+62);
    const tw2=(w-20)/2-3;
    const drawTag=(tx,ty,tw,label,val,tcol)=>{
      _rr(c,tx,ty,tw,18,4);c.fillStyle=tcol+'18';c.fill();
      c.font=`10px ${F}`;c.fillStyle=tcol;c.textAlign='center';
      c.fillText(`${label} ${val!=null?(val>=0?'+':'')+val+'%':'--'}`,tx+tw/2,ty+12);
    };
    drawTag(x+10,y+74,tw2,'近1年',yr1,col);
    drawTag(x+10+tw2+3,y+74,tw2,'近15日',d15,col);
    c.textAlign='left';
  };

  const ndxR=ndxD.returns||{};
  const spxR=spxD.returns||{};
  drawPriceCard(PX,ic4Y,ic4W,ic4H,'纳斯达克100',ndxD.price,ndxD.change_pct,ndxR.yr1,ndxR.d15,L.blue);
  drawPriceCard(PX+ic4W+GAP,ic4Y,ic4W,ic4H,'标普500',spxD.price,spxD.change_pct,spxR.yr1,spxR.d15,L.cyan);

  // VIX card
  const vix3X=PX+(ic4W+GAP)*2;
  _rr(c,vix3X,ic4Y,ic4W,ic4H,10);c.fillStyle=L.card;c.fill();
  c.strokeStyle=L.border;c.lineWidth=0.5;c.stroke();
  const vixVal=vixD.value;
  const vixCol=!vixVal?L.muted:vixVal>=40?L.red:vixVal>=30?'#ff6b35':vixVal>=20?L.orange:L.green;
  const vixLbl=!vixVal?'--':vixVal>=40?'极度恐慌':vixVal>=30?'高度恐慌':vixVal>=20?'市场警惕':vixVal>=12?'相对平静':'极度平静';
  const vtg=c.createLinearGradient(vix3X,ic4Y,vix3X+ic4W,ic4Y);
  vtg.addColorStop(0,vixCol);vtg.addColorStop(1,vixCol+'88');
  _rr(c,vix3X,ic4Y,ic4W,4,2);c.fillStyle=vtg;c.fill();
  c.font=`bold 11px ${F}`;c.fillStyle=L.dim;c.textAlign='center';c.fillText('VIX 恐慌指数',vix3X+ic4W/2,ic4Y+20);
  c.font=`bold 24px ${F}`;c.fillStyle=vixCol;c.fillText(vixVal??'--',vix3X+ic4W/2,ic4Y+48);
  c.font=`bold 13px ${F}`;c.fillStyle=vixCol;c.fillText(vixLbl,vix3X+ic4W/2,ic4Y+66);
  const vixChgStr2=vixD.change_pct!=null?`今日 ${vixD.change_pct>=0?'+':''}${vixD.change_pct}%`:'';
  c.font=`11px ${F}`;c.fillStyle=L.muted;c.fillText(vixChgStr2,vix3X+ic4W/2,ic4Y+83);
  if(vixVal){
    const bx2=vix3X+12,by2=ic4Y+94,bw2=ic4W-24;
    _rr(c,bx2,by2,bw2,5,2);c.fillStyle=L.border;c.fill();
    _rr(c,bx2,by2,bw2*Math.min(vixVal/60,1),5,2);c.fillStyle=vixCol;c.fill();
  }
  c.textAlign='left';

  // Fear & Greed card
  const fg4X=PX+(ic4W+GAP)*3;
  _rr(c,fg4X,ic4Y,ic4W,ic4H,10);c.fillStyle=L.card;c.fill();
  c.strokeStyle=L.border;c.lineWidth=0.5;c.stroke();
  const fgScore=fgD.score;
  const fgCol=fgScore==null?L.muted:fgScore<=25?L.red:fgScore<=45?L.orange:fgScore<=55?L.dim:fgScore<=75?L.green:'#15803d';
  const fgLblMap={'extreme fear':'极度恐慌','fear':'恐慌','neutral':'中性','greed':'贪婪','extreme greed':'极度贪婪'};
  const fgLbl=fgLblMap[(fgD.rating||'').toLowerCase()]||fgD.rating||'--';
  const ftg=c.createLinearGradient(fg4X,ic4Y,fg4X+ic4W,ic4Y);
  ftg.addColorStop(0,fgCol);ftg.addColorStop(1,fgCol+'88');
  _rr(c,fg4X,ic4Y,ic4W,4,2);c.fillStyle=ftg;c.fill();
  c.font=`bold 11px ${F}`;c.fillStyle=L.dim;c.textAlign='center';c.fillText('CNN 恐慌贪婪指数',fg4X+ic4W/2,ic4Y+20);
  c.font=`bold 24px ${F}`;c.fillStyle=fgCol;c.fillText(fgScore??'--',fg4X+ic4W/2,ic4Y+48);
  c.font=`bold 13px ${F}`;c.fillStyle=fgCol;c.fillText(fgLbl,fg4X+ic4W/2,ic4Y+66);
  const fgPrevStr=fgD.previous_close!=null?`昨收 ${fgD.previous_close}`:'';
  c.font=`11px ${F}`;c.fillStyle=L.muted;c.fillText(fgPrevStr,fg4X+ic4W/2,ic4Y+83);
  if(fgScore!=null){
    const bx3=fg4X+12,by3=ic4Y+94,bw3=ic4W-24;
    _rr(c,bx3,by3,bw3,5,2);c.fillStyle=L.border;c.fill();
    _rr(c,bx3,by3,bw3*(fgScore/100),5,2);c.fillStyle=fgCol;c.fill();
  }
  c.textAlign='left';

  // 15-day trend chart
  const clY=ic4Y+ic4H+16;
  c.font=`bold 12px ${F}`;c.fillStyle=L.dark;c.fillText('近15日走势对比',PX,clY+14);
  c.font=`10px ${F}`;c.fillStyle=L.muted;c.fillText('以区间首日为基准  ·  累计涨幅',PX+116,clY+14);
  c.fillStyle=L.blue;c.fillRect(W-PX-124,clY+7,10,3);
  c.textAlign='right';c.font=`10px ${F}`;c.fillStyle=L.muted;c.fillText('纳斯达克100',W-PX,clY+14);
  c.fillStyle=L.cyan;c.fillRect(W-PX-52,clY+7,10,3);
  c.fillText('标普500',W-PX-38,clY+14);
  c.textAlign='left';

  const buildPctArr=(hist=[])=>{
    if(hist.length<2)return[];
    const base=hist[0].close;
    return hist.map(d=>({date:d.date,pct:base?Math.round((d.close-base)/base*10000)/100:0}));
  };
  const ndxPts=buildPctArr(ndxD.history||[]);
  const spxPts=buildPctArr(spxD.history||[]);
  const lcX=PX+40,lcW=W-PX*2-48,lcH=108;
  const lcCardY=clY+22,lcY2=lcCardY+12;
  _rr(c,PX,lcCardY,W-PX*2,lcH+30,8);c.fillStyle=L.card;c.fill();
  c.strokeStyle=L.border;c.lineWidth=0.5;c.stroke();

  if(ndxPts.length>1||spxPts.length>1){
    const allPcts=[...ndxPts.map(p=>p.pct),...spxPts.map(p=>p.pct)];
    const pMin=Math.min(...allPcts,0),pMax=Math.max(...allPcts,0);
    const pRange=(pMax-pMin)||0.01;
    const vMin2=pMin-pRange*0.12,vMax2=pMax+pRange*0.12;
    const vRange2=(vMax2-vMin2)||0.01;
    const toY3=v=>lcY2+lcH*(1-(v-vMin2)/vRange2);

    c.strokeStyle=L.border;c.lineWidth=0.5;c.setLineDash([2,3]);
    c.beginPath();c.moveTo(lcX,toY3(0));c.lineTo(lcX+lcW,toY3(0));c.stroke();
    c.setLineDash([]);
    c.font=`9px ${F}`;c.fillStyle=L.muted;c.textAlign='right';c.fillText('0%',lcX-2,toY3(0)+3);c.textAlign='left';

    if(ndxPts.length>1){
      c.beginPath();
      ndxPts.forEach((p,i)=>{const xx=lcX+i/(ndxPts.length-1)*lcW;const yy=toY3(p.pct);if(i===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);});
      c.lineTo(lcX+lcW,lcY2+lcH);c.lineTo(lcX,lcY2+lcH);c.closePath();
      const nf=c.createLinearGradient(0,lcY2,0,lcY2+lcH);
      nf.addColorStop(0,L.blue+'30');nf.addColorStop(1,L.blue+'00');
      c.fillStyle=nf;c.fill();
      c.strokeStyle=L.blue;c.lineWidth=2;c.beginPath();
      ndxPts.forEach((p,i)=>{const xx=lcX+i/(ndxPts.length-1)*lcW;const yy=toY3(p.pct);if(i===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);});
      c.stroke();
    }
    if(spxPts.length>1){
      c.beginPath();
      spxPts.forEach((p,i)=>{const xx=lcX+i/(spxPts.length-1)*lcW;const yy=toY3(p.pct);if(i===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);});
      c.lineTo(lcX+lcW,lcY2+lcH);c.lineTo(lcX,lcY2+lcH);c.closePath();
      const sf=c.createLinearGradient(0,lcY2,0,lcY2+lcH);
      sf.addColorStop(0,L.cyan+'25');sf.addColorStop(1,L.cyan+'00');
      c.fillStyle=sf;c.fill();
      c.strokeStyle=L.cyan;c.lineWidth=2;c.setLineDash([5,3]);c.beginPath();
      spxPts.forEach((p,i)=>{const xx=lcX+i/(spxPts.length-1)*lcW;const yy=toY3(p.pct);if(i===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);});
      c.stroke();c.setLineDash([]);
    }
    const refPts=ndxPts.length>=spxPts.length?ndxPts:spxPts;
    const rn=refPts.length;
    const showIdx=new Set([0,Math.floor(rn/4),Math.floor(rn/2),Math.floor(3*rn/4),rn-1]);
    refPts.forEach((p,i)=>{
      if(!showIdx.has(i))return;
      const xx=lcX+i/(rn-1)*lcW;
      c.font=`9px ${F}`;c.fillStyle=L.muted;c.textAlign='center';c.fillText(p.date,xx,lcY2+lcH+14);
    });
    c.textAlign='left';
  } else {
    c.font=`11px ${F}`;c.fillStyle=L.muted;c.textAlign='center';
    c.fillText('数据加载中…',PX+(W-PX*2)/2,lcCardY+(lcH+30)/2+5);
    c.textAlign='left';
  }

  // ── 12-month bar chart ────────────────────────────────────────────────────
  const charty=BRAND_H+STATS_H+INDEX_H;
  c.strokeStyle=L.border;c.lineWidth=1;c.beginPath();c.moveTo(0,charty);c.lineTo(W,charty);c.stroke();
  c.fillStyle=L.bg;c.fillRect(0,charty,W,CHART_H);

  c.fillStyle=L.blue;c.fillRect(PX,charty+18,3,16);
  c.font=`bold 14px ${F}`;c.fillStyle=L.dark;c.fillText('纳指 vs 标普 · 近12月收益率',PX+10,charty+30);
  c.font=`11px ${F}`;c.fillStyle=L.muted;c.fillText('美元口径（2025.05 – 2026.04）',PX+10,charty+48);
  c.textAlign='right';
  c.fillStyle=L.blue;c.fillRect(W-PX-126,charty+18,12,12);
  c.font=`11px ${F}`;c.fillStyle=L.muted;c.fillText('纳斯达克100',W-PX,charty+29);
  c.fillStyle=L.cyan;c.fillRect(W-PX-56,charty+18,12,12);
  c.fillText('标普500',W-PX-36+6,charty+29);
  c.textAlign='left';

  const chartX=PX+44,chartTopY=charty+58,chartW=W-PX*2-44,chartH2=176;
  const allVals=[...MONTHLY_12M.map(d=>d.nasdaq),...MONTHLY_12M.map(d=>d.sp500)];
  const maxV=Math.ceil(Math.max(...allVals.map(v=>Math.abs(v)))/5)*5||10;
  const zeroY=chartTopY+chartH2/2;

  [maxV,maxV/2,0,-maxV/2,-maxV].forEach(v=>{
    const yy=chartTopY+chartH2*(1-v/maxV)/2;
    c.strokeStyle=L.border+(v===0?'':'80');c.lineWidth=v===0?1:0.5;
    c.beginPath();c.moveTo(chartX,yy);c.lineTo(chartX+chartW,yy);c.stroke();
    c.font=`10px ${F}`;c.fillStyle=L.muted;c.textAlign='right';
    c.fillText(v===0?'0':v+'%',chartX-4,yy+4);
  });
  c.textAlign='left';

  const groupW=chartW/MONTHLY_12M.length;
  const bW=Math.floor(groupW*0.26);
  MONTHLY_12M.forEach((d,i)=>{
    const gx=chartX+i*groupW;
    const nx=gx+(groupW-bW*2-3)/2;
    const nh=Math.max(Math.abs(d.nasdaq)/maxV*chartH2/2,1);
    const ny=d.nasdaq>=0?zeroY-nh:zeroY;
    _rr(c,nx,ny,bW,nh,2);c.fillStyle=d.nasdaq>=0?L.blue:L.blue+'99';c.fill();
    const sx2=nx+bW+3;
    const sh=Math.max(Math.abs(d.sp500)/maxV*chartH2/2,1);
    const sy2=d.sp500>=0?zeroY-sh:zeroY;
    _rr(c,sx2,sy2,bW,sh,2);c.fillStyle=d.sp500>=0?L.cyan:L.cyan+'99';c.fill();
    c.font=`10px ${F}`;c.fillStyle=L.muted;c.textAlign='center';
    c.fillText(d.month,gx+groupW/2,chartTopY+chartH2+18);
    c.textAlign='left';
  });

  // ── 35-year compound curve ────────────────────────────────────────────────
  const histY=BRAND_H+STATS_H+INDEX_H+CHART_H;
  c.strokeStyle=L.border;c.lineWidth=1;c.beginPath();c.moveTo(0,histY);c.lineTo(W,histY);c.stroke();
  c.fillStyle=L.bg;c.fillRect(0,histY,W,HIST_H);

  const years=Object.keys(INDEX_ANNUAL.nasdaq).map(Number).sort();
  let nV=100,sV=100;
  const cumPts=[[1989,100,100]];
  years.forEach(y=>{nV*=(1+(INDEX_ANNUAL.nasdaq[y]||0)/100);sV*=(1+(INDEX_ANNUAL.sp500[y]||0)/100);cumPts.push([y,+nV.toFixed(1),+sV.toFixed(1)]);});
  const nFinal=cumPts[cumPts.length-1][1],sFinal=cumPts[cumPts.length-1][2];

  c.fillStyle=L.blue;c.fillRect(PX,histY+18,3,16);
  c.font=`bold 14px ${F}`;c.fillStyle=L.dark;c.fillText('纳指 & 标普 · 35年复利增长',PX+10,histY+30);
  c.font=`11px ${F}`;c.fillStyle=L.muted;c.fillText('1990–2025  ·  以100为起点  ·  对数坐标',PX+10,histY+48);
  c.textAlign='right';
  c.fillStyle=L.blue;c.fillRect(W-PX-120,histY+18,10,10);
  c.font=`11px ${F}`;c.fillStyle=L.muted;c.fillText(`纳指 →${nFinal.toFixed(0)}x`,W-PX,histY+28);
  c.fillStyle=L.cyan;c.fillRect(W-PX-50,histY+18,10,10);
  c.fillText(`标普 →${sFinal.toFixed(0)}x`,W-PX,histY+44);
  c.textAlign='left';

  const hcX=PX+44,hcY=histY+62,hcW=W-PX*2-44,hcH=210;
  const logMin=Math.log10(60),logMax=Math.log10(Math.max(nFinal,sFinal)*1.3);
  const toY2=v=>hcY+hcH*(1-(Math.log10(Math.max(v,1))-logMin)/(logMax-logMin));

  [100,300,1000,3000,10000,30000].forEach(v=>{
    const yy=toY2(v);
    if(yy<hcY-4||yy>hcY+hcH+4)return;
    c.strokeStyle=L.border+(v===100?'':'80');c.lineWidth=v===100?1:0.5;
    c.beginPath();c.moveTo(hcX,yy);c.lineTo(hcX+hcW,yy);c.stroke();
    c.font=`9px ${F}`;c.fillStyle=L.muted;c.textAlign='right';
    c.fillText(v>=1000?`${v/1000}k`:String(v),hcX-4,yy+3);
  });
  c.textAlign='left';

  const xYrs=[1990,1995,2000,2005,2010,2015,2020,2025];
  xYrs.forEach(y=>{
    const xx=hcX+(y-1989)/(2025-1989)*hcW;
    c.font=`9px ${F}`;c.fillStyle=L.muted;c.textAlign='center';c.fillText(String(y),xx,hcY+hcH+14);
  });
  c.textAlign='left';

  [{y:2000,label:'科网泡沫'},{y:2008,label:'金融危机'},{y:2020,label:'新冠'}].forEach(({y,label})=>{
    const xx=hcX+(y-1989)/(2025-1989)*hcW;
    c.strokeStyle=L.border+'80';c.lineWidth=0.5;c.setLineDash([3,3]);
    c.beginPath();c.moveTo(xx,hcY);c.lineTo(xx,hcY+hcH);c.stroke();
    c.setLineDash([]);
    c.font=`8px ${F}`;c.fillStyle=L.muted;c.textAlign='center';c.fillText(label,xx,hcY+hcH+26);
  });
  c.textAlign='left';

  c.beginPath();
  cumPts.forEach(([y,n],i)=>{const xx=hcX+(y-1989)/(2025-1989)*hcW;const yy=toY2(n);if(i===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);});
  c.lineTo(hcX+hcW,hcY+hcH);c.lineTo(hcX,hcY+hcH);c.closePath();
  const nasFill=c.createLinearGradient(0,hcY,0,hcY+hcH);
  nasFill.addColorStop(0,L.blue+'40');nasFill.addColorStop(1,L.blue+'08');
  c.fillStyle=nasFill;c.fill();
  c.strokeStyle=L.blue;c.lineWidth=2.5;c.beginPath();
  cumPts.forEach(([y,n],i)=>{const xx=hcX+(y-1989)/(2025-1989)*hcW;const yy=toY2(n);if(i===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);});
  c.stroke();

  c.beginPath();
  cumPts.forEach(([y,,s],i)=>{const xx=hcX+(y-1989)/(2025-1989)*hcW;const yy=toY2(s);if(i===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);});
  c.lineTo(hcX+hcW,hcY+hcH);c.lineTo(hcX,hcY+hcH);c.closePath();
  const spFill=c.createLinearGradient(0,hcY,0,hcY+hcH);
  spFill.addColorStop(0,L.cyan+'30');spFill.addColorStop(1,L.cyan+'05');
  c.fillStyle=spFill;c.fill();
  c.strokeStyle=L.cyan;c.lineWidth=2;c.beginPath();
  cumPts.forEach(([y,,s],i)=>{const xx=hcX+(y-1989)/(2025-1989)*hcW;const yy=toY2(s);if(i===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);});
  c.stroke();

  // ── FX analysis ───────────────────────────────────────────────────────────
  const fxY=histY+HIST_H;
  c.strokeStyle=L.border;c.lineWidth=1;c.beginPath();c.moveTo(0,fxY);c.lineTo(W,fxY);c.stroke();
  c.fillStyle=L.bg;c.fillRect(0,fxY,W,FX_H);

  c.fillStyle=L.blue;c.fillRect(PX,fxY+18,3,16);
  c.font=`bold 14px ${F}`;c.fillStyle=L.dark;c.fillText('汇率影响剥离分析',PX+10,fxY+30);
  c.font=`11px ${F}`;c.fillStyle=L.muted;c.fillText('2015–2025  ·  人民币持有 vs 美元持有  ·  以100为基准，差距即汇率净贡献',PX+10,fxY+48);

  const fxYrs=Object.keys(FX_ANNUAL).map(Number).sort();
  let nuSD=100,nuCNY=100,suSD=100,suCNY=100;
  const fxPts=[[2014,100,100,100,100]];
  fxYrs.forEach(y=>{
    const[startFX2,endFX]=FX_ANNUAL[y];
    const fx=endFX/startFX2;
    const nr=1+(INDEX_ANNUAL.nasdaq[y]||0)/100;
    const sr=1+(INDEX_ANNUAL.sp500[y]||0)/100;
    nuSD*=nr;nuCNY*=nr*fx;suSD*=sr;suCNY*=sr*fx;
    fxPts.push([y,+nuSD.toFixed(1),+nuCNY.toFixed(1),+suSD.toFixed(1),+suCNY.toFixed(1)]);
  });
  const lastFX=fxPts[fxPts.length-1];
  const nUSDv=lastFX[1],nCNYv=lastFX[2],sUSDv=lastFX[3],sCNYv=lastFX[4];
  const nFXc=+(nCNYv-nUSDv).toFixed(1);
  const sFXc=+(sCNYv-sUSDv).toFixed(1);

  const scW=(W-PX*2-GAP*3)/4,scH=84,scY2=fxY+62;
  const drawSC=(x,y,w,h,lbl,sub,val,col)=>{
    _rr(c,x,y,w,h,8);c.fillStyle=L.card;c.fill();
    c.strokeStyle=L.border;c.lineWidth=0.5;c.stroke();
    c.font=`bold 20px ${F}`;c.fillStyle=col;c.textAlign='center';c.fillText(val,x+w/2,y+34);
    c.font=`11px ${F}`;c.fillStyle=L.dim;c.fillText(sub,x+w/2,y+50);
    c.font=`bold 10px ${F}`;c.fillStyle=L.dark;c.fillText(lbl,x+w/2,y+68);
    c.textAlign='left';
  };
  drawSC(PX,scY2,scW,scH,'纳指·美元累计',`+${(nUSDv-100).toFixed(0)}%`,`${nUSDv.toFixed(0)}`,L.blue);
  drawSC(PX+scW+GAP,scY2,scW,scH,'纳指·人民币累计',`+${(nCNYv-100).toFixed(0)}%`,`${nCNYv.toFixed(0)}`,L.blue);
  drawSC(PX+(scW+GAP)*2,scY2,scW,scH,'标普·美元累计',`+${(sUSDv-100).toFixed(0)}%`,`${sUSDv.toFixed(0)}`,L.cyan);
  drawSC(PX+(scW+GAP)*3,scY2,scW,scH,'标普·人民币累计',`+${(sCNYv-100).toFixed(0)}%`,`${sCNYv.toFixed(0)}`,L.cyan);

  const fxCol=nFXc>=0?L.green:L.red;
  const fxColS=sFXc>=0?L.green:L.red;
  c.font=`11px ${F}`;c.fillStyle=L.muted;c.textAlign='center';
  c.fillText(`纳指汇率贡献: ${nFXc>=0?'+':''}${nFXc}%`,PX+scW,scY2+scH+16);
  c.fillStyle=fxCol;c.fillText(nFXc>=0?'▲':'▼',PX+scW-20,scY2+scH+16);
  c.fillStyle=L.muted;c.fillText(`标普汇率贡献: ${sFXc>=0?'+':''}${sFXc}%`,PX+(scW+GAP)*3,scY2+scH+16);
  c.fillStyle=fxColS;c.fillText(sFXc>=0?'▲':'▼',PX+(scW+GAP)*3-20,scY2+scH+16);
  c.textAlign='left';

  const fc2X=PX+44,fc2Y=fxY+176,fc2W=W/2-PX-60,fc2H=68;
  const fc3X=W/2+16,fc3Y=fxY+176,fc3W=W/2-PX-36,fc3H=68;
  const allVals2=[...fxPts.map(p=>p[1]),...fxPts.map(p=>p[2]),...fxPts.map(p=>p[3]),...fxPts.map(p=>p[4])];
  const fvMin=Math.min(...allVals2)*0.95,fvMax=Math.max(...allVals2)*1.02;
  const toFY=(v,top,h)=>top+h*(1-(v-fvMin)/(fvMax-fvMin));

  const drawFXMini=(cx,cy,cw,ch,usdIdx,cnyIdx,col,titleStr)=>{
    c.font=`bold 11px ${F}`;c.fillStyle=col;c.fillText(titleStr,cx,cy-4);
    c.strokeStyle=L.border;c.lineWidth=0.5;
    c.beginPath();c.moveTo(cx,cy);c.lineTo(cx,cy+ch);c.lineTo(cx+cw,cy+ch);c.stroke();
    c.strokeStyle=col;c.lineWidth=1.5;c.beginPath();
    fxPts.forEach(([,nuSD2,nuCNY2,suSD2,suCNY2],i)=>{
      const vals=[nuSD2,nuCNY2,suSD2,suCNY2];
      const xx=cx+i/(fxPts.length-1)*cw;
      const yy=toFY(vals[usdIdx],cy,ch);
      if(i===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);
    });c.stroke();
    c.strokeStyle=L.orange;c.lineWidth=1.5;c.setLineDash([4,3]);c.beginPath();
    fxPts.forEach(([,nuSD2,nuCNY2,suSD2,suCNY2],i)=>{
      const vals=[nuSD2,nuCNY2,suSD2,suCNY2];
      const xx=cx+i/(fxPts.length-1)*cw;
      const yy=toFY(vals[cnyIdx],cy,ch);
      if(i===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);
    });c.stroke();c.setLineDash([]);
    c.font=`8px ${F}`;c.fillStyle=L.muted;c.textAlign='center';
    [2015,2018,2021,2025].forEach(y=>{
      const idx=fxPts.findIndex(p=>p[0]===y);
      if(idx<0)return;
      const xx=cx+idx/(fxPts.length-1)*cw;
      c.fillText(String(y),xx,cy+ch+12);
    });
    c.textAlign='left';
    c.font=`9px ${F}`;c.fillStyle=col;c.fillText('美元',cx+cw+4,cy+10);
    c.fillStyle=L.orange;c.fillText('人民币',cx+cw+4,cy+24);
  };
  drawFXMini(fc2X,fc2Y,fc2W,fc2H,0,1,L.blue,'纳指100  美元 vs 人民币');
  drawFXMini(fc3X,fc3Y,fc3W,fc3H,2,3,L.cyan,'标普500  美元 vs 人民币');

  // ── Footer ────────────────────────────────────────────────────────────────
  const fy=H-FOOTER_H;
  c.fillStyle=L.headBg;c.fillRect(0,fy,W,FOOTER_H);
  c.strokeStyle=L.border;c.lineWidth=1;c.beginPath();c.moveTo(0,fy);c.lineTo(W,fy);c.stroke();
  c.font=`12px ${F}`;c.fillStyle=L.muted;c.textAlign='center';
  c.fillText('wise-etf.com  ·  数据仅供参考，不构成投资建议',W/2,fy+FOOTER_H/2+5);
  c.textAlign='left';
  return cvs;
}

// ─── Report Page ──────────────────────────────────────────────────────────────
function ReportPage() {
  // ⚠️ 导出数据规范（禁止修改，如需变更请征得用户同意）：
  // 1. 导出图片的数据必须与界面展示数据完全一致
  // 2. 数据来源：/api/funds/* + /api/etfs + /api/live_data（Redis 缓存，由 cron 每日更新）
  // 3. 严禁使用 FALLBACK 静态数据或 localStorage 作为基础数据源
  // 4. 必须等所有 API 返回后再生成图片，不允许提前用空数据生成

  const [images, setImages] = useState([]);
  const [generating, setGenerating] = useState(true);
  const [toast, setToast] = useState(null);
  const isMobile = typeof window!=="undefined" && window.innerWidth<=768;

  const showToast=(msg,ok=true)=>{
    setToast({msg,ok});
    setTimeout(()=>setToast(null),2000);
  };

  // 申购上限排序：高→低，暂停垫底（-1 确保暂停永远在所有有效限额之下）
  const byLimit=(arr)=>{
    const parse=s=>{if(!s||s==='暂停申购')return -1;if(s==='不限额')return 9999999;return parseFloat(s)||0;};
    return [...arr].sort((a,b)=>parse(b.daily_limit)-parse(a.daily_limit));
  };

  useEffect(()=>{
    // ⚠️ 此处数据获取逻辑禁止修改 ⚠️
    // 并发拉取所有分类数据，等全部返回后再生成图片
    // /api/funds/* 和 /api/etfs 读取 Redis 缓存（cron 每日写入），不重复调外部接口
    // /api/live_data 提供 day_change / rolling_1y（昨日涨跌 + 近1年滚动）
    Promise.all([
      apiFetch("/funds/nasdaq_passive"),
      apiFetch("/funds/sp500_passive"),
      apiFetch("/funds/us_active"),
      apiFetch("/etfs"),
      apiFetch("/live_data"),
    ]).then(([nasdaqRes, sp500Res, activeRes, etfsRes, liveRes])=>{
      const nasdaq = nasdaqRes?.data || [];
      const sp500  = sp500Res?.data  || [];
      const active = activeRes?.data || [];
      const etfs   = etfsRes?.data   || [];
      const liveMap= liveRes?.data   || {};

      // live_data 只补充 day_change / rolling_1y
      // buy_status / daily_limit 已由 /api/funds/* 提供，不允许被 live_data 覆盖
      // ytd_return（25年涨幅）永远不覆盖
      // 此逻辑与主页面 mergeLive 保持完全一致，禁止修改
      const LIVE_SKIP = new Set(["buy_status","daily_limit","ytd_return"]);
      const merge = arr => arr.map(f=>{
        const live = liveMap[f.code];
        if(!live) return f;
        const patch = Object.fromEntries(
          Object.entries(live).filter(([k,v])=>v!=null && !LIVE_SKIP.has(k))
        );
        return {...f,...patch};
      });

      const nasdaqData = merge(nasdaq);
      const sp500Data  = merge(sp500);
      const activeData = merge(active);
      // 场内ETF：按跟踪误差从低到高排序
      const etfsData   = merge(etfs).sort((a,b)=>(a.track_error||99)-(b.track_error||99));

      const today=new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'});
      const ds=today.replace(/\//g,'-');

      const logoImg=new Image();
      const proceed=(logo)=>{
        try{
          const imgs=[
            {title:'场外纳指被动基金',   url:drawNasdaqExportCanvas(byLimit(nasdaqData),logo).toDataURL('image/png'), filename:`wise-etf-nasdaq-${ds}.png`},
            {title:'场外标普500被动基金', url:drawSp500ExportCanvas(byLimit(sp500Data),logo).toDataURL('image/png'),  filename:`wise-etf-sp500-${ds}.png`},
            {title:'场内ETF对比',         url:drawEtfExportCanvas(etfsData,logo).toDataURL('image/png'),              filename:`wise-etf-etf-${ds}.png`},
            {title:'美股主动型基金',      url:drawActiveExportCanvas(byLimit(activeData),logo).toDataURL('image/png'),filename:`wise-etf-active-${ds}.png`},
          ];
          setImages(imgs);
        }finally{setGenerating(false);}
      };
      logoImg.onload=()=>proceed(logoImg);
      logoImg.onerror=()=>proceed(null);
      logoImg.src=encodeURI('/@Wise 投资有术 (2).png');
    }).catch(()=>setGenerating(false));
  },[]);

  /* ── 旧版生成逻辑（已暂停，后续优化时恢复） ──────────────────────────────
  const handleGenerateLegacy=()=>{
    // drawOverviewCanvas1、drawOverviewCanvas、drawTableCanvas 生成 5 张旧版图
    // 详见 git 历史或 bdc8392a 对话记录
  };
  ─────────────────────────────────────────────────────────────────────────── */

  const handleDownload=(url,filename)=>{
    const a=document.createElement('a');a.href=url;a.download=filename;a.click();
  };

  const handleDownloadAll=()=>{
    images.forEach((img,i)=>{
      setTimeout(()=>handleDownload(img.url,img.filename), i*300);
    });
    showToast(`开始下载全部 ${images.length} 张图片`);
  };

  const handleCopy=async(url,title)=>{
    try{
      const resp=await fetch(url);
      const blob=await resp.blob();
      await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
      showToast(`已复制：${title}`);
    }catch{showToast('复制失败，请右键图片另存为',false);}
  };

  return (
    <div style={{minHeight:'100vh',background:'#f8fafc',fontFamily:'"PingFang SC","Microsoft YaHei",Arial,sans-serif'}}>
      {/* Toast */}
      {toast&&(
        <div style={{position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',zIndex:9999,
          background:toast.ok?'#0f172a':'#dc2626',color:'#fff',padding:'10px 20px',
          borderRadius:24,fontSize:13,fontWeight:600,
          boxShadow:'0 4px 20px rgba(0,0,0,0.25)',pointerEvents:'none',
          animation:'toastIn 0.2s ease'}}>
          {toast.ok?'✓ ':''}{toast.msg}
        </div>
      )}
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#1a56db,#7c3aed)',padding:'20px 24px',color:'#fff'}}>
        <div style={{maxWidth:1100,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <a href="/" style={{color:'rgba(255,255,255,0.85)',fontSize:13,textDecoration:'none',border:'1px solid rgba(255,255,255,0.4)',padding:'6px 16px',borderRadius:20}}>← 返回首页</a>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:20,fontWeight:800,letterSpacing:-0.5}}>Wise ETF · 导出报告</div>
            <div style={{fontSize:13,opacity:0.8,marginTop:4}}>一键生成全部图片，分享或存档</div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:'0 auto',padding:'28px 16px'}}>
        {/* Action bar */}
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:32,flexWrap:'wrap'}}>
          {generating&&<span style={{fontSize:13,color:'#94a3b8'}}>图片生成中…</span>}
          {images.length>0&&!isMobile&&(
            <button onClick={handleDownloadAll}
              style={{display:'flex',alignItems:'center',gap:8,padding:'11px 24px',borderRadius:14,border:'none',background:'linear-gradient(135deg,#16a34a,#059669)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(22,163,74,0.3)'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              下载全部 ({images.length}张)
            </button>
          )}
          {images.length>0&&<span style={{fontSize:13,color:'#16a34a',fontWeight:600}}>✓ 已生成 {images.length} 张</span>}
        </div>

        {/* Image gallery */}
        {images.length>0&&(
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:24}}>
            {images.map((img,i)=>(
              <div key={i} style={{background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,0.08)',border:'1px solid #e2e8f0'}}>
                <div style={{padding:'14px 20px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                  <div style={{fontSize:15,fontWeight:700,color:'#0f172a'}}>{i+1}. {img.title}</div>
                  <div style={{display:'flex',gap:8}}>
                    {isMobile?(
                      <span style={{fontSize:12,color:'#94a3b8',padding:'6px 0'}}>长按图片 → 保存到相册</span>
                    ):(
                      <>
                        <button onClick={()=>handleCopy(img.url,img.title)}
                          style={{display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:10,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#374151',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                          复制
                        </button>
                        <button onClick={()=>handleDownload(img.url,img.filename)}
                          style={{display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#007aff,#5856d6)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          下载
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div style={{padding:16,background:'#f8fafc',overflow:'auto'}}>
                  <img src={img.url} alt={img.title} style={{maxWidth:'100%',borderRadius:8,display:'block'}}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {images.length===0&&generating&&(
          <div style={{textAlign:'center',padding:'60px 0',color:'#94a3b8'}}>
            <div style={{fontSize:16,fontWeight:600,color:'#64748b'}}>图片生成中，请稍候…</div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
      `}</style>
    </div>
  );
}

// ─── SliderCaptcha ────────────────────────────────────────────────────────────
function SliderCaptcha({ onVerified }) {
  const [pos, setPos] = useState(0);
  const [verified, setVerified] = useState(false);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startPos = useRef(0);
  const TRACK_W = 260, HANDLE_W = 44, MAX = TRACK_W - HANDLE_W;

  const handleStart = (cx) => {
    if (verified) return;
    dragging.current = true;
    startX.current = cx;
    startPos.current = pos;
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const newPos = Math.max(0, Math.min(MAX, startPos.current + (cx - startX.current)));
      setPos(newPos);
      if (newPos >= MAX - 2) {
        dragging.current = false;
        setVerified(true);
        onVerified();
      }
    };
    const onEnd = () => {
      if (dragging.current) { dragging.current = false; setPos(0); startPos.current = 0; }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [verified, onVerified, MAX]);

  return (
    <div style={{ marginBottom: 16, userSelect: "none" }}>
      <div style={{ fontSize: 12, color: verified ? "#059669" : "#64748b", marginBottom: 8, fontWeight: verified ? 600 : 400 }}>
        {verified ? "✅ 验证通过" : "请拖动滑块到最右侧"}
      </div>
      <div style={{
        position: "relative", width: TRACK_W, height: HANDLE_W,
        background: verified ? "#dcfce7" : "#f1f5f9",
        borderRadius: HANDLE_W / 2,
        border: `1.5px solid ${verified ? "#86efac" : "#e2e8f0"}`,
      }}>
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: Math.max(pos + HANDLE_W / 2, HANDLE_W / 2),
          background: verified ? "#86efac" : "#c7d2fe",
          borderRadius: HANDLE_W / 2,
        }} />
        <div
          onMouseDown={e => { e.preventDefault(); handleStart(e.clientX); }}
          onTouchStart={e => { handleStart(e.touches[0].clientX); }}
          style={{
            position: "absolute", left: pos, top: 0,
            width: HANDLE_W, height: HANDLE_W,
            background: "#fff", borderRadius: "50%",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: verified ? "default" : "grab",
            fontSize: 16, fontWeight: 700, zIndex: 1,
            color: verified ? "#059669" : "#6366f1",
          }}
        >
          {verified ? "✓" : "›"}
        </div>
      </div>
    </div>
  );
}

// ─── AuthModal ────────────────────────────────────────────────────────────────
function AuthModal({ onClose, onLogin, authRequired }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaOk, setCaptchaOk] = useState(false);

  const switchMode = (m) => { setMode(m); setError(""); setCaptchaOk(false); setPassword(""); setConfirmPwd(""); setShowPwd(false); setShowConfirmPwd(false); };

  const validatePwd = (p) => {
    if (p.length < 8) return "密码至少8位";
    if (!/[A-Z]/.test(p)) return "需包含大写字母";
    if (!/[a-z]/.test(p)) return "需包含小写字母";
    if (!/[0-9]/.test(p)) return "需包含数字";
    return null;
  };

  const handleSubmit = async () => {
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("邮箱格式不正确"); return; }
    if (!captchaOk) { setError("请完成滑块验证"); return; }
    if (mode === "register") {
      const e = validatePwd(password); if (e) { setError(e); return; }
      if (password !== confirmPwd) { setError("两次密码不一致"); return; }
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem("wise_token", data.token);
        localStorage.setItem("wise_email", data.email);
        onLogin({ token: data.token, email: data.email });
      } else {
        setError(data.msg || "操作失败");
      }
    } catch { setError("网络错误，请稍后重试"); }
    setLoading(false);
  };

  const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  const EyeIcon = ({ show }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {show ? (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>) : (<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>)}
    </svg>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (!authRequired && e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "32px", maxWidth: 400, width: "90%", position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        {!authRequired && (
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>×</button>
        )}
        <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>
          {mode === "login" ? "欢迎回来" : "创建账号"}
        </div>
        {authRequired && (
          <div style={{ fontSize: 13, color: "#f59e0b", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 12px", marginBottom: 16, marginTop: 8 }}>
            请登录后访问此功能
          </div>
        )}
        <div style={{ marginTop: authRequired ? 0 : 20 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 500 }}>邮箱</div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inputStyle} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 500 }}>密码</div>
            <div style={{ position: "relative" }}>
              <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === "register" ? "至少8位，含大小写字母和数字" : "请输入密码"} style={{ ...inputStyle, paddingRight: 42 }} onKeyDown={e => e.key === "Enter" && mode === "login" && handleSubmit()} />
              <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex", alignItems: "center" }}>
                <EyeIcon show={showPwd} />
              </button>
            </div>
          </div>
          {mode === "register" && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 500 }}>确认密码</div>
              <div style={{ position: "relative" }}>
                <input type={showConfirmPwd ? "text" : "password"} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="再次输入密码" style={{ ...inputStyle, paddingRight: 42 }} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
                <button type="button" onClick={() => setShowConfirmPwd(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex", alignItems: "center" }}>
                  <EyeIcon show={showConfirmPwd} />
                </button>
              </div>
            </div>
          )}
          <SliderCaptcha key={mode} onVerified={() => setCaptchaOk(true)} />
          {error && <div style={{ fontSize: 13, color: "#ef4444", marginBottom: 12, background: "#fef2f2", padding: "8px 12px", borderRadius: 8, border: "1px solid #fecaca" }}>{error}</div>}
          <button onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: loading ? "#a5b4fc" : "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: loading ? "default" : "pointer" }}>
            {loading ? "处理中…" : (mode === "login" ? "登录" : "注册")}
          </button>
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#64748b" }}>
            {mode === "login" ? <>还没有账号？<button onClick={() => switchMode("register")} style={{ color: "#4f46e5", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, padding: 0 }}>立即注册</button></> : <>已有账号？<button onClick={() => switchMode("login")} style={{ color: "#4f46e5", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, padding: 0 }}>去登录</button></>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── UserCenter ───────────────────────────────────────────────────────────────
function UserCenter({ user, onClose, onLogout, favorites, allFunds }) {
  const [expandedCode, setExpandedCode] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [rightPanel, setRightPanel] = useState("account"); // "account" | "compare"
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old: "", new1: "", new2: "", showOld: false, showNew: false });
  const [pwdMsg, setPwdMsg] = useState(null); // { ok, text }
  const [pwdLoading, setPwdLoading] = useState(false);

  const openChangePwd = () => { setPwdForm({ old: "", new1: "", new2: "", showOld: false, showNew: false }); setPwdMsg(null); setShowChangePwd(true); };

  const handleChangePwd = async () => {
    setPwdMsg(null);
    if (!pwdForm.old) { setPwdMsg({ ok: false, text: "请输入当前密码" }); return; }
    if (pwdForm.new1 !== pwdForm.new2) { setPwdMsg({ ok: false, text: "两次新密码不一致" }); return; }
    setPwdLoading(true);
    try {
      const token = localStorage.getItem("wise_token") || "";
      const res = await fetch("/api/auth/change_password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ old_password: pwdForm.old, new_password: pwdForm.new1 }),
      });
      const data = await res.json();
      setPwdMsg({ ok: data.ok, text: data.msg || (data.ok ? "修改成功" : "修改失败") });
      if (data.ok) { setTimeout(() => setShowChangePwd(false), 1200); }
    } catch { setPwdMsg({ ok: false, text: "网络错误，请稍后重试" }); }
    setPwdLoading(false);
  };

  const GROUPS = [
    { label: "纳指被动", color: "#4f46e5", funds: allFunds.nasdaq },
    { label: "标普500",  color: "#06b6d4", funds: allFunds.sp500  },
    { label: "美股主动", color: "#a855f7", funds: allFunds.active  },
    { label: "场内ETF",  color: "#f97316", funds: allFunds.etfs   },
  ];
  const allFlatFunds = GROUPS.flatMap(g => g.funds || []);
  const myGroups = GROUPS.map(g => ({ ...g, funds: (g.funds || []).filter(f => favorites.includes(f.code)) })).filter(g => g.funds.length > 0);
  const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.email || "user")}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

  const toggleCompare = (code) => {
    setCompareList(prev => {
      if (prev.includes(code)) return prev.filter(c => c !== code);
      if (prev.length >= 4) return prev;
      return [...prev, code];
    });
    setRightPanel("compare");
  };

  // 评分算法：在自选基金范围内标准化
  const scoreFunds = (funds) => {
    if (!funds.length) return {};
    const get = (f, k) => f[k] ?? null;
    const normalize = (vals, higherBetter) => {
      const valid = vals.filter(v => v != null);
      if (!valid.length) return vals.map(() => null);
      const mn = Math.min(...valid), mx = Math.max(...valid);
      return vals.map(v => v == null ? null : mx === mn ? 50 : higherBetter ? (v - mn) / (mx - mn) * 100 : (mx - v) / (mx - mn) * 100);
    };
    const ytdScores    = normalize(funds.map(f => get(f,"ytd_return")),  true);
    const feeScores    = normalize(funds.map(f => get(f,"fee_rate")),     false);
    const teScores     = normalize(funds.map(f => get(f,"track_error")),  false);
    const scaleScores  = normalize(funds.map(f => get(f,"scale")),        true);
    return Object.fromEntries(funds.map((f, i) => {
      const parts = [
        [ytdScores[i],   0.40],
        [feeScores[i],   0.30],
        [teScores[i],    0.20],
        [scaleScores[i], 0.10],
      ];
      const validParts = parts.filter(([v]) => v != null);
      const totalW = validParts.reduce((s,[,w]) => s+w, 0);
      const raw = totalW > 0 ? validParts.reduce((s,[v,w]) => s + v*(w/totalW), 0) : 50;
      const bonus = f.buy_status === "open" ? 3 : -3;
      return [f.code, Math.min(100, Math.max(0, Math.round(raw + bonus)))];
    }));
  };

  const compareScores = (() => {
    if (compareList.length < 2) return {};
    const funds = compareList.map(c => allFlatFunds.find(f => f.code === c)).filter(Boolean);
    return scoreFunds(funds);
  })();

  const scoreColor = (s) => s >= 70 ? "#16a34a" : s >= 45 ? "#f59e0b" : "#dc2626";
  const scoreBg    = (s) => s >= 70 ? "#f0fdf4" : s >= 45 ? "#fffbeb" : "#fef2f2";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: 1080, height: "88vh", background: "#f8fafc", borderRadius: 24, boxShadow: "0 40px 100px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── Header ── */}
        <div style={{ background: "linear-gradient(135deg,#312e81 0%,#4f46e5 55%,#7c3aed 100%)", padding: "24px 32px", color: "#fff", display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
          <img src={avatarUrl} alt="avatar" style={{ width: 52, height: 52, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.5)", flexShrink: 0, background: "rgba(255,255,255,0.15)" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
            <div style={{ marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: "2px 10px" }}>免费版</span>
              <span style={{ fontSize: 11, opacity: 0.6 }}>自选 {favorites.length} 只</span>
              {compareList.length > 0 && <span style={{ fontSize: 11, background: "rgba(251,191,36,0.3)", border: "1px solid rgba(251,191,36,0.5)", borderRadius: 20, padding: "2px 10px", color: "#fde68a" }}>已选 {compareList.length} 只对比</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "6px 14px", whiteSpace: "nowrap", opacity: 0.8 }}>Pro · 即将开放</div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

          {/* ── Left: 我的自选 ── */}
          <div style={{ width: 380, flexShrink: 0, borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", background: "#fff" }}>
            <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>我的自选</div>
              {compareList.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>对比中：</span>
                  {compareList.map(c => {
                    const f = allFlatFunds.find(x => x.code === c);
                    return f ? <span key={c} onClick={() => toggleCompare(c)} style={{ fontSize: 11, background: "#ede9fe", color: "#7c3aed", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>{f.code} ×</span> : null;
                  })}
                  <span onClick={() => { setCompareList([]); setRightPanel("account"); }} style={{ fontSize: 11, color: "#94a3b8", cursor: "pointer", marginLeft: 4 }}>清除</span>
                </div>
              )}
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "12px 16px 24px" }}>
              {myGroups.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>⭐</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>暂无自选基金</div>
                  <div style={{ fontSize: 12 }}>在各板块点击 ☆ 加入自选</div>
                </div>
              ) : myGroups.map(g => (
                <div key={g.label} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: g.color, marginBottom: 8, display: "flex", alignItems: "center", gap: 5, letterSpacing: 0.8, textTransform: "uppercase" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: g.color, display: "inline-block" }} />{g.label}
                  </div>
                  {g.funds.map(f => {
                    const isExpanded = expandedCode === f.code;
                    const inCompare  = compareList.includes(f.code);
                    return (
                      <div key={f.code} style={{ borderRadius: 12, border: `1.5px solid ${inCompare ? "#a5b4fc" : "#f1f5f9"}`, background: inCompare ? "#f5f3ff" : "#fafafa", marginBottom: 8, overflow: "hidden", transition: "border-color .15s" }}>
                        {/* Fund row */}
                        <div style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setExpandedCode(isExpanded ? null : f.code)}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace", marginTop: 2 }}>{f.code}</div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            {f.ytd_return != null && <div style={{ fontSize: 13, fontWeight: 700, color: f.ytd_return >= 0 ? "#dc2626" : "#16a34a" }}>{f.ytd_return >= 0 ? "+" : ""}{f.ytd_return.toFixed(2)}%</div>}
                            <div style={{ fontSize: 10, color: f.buy_status === "open" ? "#16a34a" : "#94a3b8", marginTop: 1 }}>{f.buy_status === "open" ? "开放申购" : "暂停申购"}</div>
                          </div>
                          <div style={{ fontSize: 12, color: "#94a3b8", flexShrink: 0 }}>{isExpanded ? "▲" : "▼"}</div>
                        </div>
                        {/* Expanded detail */}
                        {isExpanded && (
                          <div style={{ borderTop: "1px solid #f1f5f9", padding: "12px 14px", background: "#fff" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 12 }}>
                              {[
                                ["年化费率", f.fee_rate != null ? `${f.fee_rate}%` : "—"],
                                ["基金规模", f.scale != null ? `${f.scale} 亿` : "—"],
                                ["跟踪误差", f.track_error != null ? `${f.track_error}%` : "—"],
                                ["每日限额", f.daily_limit || "—"],
                              ].map(([k, v]) => (
                                <div key={k}>
                                  <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>{k}</div>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{v}</div>
                                </div>
                              ))}
                            </div>
                            <button onClick={() => toggleCompare(f.code)} style={{ width: "100%", padding: "7px", borderRadius: 8, border: `1.5px solid ${inCompare ? "#a5b4fc" : "#e2e8f0"}`, background: inCompare ? "#ede9fe" : "#f8fafc", color: inCompare ? "#7c3aed" : "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                              {inCompare ? "✓ 已加入对比  点击移除" : "+ 加入对比"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflowY: "auto" }}>

            {/* Right tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", padding: "0 24px", background: "#fff", flexShrink: 0 }}>
              {[["account","账户信息"],["compare","基金对比"]].map(([key, label]) => (
                <button key={key} onClick={() => setRightPanel(key)} style={{ padding: "14px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: rightPanel === key ? 700 : 400, color: rightPanel === key ? "#4f46e5" : "#64748b", borderBottom: rightPanel === key ? "2px solid #4f46e5" : "2px solid transparent", marginBottom: -1, fontFamily: "inherit" }}>
                  {label}{key === "compare" && compareList.length > 0 && <span style={{ marginLeft: 6, fontSize: 11, background: "#ede9fe", color: "#7c3aed", borderRadius: 10, padding: "1px 6px" }}>{compareList.length}</span>}
                </button>
              ))}
            </div>

            <div style={{ padding: "24px 28px 32px", flex: 1 }}>

              {/* ── Account tab ── */}
              {rightPanel === "account" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}>
                  <div style={{ borderRadius: 14, border: "1px solid #f1f5f9", overflow: "hidden", background: "#fff" }}>
                    <div style={{ background: "#f8fafc", padding: "11px 16px", fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.8, textTransform: "uppercase" }}>账户信息</div>
                    {[["邮箱", user.email],["当前套餐","免费版"],["账户状态","正常"]].map(([k,v]) => (
                      <div key={k} style={{ padding: "13px 16px", display: "flex", justifyContent: "space-between", borderTop: "1px solid #f1f5f9" }}>
                        <span style={{ fontSize: 13, color: "#64748b" }}>{k}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ padding: "13px 16px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#64748b" }}>登录密码</span>
                      <button onClick={openChangePwd} style={{ fontSize: 13, fontWeight: 600, color: "#4f46e5", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>修改密码</button>
                    </div>
                  </div>
                  <div style={{ borderRadius: 14, border: "1.5px solid #e0e7ff", background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", padding: "20px 22px" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#4f46e5", marginBottom: 6 }}>Pro 计划 · 即将开放</div>
                    <div style={{ fontSize: 13, color: "#6366f1", lineHeight: 1.7 }}>解锁全部板块访问权限、溢价率历史、估值详情及优先支持。敬请期待。</div>
                  </div>
                  <button onClick={onLogout} style={{ padding: "12px", borderRadius: 12, border: "1.5px solid #fecaca", background: "#fff", color: "#ef4444", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                    onMouseEnter={e => e.currentTarget.style.background="#fef2f2"}
                    onMouseLeave={e => e.currentTarget.style.background="#fff"}>
                    退出登录
                  </button>
                </div>
              )}

              {/* ── Compare tab ── */}
              {rightPanel === "compare" && (
                <>
                  {compareList.length < 2 ? (
                    <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
                      <div style={{ fontSize: 40, marginBottom: 16 }}>⚖️</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>请从左侧选择 2~4 只基金进行对比</div>
                      <div style={{ fontSize: 13 }}>展开基金 → 点击「加入对比」</div>
                    </div>
                  ) : (() => {
                    const funds = compareList.map(c => allFlatFunds.find(f => f.code === c)).filter(Boolean);
                    const METRICS = [
                      { key: "ytd_return",  label: "今年以来收益", fmt: v => v != null ? `+${v.toFixed(2)}%` : "—", higher: true },
                      { key: "fee_rate",    label: "年化费率",     fmt: v => v != null ? `${v}%`            : "—", higher: false },
                      { key: "track_error", label: "跟踪误差",     fmt: v => v != null ? `${v}%`            : "—", higher: false },
                      { key: "scale",       label: "基金规模",     fmt: v => v != null ? `${v} 亿`          : "—", higher: true  },
                      { key: "daily_limit", label: "每日限额",     fmt: v => v || "—",                              higher: null  },
                      { key: "buy_status",  label: "申购状态",     fmt: v => v === "open" ? "开放申购" : "暂停申购", higher: null  },
                    ];
                    // best value per metric
                    const best = {};
                    METRICS.forEach(m => {
                      if (m.higher == null) return;
                      const vals = funds.map(f => f[m.key]).filter(v => v != null);
                      if (!vals.length) return;
                      best[m.key] = m.higher ? Math.max(...vals) : Math.min(...vals);
                    });
                    return (
                      <div>
                        {/* Score cards */}
                        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                          {funds.map(f => {
                            const s = compareScores[f.code] ?? 50;
                            return (
                              <div key={f.code} style={{ flex: "1 1 140px", borderRadius: 14, border: `1.5px solid ${scoreColor(s)}33`, background: scoreBg(s), padding: "16px 18px", textAlign: "center" }}>
                                <div style={{ fontSize: 28, fontWeight: 900, color: scoreColor(s), lineHeight: 1 }}>{s}</div>
                                <div style={{ fontSize: 10, color: scoreColor(s), fontWeight: 700, marginTop: 2, marginBottom: 8 }}>综合评分</div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: "#1e293b", lineHeight: 1.4 }}>{f.name}</div>
                                <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace", marginTop: 3 }}>{f.code}</div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Comparison table */}
                        <div style={{ borderRadius: 14, border: "1px solid #f1f5f9", overflow: "hidden", background: "#fff" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ background: "#f8fafc" }}>
                                <th style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.6, textTransform: "uppercase", width: 110 }}>指标</th>
                                {funds.map(f => <th key={f.code} style={{ padding: "11px 12px", fontSize: 12, fontWeight: 700, color: "#1e293b", textAlign: "center", borderLeft: "1px solid #f1f5f9", minWidth: 110 }}>{f.code}</th>)}
                              </tr>
                            </thead>
                            <tbody>
                              {METRICS.map((m, i) => (
                                <tr key={m.key} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 ? "#fafafa" : "#fff" }}>
                                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", fontWeight: 500 }}>{m.label}</td>
                                  {funds.map(f => {
                                    const v = f[m.key];
                                    const isBest = m.higher != null && v != null && v === best[m.key];
                                    return (
                                      <td key={f.code} style={{ padding: "12px 12px", textAlign: "center", borderLeft: "1px solid #f1f5f9" }}>
                                        <span style={{ fontSize: 13, fontWeight: isBest ? 700 : 500, color: m.key === "buy_status" ? (v === "open" ? "#16a34a" : "#94a3b8") : (isBest ? scoreColor(80) : "#1e293b"), background: isBest ? scoreBg(80) : "transparent", padding: isBest ? "2px 8px" : "0", borderRadius: 6 }}>
                                          {m.fmt(v)}
                                        </span>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div style={{ marginTop: 10, fontSize: 11, color: "#94a3b8" }}>※ 综合评分基于今年收益（40%）、费率（30%）、跟踪误差（20%）、规模（10%）加权计算，绿色高亮为各项最优值。</div>
                      </div>
                    );
                  })()}
                </>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ── 修改密码弹窗 ── */}
      {showChangePwd && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={e => e.target === e.currentTarget && setShowChangePwd(false)}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "32px", width: "min(420px,90%)", boxShadow: "0 24px 60px rgba(0,0,0,0.25)", position: "relative" }}>
            <button onClick={() => setShowChangePwd(false)} style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>×</button>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", marginBottom: 20 }}>修改密码</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "当前密码",   key: "old",  showKey: "showOld", placeholder: "请输入当前密码" },
                { label: "新密码",     key: "new1", showKey: "showNew", placeholder: "至少8位，含大小写字母和数字" },
                { label: "确认新密码", key: "new2", showKey: "showNew", placeholder: "再次输入新密码" },
              ].map(({ label, key, showKey, placeholder }) => (
                <div key={key}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 500 }}>{label}</div>
                  <div style={{ position: "relative" }}>
                    <input
                      type={pwdForm[showKey] ? "text" : "password"}
                      value={pwdForm[key]}
                      onChange={e => { setPwdForm(p => ({ ...p, [key]: e.target.value })); setPwdMsg(null); }}
                      placeholder={placeholder}
                      style={{ width: "100%", padding: "10px 40px 10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                    />
                    <button type="button" onClick={() => setPwdForm(p => ({ ...p, [showKey]: !p[showKey] }))}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex", alignItems: "center" }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {pwdForm[showKey] ? (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>) : (<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>)}
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {pwdMsg && (
                <div style={{ fontSize: 13, padding: "9px 13px", borderRadius: 8, background: pwdMsg.ok ? "#f0fdf4" : "#fef2f2", color: pwdMsg.ok ? "#16a34a" : "#ef4444", border: `1px solid ${pwdMsg.ok ? "#bbf7d0" : "#fecaca"}` }}>
                  {pwdMsg.ok ? "✓ " : "✕ "}{pwdMsg.text}
                </div>
              )}
              <button onClick={handleChangePwd} disabled={pwdLoading}
                style={{ padding: "12px", borderRadius: 12, border: "none", background: pwdLoading ? "#a5b4fc" : "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: pwdLoading ? "default" : "pointer", fontFamily: "inherit", marginTop: 2 }}>
                {pwdLoading ? "处理中…" : "确认修改"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  if(window.location.pathname==="/admin") return <AdminPage/>;
  if(window.location.pathname==="/export") return <ReportPage/>;
  if(window.location.pathname==="/lazy") return <LazyPage/>;
  if(window.location.pathname==="/qdii") return <QDIIPage/>;

  const getInitialTab = () => {
    const path = window.location.pathname.replace(/^\//, "");
    const valid = ["guide","nasdaq","sp500","etf","active","watchlist"];
    return valid.includes(path) ? path : "overview";
  };
  const [activeTab,setActiveTab]=useState(getInitialTab);
  const [sortKey,setSortKey]=useState(null);
  const [sortDir,setSortDir]=useState("desc");
  const [search,setSearch]=useState("");
  const [statusFilter,setStatusFilter]=useState("all");
  const [selETF,setSelETF]=useState("513100");
  const [scrolled,setScrolled]=useState(false);
  const [showBackToTop,setShowBackToTop]=useState(false);
  const [mobileMenuOpen,setMobileMenuOpen]=useState(false);
  const [showDisclaimer,setShowDisclaimer]=useState(()=>{
    if(typeof window!=="undefined"&&window.innerWidth<=768){
      localStorage.setItem("etf-disclaimer","1");
      return false;
    }
    return !localStorage.getItem("etf-disclaimer");
  });
  const [showBriefing,setShowBriefing]=useState(()=>{
    if(!localStorage.getItem("etf-disclaimer")) return false;
    if(localStorage.getItem("group_chat_no_show")===new Date().toDateString()) return false;
    const last=localStorage.getItem("group_chat_last_shown");
    if(!last) return true;
    return Date.now()-parseInt(last)>3*60*60*1000;
  });
  const [favorites,setFavorites]=useState(()=>JSON.parse(localStorage.getItem("etf-favorites")||"[]"));
  const [user,setUser]=useState(()=>{try{const t=localStorage.getItem("wise_token"),e=localStorage.getItem("wise_email");return t&&e?{token:t,email:e}:null;}catch{return null;}});
  const [showAuth,setShowAuth]=useState(false);
  const [authRequired,setAuthRequired]=useState(false);
  const [showUserCenter,setShowUserCenter]=useState(false);
  const [lastUpdate,setLastUpdate]=useState(null);
  const [dataLoading,setDataLoading]=useState(false);
  const [usdcny,setUsdcny]=useState(null);
  const [sentiment,setSentiment]=useState(null);
  const [peHistory,setPeHistory]=useState({sp500:[],nasdaq100:[]});
  const [aiInsight,setAiInsight]=useState(null);
  const [aiLoading,setAiLoading]=useState(false);
  const [compareList,setCompareList]=useState([]);
  const [showCompare,setShowCompare]=useState(false);
  const [showWechat,setShowWechat]=useState(false);
  const navRef=useRef(null);
  const [indicator,setIndicator]=useState({left:0,width:0,opacity:0});

  const windowWidth = useWindowWidth();
  const isMobile = windowWidth <= 768;

  const [nasdaq,setNasdaq]=useState(FALLBACK.nasdaq_passive);
  const [sp500, setSp500 ]=useState(FALLBACK.sp500_passive);
  const [active,setActive]=useState(FALLBACK.us_active);
  const [etfs,  setEtfs  ]=useState(FALLBACK.etfs);
  // 同步读缓存，避免首屏 loading 闪烁
  const [liveData,setLiveData]=useState(()=>{
    try{
      const raw=localStorage.getItem("wise_etf_live_v2");
      if(!raw) return {};
      const {data,ts}=JSON.parse(raw);
      const H21=21*3600*1000,DAY=24*3600*1000;
      if(ts>=Math.floor((Date.now()-H21)/DAY)*DAY+H21) return data;
    }catch{}
    return {};
  });
  const [liveTs,setLiveTs]=useState(()=>{
    try{
      const raw=localStorage.getItem("wise_etf_live_v2");
      if(!raw) return null;
      const {liveTs,ts}=JSON.parse(raw);
      const H21=21*3600*1000,DAY=24*3600*1000;
      if(ts>=Math.floor((Date.now()-H21)/DAY)*DAY+H21) return liveTs||null;
    }catch{}
    return null;
  });

  useEffect(()=>{
    const h=()=>{setScrolled(window.scrollY>8);setShowBackToTop(window.scrollY>400);};
    window.addEventListener("scroll",h,{passive:true});
    return()=>window.removeEventListener("scroll",h);
  },[]);

  useEffect(()=>{
    const onPop=()=>{
      const path=window.location.pathname.replace(/^\//,"");
      const valid=["guide","nasdaq","sp500","etf","active","watchlist"];
      setActiveTab(valid.includes(path)?path:"overview");
    };
    window.addEventListener("popstate",onPop);
    return()=>window.removeEventListener("popstate",onPop);
  },[]);

  // Sliding tab indicator
  useEffect(()=>{
    if(!navRef.current) return;
    const btn=navRef.current.querySelector(`[data-tab="${activeTab}"]`);
    if(!btn){ setIndicator(p=>({...p,opacity:0})); return; }
    const nr=navRef.current.getBoundingClientRect();
    const br=btn.getBoundingClientRect();
    setIndicator({left:br.left-nr.left,width:br.width,opacity:1});
  },[activeTab]);

  useEffect(()=>{
    // 仅拉取 overview 时间戳，不阻塞渲染（基金静态数据已内置 FALLBACK）
    apiFetch("/overview").then(ov=>{ if(ov?.last_update) setLastUpdate(ov.last_update); });
    // 拉取场内ETF实时行情（含溢价率），以 FALLBACK 为兜底
    apiFetch("/etfs").then(d=>{ if(d?.data?.length) setEtfs(d.data); });
    // 拉取基金动态数据（ytd_return / buy_status / daily_limit），以 FALLBACK 为兜底
    apiFetch("/funds/nasdaq_passive").then(d=>{ if(d?.data?.length) setNasdaq(d.data); });
    apiFetch("/funds/sp500_passive").then(d=>{ if(d?.data?.length) setSp500(d.data); });
    apiFetch("/funds/us_active").then(d=>{ if(d?.data?.length) setActive(d.data); });
    // 拉取市场情绪指标
    apiFetch("/market-sentiment").then(d=>{ if(d?.data) setSentiment(d.data); });
    // 拉取标普500 + 纳指100 历史月度 PE
    apiFetch("/pe-history").then(d=>{ if(d?.data) setPeHistory(d.data); });
    // 拉取 AI 市场解读（DeepSeek，2小时缓存）
    setAiLoading(true);
    apiFetch("/market-ai-insight").then(d=>{
      if(d?.data?.insights?.length) setAiInsight(d.data);
      setAiLoading(false);
    }).catch(()=>setAiLoading(false));
  },[]);

  // ── 实时行情（day_change / rolling_1y / buy_status / daily_limit）
  // 数据每日在北京时间凌晨5点（美股收盘后）更新一次，缓存到下一个北京时间5点再失效
  useEffect(()=>{
    const CACHE_KEY="wise_etf_live_v2";
    const H21=21*3600*1000,DAY=24*3600*1000;
    const lastBeijing5am=()=>Math.floor((Date.now()-H21)/DAY)*DAY+H21;
    // 已在 useState 初始化时同步加载缓存；这里只在缓存失效时重新拉取
    try{
      const raw=localStorage.getItem(CACHE_KEY);
      if(raw){const {ts}=JSON.parse(raw);if(ts>=lastBeijing5am()) return;}
    }catch{}
    apiFetch("/live_data").then(d=>{
      if(d?.data){
        const timeStr=new Date().toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"});
        setLiveData(d.data);
        setLiveTs(timeStr);
        try{ localStorage.setItem(CACHE_KEY,JSON.stringify({data:d.data,ts:Date.now(),liveTs:timeStr})); }catch{}
      }
    });
  },[]);

  useEffect(()=>{
    (async()=>{
      // 优先：ExchangeRate-API (免费，数据准确，更新及时)
      try {
        const r=await fetch("https://open.er-api.com/v6/latest/USD");
        const d=await r.json();
        if(d.result==="success"&&d.rates?.CNY) {setUsdcny(d.rates.CNY.toFixed(4));return;}
      } catch{}
      // 备用：Fawazahmed0 CDN
      try {
        const r=await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json");
        const d=await r.json();
        if(d.usd?.cny) {setUsdcny(d.usd.cny.toFixed(4));return;}
      } catch{}
      // 兜底：使用静态近期值
      setUsdcny("7.2400");
    })();
  },[]);

  const handleSort = k => {
    if(sortKey===k) setSortDir(d=>d==="asc"?"desc":"asc");
    else{setSortKey(k);setSortDir("desc");}
  };
  const parseDailyLimit = v => {
    if(!v||v==="暂停申购") return -1;
    if(v==="不限额") return Infinity;
    const n = parseFloat(String(v).replace(/[^\d.]/g,""));
    return isNaN(n)?-1:n;
  };
  const sortData = data => {
    if(!sortKey) return data;
    return [...data].sort((a,b)=>{
      const av=a[sortKey],bv=b[sortKey];
      if(sortKey==="daily_limit"){
        const na=parseDailyLimit(av),nb=parseDailyLimit(bv);
        return sortDir==="asc"?na-nb:nb-na;
      }
      if(typeof av==="number"&&typeof bv==="number") return sortDir==="asc"?av-bv:bv-av;
      return sortDir==="asc"?String(av||"").localeCompare(String(bv||"")):String(bv||"").localeCompare(String(av||""));
    });
  };
  const _PROTECTED_TABS = ["nasdaq","sp500","etf","active","watchlist","lazy","qdii","export"];
  const switchTab = id=>{
    if(_PROTECTED_TABS.includes(id) && !user){
      setAuthRequired(true);
      setShowAuth(true);
      return;
    }
    setActiveTab(id);
    setSortKey(null);setSearch("");setStatusFilter("all");
    window.history.pushState(null, "", id === "overview" ? "/" : `/${id}`);
    window.scrollTo({top:0,behavior:"smooth"});
  };

  const [premHist, setPremHist] = useState([]);
  const [premHistLoading, setPremHistLoading] = useState(false);
  useEffect(()=>{
    setPremHistLoading(true);
    setPremHist([]);
    apiFetch(`/premium_history/${selETF}`).then(d=>{
      if(d?.data?.length) setPremHist(d.data);
      setPremHistLoading(false);
    });
  },[selETF]);

  const filterData = data => {
    let filtered = data;
    if(search.trim()){
      const q=search.trim().toLowerCase();
      filtered=filtered.filter(f=>(f.name||"").toLowerCase().includes(q)||(f.code||"").toLowerCase().includes(q));
    }
    if(statusFilter==="open")      filtered=filtered.filter(f=>f.buy_status==="open");
    if(statusFilter==="suspended") filtered=filtered.filter(f=>f.buy_status==="suspended");
    return filtered;
  };
  const toggleFavorite = code=>{
    setFavorites(prev=>{
      const next=prev.includes(code)?prev.filter(c=>c!==code):[...prev,code];
      localStorage.setItem("etf-favorites",JSON.stringify(next));
      return next;
    });
  };
  const toggleCompare = row=>{
    setCompareList(prev=>{
      if(prev.some(f=>f.code===row.code)) return prev.filter(f=>f.code!==row.code);
      if(prev.length>=4) return prev;
      const cat=nasdaq.some(f=>f.code===row.code)?"纳指被动"
        :sp500.some(f=>f.code===row.code)?"标普500"
        :active.some(f=>f.code===row.code)?"美股主动":"场内ETF";
      return [...prev,{...row,_cat:cat}];
    });
  };


  const avg=(arr,k)=>arr.length?(arr.reduce((s,f)=>s+(f[k]||0),0)/arr.length).toFixed(1):"0";
  const totalFunds = nasdaq.length+sp500.length+active.length+etfs.length;
  const openFunds  = [...nasdaq,...sp500,...active].filter(f=>f.buy_status==="open").length+etfs.length;
  const topPerf    = [...active].sort((a,b)=>(b.ytd_return||0)-(a.ytd_return||0)).slice(0,5);

  // 合并 liveData 到各基金数组
  // 只合并非 null 字段，API 失败时保留静态兜底值
  const mergeLive = useCallback((arr)=>arr.map(f=>{
    const live=liveData[f.code];
    if(!live) return f;
    // buy_status/daily_limit 由每日 cron 刷新的 funds 端点管理，不被 live_data 覆盖
    // ytd_return（25年涨幅）写死，禁止被 live_data 覆盖
    const SKIP=new Set(["buy_status","daily_limit","ytd_return"]);
    const patch=Object.fromEntries(Object.entries(live).filter(([k,v])=>v!=null&&!SKIP.has(k)));
    return {...f,...patch};
  }),[liveData]);
  const nasdaqM = useMemo(()=>mergeLive(nasdaq),[nasdaq,mergeLive]);
  const sp500M  = useMemo(()=>mergeLive(sp500), [sp500, mergeLive]);
  const activeM = useMemo(()=>mergeLive(active),[active,mergeLive]);
  const etfsM   = useMemo(()=>mergeLive(etfs),  [etfs,  mergeLive]);

  // ── 申购上限排序（高→低，暂停在底）
  const byLimit = useCallback((arr)=>{
    const parse=s=>{
      if(!s||s==='暂停申购') return -1;
      if(s==='不限额') return 9999999;
      return parseFloat(s)||0;
    };
    return [...arr].sort((a,b)=>parse(b.daily_limit)-parse(a.daily_limit));
  },[]);


  const maxReturn  = Math.max(...[...nasdaqM,...sp500M,...activeM].map(f=>f.ytd_return||0));

  const actionsCol=(accent)=>({key:"_act",label:"",sortable:false,align:"center",render:(_,row)=>{
    const isFav=favorites.includes(row.code);
    const inCmp=compareList.some(f=>f.code===row.code);
    const cmpFull=compareList.length>=4&&!inCmp;
    return (
      <div style={{display:"flex",gap:4,justifyContent:"center",alignItems:"center",whiteSpace:"nowrap"}}>
        <button onClick={e=>{e.stopPropagation();toggleFavorite(row.code);}}
          title={isFav?"取消自选":"加入自选"}
          style={{background:"none",border:"none",cursor:"pointer",padding:"2px 3px",fontSize:15,lineHeight:1,color:isFav?C.orange:C.textDim,transition:"transform 0.2s,color 0.2s",transform:isFav?"scale(1.15)":"scale(1)"}}>
          {isFav?"★":"☆"}
        </button>
        <button onClick={e=>{e.stopPropagation();if(!cmpFull||inCmp)toggleCompare(row);}}
          title={inCmp?"取消对比":cmpFull?"最多4只":"加入对比"}
          style={{background:inCmp?accent+"15":"none",border:`1px solid ${inCmp?accent+"60":C.borderLight}`,borderRadius:5,cursor:cmpFull&&!inCmp?"not-allowed":"pointer",padding:"2px 6px",fontSize:11,lineHeight:1.5,color:inCmp?accent:C.textDim,fontWeight:inCmp?700:400,transition:"all 0.18s",opacity:cmpFull&&!inCmp?0.35:1}}>
          {inCmp?"−对比":"+对比"}
        </button>
      </div>
    );
  }});

  const renderDayChange = v => {
    if(v==null) return <span style={{color:C.textDim,fontSize:11}}>—</span>;
    const n=parseFloat(v);
    const color = n>0?C.green : n<0?C.red:C.textDim;
    return <span style={{color,fontWeight:700,fontSize:12}}>{n>0?"+":""}{n.toFixed(2)}%</span>;
  };
  const renderRolling1y = v => {
    if(v==null) return <span style={{color:C.textDim,fontSize:11}}>—</span>;
    const n=parseFloat(v);
    return <MiniBar value={n} max={Math.max(maxReturn,50)} color={n>0?C.green:C.red}/>;
  };

  const passiveCols=[
    actionsCol(C.accent),
    {key:"code",   label:"代码",    render:v=><span style={{fontFamily:"monospace",color:C.accent,fontWeight:700,fontSize:12}}>{v}</span>},
    {key:"name",   label:"基金名称", render:v=><span style={{fontSize:12,color:C.text}}>{v}</span>},
    {key:"code_c", label:"C类代码", sortable:false, tip:"同基金的C类份额：无申购费，有年化0.2%~0.4%销售服务费。持有≤1年选C类可省申购费，持有＞1年A类总费更低。",align:"center",
     render:v=>v?<span style={{fontFamily:"monospace",fontSize:11,color:C.cyan,background:C.cyan+"18",padding:"2px 7px",borderRadius:4,fontWeight:700,letterSpacing:"0.5px"}}>{v}</span>:<span style={{color:C.textDim,fontSize:11}}>—</span>},
    {key:"fee_rate",label:"运作费率",tip:"管理费+托管费（年化），不含申购赎回费，越低越好",align:"right",render:v=>v!=null?<span style={{color:v>1?C.orange:C.textMuted,fontWeight:v>1?600:400}}>{v}%</span>:"—"},
    {key:"scale",  label:"规模(亿)",tip:"基金总规模，规模大流动性好",align:"right",render:v=><span style={{fontWeight:600}}>{v||"—"}</span>},
    {key:"ytd_return",label:"25年涨幅",tip:"2025年全年涨幅（pingzhongdata实时计算）",align:"right",render:v=>v!=null?<MiniBar value={v} max={maxReturn} color={v>0?C.green:C.red}/>:"—"},
    {key:"rolling_1y",label:"近1年滚动",tip:"最近365天滚动涨幅，实时数据，每5分钟更新",align:"right",render:(_,row)=>renderRolling1y(row.rolling_1y)},
    {key:"day_change",label:"昨日涨跌",tip:"绿色=上涨，红色=下跌",align:"right",render:(_,row)=>renderDayChange(row.day_change)},
    {key:"track_error",label:"跟踪误差",tip:"年化跟踪误差，越小越紧密",align:"right",render:v=>v!=null?<span style={{color:v>2?C.orange:C.textDim}}>{v}%</span>:"—"},
    {key:"daily_limit",label:"申购上限",tip:"每日单笔最大申购金额",align:"right",render:v=><span style={{fontSize:12,color:C.textMuted}}>{v}</span>},
    {key:"buy_status",label:"申购状态",tip:"当前是否开放申购",align:"center",sortable:false,render:v=><StatusBadge status={v}/>},
  ];
  const activeCols=[
    actionsCol(C.purple),
    {key:"code",   label:"代码",    render:v=><span style={{fontFamily:"monospace",color:C.purple,fontWeight:700,fontSize:12}}>{v}</span>},
    {key:"name",   label:"基金名称", render:v=><span style={{fontSize:12}}>{v}</span>},
    {key:"fee_rate",label:"运作费率",tip:"管理费+托管费（年化），主动型普遍偏高(~1.55%)",align:"right",render:v=>v!=null?`${v}%`:"—"},
    {key:"scale",  label:"规模(亿)",tip:"基金总规模",align:"right",render:v=><span style={{fontWeight:600}}>{v||"—"}</span>},
    {key:"ytd_return",label:"25年涨幅",tip:"2025年全年涨幅（pingzhongdata实时计算）",align:"right",render:v=>v!=null?<MiniBar value={v} max={maxReturn} color={C.green}/>:"—"},
    {key:"rolling_1y",label:"近1年滚动",tip:"最近365天滚动涨幅，实时数据",align:"right",render:(_,row)=>renderRolling1y(row.rolling_1y)},
    {key:"day_change",label:"昨日涨跌",tip:"绿色=上涨，红色=下跌",align:"right",render:(_,row)=>renderDayChange(row.day_change)},
    {key:"daily_limit",label:"每日限额",tip:"每日单笔最大申购金额，额度越低说明越紧俏",align:"right",render:v=><span style={{fontSize:12,color:C.textMuted}}>{v}</span>},
    {key:"buy_status",label:"申购状态",tip:"当前是否开放申购",align:"center",sortable:false,render:v=><StatusBadge status={v}/>},
  ];
  const etfCols=[
    actionsCol(C.cyan),
    {key:"code",  label:"代码",  render:v=><span style={{fontFamily:"monospace",color:C.cyan,fontWeight:700,fontSize:12}}>{v}</span>},
    {key:"name",  label:"ETF名称"},
    {key:"tracking_index",label:"跟踪指数",render:v=><span style={{color:C.textMuted,fontSize:12}}>{v||"—"}</span>},
    {key:"scale", label:"规模(亿)",tip:"基金总规模，越大流动性越好",align:"right",render:v=><span style={{fontWeight:600}}>{v||"—"}</span>},
    {key:"ytd_return",label:"25年涨幅",tip:"2025年全年涨幅（pingzhongdata实时计算）",align:"right",render:v=>v!=null?<MiniBar value={v} max={30} color={C.green}/>:"—"},
    {key:"rolling_1y",label:"近1年滚动",tip:"最近365天滚动涨幅，实时数据",align:"right",render:(_,row)=>renderRolling1y(row.rolling_1y)},
    {key:"day_change",label:"昨日涨跌",tip:"绿色=上涨，红色=下跌",align:"right",render:(_,row)=>renderDayChange(row.day_change)},
    {key:"fee_rate",label:"运作费率",tip:"管理费+托管费（年化），场内ETF区间0.65%~1.00%",align:"right",render:v=>v!=null?<span style={{color:v>=1.0?C.orange:C.textMuted,fontWeight:v>=1.0?600:400}}>{v}%</span>:"—"},
    {key:"track_error",label:"跟踪误差",tip:"年化跟踪误差，越小说明与指数越贴近",align:"right",render:v=>v!=null?<span style={{color:v>1.5?C.orange:C.textDim,fontWeight:v>1.5?600:400}}>{v}%</span>:"—"},
    {key:"premium",label:"溢价率",tip:"场内价格相对净值的溢价。>1%注意；>2%偏高；>3%极高",align:"center",sortable:false,render:v=>v!=null?<PremiumBadge value={v}/>:"—"},
    {key:"volume",label:"日均成交(亿)",tip:"日均成交额（亿元），越大流动性越好",align:"center"},
  ];

  // 移动端隐藏次要列，保留核心信息
  const _mobileHide = new Set(["code_c","fee_rate","ytd_return","track_error"]);
  const passiveColsF = isMobile ? passiveCols.filter(c=>!_mobileHide.has(c.key)) : passiveCols;
  const activeColsF  = isMobile ? activeCols.filter(c=>c.key!=="fee_rate") : activeCols;
  const etfColsF     = isMobile ? etfCols.filter(c=>!["fee_rate","track_error"].includes(c.key)) : etfCols;

  const dismissDisclaimer = ()=>{
    localStorage.setItem("etf-disclaimer","1");
    setShowDisclaimer(false);
    if(localStorage.getItem("briefing_date")!==new Date().toDateString()) setShowBriefing(true);
  };

  return (
    <>
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif",overflowX:"hidden"}}>
      {showDisclaimer&&<DisclaimerModal onClose={dismissDisclaimer}/>}
      {/* 微信公众号二维码弹窗 */}
      {showWechat&&(
        <div onClick={()=>setShowWechat(false)}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
          <div onClick={e=>e.stopPropagation()}
            style={{background:C.card,borderRadius:16,padding:"28px 32px",boxShadow:"0 20px 60px rgba(0,0,0,0.2)",display:"flex",flexDirection:"column",alignItems:"center",gap:16,minWidth:240}}>
            <div style={{fontSize:15,fontWeight:700,color:C.text}}>微信公众号</div>
            <div style={{borderRadius:16,overflow:"hidden",border:`1px solid ${C.border}`,flexShrink:0}}>
              <img src="/公众号.png" alt="微信公众号二维码"
                style={{width:420,height:"auto",display:"block"}}
                onError={e=>{e.currentTarget.parentElement.style.display="none";}}/>
            </div>
            <div style={{fontSize:12,color:C.textDim}}>扫码关注，获取最新资讯</div>
            <button onClick={()=>setShowWechat(false)}
              style={{padding:"6px 20px",borderRadius:8,border:`1px solid ${C.border}`,background:"none",color:C.textMuted,fontSize:13,cursor:"pointer"}}>
              关闭
            </button>
          </div>
        </div>
      )}
      {showBriefing&&!showDisclaimer&&(
        COMMUNITY_MODE==="telegram"
          ? <TelegramGroupChatModal onClose={()=>setShowBriefing(false)}/>
          : <GroupChatModal onClose={()=>setShowBriefing(false)}/>
      )}
      {showAuth&&(
        <AuthModal
          authRequired={authRequired}
          onClose={()=>{setShowAuth(false);setAuthRequired(false);}}
          onLogin={u=>{setUser(u);setShowAuth(false);setAuthRequired(false);}}
        />
      )}
      {showUserCenter&&user&&(
        <UserCenter
          user={user}
          onClose={()=>setShowUserCenter(false)}
          onLogout={()=>{localStorage.removeItem("wise_token");localStorage.removeItem("wise_email");setUser(null);setShowUserCenter(false);}}
          favorites={favorites}
          allFunds={{nasdaq:nasdaqM,sp500:sp500M,active:activeM,etfs:etfsM}}
        />
      )}

      {/* ── 全站升级弹窗（本地调试已注释，线上保留）── */}
      {/* <div style={{
        position:"fixed", left:0, right:0, top:72, bottom:0, zIndex:99,
        background:"rgba(0,0,0,0.55)", backdropFilter:"blur(8px)",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <div style={{
          background:"#fff", borderRadius:20, padding:"36px 44px",
          textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.25)",
          maxWidth:360, width:"90%",
        }}>
          <div style={{ fontSize:38, marginBottom:14 }}>🔧</div>
          <div style={{ fontSize:18, fontWeight:800, color:"#1e293b", marginBottom:8 }}>
            网站升级中
          </div>
          <div style={{ fontSize:14, color:"#64748b", lineHeight:1.8 }}>
            更多咨询请点击右上角加入群聊
          </div>
        </div>
      </div> */}

      {/* ── Header ── */}
      <header style={{position:"sticky",top:0,zIndex:100,padding:isMobile?"8px 12px":"10px 24px",pointerEvents:"none"}}>
        <div style={{
          maxWidth:1440,margin:"0 auto",
          background:"rgba(255,255,255,0.92)",
          backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
          borderRadius:16,
          border:"1px solid rgba(0,0,0,0.07)",
          boxShadow:"0 4px 24px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)",
          height:52,
          display:"flex",alignItems:"center",
          padding:isMobile?"0 12px":"0 20px",
          gap:0,
          pointerEvents:"auto",
        }}>
          {/* Logo */}
          <a href="/" onClick={e=>{e.preventDefault();switchTab("overview");}} style={{textDecoration:"none",display:"flex",alignItems:"center",gap:8,flexShrink:0,marginRight:8}}>
            <svg width="30" height="30" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#logobg)"/>
              <polyline points="4,20 9,13 14,16 19,8 24,11" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="24" cy="11" r="2" fill="white"/>
              <defs><linearGradient id="logobg" x1="0" y1="0" x2="28" y2="28"><stop stopColor="#007aff"/><stop offset="1" stopColor="#5856d6"/></linearGradient></defs>
            </svg>
            <span style={{fontSize:15,fontWeight:800,letterSpacing:-0.3,color:C.text}}>Wise <span style={{color:C.accent}}>ETF</span></span>
          </a>

          {/* Nav tabs — left aligned */}
          <nav ref={navRef} style={{display:"flex",alignItems:"center",height:"100%",position:"relative",flexShrink:0}}>
            <div style={{position:"absolute",bottom:0,left:indicator.left,width:indicator.width,height:2,background:`linear-gradient(90deg,${C.accent},#5856d6)`,borderRadius:"2px 2px 0 0",transition:"left 0.3s cubic-bezier(0.4,0,0.2,1),width 0.3s cubic-bezier(0.4,0,0.2,1)",opacity:indicator.opacity}}/>
            {TABS.map(tab=>{
              const isActive=activeTab===tab.id;
              const commonStyle={height:"100%",padding:"0 15px",border:"none",background:"none",fontSize:15,cursor:"pointer",whiteSpace:"nowrap",fontWeight:700,color:isActive?C.accent:C.text,transition:"color 0.18s"};
              return tab.href
                ? <a key={tab.id} href={tab.href} style={{...commonStyle,display:"flex",alignItems:"center",textDecoration:"none"}}
                    onMouseEnter={e=>{if(!isActive)e.currentTarget.style.color=C.accent;}}
                    onMouseLeave={e=>{if(!isActive)e.currentTarget.style.color=C.text;}}>
                    {tab.label}
                  </a>
                : <button key={tab.id} data-tab={tab.id} onClick={()=>switchTab(tab.id)} style={commonStyle}
                    onMouseEnter={e=>{if(!isActive)e.currentTarget.style.color=C.accent;}}
                    onMouseLeave={e=>{if(!isActive)e.currentTarget.style.color=C.text;}}>
                    {tab.label}
                  </button>;
            })}
          </nav>

          {/* Spacer */}
          <div style={{flex:1}}/>

          {/* Right actions */}
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            {!isMobile&&<button onClick={()=>setShowBriefing(true)}
              style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,border:`1px solid ${C.borderLight}`,background:"none",color:C.textMuted,fontSize:12,fontWeight:500,cursor:"pointer",transition:"all 0.18s",whiteSpace:"nowrap"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#07c16014";e.currentTarget.style.color="#07c160";e.currentTarget.style.borderColor="#07c16044";}}
              onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color=C.textMuted;e.currentTarget.style.borderColor=C.borderLight;}}>
              <span style={{fontSize:13}}>💬</span> 加入群聊
            </button>}
            <button onClick={()=>user?setShowUserCenter(true):(setAuthRequired(false),setShowAuth(true))}
              style={{display:"flex",alignItems:"center",padding:0,border:`2px solid ${user?"#a5b4fc":C.borderLight}`,borderRadius:"50%",background:"none",cursor:"pointer",transition:"border-color 0.18s",width:32,height:32,overflow:"hidden",flexShrink:0}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=user?"#6366f1":"#94a3b8";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=user?"#a5b4fc":C.borderLight;}}>
              {user
                ? <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.email)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`} alt="avatar" style={{width:"100%",height:"100%",display:"block"}} />
                : <span style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
              }
            </button>
            <button onClick={()=>setMobileMenuOpen(o=>!o)} className="hamburger-btn" aria-label="菜单"
              style={{display:"none",flexDirection:"column",gap:5,background:"none",border:"none",cursor:"pointer",padding:6}}>
              <span style={{display:"block",width:22,height:2,background:mobileMenuOpen?C.accent:C.textMuted,borderRadius:2,transition:"all 0.25s",transform:mobileMenuOpen?"rotate(45deg) translateY(7px)":"none"}}/>
              <span style={{display:"block",width:22,height:2,background:mobileMenuOpen?C.accent:C.textMuted,borderRadius:2,transition:"all 0.25s",opacity:mobileMenuOpen?0:1}}/>
              <span style={{display:"block",width:22,height:2,background:mobileMenuOpen?C.accent:C.textMuted,borderRadius:2,transition:"all 0.25s",transform:mobileMenuOpen?"rotate(-45deg) translateY(-7px)":"none"}}/>
            </button>
          </div>
        </div>
        {/* Mobile dropdown menu */}
        {mobileMenuOpen&&(
          <div className="mobile-menu" style={{borderTop:`1px solid ${C.border}`,background:C.card,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",pointerEvents:"auto"}}>
            {TABS.map(tab=>(
              tab.href
                ? <a key={tab.id} href={tab.href}
                    style={{display:"flex",alignItems:"center",width:"100%",padding:"14px 24px",textAlign:"left",borderBottom:`1px solid ${C.border}`,color:C.textMuted,fontWeight:500,fontSize:15,textDecoration:"none",boxSizing:"border-box"}}>
                    {tab.label}
                  </a>
                : <button key={tab.id} onClick={()=>{switchTab(tab.id);setMobileMenuOpen(false);}}
                    style={{display:"flex",alignItems:"center",width:"100%",padding:"14px 24px",textAlign:"left",background:activeTab===tab.id?C.accent+"15":"none",border:"none",borderBottom:`1px solid ${C.border}`,color:activeTab===tab.id?C.accent:C.textMuted,fontWeight:activeTab===tab.id?700:500,fontSize:15,cursor:"pointer",boxSizing:"border-box"}}>
                    {tab.label}
                  </button>
            ))}
            <button onClick={()=>{setShowBriefing(true);setMobileMenuOpen(false);}}
              style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"14px 24px",textAlign:"left",background:"none",border:"none",color:COMMUNITY_MODE==="telegram"?"#229ED9":"#07c160",fontWeight:600,fontSize:15,cursor:"pointer",boxSizing:"border-box"}}>
              <span style={{fontSize:15}}>💬</span> 加入群聊
            </button>
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <main style={{maxWidth:1440,margin:"0 auto",padding:isMobile?"16px 12px 80px":"36px 20px 100px"}}>
        <div key={activeTab} className="tab-content">

        {/* ════ WATCHLIST ════ */}
        {activeTab==="watchlist"&&(
          <>
            <SectionHeader title="我的自选" subtitle={favorites.length>0?`共 ${favorites.length} 只基金`:"还没有自选"} color={C.orange}/>
            {favorites.length===0 ? (
              <WatchlistEmpty onGo={()=>switchTab("nasdaq")}/>
            ) : (
              <>
                {nasdaq.filter(f=>favorites.includes(f.code)).length>0&&(
                  <Reveal delay={0}><div style={{marginBottom:28}}>
                    <SectionHeader title="纳指被动" color={C.accent}/>
                    <DataTable columns={passiveColsF} data={nasdaqM.filter(f=>favorites.includes(f.code))} sortKey={sortKey} sortDir={sortDir} onSort={handleSort}/>
                  </div></Reveal>
                )}
                {sp500M.filter(f=>favorites.includes(f.code)).length>0&&(
                  <Reveal delay={0.05}><div style={{marginBottom:28}}>
                    <SectionHeader title="标普500被动" color={C.cyan}/>
                    <DataTable columns={passiveColsF} data={sp500M.filter(f=>favorites.includes(f.code))} sortKey={sortKey} sortDir={sortDir} onSort={handleSort}/>
                  </div></Reveal>
                )}
                {activeM.filter(f=>favorites.includes(f.code)).length>0&&(
                  <Reveal delay={0.1}><div style={{marginBottom:28}}>
                    <SectionHeader title="美股主动" color={C.purple}/>
                    <DataTable columns={activeColsF} data={activeM.filter(f=>favorites.includes(f.code))} sortKey={sortKey} sortDir={sortDir} onSort={handleSort}/>
                  </div></Reveal>
                )}
                {etfsM.filter(f=>favorites.includes(f.code)).length>0&&(
                  <Reveal delay={0.15}><div style={{marginBottom:28}}>
                    <SectionHeader title="场内ETF" color={C.orange}/>
                    <DataTable columns={etfColsF} data={etfsM.filter(f=>favorites.includes(f.code))} sortKey={sortKey} sortDir={sortDir} onSort={handleSort}/>
                  </div></Reveal>
                )}
              </>
            )}
          </>
        )}

        {/* ════ OVERVIEW ════ */}
        {activeTab==="overview"&&(
          <>
            {/* Stat row */}
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(5,1fr)",gap:isMobile?10:16,marginBottom:isMobile?20:36}}>
              {[
                {label:"纳指涨幅",value:sentiment?.ndx_price?.returns?.yr1!=null?`+${sentiment.ndx_price.returns.yr1}%`:`+${avg(nasdaq,"ytd_return")}%`,sub:"近一年",color:C.accent},
                {label:"标普涨幅",value:sentiment?.spx_price?.returns?.yr1!=null?`+${sentiment.spx_price.returns.yr1}%`:`+${avg(sp500,"ytd_return")}%`,sub:"近一年",color:C.cyan},
                {label:"主动均涨幅",value:`+${avg(active,"ytd_return")}%`,sub:"近一年",color:C.purple},
                {label:"ETF均溢价",value:`${avg(etfs,"premium")}%`,sub:"当前",color:C.orange},
                {label:"监控总数",value:String(totalFunds),sub:`${openFunds}只可申购`,color:C.green},
              ].map((s,i)=><StatCard key={s.label} {...s} index={i}/>)}
            </div>

            {/* ── 市场情绪指标 ── */}
            <MarketSentimentRow sentiment={sentiment} isMobile={isMobile}/>

            {/* ── 综合市场温度 + 历史PE参考 ── */}
            <div style={{display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:isMobile?12:20, marginBottom:isMobile?16:28}}>
              <MarketTemperature sentiment={sentiment} isMobile={isMobile}/>
              <PEHistoryReference pe={sentiment?.pe} nqPe={sentiment?.nasdaq_pe} isMobile={isMobile}/>
            </div>

            {/* Charts */}
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?12:20,marginBottom:isMobile?16:28}}>
              <Reveal delay={0.05}>
                <Card style={{padding:"24px 26px"}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>纳指 vs 标普 · 月度收益</div>
                  <div style={{fontSize:12,color:C.textDim,marginBottom:20}}>2025年5月 — 2026年4月（美元口径）</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={MONTHLY_12M} barGap={3} barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="2 4" stroke={C.borderLight} vertical={false}/>
                      <XAxis dataKey="month" tick={{fill:C.textDim,fontSize:11}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:C.textDim,fontSize:11}} axisLine={false} tickLine={false} unit="%"/>
                      <Tooltip content={<ChartTooltip/>}/>
                      <ReferenceLine y={0} stroke={C.border}/>
                      <Legend wrapperStyle={{fontSize:11,paddingTop:12}}/>
                      <Bar dataKey="nasdaq" name="纳斯达克100" fill={C.accent} radius={[4,4,0,0]}/>
                      <Bar dataKey="sp500"  name="标普500"    fill={C.cyan}   radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Reveal>

              <Reveal delay={0.1}>
                <Card style={{padding:"24px 26px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:C.text}}>场内ETF溢价走势</div>
                      <div style={{fontSize:12,color:C.textDim,marginTop:2}}>近30交易日 · 真实市价/净值计算</div>
                    </div>
                    <select value={selETF} onChange={e=>setSelETF(e.target.value)}
                      style={{background:C.bg,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,padding:"5px 10px",fontSize:12,outline:"none",cursor:"pointer"}}>
                      {etfs.map(e=><option key={e.code} value={e.code}>{e.code} {e.name}</option>)}
                    </select>
                  </div>
                  {premHistLoading?(
                    <div style={{height:220,display:"flex",alignItems:"center",justifyContent:"center",color:C.textDim,fontSize:13}}>
                      正在加载真实溢价率数据…
                    </div>
                  ):premHist.length===0?(
                    <div style={{height:220,display:"flex",alignItems:"center",justifyContent:"center",color:C.textDim,fontSize:13}}>
                      暂无历史数据
                    </div>
                  ):(
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={premHist} margin={{top:16,right:0,left:0,bottom:0}}>
                      <defs>
                        <linearGradient id="premGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={C.orange} stopOpacity={0.18}/>
                          <stop offset="95%" stopColor={C.orange} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 4" stroke={C.borderLight} vertical={false}/>
                      <XAxis dataKey="date" tick={{fill:C.textDim,fontSize:10}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:C.textDim,fontSize:11}} axisLine={false} tickLine={false} unit="%"/>
                      <ReferenceLine y={1.5} stroke={C.orange} strokeDasharray="3 3" label={{value:"警戒线",fill:C.orange,fontSize:10,position:"right"}}/>
                      <Tooltip content={<ChartTooltip/>}/>
                      <Area type="monotone" dataKey="premium" name="溢价率" stroke={C.orange} fill="url(#premGrad)" strokeWidth={2} dot={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                  )}
                </Card>
              </Reveal>
            </div>

            {/* ── 指数实时点位 + 走势 ── */}
            <IndexPriceRow sentiment={sentiment} aiInsight={aiInsight} aiLoading={aiLoading} isMobile={isMobile}/>

            {/* Index History */}
            <IndexHistoryCard/>

            {/* ── 标普500 + 纳指100 PE历史走势图 ── */}
            <PEHistoryChart peHistory={peHistory} currentPE={sentiment?.pe?.pe} currentNQPE={sentiment?.nasdaq_pe?.pe} isMobile={isMobile}/>

            {/* FX Analysis */}
            <FXAnalysisCard/>

            {/* Top 5 */}            <Reveal delay={0.08}>
              <SectionHeader title="近一年涨幅 TOP 5 · 主动型" color={C.purple}/>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(5,1fr)",gap:isMobile?10:16,marginBottom:36}}>
                {topPerf.map((f,i)=>(
                  <Card key={f.code} style={{padding:isMobile?"14px 16px":"20px 22px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:-10,right:-10,fontSize:80,fontWeight:900,color:C.accent+(i===0?"10":"07"),lineHeight:1,userSelect:"none"}}>
                      {i+1}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                      {i===0&&<span style={{fontSize:10,background:C.accent+"18",color:C.accent,padding:"1px 7px",borderRadius:10,fontWeight:700}}>TOP</span>}
                      <span style={{fontSize:11,color:C.textDim,fontFamily:"monospace"}}>{f.code}</span>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:14,lineHeight:1.4,paddingRight:40,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div>
                    <div style={{fontSize:28,fontWeight:800,color:C.green,letterSpacing:-0.5,marginBottom:6}}>+{f.ytd_return}%</div>
                    <div style={{height:3,borderRadius:2,background:C.borderLight,overflow:"hidden",marginBottom:8}}>
                      <div style={{height:"100%",width:`${Math.min(f.ytd_return/120*100,100)}%`,background:`linear-gradient(90deg,${C.green},${C.green}80)`,borderRadius:2}}/>
                    </div>
                    <div style={{fontSize:11,color:C.textDim}}>规模 {f.scale}亿 · 限额 {f.daily_limit}</div>
                  </Card>
                ))}
              </div>
            </Reveal>

            {/* ETF warning */}
            <Reveal delay={0.1}>
              <SectionHeader title="场内ETF溢价预警" subtitle="溢价 >1% 注意 · >2% 偏高 · >3% 极高建议等待收窄" color={C.orange}/>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:isMobile?10:16}}>
                {etfs.map(e=>{
                  const prem = e.premium||0;
                  const barColor = prem>3?C.red:prem>2?"#ff6b35":prem>1?C.orange:C.green;
                  return (
                  <Card key={e.code} style={{padding:isMobile?"14px 16px":"18px 22px",borderColor:prem>3?`${C.red}40`:prem>2?`#ff6b3530`:C.border}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                      <div>
                        <div style={{fontSize:11,color:C.textDim,fontFamily:"monospace",marginBottom:4}}>{e.code}</div>
                        <div style={{fontSize:13,fontWeight:600,color:C.text}}>{e.name}</div>
                        <div style={{fontSize:11,color:C.textDim,marginTop:2}}>{e.tracking_index}</div>
                      </div>
                      <PremiumBadge value={prem}/>
                    </div>
                    {/* Premium meter — 刻度0/1/2/3/4% */}
                    <div style={{marginBottom:12}}>
                      <div style={{position:"relative",height:6,borderRadius:3,background:C.borderLight,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.min(prem/4*100,100)}%`,background:`linear-gradient(90deg,${C.green},${barColor})`,borderRadius:3,transition:"width 0.6s ease"}}/>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                        {["0%","1%","2%","3%","4%+"].map(t=><span key={t} style={{fontSize:9,color:C.textDim}}>{t}</span>)}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                      <div><div style={{fontSize:10,color:C.textDim,marginBottom:1}}>近1年</div><div style={{fontSize:13,fontWeight:700,color:C.green}}>+{e.ytd_return}%</div></div>
                      <div><div style={{fontSize:10,color:C.textDim,marginBottom:1}}>规模</div><div style={{fontSize:13,fontWeight:600}}>{e.scale}亿</div></div>
                      <div><div style={{fontSize:10,color:C.textDim,marginBottom:1}}>成交</div><div style={{fontSize:13,fontWeight:600}}>{e.volume}亿</div></div>
                      {e.fee_rate!=null&&<div><div style={{fontSize:10,color:C.textDim,marginBottom:1}}>费率</div><div style={{fontSize:13,fontWeight:600,color:C.textMuted}}>{e.fee_rate}%</div></div>}
                      {e.track_error!=null&&<div><div style={{fontSize:10,color:C.textDim,marginBottom:1}}>跟踪误差</div><div style={{fontSize:13,fontWeight:600,color:e.track_error>1?C.orange:C.textMuted}}>{e.track_error}%</div></div>}
                    </div>
                  </Card>
                  );
                })}
              </div>
            </Reveal>
          </>
        )}

        {/* ════ NASDAQ ════ */}
        {activeTab==="nasdaq"&&(
          <Reveal>
            <SectionHeader title="场外纳斯达克100（被动型）" subtitle="数据来源：天天基金网" count={filterData(nasdaqM).length} color={C.accent} timestamp={liveTs} sortable/>
            <div style={{display:"flex",gap:12,alignItems:"flex-start",flexWrap:"wrap",marginBottom:4}}>
              <div style={{flex:1,minWidth:200}}><SearchBar value={search} onChange={setSearch} color={C.accent}/></div>
              <StatusFilterBar value={statusFilter} onChange={setStatusFilter} color={C.accent}/>
            </div>
            {dataLoading?<SkeletonTable rows={8} cols={9}/>:<><DataTable columns={passiveColsF} data={sortData(filterData(nasdaqM))} sortKey={sortKey} sortDir={sortDir} onSort={handleSort}/>{filterData(nasdaqM).length===0&&<EmptyResult query={search}/>}</>}
            <AcInfoBox/>
          </Reveal>
        )}

        {/* ════ SP500 ════ */}
        {activeTab==="sp500"&&(
          <Reveal>
            <SectionHeader title="场外标普500基金对比" subtitle="数据来源：天天基金网" count={filterData(sp500M).length} color={C.cyan} timestamp={liveTs} sortable/>
            <div style={{display:"flex",gap:12,alignItems:"flex-start",flexWrap:"wrap",marginBottom:4}}>
              <div style={{flex:1,minWidth:200}}><SearchBar value={search} onChange={setSearch} color={C.cyan}/></div>
              <StatusFilterBar value={statusFilter} onChange={setStatusFilter} color={C.cyan}/>
            </div>
            {dataLoading?<SkeletonTable rows={8} cols={9}/>:<><DataTable columns={passiveColsF} data={sortData(filterData(sp500M))} sortKey={sortKey} sortDir={sortDir} onSort={handleSort}/>{filterData(sp500M).length===0&&<EmptyResult query={search}/>}</>}
            <AcInfoBox/>
          </Reveal>
        )}

        {/* ════ ACTIVE ════ */}
        {activeTab==="active"&&(
          <Reveal>
            <SectionHeader title="场外美股（主动型）基金对比" subtitle="数据来源：天天基金网" count={filterData(activeM).length} color={C.purple} timestamp={liveTs} sortable/>
            <div style={{display:"flex",gap:12,alignItems:"flex-start",flexWrap:"wrap",marginBottom:4}}>
              <div style={{flex:1,minWidth:200}}><SearchBar value={search} onChange={setSearch} color={C.purple}/></div>
              <StatusFilterBar value={statusFilter} onChange={setStatusFilter} color={C.purple}/>
            </div>
            {dataLoading?<SkeletonTable rows={8} cols={8}/>:<><DataTable columns={activeColsF} data={sortData(filterData(activeM))} sortKey={sortKey} sortDir={sortDir} onSort={handleSort}/>{filterData(activeM).length===0&&<EmptyResult query={search}/>}</>}
          </Reveal>
        )}

        {activeTab==="guide"&&(
          <Reveal>
            <GuideTab isMobile={isMobile}/>
          </Reveal>
        )}

        {/* ════ ETF ════ */}
        {activeTab==="etf"&&(
          <Reveal>
            <SectionHeader title="场内ETF（纳指 / 标普）" subtitle="可在A股账户直接交易，关注溢价风险" count={filterData(etfsM).length} color={C.orange} timestamp={liveTs} sortable/>
            <div style={{display:"flex",gap:12,alignItems:"flex-start",flexWrap:"wrap",marginBottom:4}}>
              <div style={{flex:1,minWidth:200}}><SearchBar value={search} onChange={setSearch} color={C.orange}/></div>
            </div>
            {dataLoading?<SkeletonTable rows={8} cols={8}/>:<><DataTable columns={etfColsF} data={sortData(filterData(etfsM))} sortKey={sortKey} sortDir={sortDir} onSort={handleSort}/>{filterData(etfsM).length===0&&<EmptyResult query={search}/>}</>}
            <Card style={{marginTop:24,padding:"24px 26px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:C.text}}>溢价率历史走势（近30交易日）</div>
                  <div style={{fontSize:12,color:C.textDim,marginTop:2}}>真实市价/净值计算 · 来源：新浪财经 + 东方财富</div>
                </div>
                <select value={selETF} onChange={e=>setSelETF(e.target.value)}
                  style={{background:C.bg,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,padding:"5px 12px",fontSize:12,outline:"none"}}>
                  {etfs.map(e=><option key={e.code} value={e.code}>{e.code} {e.name}</option>)}
                </select>
              </div>
              {premHistLoading?(
                <div style={{height:280,display:"flex",alignItems:"center",justifyContent:"center",color:C.textDim,fontSize:13}}>
                  正在加载真实溢价率数据…
                </div>
              ):premHist.length===0?(
                <div style={{height:280,display:"flex",alignItems:"center",justifyContent:"center",color:C.textDim,fontSize:13}}>
                  暂无历史数据
                </div>
              ):(
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={premHist} margin={{top:20,right:0,left:0,bottom:0}}>
                  <defs>
                    <linearGradient id="premGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.orange} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={C.orange} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke={C.borderLight} vertical={false}/>
                  <XAxis dataKey="date" tick={{fill:C.textDim,fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:C.textDim,fontSize:11}} axisLine={false} tickLine={false} unit="%" domain={["auto","auto"]}/>
                  <ReferenceLine y={1.5} stroke={C.orange} strokeDasharray="3 3" label={{value:"1.5%",fill:C.orange,fontSize:10,position:"right"}}/>
                  <ReferenceLine y={3} stroke={C.red} strokeDasharray="3 3" label={{value:"3%",fill:C.red,fontSize:10,position:"right"}}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Area type="monotone" dataKey="premium" name="溢价率" stroke={C.orange} fill="url(#premGrad2)" strokeWidth={2} dot={{r:2,fill:C.orange,strokeWidth:0}}/>
                </AreaChart>
              </ResponsiveContainer>
              )}
            </Card>
          </Reveal>
        )}

        </div>
      </main>

      {/* ── Compare Bar & Modal ── */}
      <CompareBar
        list={compareList}
        onOpen={()=>setShowCompare(true)}
        onRemove={code=>setCompareList(p=>p.filter(f=>f.code!==code))}
        onClear={()=>setCompareList([])}
      />
      {showCompare&&compareList.length>=2&&(
        <CompareModal list={compareList} onClose={()=>setShowCompare(false)}/>
      )}

      {["overview","guide","lazy"].includes(activeTab)&&(
        <BackToTop visible={showBackToTop} offset={compareList.length>0?84:32}/>
      )}

      {/* ── Footer ── */}
      <footer style={{background:"#fff",borderTop:`1px solid ${C.border}`}}>
        <div style={{maxWidth:1440,margin:"0 auto",padding:isMobile?"32px 16px 24px":"56px 40px 48px",display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr auto auto",gap:isMobile?"32px":"60px 80px"}}>
          <div style={{maxWidth:340}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${C.accent},#5856d6)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#fff"}}>W</div>
              <span style={{fontSize:19,fontWeight:800,letterSpacing:-0.5,color:C.text}}>Wise<span style={{color:C.accent}}>ETF</span></span>
            </div>
            <p style={{fontSize:14,color:C.textMuted,lineHeight:1.85,marginBottom:10}}>
              中国投资者的美股ETF与QDII基金追踪平台，覆盖纳斯达克100、标普500被动指数及主动型QDII基金，提供费率对比、溢价监控与申购状态追踪。
            </p>
            <p style={{fontSize:12,color:C.textDim}}>wise-etf.com</p>
          </div>

          <div style={{minWidth:180}}>
            <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:20}}>快速导航</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px 24px"}}>
              {TABS.slice(1).filter(tab=>tab.id!=="watchlist").map(tab=>(
                <button key={tab.id} onClick={()=>{switchTab(tab.id);}}
                  className="footer-link"
                  style={{background:"none",border:"none",padding:0,fontSize:14,color:C.textMuted,cursor:"pointer",textAlign:"left",transition:"color 0.15s,transform 0.15s",lineHeight:"20px",height:20}}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{minWidth:160}}>
            <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:20}}>其他</div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {[
                {label:"投资主站",   href:"https://www.wise-invest.org",  icon:"🌐"},
                {label:"Wise-Witness",href:"https://www.wise-witness.com",icon:"🏦"},
                {label:"Wise-Hold",  href:"https://www.wise-hold.com",    icon:"📈"},
                {label:"Wise-SIM",   href:"https://www.wise-sim.org",     icon:"📱"},
              ].map(l=>(
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
                  className="footer-link"
                  style={{fontSize:14,color:C.textMuted,textDecoration:"none",display:"flex",alignItems:"center",gap:8,transition:"color 0.15s,transform 0.15s",lineHeight:"20px",height:20}}>
                  <span style={{fontSize:14,lineHeight:"20px"}}>{l.icon}</span>{l.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div style={{borderTop:`1px solid ${C.border}`}}/>
        <div style={{maxWidth:1440,margin:"0 auto",padding:isMobile?"14px 16px":"18px 40px",display:"flex",justifyContent:"center",flexDirection:"column",alignItems:"center",gap:5}}>
          <div style={{fontSize:12,color:C.textDim}}>© 2026 wise-etf.com · All rights reserved</div>
          <div style={{fontSize:12,color:C.textDim}}>仅提供信息参考，不构成任何投资建议</div>
        </div>
      </footer>

      <style>{`
        *{box-sizing:border-box}

        /* Tab content */
        @keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .tab-content{animation:fadeInUp 0.4s cubic-bezier(0.25,0.46,0.45,0.94) both}

        /* StatCard stagger */
        @keyframes cardIn{from{opacity:0;transform:translateY(16px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        .stat-card{animation:cardIn 0.45s cubic-bezier(0.25,0.46,0.45,0.94) both}

        /* Status pulse */
        @keyframes statusPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.4)}}

        /* Premium alert */
        @keyframes premiumAlert{0%,100%{opacity:1}60%{opacity:0.6}}

        /* Table */
        .table-row{transition:background 0.15s,border-left 0.15s}

        /* Footer links */
        .footer-link:hover{color:${C.text} !important;transform:translateX(3px)}

        /* Nav hover */
        header nav button:hover{color:${C.text} !important}

        /* Skeleton */
        @keyframes skeletonPulse{0%,100%{opacity:1}50%{opacity:0.45}}

        /* Compare bar slide up */
        @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}

        /* Crash reason panel */
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}

        /* Scrollbar */
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${C.bg}}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:${C.textDim}}

        @media(max-width:900px){
          header nav{flex:1;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
          header nav::-webkit-scrollbar{display:none}
          header nav button,header nav a{padding:0 11px;font-size:13px}
        }
        @media(max-width:600px){
          header nav{display:none}
          .hamburger-btn{display:flex !important}
        }

        @media(max-width:768px){
          html,body{overflow-x:hidden;max-width:100vw}
          /* 表格单元格紧凑 */
          .table-row td{padding:9px 10px !important;font-size:12px !important;white-space:nowrap}
          table thead th{padding:9px 10px !important;font-size:10px !important}
          /* StatCard 字号缩小 */
          .stat-card{padding:16px 14px !important;border-radius:14px !important}
          /* 卡片圆角收小 */
          .lift-card{border-radius:14px !important}
          /* 搜索框与筛选条换行 */
          .search-filter-row{flex-direction:column}
        }
      `}</style>
    </div>
    <Analytics />
    </>
  );
}
