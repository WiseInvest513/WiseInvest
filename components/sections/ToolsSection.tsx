"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Coins, BarChart } from "lucide-react";
import { getToolRoute } from "@/lib/tool-routes";

const tools = [
  {
    id: "compound-calc",
    name: "复利计算器",
    nameEn: "Compound Interest Calc",
    icon: Calculator,
    description: "计算复利收益",
  },
  {
    id: "roi-calculator",
    name: "时光财富机",
    nameEn: "Time Wealth Machine",
    icon: Coins,
    description: "计算投资回报率",
  },
  {
    id: "fear-greed",
    name: "贪婪恐慌指数",
    nameEn: "Fear & Greed Index",
    icon: BarChart,
    description: "市场情绪指标",
  },
];

export function ToolsSection() {
  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-center mb-10 text-slate-900 dark:text-white tracking-tight relative inline-block w-full">
        <span className="relative inline-block">
          实用投资工具
          <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-30" />
        </span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const toolRoute = getToolRoute(tool.id);
          return (
            <Link
              key={tool.id}
              href={toolRoute}
              className="group relative cursor-pointer"
            >
              {/* Radial Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/15 via-orange-500/10 to-amber-400/15 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 rounded-2xl p-6 md:p-7 transition-all duration-500 overflow-hidden
                hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-1 hover:bg-white/90 dark:hover:bg-slate-900/90"
                style={{
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                
                {/* Living Border */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(249, 115, 22, 0.2), rgba(251, 191, 36, 0.3))',
                    padding: '1px',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude'
                  }} />
                
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-orange-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:via-orange-500/3 group-hover:to-amber-500/5 rounded-2xl transition-all duration-500 pointer-events-none" />
                
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
                    {tool.nameEn}
                  </CardDescription>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

