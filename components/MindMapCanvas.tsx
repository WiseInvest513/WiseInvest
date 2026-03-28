"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ZoomIn, ZoomOut, RotateCcw, ExternalLink, X } from "lucide-react";
import {
  flowNodes,
  flowEdges,
  categoryConfig,
  NODE_W,
  NODE_H,
  type FlowNode,
  type NodeCategory,
  type Tutorial,
} from "@/lib/mindmap-data";

// ─── Layout constants ──────────────────────────────────────────────────────
const RX = 12;
const HW = NODE_W / 2;
const HH = NODE_H / 2;

// ─── Bus topology geometry ─────────────────────────────────────────────────
const BUS_X = 228;
const BUS_COLOR = "#6366f1";

const BANK_IDS   = ["ifast", "zongan", "mayi", "tianxing", "hsbc", "bochk"];
const BROKER_IDS = ["fusun", "changqiao", "yingli", "yintou", "zhifu"];

// ─── Edge path helper ──────────────────────────────────────────────────────
function edgePath(src: FlowNode, dst: FlowNode, isReturn = false): string {
  if (isReturn) {
    const busY = Math.max(src.y, dst.y) + 200;
    return `M${src.x},${src.y + HH} C${src.x},${busY} ${dst.x},${busY} ${dst.x},${dst.y + HH}`;
  }
  const goRight = dst.x >= src.x;
  const x1 = src.x + (goRight ? HW : -HW);
  const y1 = src.y;
  const x2 = dst.x + (goRight ? -HW : HW);
  const y2 = dst.y;
  const c  = Math.max(Math.abs(x2 - x1) * 0.5, 60);
  return goRight
    ? `M${x1},${y1} C${x1+c},${y1} ${x2-c},${y2} ${x2},${y2}`
    : `M${x1},${y1} C${x1-c},${y1} ${x2+c},${y2} ${x2},${y2}`;
}

// ─── Props ─────────────────────────────────────────────────────────────────
interface MindMapCanvasProps {
  /**
   * When true: fills its parent container, no scroll lock, no topbar.
   * When false (standalone page): subtracts nav+topbar from height, locks body scroll.
   */
  embedded?: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function MindMapCanvas({ embedded = false }: MindMapCanvasProps) {
  const [viewport, setViewport] = useState({ w: 1200, h: 700 });
  const [selected, setSelected] = useState<FlowNode | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [displayScale, setDisplayScale] = useState(0.95);

  // Transform stored in refs — updated directly on the DOM, bypassing React re-renders
  const txRef    = useRef(0);
  const tyRef    = useRef(0);
  const scaleRef = useRef(0.95);

  const wrapperRef   = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gRef         = useRef<SVGGElement>(null);
  const dragging     = useRef(false);
  const lastMouse    = useRef({ x: 0, y: 0 });
  const lastTouch    = useRef({ x: 0, y: 0 });

  // Apply current transform refs directly to the DOM <g> element — no React re-render
  const applyTransform = useCallback(() => {
    gRef.current?.setAttribute(
      "transform",
      `translate(${txRef.current},${tyRef.current}) scale(${scaleRef.current})`
    );
  }, []);

  // Re-sync after every React render
  useLayoutEffect(() => { applyTransform(); });

  const connectedIds = useCallback((id: string) => {
    const s = new Set([id]);
    if (BANK_IDS.includes(id))   BROKER_IDS.forEach(b => s.add(b));
    if (BROKER_IDS.includes(id)) BANK_IDS.forEach(b => s.add(b));
    flowEdges.forEach(e => { if (e.from === id) s.add(e.to); if (e.to === id) s.add(e.from); });
    return s;
  }, []);

  // Lock body scroll only in standalone mode
  useEffect(() => {
    if (embedded) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [embedded]);

  // Viewport sizing
  useEffect(() => {
    const getSize = () => {
      // Always use the wrapper container's actual dimensions
      if (wrapperRef.current) {
        return {
          w: wrapperRef.current.offsetWidth,
          h: wrapperRef.current.offsetHeight,
        };
      }
      return { w: window.innerWidth, h: window.innerHeight };
    };

    const upd = () => {
      const { w, h } = getSize();
      txRef.current = w / 2 + 90;
      tyRef.current = h / 2 + 80;
      setViewport({ w, h });
    };

    upd();

    if (wrapperRef.current) {
      const ro = new ResizeObserver(upd);
      ro.observe(wrapperRef.current);
      return () => ro.disconnect();
    }
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, [embedded]);

  // Zoom
  const zoom = useCallback((f: number) => {
    scaleRef.current = Math.min(2.5, Math.max(0.2, scaleRef.current * f));
    applyTransform();
    setDisplayScale(scaleRef.current);
  }, [applyTransform]);

  // Non-passive wheel
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const h = (e: WheelEvent) => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.1 : 0.91); };
    el.addEventListener("wheel", h, { passive: false });
    return () => el.removeEventListener("wheel", h);
  }, [zoom]);

  const resetView = useCallback(() => {
    scaleRef.current = 0.95;
    txRef.current = viewport.w / 2 + 90;
    tyRef.current = viewport.h / 2 + 80;
    applyTransform();
    setDisplayScale(0.95);
  }, [viewport, applyTransform]);

  // Drag handlers — zero React re-renders
  const onMD = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).style.cursor = "grabbing";
  }, []);
  const onMM = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    txRef.current += e.clientX - lastMouse.current.x;
    tyRef.current += e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    applyTransform();
  }, [applyTransform]);
  const stop = useCallback((e: React.MouseEvent) => {
    dragging.current = false;
    (e.currentTarget as HTMLElement).style.cursor = "grab";
  }, []);
  const onTS = useCallback((e: React.TouchEvent) => {
    lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);
  const onTM = useCallback((e: React.TouchEvent) => {
    txRef.current += e.touches[0].clientX - lastTouch.current.x;
    tyRef.current += e.touches[0].clientY - lastTouch.current.y;
    lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    applyTransform();
  }, [applyTransform]);

  // Pre-compute bus
  const bankNodes   = BANK_IDS.map(id => flowNodes.find(n => n.id === id)!);
  const brokerNodes = BROKER_IDS.map(id => flowNodes.find(n => n.id === id)!);
  const busTop    = Math.min(...bankNodes.map(n => n.y), ...brokerNodes.map(n => n.y)) - HH - 18;
  const busBottom = Math.max(...bankNodes.map(n => n.y), ...brokerNodes.map(n => n.y)) + HH + 18;

  const highlighted    = hoveredId ? connectedIds(hoveredId) : null;
  const busHighlighted = hoveredId ? (BANK_IDS.includes(hoveredId) || BROKER_IDS.includes(hoveredId)) : false;

  const zoomButtons = [
    ["放大", () => zoom(1.15), <ZoomIn key="i"  className="w-3.5 h-3.5"/>],
    ["缩小", () => zoom(0.87), <ZoomOut key="o" className="w-3.5 h-3.5"/>],
    ["重置", resetView,        <RotateCcw key="r" className="w-3.5 h-3.5"/>],
  ] as const;

  return (
    <div ref={wrapperRef} className="w-full h-full flex flex-col overflow-hidden" style={{ background: "#f0f2f5" }}>
      {/* Canvas */}
      <div ref={containerRef} className="flex-1 overflow-hidden relative"
        style={{ cursor: "grab" }}
        onMouseDown={onMD} onMouseMove={onMM} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={() => { dragging.current = false; }}
      >
        <svg width={viewport.w} height={viewport.h} className="absolute inset-0 select-none">
          <defs>
            <pattern id="mm-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="#c8cdd6" opacity="0.55"/>
            </pattern>
            {(Object.entries(categoryConfig) as [NodeCategory, (typeof categoryConfig)[NodeCategory]][]).map(([cat, cfg]) => (
              <marker key={cat} id={`mm-a-${cat}`} markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto" markerUnits="userSpaceOnUse">
                <polygon points="0 0,9 3.5,0 7" fill={cfg.color} opacity="0.85"/>
              </marker>
            ))}
            <marker id="mm-a-bus" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto" markerUnits="userSpaceOnUse">
              <polygon points="0 0,9 3.5,0 7" fill={BUS_COLOR} opacity="0.85"/>
            </marker>
            <marker id="mm-a-ret" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto" markerUnits="userSpaceOnUse">
              <polygon points="0 0,9 3.5,0 7" fill="#94a3b8" opacity="0.85"/>
            </marker>
          </defs>

          <rect width={viewport.w} height={viewport.h} fill="url(#mm-grid)"/>

          <g ref={gRef}>
            {/* Directed edges (skip hidden ones — they exist only for tutorial lookup) */}
            {flowEdges.filter(e => !e.hidden).map((edge, i) => {
              const src = flowNodes.find(n => n.id === edge.from)!;
              const dst = flowNodes.find(n => n.id === edge.to)!;
              const cfg = categoryConfig[src.category];
              const isRet = !!edge.isReturn;
              const isHl  = highlighted ? highlighted.has(src.id) && highlighted.has(dst.id) : false;
              const faded = !!highlighted && !isHl;
              return (
                <path key={i}
                  className={isRet ? "flow-return" : "flow-edge"}
                  d={edgePath(src, dst, isRet)}
                  fill="none"
                  stroke={isRet ? "#94a3b8" : cfg.color}
                  strokeWidth={isHl ? 2.5 : 2}
                  strokeOpacity={faded ? 0.05 : 0.65}
                  markerEnd={`url(#mm-a-${isRet ? "ret" : src.category})`}
                  style={{ transition: "stroke-opacity 0.18s" }}
                />
              );
            })}

            {/* Bus spine */}
            <line className="flow-bus-spine"
              x1={BUS_X} y1={busTop} x2={BUS_X} y2={busBottom}
              stroke={BUS_COLOR} strokeWidth={busHighlighted ? 4 : 3}
              strokeOpacity={busHighlighted ? 0.75 : 0.45} strokeLinecap="round"
              style={{ transition: "stroke-opacity 0.18s, stroke-width 0.18s" }}
            />
            <circle cx={BUS_X} cy={busTop}    r="5" fill={BUS_COLOR} opacity={busHighlighted ? 0.7 : 0.35}/>
            <circle cx={BUS_X} cy={busBottom} r="5" fill={BUS_COLOR} opacity={busHighlighted ? 0.7 : 0.35}/>
            <text x={BUS_X + 10} y={busTop + 20} fontSize={10} fontWeight="700"
              fill={BUS_COLOR} opacity={0.65} style={{ fontFamily: "system-ui, sans-serif" }}>
              入金通道
            </text>

            {/* Bank → spine */}
            {bankNodes.map(node => {
              const cfg = categoryConfig[node.category];
              const isHl = highlighted ? highlighted.has(node.id) : false;
              const faded = !!highlighted && !isHl;
              return (
                <line key={`bus-b-${node.id}`} className="flow-bus-conn"
                  x1={node.x + HW + 2} y1={node.y} x2={BUS_X - 2} y2={node.y}
                  stroke={cfg.color} strokeWidth={isHl ? 2 : 1.5}
                  strokeOpacity={faded ? 0.05 : 0.55}
                  style={{ transition: "stroke-opacity 0.18s" }}
                />
              );
            })}

            {/* Spine → broker */}
            {brokerNodes.map(node => {
              const isHl = highlighted ? highlighted.has(node.id) : false;
              const faded = !!highlighted && !isHl;
              return (
                <line key={`bus-p-${node.id}`} className="flow-bus-conn"
                  x1={BUS_X + 2} y1={node.y} x2={node.x - HW - 4} y2={node.y}
                  stroke={BUS_COLOR} strokeWidth={isHl ? 2 : 1.5}
                  strokeOpacity={faded ? 0.05 : 0.55}
                  markerEnd="url(#mm-a-bus)"
                  style={{ transition: "stroke-opacity 0.18s" }}
                />
              );
            })}

            {/* Nodes */}
            {flowNodes.map(node => {
              const cfg   = categoryConfig[node.category];
              const isHl  = highlighted ? highlighted.has(node.id) : false;
              const faded = !!highlighted && !isHl;
              const isSel = selected?.id === node.id;
              const isBus = BANK_IDS.includes(node.id) || BROKER_IDS.includes(node.id);
              return (
                <g key={node.id}
                  transform={`translate(${node.x - HW},${node.y - HH})`}
                  onClick={() => setSelected(isSel ? null : node)}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ cursor: "pointer", opacity: faded ? 0.18 : 1, transition: "opacity 0.18s" }}
                >
                  <rect x={2} y={3} width={NODE_W} height={NODE_H} rx={RX} fill={cfg.color} opacity={0.1}/>
                  <rect width={NODE_W} height={NODE_H} rx={RX} fill="white"
                    stroke={isSel ? cfg.color : isHl ? cfg.color : cfg.border}
                    strokeWidth={isSel ? 2.5 : isHl ? 2 : 1.5}
                  />
                  <rect width={NODE_W} height={NODE_H} rx={RX} fill={cfg.bg} opacity={0.55}/>
                  <rect x={0} y={7} width={4} height={NODE_H - 14} rx={2} fill={cfg.color} opacity={0.9}/>
                  {isBus && BANK_IDS.includes(node.id) && (
                    <circle cx={NODE_W} cy={HH} r={4} fill={BUS_COLOR}
                      opacity={busHighlighted ? 0.8 : 0.3} style={{ transition: "opacity 0.18s" }}/>
                  )}
                  {isBus && BROKER_IDS.includes(node.id) && (
                    <circle cx={0} cy={HH} r={4} fill={BUS_COLOR}
                      opacity={busHighlighted ? 0.8 : 0.3} style={{ transition: "opacity 0.18s" }}/>
                  )}
                  <text x={NODE_W / 2 + 2} y={HH}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={12} fontWeight="700" fill={cfg.color}
                    style={{ fontFamily: "system-ui, sans-serif" }}>
                    {node.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur border border-slate-200 rounded-2xl p-3.5 shadow-sm z-10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">图例</p>
          <div className="space-y-1.5">
            {(Object.entries(categoryConfig) as [NodeCategory, (typeof categoryConfig)[NodeCategory]][]).map(([, cfg]) => (
              <div key={cfg.label} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: cfg.color }}/>
                <span className="text-[11px] font-medium" style={{ color: cfg.color }}>{cfg.icon} {cfg.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-0.5 rounded-full flex-shrink-0" style={{ background: BUS_COLOR, opacity: 0.6 }}/>
              <span className="text-[11px] text-slate-500">入金通道总线</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-0 border-t-2 border-dashed border-slate-400 opacity-60 flex-shrink-0"/>
              <span className="text-[11px] text-slate-500">回流通道</span>
            </div>
          </div>
        </div>

        {/* Zoom controls (always visible) */}
        <div className="absolute top-4 left-4 flex items-center gap-1 bg-white/90 backdrop-blur border border-slate-200 rounded-xl px-2 py-1.5 shadow-sm z-10">
          {zoomButtons.map(([title, fn, icon]) => (
            <button key={title} onClick={fn} title={title}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              {icon}
            </button>
          ))}
          <span className="text-[11px] text-slate-400 w-10 text-center tabular-nums">{Math.round(displayScale * 100)}%</span>
        </div>

        {/* Node detail popup */}
        {selected && (() => {
          const nodeTuts: Tutorial[] = selected.tutorials ?? [];
          const edgeTuts: (Tutorial & { context: string })[] = flowEdges
            .filter(e => e.tutorial && (e.from === selected.id || e.to === selected.id))
            .map(e => {
              const other = flowNodes.find(n => n.id === (e.from === selected.id ? e.to : e.from))!;
              const context = e.from === selected.id ? `→ ${other.name}` : `${other.name} →`;
              return { ...e.tutorial!, context };
            });
          const isYT = (url: string) => url.includes("youtube.com") || url.includes("youtu.be");
          return (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[22rem] max-w-[calc(100%-2rem)] bg-white border border-slate-200 rounded-2xl shadow-xl p-5 z-20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1.5"
                    style={{ color: categoryConfig[selected.category].color }}>
                    {categoryConfig[selected.category].icon} {categoryConfig[selected.category].label}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1.5">{selected.name}</h3>
                  {selected.description && (
                    <p className="text-sm text-slate-500 leading-relaxed">{selected.description}</p>
                  )}
                </div>
                <button onClick={() => setSelected(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors flex-shrink-0">
                  <X className="w-4 h-4"/>
                </button>
              </div>
              {(nodeTuts.length > 0 || edgeTuts.length > 0) && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                  {nodeTuts.map((t, i) => (
                    <Link key={`n-${i}`} href={t.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-transparent transition-colors group"
                      onClick={e => e.stopPropagation()}>
                      <span className="text-base flex-shrink-0">{isYT(t.url) ? "▶" : "𝕏"}</span>
                      <span className="text-xs font-medium text-slate-700 group-hover:text-amber-800 truncate">{t.label}</span>
                      <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-amber-500 flex-shrink-0 ml-auto"/>
                    </Link>
                  ))}
                  {edgeTuts.map((t, i) => (
                    <Link key={`e-${i}`} href={t.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-transparent hover:border-indigo-200 transition-colors group"
                      onClick={e => e.stopPropagation()}>
                      <span className="text-base flex-shrink-0">{isYT(t.url) ? "▶" : "𝕏"}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-indigo-700 group-hover:text-indigo-900 truncate block">{t.label}</span>
                        <span className="text-[10px] text-indigo-400">{t.context}</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-indigo-300 group-hover:text-indigo-500 flex-shrink-0"/>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        <p className="absolute bottom-5 right-5 text-xs text-slate-400 text-right pointer-events-none leading-relaxed">
          滚轮缩放 · 拖拽移动<br/>点击节点 · 悬停高亮
        </p>
      </div>
    </div>
  );
}
