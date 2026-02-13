"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  watermarkSrc?: string;
  watermarkAlt?: string;
  watermarkNode?: ReactNode;
}

export function SectionCardShell({
  children,
  className,
  contentClassName,
  watermarkSrc,
  watermarkAlt = "",
  watermarkNode,
}: SectionCardShellProps) {
  return (
    <div className={cn("group relative", className)}>
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/15 via-orange-500/10 to-amber-400/15 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div
        className={cn(
          "relative h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 rounded-2xl transition-all duration-500 overflow-hidden hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-1 hover:bg-white/90 dark:hover:bg-slate-900/90",
          contentClassName
        )}
        style={{
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(249, 115, 22, 0.2), rgba(251, 191, 36, 0.3))",
            padding: "1px",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-orange-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:via-orange-500/3 group-hover:to-amber-500/5 rounded-2xl transition-all duration-500 pointer-events-none" />

        {(watermarkSrc || watermarkNode) && (
          <div className="absolute -bottom-12 -right-12 w-48 h-48 opacity-[0.08] rotate-12 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:opacity-[0.12] z-0 pointer-events-none select-none grayscale group-hover:grayscale-0">
            {watermarkSrc ? (
              <img src={watermarkSrc} alt={watermarkAlt} className="w-full h-full object-contain" />
            ) : (
              watermarkNode
            )}
          </div>
        )}

        <div className="relative z-10 h-full">{children}</div>
      </div>
    </div>
  );
}

