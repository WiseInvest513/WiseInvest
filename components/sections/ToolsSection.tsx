"use client";

import Link from "next/link";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Calculator, Clock, TrendingUp, BarChart3, Percent } from "lucide-react";
import { getToolRoute } from "@/lib/tool-routes";
import { tools } from "@/lib/data";
import { SectionCardShell } from "@/components/sections/SectionCardShell";

const featuredToolIds = ["compound-calc", "roi-calculator", "fear-greed"];

const iconMap = {
  Calculator,
  Clock,
  TrendingUp,
  BarChart3,
  Percent,
} as const;

export function ToolsSection() {
  const featuredTools = featuredToolIds
    .map((id) => tools.find((tool) => tool.id === id))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));

  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-center mb-10 text-slate-900 dark:text-white tracking-tight relative inline-block w-full">
        <span className="relative inline-block">
          实用投资工具
          <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-30" />
        </span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto items-stretch">
        {featuredTools.map((tool) => {
          const Icon = iconMap[tool.icon as keyof typeof iconMap] || Calculator;
          const toolRoute = getToolRoute(tool.id);
          return (
            <Link
              key={tool.id}
              href={toolRoute}
              className="group relative cursor-pointer block h-full min-w-0"
            >
              <SectionCardShell
                className="h-full min-h-[240px]"
                contentClassName="p-6 md:p-7"
                watermarkNode={
                  <Icon className="w-full h-full text-slate-300 dark:text-slate-700 group-hover:text-amber-400 transition-colors duration-500" />
                }
              >
                <div className="relative z-10 text-center">
                  {/* Icon with Dual-Tone Glow */}
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/40 via-orange-500/30 to-amber-400/40 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
                    <div className="relative p-5 rounded-2xl bg-gradient-to-br from-amber-100/50 via-orange-50/30 to-amber-100/50 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-amber-900/30 group-hover:from-amber-200/60 group-hover:via-orange-100/40 group-hover:to-amber-200/60 dark:group-hover:from-amber-800/40 dark:group-hover:via-orange-800/30 dark:group-hover:to-amber-800/40 transition-all duration-500 border border-amber-200/30 dark:border-amber-800/30 group-hover:border-amber-300/50 dark:group-hover:border-amber-700/50">
                      <Icon className="h-12 w-12 text-amber-600 dark:text-amber-400 relative z-10 group-hover:scale-110 transition-transform duration-500"
                        style={{ filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.5))' }} />
                    </div>
                  </div>
                  
                  <CardTitle className="text-xl md:text-2xl font-heading font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-500 mb-2">
                    {tool.name}
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base text-slate-600 dark:text-slate-400">
                    {tool.description}
                  </CardDescription>
                </div>
              </SectionCardShell>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

