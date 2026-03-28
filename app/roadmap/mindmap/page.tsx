"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MindMapCanvas from "@/components/MindMapCanvas";

export default function MindMapPage() {
  // Lock body scroll for the standalone full-page view
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 64px)" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-slate-200 bg-white flex-shrink-0 z-10">
        <Link href="/roadmap" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回学习路线
        </Link>
        <span className="text-slate-200">|</span>
        <h1 className="text-base font-bold text-slate-900">🧠 投资脑图</h1>
        <span className="text-xs text-slate-400 hidden sm:block">· 资金流转路径图</span>
      </div>

      {/* Canvas — fills remaining space, zoom controls are inside */}
      <div className="flex-1 overflow-hidden">
        <MindMapCanvas embedded={false} />
      </div>
    </div>
  );
}
