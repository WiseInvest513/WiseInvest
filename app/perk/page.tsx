import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  Globe2,
  Landmark,
  Layers3,
  Network,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { perkSections, totalProductSlotCount, totalSubcategoryCount } from "./data";

const sectionIcons: Record<string, LucideIcon> = {
  bank: Landmark,
  crypto: Network,
  broker: Building2,
  ipo: TrendingUp,
  "global-access": Globe2,
  "other-resources": Sparkles,
};

const formatCount = (value: number) => value.toString().padStart(2, "0");

function SectionEntryCard({ section }: { section: (typeof perkSections)[number] }) {
  const Icon = sectionIcons[section.slug] ?? Sparkles;
  const slotCount = section.subcategories.reduce((sum, subcategory) => sum + subcategory.slots, 0);

  return (
    <Link
      href={`/perk/${section.slug}`}
      className="group relative flex min-h-[142px] flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.055)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300/80 hover:bg-white hover:shadow-[0_18px_42px_rgba(245,158,11,0.14)] dark:border-slate-800/80 dark:bg-slate-900/90 dark:hover:border-amber-700/80 dark:hover:shadow-amber-950/20"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-950/80 via-amber-400 to-yellow-300/90 dark:from-amber-500 dark:via-yellow-300 dark:to-amber-500" />
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-amber-300 shadow-[0_8px_18px_rgba(15,23,42,0.16)] dark:bg-amber-400 dark:text-slate-950">
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div className="text-right">
          <div className="font-mono text-xs font-black text-slate-300 dark:text-slate-700">{section.index}</div>
          <div className="mt-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300">
            {section.subcategories.length} 个方向
          </div>
        </div>
      </div>

      <div className="flex-1">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
          {section.eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950 dark:text-white">
          {section.title}
        </h2>
        <p className="mt-1 line-clamp-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
          {section.description}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {section.subcategories.slice(0, 3).map((subcategory) => (
          <span
            key={subcategory.slug}
            className="rounded-full border border-slate-200/80 bg-slate-50/90 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:border-slate-700/80 dark:bg-slate-950/80 dark:text-slate-400"
          >
            {subcategory.title}
          </span>
        ))}
        {section.subcategories.length > 3 && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300">
            +{section.subcategories.length - 3}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100/80 pt-2 text-xs font-bold dark:border-slate-800/80">
        <span className="text-slate-400">{formatCount(slotCount)} 个产品位</span>
        <span className="inline-flex items-center gap-1 text-slate-900 transition-colors group-hover:text-amber-600 dark:text-slate-100 dark:group-hover:text-amber-300">
          进入
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export default function PerkPage() {
  return (
    <div className="relative min-h-screen bg-slate-50 dot-grid dot-grid-light dark:bg-slate-950">
      <main className="relative z-[1] mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-7">
        <section className="mb-4 rounded-2xl border border-amber-200/70 bg-white/90 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-amber-900/50 dark:bg-slate-900/90">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
                WiseInvest 福利导航
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                一眼找到要用的福利
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                六个场景入口直接进入独立页面；每个页面里再承载具体产品、教程和领取按钮。
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr] lg:grid-cols-3">
              {[
                { label: "大类", value: perkSections.length, icon: Layers3 },
                { label: "方向", value: totalSubcategoryCount, icon: BadgeCheck },
                { label: "产品位", value: totalProductSlotCount, icon: Banknote },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-3 shadow-inner shadow-white/70 dark:border-slate-800/80 dark:bg-slate-950/60 dark:shadow-none"
                  >
                    <Icon className="mb-2 h-4 w-4 text-amber-500" />
                    <div className="text-xl font-black text-slate-950 dark:text-white">{item.value}</div>
                    <div className="mt-0.5 text-[11px] font-semibold text-slate-400">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {perkSections.map((section) => (
            <SectionEntryCard key={section.slug} section={section} />
          ))}
        </section>

      </main>
    </div>
  );
}
