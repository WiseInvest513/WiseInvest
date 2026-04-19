"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { btcPriceHistory, btcEvents, btcHalvings } from "@/lib/data-center";

// ─── World & chart constants ───────────────────────────────────────────────────
const WORLD_W = 2430;
const WORLD_H = 1800;

const CX = 480;
const CY = 510;
const CW = 1300;
const CH = 500;

// ─── Scales ───────────────────────────────────────────────────────────────────
const T0 = new Date("2012-01-01").getTime();
const T1 = new Date("2027-06-01").getTime();
const T_RANGE = T1 - T0;
const LOG_MIN = Math.log10(5);
const LOG_MAX = Math.log10(150000);
const LOG_RANGE = LOG_MAX - LOG_MIN;

function dateToX(d: string): number {
  const full = d.length <= 4 ? `${d}-07-01` : d.length <= 7 ? `${d}-01` : d;
  return CX + ((new Date(full).getTime() - T0) / T_RANGE) * CW;
}
function priceToY(p: number): number {
  if (p <= 0) return CY + CH;
  return CY + CH - ((Math.log10(p) - LOG_MIN) / LOG_RANGE) * CH;
}

// ─── Phase bands ──────────────────────────────────────────────────────────────
const phases = [
  { x1: "2012-01-01", x2: "2013-11-30", type: "bull" as const },
  { x1: "2013-11-30", x2: "2015-01-14", type: "bear" as const },
  { x1: "2015-01-14", x2: "2017-12-17", type: "bull" as const },
  { x1: "2017-12-17", x2: "2018-12-15", type: "bear" as const },
  { x1: "2018-12-15", x2: "2021-11-10", type: "bull" as const },
  { x1: "2021-11-10", x2: "2022-11-21", type: "bear" as const },
  { x1: "2022-11-21", x2: "2025-10-06", type: "bull" as const },
  { x1: "2025-10-06", x2: "2027-06-01", type: "bear" as const },
];

const yGridPrices = [10, 100, 1000, 10000, 100000];
function fmtGrid(p: number) { return p >= 1000 ? `$${p / 1000}k` : `$${p}`; }

const CARD_W = 252;
const CARD_H = 170;

// ─── Event colors ──────────────────────────────────────────────────────────────
const EC: Record<string, { stroke: string; badge: string; bg: string; label: string; dot: string }> = {
  milestone:  { stroke: "#3b82f6", badge: "#1e3a8a", bg: "#eff6ff", label: "里程碑", dot: "#3b82f6" },
  bull:       { stroke: "#10b981", badge: "#065f46", bg: "#f0fdf9", label: "牛市",   dot: "#10b981" },
  bear:       { stroke: "#ef4444", badge: "#7f1d1d", bg: "#fff1f2", label: "熊市",   dot: "#ef4444" },
  hack:       { stroke: "#f97316", badge: "#7c2d12", bg: "#fff7ed", label: "安全",   dot: "#f97316" },
  regulation: { stroke: "#a855f7", badge: "#4c1d95", bg: "#faf5ff", label: "监管",   dot: "#a855f7" },
  macro:      { stroke: "#eab308", badge: "#713f12", bg: "#fefce8", label: "宏观",   dot: "#eab308" },
};

// ─── Layout: 23 events in btcEvents order ─────────────────────────────────────
interface EventLayout {
  dx: number; dy: number;
  cx: number; cy: number;
  side: "top" | "bottom" | "left" | "right";
}

function buildLayouts(): EventLayout[] {
  return [
    // TOP row A (cy=80): halvings spread across timeline
    // 0: 2012-11-28 第一次减半
    { dx: dateToX("2012-11-28"), dy: priceToY(12),     cx: 330,  cy: 80,   side: "bottom" },
    // TOP row B (cy=290): bull events
    // 1: 2013-03 塞浦路斯
    { dx: dateToX("2013-03-01"), dy: priceToY(150),    cx: 430,  cy: 290,  side: "bottom" },
    // BOTTOM row A (cy=1110): hacks/bears early
    // 2: 2014-02 Mt.Gox
    { dx: dateToX("2014-02-01"), dy: priceToY(867),    cx: 430,  cy: 1110, side: "top"    },
    // TOP row A
    // 3: 2016-07-09 第二次减半
    { dx: dateToX("2016-07-09"), dy: priceToY(640),    cx: 640,  cy: 80,   side: "bottom" },
    // TOP row B
    // 4: 2017-12 ICO顶峰
    { dx: dateToX("2017-12-01"), dy: priceToY(19783),  cx: 730,  cy: 290,  side: "bottom" },
    // BOTTOM row A
    // 5: 2018 ICO破裂
    { dx: dateToX("2018-06-01"), dy: priceToY(6000),   cx: 710,  cy: 1110, side: "top"    },
    // TOP row B
    // 6: 2019-06 Facebook Libra
    { dx: dateToX("2019-06-01"), dy: priceToY(13800),  cx: 1000, cy: 290,  side: "bottom" },
    // BOTTOM row A
    // 7: 2020-03-12 新冠
    { dx: dateToX("2020-03-12"), dy: priceToY(7900),   cx: 1000, cy: 1110, side: "top"    },
    // TOP row A
    // 8: 2020-05-11 第三次减半
    { dx: dateToX("2020-05-11"), dy: priceToY(8600),   cx: 940,  cy: 80,   side: "bottom" },
    // BOTTOM row B (cy=1320): regulation/bear cluster
    // 9: 2021-05-19 中国禁矿
    { dx: dateToX("2021-05-19"), dy: priceToY(58000),  cx: 900,  cy: 1320, side: "top"    },
    // 10: 2022-05 LUNA
    { dx: dateToX("2022-05-01"), dy: priceToY(36000),  cx: 1160, cy: 1320, side: "top"    },
    // 11: 2022-11 FTX
    { dx: dateToX("2022-11-01"), dy: priceToY(21000),  cx: 1420, cy: 1320, side: "top"    },
    // RIGHT col A (cx=1840): 2023–2024 events
    // 12: 2023-06-15 贝莱德申请ETF
    { dx: dateToX("2023-06-15"), dy: priceToY(26000),  cx: 1840, cy: 100,  side: "left"   },
    // 13: 2023-08-29 Grayscale胜诉
    { dx: dateToX("2023-08-29"), dy: priceToY(26000),  cx: 1840, cy: 310,  side: "left"   },
    // 14: 2024-01-10 ETF通过
    { dx: dateToX("2024-01-10"), dy: priceToY(46000),  cx: 1840, cy: 520,  side: "left"   },
    // TOP row A
    // 15: 2024-04-20 第四次减半
    { dx: dateToX("2024-04-20"), dy: priceToY(63000),  cx: 1310, cy: 80,   side: "bottom" },
    // RIGHT col A
    // 16: 2024-11 特朗普大选
    { dx: dateToX("2024-11-06"), dy: priceToY(76000),  cx: 1840, cy: 730,  side: "left"   },
    // RIGHT col B (cx=2110): 2025 events
    // 17: 2025-01-20 特朗普就职
    { dx: dateToX("2025-01-20"), dy: priceToY(102682), cx: 2110, cy: 100,  side: "left"   },
    // 18: 2025-03-31 关税战
    { dx: dateToX("2025-03-31"), dy: priceToY(78214),  cx: 2110, cy: 320,  side: "left"   },
    // 19: 2025-05-05 关税暂停
    { dx: dateToX("2025-05-05"), dy: priceToY(96000),  cx: 2110, cy: 540,  side: "left"   },
    // 20: 2025-07-07 BTC $119k
    { dx: dateToX("2025-07-07"), dy: priceToY(119116), cx: 2110, cy: 760,  side: "left"   },
    // 21: 2025-10-06 第4周期高点
    { dx: dateToX("2025-10-06"), dy: priceToY(126210), cx: 2110, cy: 980,  side: "left"   },
    // 22: 2025-11 熊市确认
    { dx: dateToX("2025-11-01"), dy: priceToY(90000),  cx: 2110, cy: 1200, side: "left"   },
  ];
}

function cardAnchor(l: EventLayout): [number, number] {
  switch (l.side) {
    case "top":    return [l.cx + CARD_W / 2, l.cy];
    case "bottom": return [l.cx + CARD_W / 2, l.cy + CARD_H];
    case "left":   return [l.cx, l.cy + CARD_H / 2];
    case "right":  return [l.cx + CARD_W, l.cy + CARD_H / 2];
  }
}

// Bezier from chart dot outward to card anchor (for draw animation)
function bezierFromDot(ax: number, ay: number, dx: number, dy: number, side: EventLayout["side"]): string {
  const mx = (ax + dx) / 2, my = (ay + dy) / 2;
  let c1x = dx, c1y = dy, c2x = ax, c2y = ay;
  if (side === "top" || side === "bottom") { c1x = dx; c1y = my; c2x = ax; c2y = my; }
  else                                      { c1x = mx; c1y = dy; c2x = mx; c2y = ay; }
  return `M${dx},${dy} C${c1x},${c1y} ${c2x},${c2y} ${ax},${ay}`;
}

// ─── SVG path builders ─────────────────────────────────────────────────────────
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function BTCEventMap() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef   = useRef<HTMLDivElement>(null);
  const dragging   = useRef(false);
  const didDrag    = useRef(false);
  const startMouse = useRef({ x: 0, y: 0 });
  const lastMouse  = useRef({ x: 0, y: 0 });
  const txRef      = useRef(-60);
  const tyRef      = useRef(-60);
  const scaleRef   = useRef(0.56);
  const [pct, setPct]           = useState(0.56);
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);

  const apply = useCallback(() => {
    if (innerRef.current)
      innerRef.current.style.transform =
        `translate(${txRef.current}px,${tyRef.current}px) scale(${scaleRef.current})`;
  }, []);

  useLayoutEffect(() => { apply(); });

  const clamp = (s: number) => Math.min(2, Math.max(0.18, s));

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
    lastMouse.current  = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  };
  const onMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    if (Math.hypot(e.clientX - startMouse.current.x, e.clientY - startMouse.current.y) > 4)
      didDrag.current = true;
    txRef.current += e.clientX - lastMouse.current.x;
    tyRef.current += e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    apply();
  };
  const onUp = () => { dragging.current = false; };

  const lastT = useRef({ x: 0, y: 0 });
  const onTS  = (e: React.TouchEvent) => { lastT.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTM  = (e: React.TouchEvent) => {
    e.preventDefault();
    txRef.current += e.touches[0].clientX - lastT.current.x;
    tyRef.current += e.touches[0].clientY - lastT.current.y;
    lastT.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    apply();
  };

  const zoomBtn = (dir: 1 | -1) => {
    const r = wrapperRef.current!.getBoundingClientRect();
    const cx = r.width / 2, cy = r.height / 2;
    const old = scaleRef.current, next = clamp(old * (dir > 0 ? 1.2 : 0.83));
    txRef.current = cx - (cx - txRef.current) * (next / old);
    tyRef.current = cy - (cy - tyRef.current) * (next / old);
    scaleRef.current = next; setPct(next); apply();
  };
  const reset = () => { txRef.current = -60; tyRef.current = -60; scaleRef.current = 0.56; setPct(0.56); apply(); };

  const layouts  = buildLayouts();
  const events   = btcEvents.slice(0, layouts.length);
  const linePth  = buildLine();
  const areaPth  = buildArea();

  return (
    <>
    <style>{`
      @keyframes lineDrawIn {
        from { stroke-dashoffset: 3000; }
        to   { stroke-dashoffset: 0; }
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
            <linearGradient id="evag" x1="0" y1="0" x2="0" y2="1">
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

          <path d={areaPth} fill="url(#evag)" />

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

          {/* connectors — draw from chart dot outward */}
          {events.map((ev, i) => {
            const l = layouts[i];
            const [ax, ay] = cardAnchor(l);
            const style = EC[ev.type] ?? EC.milestone;
            const delay = `${0.3 + i * 0.07}s`;
            return (
              <path key={i}
                d={bezierFromDot(ax, ay, l.dx, l.dy, l.side)}
                fill="none" stroke={style.stroke} strokeWidth={1.8} strokeOpacity={0.55}
                strokeDasharray="3000"
                style={{ strokeDashoffset: 3000, animation: `lineDrawIn 0.7s ease-out ${delay} both` }}
              />
            );
          })}

          {/* dots */}
          {events.map((ev, i) => {
            const l = layouts[i];
            const style = EC[ev.type] ?? EC.milestone;
            return (
              <g key={i}>
                <circle cx={l.dx} cy={l.dy} r={14} fill={style.dot} opacity={0.12} />
                <circle cx={l.dx} cy={l.dy} r={7}  fill={style.dot} stroke="white" strokeWidth={2} />
              </g>
            );
          })}

          {/* chart title */}
          <text x={CX + CW / 2} y={CY - 22} fontSize={24} fill="#b45309" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">
            ₿ BTC 重大事件 · 对数坐标 · 历史脉络
          </text>
        </svg>

        {/* ── Cards ── */}
        {events.map((ev, i) => {
          const l = layouts[i];
          const style = EC[ev.type] ?? EC.milestone;
          const isFocused = focusedIdx === i;

          return (
            <div key={i}
              onClick={(e) => { e.stopPropagation(); if (!didDrag.current) setFocusedIdx(isFocused ? null : i); }}
              style={{
                position: "absolute", left: l.cx, top: l.cy,
                width: CARD_W, height: CARD_H,
                background: style.bg,
                border: `1.5px solid ${style.stroke}${isFocused ? "cc" : "50"}`,
                borderRadius: 14,
                padding: "12px 14px",
                boxShadow: isFocused ? `0 16px 48px 0 ${style.stroke}40` : "0 3px 18px 0 #0000001a",
                display: "flex", flexDirection: "column", gap: 5,
                pointerEvents: "auto",
                cursor: "pointer",
                transformOrigin: "center",
                zIndex: isFocused ? 50 : 1,
                transform: focusedIdx === null ? "scale(1)" : isFocused ? "scale(3.5)" : "scale(0.82)",
                opacity: focusedIdx === null ? 1 : isFocused ? 1 : 0.4,
                transition: "transform 0.32s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease, box-shadow 0.25s ease",
              }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: "2px 9px", borderRadius: 999,
                  background: style.stroke + "20", color: style.badge, letterSpacing: "0.02em",
                }}>{style.label}</span>
                <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{ev.date}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", lineHeight: 1.25 }}>{ev.title}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: style.badge, lineHeight: 1.2 }}>{ev.impact}</div>
              <div style={{
                fontSize: 11, color: "#475569", lineHeight: 1.5,
                overflow: isFocused ? "visible" : "hidden",
                display: isFocused ? "block" : "-webkit-box",
                WebkitLineClamp: isFocused ? undefined : 3,
                WebkitBoxOrient: "vertical" as const,
              }}>{ev.reason}</div>
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
        滚轮缩放 · 拖拽移动 · 点击卡片放大
      </div>
    </div>
    </>
  );
}
