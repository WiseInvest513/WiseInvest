"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
  className?: string;
  /** 紧凑模式，减少 padding */
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center max-w-md mx-auto",
        compact ? "py-16 px-6" : "py-32 px-8",
        className
      )}
    >
      <div className="w-20 h-20 bg-yellow-50 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-yellow-500 dark:text-yellow-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto text-sm leading-relaxed text-center">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="border border-slate-200 dark:border-slate-700 hover:border-yellow-400 dark:hover:border-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-500 text-slate-600 dark:text-slate-400 px-6 py-2 rounded-full mt-6 transition-all bg-white dark:bg-slate-950 font-medium text-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
