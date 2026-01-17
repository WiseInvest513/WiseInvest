"use client";

import { ExternalLink, BookOpen } from "lucide-react";
import { ResourceIcon } from "@/components/ui/resource-icon";
import { Button } from "@/components/ui/button";
import { perks } from "@/lib/perks-data";

// CEX 交易所数据
const cexExchanges = [
  {
    id: "binance",
    name: "币安",
    nameEn: "Binance",
    url: "https://www.binance.com",
    description: "全球领先的加密货币交易所",
    claimLink: perks.find(p => p.id === "binance")?.link || "https://www.binance.com",
    tutorialLink: perks.find(p => p.id === "binance")?.tutorialLink || "https://x.com/WiseInvest513",
  },
  {
    id: "okx",
    name: "欧易",
    nameEn: "OKX",
    url: "https://www.okx.com",
    description: "全球知名数字资产交易平台",
    claimLink: perks.find(p => p.id === "okx")?.link || "https://www.okx.com",
    tutorialLink: perks.find(p => p.id === "okx")?.tutorialLink || "https://x.com/WiseInvest513",
  },
  {
    id: "bitget",
    name: "Bitget",
    nameEn: "Bitget",
    url: "https://www.bitget.com",
    description: "全球领先的加密货币衍生品交易平台",
    claimLink: perks.find(p => p.id === "bitget")?.link || "https://www.bitget.com",
    tutorialLink: perks.find(p => p.id === "bitget")?.tutorialLink || "https://x.com/WiseInvest513",
  },
  {
    id: "bybit",
    name: "Bybit",
    nameEn: "Bybit",
    url: "https://www.bybit.com",
    description: "全球知名加密货币衍生品交易所",
    claimLink: perks.find(p => p.id === "bybit")?.link || "https://www.bybit.com",
    tutorialLink: perks.find(p => p.id === "bybit")?.tutorialLink || "https://x.com/WiseInvest513",
  },
];

export function CEXSection() {
  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-center mb-10 text-slate-900 dark:text-white tracking-tight relative inline-block w-full">
        <span className="relative inline-block">
          CEX 交易所福利
          <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-30" />
        </span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 max-w-7xl mx-auto">
        {cexExchanges.map((exchange) => (
          <div
            key={exchange.id}
            className="group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 rounded-2xl p-6 transition-all duration-500 overflow-hidden
              hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-1 hover:bg-white/90 dark:hover:bg-slate-900/90"
            style={{
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          >
            {/* Radial Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/15 via-orange-500/10 to-amber-400/15 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
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
            
            <div className="relative z-10 flex flex-col h-full">
              {/* Icon and Name */}
              <div className="flex flex-col items-center mb-4">
                <div className="relative inline-block mb-3">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400/40 via-orange-500/30 to-amber-400/40 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
                  <div className="relative p-3 rounded-2xl bg-gradient-to-br from-amber-100/50 via-orange-50/30 to-amber-100/50 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-amber-900/30 group-hover:from-amber-200/60 group-hover:via-orange-100/40 group-hover:to-amber-200/60 dark:group-hover:from-amber-800/40 dark:group-hover:via-orange-800/30 dark:group-hover:to-amber-800/40 transition-all duration-500 border border-amber-200/30 dark:border-amber-800/30 group-hover:border-amber-300/50 dark:group-hover:border-amber-700/50">
                    <ResourceIcon
                      url={exchange.url}
                      name={exchange.nameEn}
                      size={48}
                      rounded={false}
                    />
                  </div>
                </div>
                <h3 className="text-lg md:text-xl font-heading font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-500 mb-1">
                  {exchange.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  {exchange.nameEn}
                </p>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 text-center flex-1">
                {exchange.description}
              </p>

              {/* Action Buttons - Vertical Layout */}
              <div className="flex flex-col gap-2 mt-auto">
                <Button
                  onClick={() => window.open(exchange.claimLink, "_blank", "noopener,noreferrer")}
                  className="w-full h-9 bg-yellow-400 dark:bg-yellow-500 text-black hover:bg-yellow-500 dark:hover:bg-yellow-600 font-semibold text-sm"
                >
                  立即领取
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </Button>
                <Button
                  onClick={() => window.open(exchange.tutorialLink, "_blank", "noopener,noreferrer")}
                  variant="outline"
                  className="w-full h-9 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 font-medium text-sm"
                >
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                  查看教程
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

