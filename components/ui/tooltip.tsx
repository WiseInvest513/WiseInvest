"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TooltipContext = React.createContext<TooltipContextValue | undefined>(undefined);

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const Tooltip = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </TooltipContext.Provider>
  );
};

const TooltipTrigger = ({ children }: { children: React.ReactNode }) => {
  const context = React.useContext(TooltipContext);
  if (!context) throw new Error("TooltipTrigger must be used within Tooltip");

  const handleMouseEnter = () => context.setOpen(true);
  const handleMouseLeave = () => context.setOpen(false);

  return (
    <span onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="inline-block">
      {children}
    </span>
  );
};

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { sideOffset?: number }
>(({ className, sideOffset = 4, children, ...props }, ref) => {
  const context = React.useContext(TooltipContext);
  if (!context) throw new Error("TooltipContent must be used within Tooltip");

  if (!context.open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 overflow-hidden rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-950 shadow-lg whitespace-nowrap dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
        "before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-slate-200 dark:before:border-t-slate-800",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
