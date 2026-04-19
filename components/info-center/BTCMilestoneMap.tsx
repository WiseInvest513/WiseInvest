"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { btcPriceHistory, btcMilestones, btcHalvings } from "@/lib/data-center";

// ─── World & chart constants ──────────────────────────────────────────────────
const WORLD_W = 2600;
const WORLD_H = 1800;

// Chart — raised CY to give room for two top rows of cards
const CX = 480;
const CY = 510;   // was 430, raised to give top cards room
const CW = 1300;
const CH = 500;

// ─── Scales ──────────────────────────────────────────────────────────────────
const T0 = new Date("2012-01-01").getTime();
const T1 = new Date("2027-06-01").getTime();
const T_RANGE = T1 - T0;
const LOG_MIN = Math.log10(5);
const LOG_MAX = Math.log10(150000);
const LOG_RANGE = LOG_MAX - LOG_MIN;

function dateToX(d: string): number {
  return CX + ((new Date(d).getTime() - T0) / T_RANGE) * CW;
}
function priceToY(p: number): number {
  if (p <= 0) return CY + CH;
  return CY + CH - ((Math.log10(p) - LOG_MIN) / LOG_RANGE) * CH;
}

// ─── Phase bands ─────────────────────────────────────────────────────────────
const phases = [
  { x1: "2012-01-01", x2: "2013-11-30", type: "bull" as const },
  { x1: "2013-11-30", x2: "2015-01-14", type: "bear" as const },
  { x1: "2015-01-14", x2: "2017-12-17", type: "bull" as const },
  { x1: "2017-12-17", x2: "2018-12-15", type: "bear" as const },
  { x1: "2018-12-15", x2: "2021-11-10", type: "bull" as const },
  { x1: "2021-11-10", x2: "2022-11-21", type: "bear" as const },
  { x1: "2022-11-21", x2: "2025-09-29", type: "bull" as const },
  { x1: "2025-09-29", x2: "2027-06-01", type: "bear" as const },
];

const yGridPrices = [10, 100, 1000, 10000, 100000];
function fmtGrid(p: number) { return p >= 1000 ? `$${p / 1000}k` : `$${p}`; }

// ─── Card size ────────────────────────────────────────────────────────────────
const CARD_W = 252;
const CARD_H = 170;

// ─── Layout: 19 nodes in chronological order ─────────────────────────────────
// Index order must match btcMilestones array order:
// 0 Genesis | 1 Pizza | 2 $1 | 3 $150 Cyprus | 4 $1242 | 5 $19783 | 6 $3191
// 7 $3800 | 8 $29000 Inst | 9 $57500 Tesla | 10 $69044 | 11 $15476
// 12 ETF $46000 | 13 $73750 pre-halving | 14 $108364 | 15 $102682
// 16 $78214 | 17 $119116 | 18 $123513
interface NodeLayout {
  dx: number; dy: number;
  cx: number; cy: number;
  side: "top" | "bottom" | "left" | "right";
  preDot?: boolean;
}

function buildLayouts(): NodeLayout[] {
  return [
    // ── LEFT: pre-chart (3) ───────────────────────────────────────────────
    // 0 Genesis
    { dx: CX, dy: CY + CH - 20,  cx: 60,  cy: 650,  side: "right", preDot: true },
    // 1 Pizza Day
    { dx: CX, dy: CY + CH - 65,  cx: 60,  cy: 870,  side: "right", preDot: true },
    // 2 $1 2011
    { dx: CX, dy: CY + CH - 110, cx: 60,  cy: 1080, side: "right", preDot: true },

    // ── TOP row A  cy=100  (surges & ATHs spread wide) ────────────────────
    // 3 $150 Cyprus 2013-04 (快速拉升)
    { dx: dateToX("2013-04-01"), dy: priceToY(150),   cx: 340,  cy: 100, side: "bottom" },
    // 4 $19783 2017-12 ATH
    { dx: dateToX("2017-12-17"), dy: priceToY(19783), cx: 780,  cy: 100, side: "bottom" },
    // 5 $57500 Tesla 2021-02 (快速拉升)
    { dx: dateToX("2021-02-21"), dy: priceToY(57500), cx: 1145, cy: 100, side: "bottom" },
    // 6 $119116 2025-07 ATH
    { dx: dateToX("2025-07-07"), dy: priceToY(119116),cx: 1495, cy: 100, side: "bottom" },

    // ── TOP row B  cy=300  (staggered ATHs) ──────────────────────────────
    // 7 $1242 2013-11 ATH
    { dx: dateToX("2013-11-30"), dy: priceToY(1242),  cx: 510,  cy: 300, side: "bottom" },
    // 8 $69044 2021-11 ATH
    { dx: dateToX("2021-11-10"), dy: priceToY(69044), cx: 1250, cy: 300, side: "bottom" },

    // ── BOTTOM row A  cy=1085  (bear bottoms) ────────────────────────────
    // 9 $3191 2018-12 bear
    { dx: dateToX("2018-12-15"), dy: priceToY(3191),  cx: 770,  cy: 1085, side: "top" },
    // 10 $29000 Institutional 2020-12 (快速拉升)
    { dx: dateToX("2020-12-01"), dy: priceToY(29000), cx: 1070, cy: 1085, side: "top" },
    // 11 $15476 FTX 2022-11 bear
    { dx: dateToX("2022-11-21"), dy: priceToY(15476), cx: 1365, cy: 1085, side: "top" },

    // ── BOTTOM row B  cy=1270  (staggered) ───────────────────────────────
    // 12 $3800 COVID 2020-03 bear
    { dx: dateToX("2020-03-12"), dy: priceToY(3800),  cx: 890,  cy: 1270, side: "top" },
    // 13 $78214 tariff 2025-03 bear
    { dx: dateToX("2025-03-31"), dy: priceToY(78214), cx: 1470, cy: 1270, side: "top" },

    // ── RIGHT column  cx=1840  (recent events) ────────────────────────────
    // 14 ETF $46000 2024-01 (快速拉升)
    { dx: dateToX("2024-01-10"), dy: priceToY(46000), cx: 1840, cy: 155, side: "left" },
    // 15 $73750 pre-halving ATH 2024-03 (快速拉升)
    { dx: dateToX("2024-03-14"), dy: priceToY(73750), cx: 1840, cy: 378, side: "left" },
    // 16 $108364 2024-12 ATH
    { dx: dateToX("2024-12-17"), dy: priceToY(108364),cx: 1840, cy: 601, side: "left" },
    // 17 $102682 Trump 2025-01
    { dx: dateToX("2025-01-20"), dy: priceToY(102682),cx: 1840, cy: 824, side: "left" },
    // 18 $123513 top 2025-09 ATH
    { dx: dateToX("2025-09-29"), dy: priceToY(123513),cx: 1840, cy: 1047, side: "left" },
  ];
}

function cardAnchor(l: NodeLayout): [number, number] {
  switch (l.side) {
    case "top":    return [l.cx + CARD_W / 2, l.cy];
    case "bottom": return [l.cx + CARD_W / 2, l.cy + CARD_H];
    case "left":   return [l.cx, l.cy + CARD_H / 2];
    case "right":  return [l.cx + CARD_W, l.cy + CARD_H / 2];
  }
}

function bezier(ax: number, ay: number, dx: number, dy: number, side: NodeLayout["side"]): string {
  const mx = (ax + dx) / 2, my = (ay + dy) / 2;
  let c1x = ax, c1y = ay, c2x = dx, c2y = dy;
  if (side === "top" || side === "bottom") { c1x = ax; c1y = my; c2x = dx; c2y = my; }
  else                                      { c1x = mx; c1y = ay; c2x = mx; c2y = dy; }
  return `M${ax},${ay} C${c1x},${c1y} ${c2x},${c2y} ${dx},${dy}`;
}

// Same curve but starts from the chart dot (dx,dy) → card anchor (ax,ay), for "outward" draw animation
function bezierFromDot(ax: number, ay: number, dx: number, dy: number, side: NodeLayout["side"]): string {
  const mx = (ax + dx) / 2, my = (ay + dy) / 2;
  let c1x = dx, c1y = dy, c2x = ax, c2y = ay;
  if (side === "top" || side === "bottom") { c1x = dx; c1y = my; c2x = ax; c2y = my; }
  else                                      { c1x = mx; c1y = dy; c2x = mx; c2y = ay; }
  return `M${dx},${dy} C${c1x},${c1y} ${c2x},${c2y} ${ax},${ay}`;
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const T = {
  genesis: { stroke: "#64748b", badge: "#334155", bg: "#f8fafc", label: "创世",    dot: "#94a3b8" },
  first:   { stroke: "#f59e0b", badge: "#92400e", bg: "#fffbeb", label: "首次",    dot: "#f59e0b" },
  bull:    { stroke: "#10b981", badge: "#065f46", bg: "#f0fdf9", label: "急速拉升", dot: "#10b981" },
  bear:    { stroke: "#ef4444", badge: "#7f1d1d", bg: "#fff1f2", label: "熊市底",  dot: "#ef4444" },
  ath:     { stroke: "#8b5cf6", badge: "#4c1d95", bg: "#f5f3ff", label: "历史高点", dot: "#8b5cf6" },
};

// ─── SVG path builders ────────────────────────────────────────────────────────
function buildLine() {
  const pts = btcPriceHistory
    .filter(p => p.p >= 5 && new Date(p.d).getTime() >= T0)
    .map(p => `${dateToX(p.d).toFixed(1)},${priceToY(p.p).toFixed(1)}`);
  return pts.length ? `M${pts.join(" L")}` : "";
}
function buildArea() {
  const data = btcPriceHistory.filter(p => p.p >= 5 && new Date(p.d).getTime() >= T0);
  if (!data.length) return "";
  const pts = data.map(p => `${dateToX(p.d).toFixed(1)},${priceToY(p.p).toFixed(1)}`);
  const x0 = dateToX(data[0].d).toFixed(1);
  const xN = dateToX(data[data.length - 1].d).toFixed(1);
  const yB = (CY + CH).toFixed(1);
  return `M${x0},${yB} L${pts.join(" L")} L${xN},${yB} Z`;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function BTCMilestoneMap() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef   = useRef<HTMLDivElement>(null);
  const dragging   = useRef(false);
  const lastMouse  = useRef({ x: 0, y: 0 });
  const txRef      = useRef(-60);
  const tyRef      = useRef(-60);
  const scaleRef   = useRef(0.56);
  const [pct, setPct] = useState(0.56);
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);

  // track drag to avoid toggling focus on pan
  const didDrag = useRef(false);
  const startMouse = useRef({ x: 0, y: 0 });

  const apply = useCallback(() => {
    if (innerRef.current)
      innerRef.current.style.transform =
        `translate(${txRef.current}px,${tyRef.current}px) scale(${scaleRef.current})`;
  }, []);

  useLayoutEffect(() => { apply(); });

  const clamp = (s: number) => Math.min(2, Math.max(0.18, s));

  // Non-passive wheel → zoom, no page scroll
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const k = e.deltaY > 0 ? 0.91 : 1.10;
      const old = scaleRef.current, next = clamp(old * k);
      txRef.current = mx - (mx - txRef.current) * (next / old);
      tyRef.current = my - (my - tyRef.current) * (next / old);
      scaleRef.current = next; setPct(next); apply();
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [apply]);

  const onDown = (e: React.MouseEvent) => {
    dragging.current = true;
    didDrag.current = false;
    startMouse.current = { x: e.clientX, y: e.clientY };
    lastMouse.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  };
  const onMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    if (Math.hypot(e.clientX - startMouse.current.x, e.clientY - startMouse.current.y) > 4) {
      didDrag.current = true;
    }
    txRef.current += e.clientX - lastMouse.current.x;
    tyRef.current += e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    apply();
  };
  const onUp   = () => { dragging.current = false; };

  const lastT = useRef({ x: 0, y: 0 });
  const onTS  = (e: React.TouchEvent) => { lastT.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTM  = (e: React.TouchEvent) => { e.preventDefault(); txRef.current += e.touches[0].clientX - lastT.current.x; tyRef.current += e.touches[0].clientY - lastT.current.y; lastT.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; apply(); };

  const zoomBtn = (dir: 1 | -1) => {
    const r = wrapperRef.current!.getBoundingClientRect();
    const cx = r.width / 2, cy = r.height / 2;
    const old = scaleRef.current, next = clamp(old * (dir > 0 ? 1.2 : 0.83));
    txRef.current = cx - (cx - txRef.current) * (next / old);
    tyRef.current = cy - (cy - tyRef.current) * (next / old);
    scaleRef.current = next; setPct(next); apply();
  };
  const reset = () => { txRef.current = -60; tyRef.current = -60; scaleRef.current = 0.56; setPct(0.56); apply(); };

  const layouts = buildLayouts();
  const nodes   = btcMilestones.slice(0, layouts.length);
  const linePth = buildLine();
  const areaPth = buildArea();

  return (
    <>
    <style>{`
      @keyframes lineDrawIn {
        from { stroke-dashoffset: 3000; }
        to   { stroke-dashoffset: 0; }
      }
      @keyframes lineFadeIn {
        from { opacity: 0; }
        to   { opacity: 0.55; }
      }
    `}</style>
    <div ref={wrapperRef}
      className="relative w-full overflow-hidden select-none"
      style={{ height: "100%", background: "#f8fafc", cursor: "grab" }}
      onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
      onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onUp}
      onClick={() => { if (!didDrag.current) setFocusedIdx(null); }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle,#94a3b850 1px,transparent 1px)", backgroundSize: "22px 22px" }} />

      <div ref={innerRef} style={{ position: "absolute", top: 0, left: 0, width: WORLD_W, height: WORLD_H, transformOrigin: "0 0" }}>

        {/* ── SVG ── */}
        <svg width={WORLD_W} height={WORLD_H} style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}>
          <defs>
            <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#f59e0b" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* phase bands */}
          {phases.map((ph, i) => {
            const x1 = Math.max(dateToX(ph.x1), CX), x2 = Math.min(dateToX(ph.x2), CX + CW);
            return x2 > x1 ? <rect key={i} x={x1} y={CY} width={x2 - x1} height={CH}
              fill={ph.type === "bull" ? "#10b98112" : "#ef444410"} /> : null;
          })}

          <rect x={CX} y={CY} width={CW} height={CH} fill="none" stroke="#e2e8f0" strokeWidth={1} />

          {/* y grid */}
          {yGridPrices.map(p => {
            const y = priceToY(p);
            return y >= CY && y <= CY + CH ? (
              <g key={p}>
                <line x1={CX} y1={y} x2={CX + CW} y2={y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="4 4" />
                <text x={CX - 10} y={y + 5} textAnchor="end" fontSize={20} fill="#94a3b8" fontFamily="monospace">{fmtGrid(p)}</text>
              </g>
            ) : null;
          })}

          {/* x axis years */}
          {[2013, 2015, 2017, 2019, 2021, 2023, 2025, 2027].map(yr => {
            const x = dateToX(`${yr}-01-01`);
            return x >= CX && x <= CX + CW ? (
              <g key={yr}>
                <line x1={x} y1={CY} x2={x} y2={CY + CH} stroke="#e2e8f018" strokeWidth={1} />
                <text x={x} y={CY + CH + 28} textAnchor="middle" fontSize={20} fill="#94a3b8" fontFamily="monospace">{yr}</text>
              </g>
            ) : null;
          })}

          <path d={areaPth} fill="url(#ag2)" />

          {/* halving lines */}
          {btcHalvings.map((h, i) => {
            const x = dateToX(h.date);
            return (
              <g key={i}>
                <line x1={x} y1={CY} x2={x} y2={CY + CH} stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="7 4" opacity={0.55} />
                <rect x={x - 38} y={CY + 8} width={76} height={26} rx={6} fill="#3b82f6" opacity={0.9} />
                <text x={x} y={CY + 25} textAnchor="middle" fontSize={16} fill="white" fontWeight="bold" fontFamily="sans-serif">{h.label}</text>
              </g>
            );
          })}

          <path d={linePth} fill="none" stroke="#f59e0b" strokeWidth={2.5} strokeLinejoin="round" />

          {/* connectors */}
          {nodes.map((m, i) => {
            const l = layouts[i];
            const [ax, ay] = cardAnchor(l);
            const style = T[m.type];
            const delay = `${0.3 + i * 0.09}s`;
            if (l.preDot) {
              // dashed pre-chart lines: fade in
              return (
                <path key={i} d={bezier(ax, ay, l.dx, l.dy, l.side)}
                  fill="none" stroke={style.stroke} strokeWidth={1.8}
                  strokeDasharray="7 4"
                  style={{ opacity: 0, animation: `lineFadeIn 0.5s ease-out ${delay} both` }}
                />
              );
            }
            // regular lines: draw outward from chart dot to card
            return (
              <path key={i} d={bezierFromDot(ax, ay, l.dx, l.dy, l.side)}
                fill="none" stroke={style.stroke} strokeWidth={1.8} strokeOpacity={0.55}
                strokeDasharray="3000"
                style={{ strokeDashoffset: 3000, animation: `lineDrawIn 0.7s ease-out ${delay} both` }}
              />
            );
          })}

          {/* dots */}
          {nodes.map((m, i) => {
            const l = layouts[i];
            const style = T[m.type];
            return (
              <g key={i}>
                <circle cx={l.dx} cy={l.dy} r={l.preDot ? 8 : 11} fill={style.dot} opacity={0.15} />
                <circle cx={l.dx} cy={l.dy} r={l.preDot ? 5 : 7}  fill={style.dot} stroke="white" strokeWidth={2} />
                {l.preDot && (
                  <polygon points={`${CX+10},${l.dy-7} ${CX+10},${l.dy+7} ${CX+20},${l.dy}`} fill={style.dot} opacity={0.65} />
                )}
              </g>
            );
          })}

          {/* pre-chart label */}
          <text x={CX - 190} y={CY + 40}  fontSize={20} fill="#94a3b8" fontFamily="sans-serif" textAnchor="middle" fontWeight="500">早期历史</text>
          <text x={CX - 190} y={CY + 65}  fontSize={17} fill="#cbd5e1" fontFamily="sans-serif" textAnchor="middle">2009 – 2011</text>

          {/* chart title */}
          <text x={CX + CW / 2} y={CY - 22} fontSize={24} fill="#b45309" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">
            ₿ BTC 价格里程碑 · 对数坐标 · 牛熊周期
          </text>
        </svg>

        {/* ── Cards ── */}
        {nodes.map((m, i) => {
          const l = layouts[i];
          const style = T[m.type];
          // bull type label: first 3 (pre-chart) keep original labels, after use "急速拉升"
          const badgeLabel =
            m.type === "genesis" ? "创世" :
            m.type === "first"   ? "首次" :
            m.type === "ath"     ? "历史高点" :
            m.type === "bear"    ? "熊市底" :
            // bull — distinguish surges from general bull
            ["$150", "$29,000", "$57,500", "$46,000", "$73,750"].includes(m.price) ? "急速拉升" : "牛市";

          return (
            <div key={i}
              onClick={(e) => { e.stopPropagation(); if (!didDrag.current) setFocusedIdx(focusedIdx === i ? null : i); }}
              style={{
              position: "absolute", left: l.cx, top: l.cy,
              width: CARD_W, height: CARD_H,
              background: style.bg,
              border: `1.5px solid ${style.stroke}${focusedIdx === i ? "cc" : "50"}`,
              borderRadius: 14,
              padding: "12px 14px",
              boxShadow: focusedIdx === i
                ? `0 16px 48px 0 ${style.stroke}40`
                : "0 3px 18px 0 #0000001a",
              display: "flex", flexDirection: "column", gap: 5,
              pointerEvents: "auto",
              cursor: "pointer",
              transformOrigin: "center",
              zIndex: focusedIdx === i ? 50 : 1,
              transform: focusedIdx === null
                ? "scale(1)"
                : focusedIdx === i
                  ? "scale(3.5)"
                  : "scale(0.82)",
              opacity: focusedIdx === null ? 1 : focusedIdx === i ? 1 : 0.4,
              transition: "transform 0.32s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease, box-shadow 0.25s ease, border-color 0.2s ease",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: "2px 9px", borderRadius: 999,
                  background: style.stroke + "20", color: style.badge, letterSpacing: "0.02em",
                }}>{badgeLabel}</span>
                <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>
                  {m.date.length > 7 ? m.date.slice(0, 7) : m.date}
                </span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>{m.price}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", lineHeight: 1.35 }}>{m.title}</div>
              <div style={{
                fontSize: 11.5, color: "#475569", lineHeight: 1.5,
                overflow: focusedIdx === i ? "visible" : "hidden",
                display: focusedIdx === i ? "block" : "-webkit-box",
                WebkitLineClamp: focusedIdx === i ? undefined : 3,
                WebkitBoxOrient: "vertical" as const,
              }}>{m.why}</div>
            </div>
          );
        })}
      </div>

      {/* controls */}
      <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 backdrop-blur rounded-xl border border-slate-200 px-2 py-1.5 shadow-sm z-10">
        <button onClick={() => zoomBtn(1)}  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><ZoomIn  className="w-3.5 h-3.5 text-slate-500" /></button>
        <button onClick={() => zoomBtn(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><ZoomOut className="w-3.5 h-3.5 text-slate-500" /></button>
        <span className="text-xs text-slate-400 w-9 text-center tabular-nums">{Math.round(pct * 100)}%</span>
        <button onClick={reset} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><RotateCcw className="w-3.5 h-3.5 text-slate-500" /></button>
      </div>

      <div className="absolute bottom-3 right-3 text-xs text-slate-400 bg-white/80 backdrop-blur rounded-lg px-2.5 py-1 z-10 pointer-events-none">
        滚轮缩放 · 拖拽移动
      </div>
    </div>
    </>
  );
}
