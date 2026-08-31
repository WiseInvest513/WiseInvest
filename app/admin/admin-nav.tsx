"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardCheck,
  FileLock2,
  History,
  KeyRound,
  LayoutDashboard,
  ServerCog,
  ShieldCheck,
  Users,
  Waypoints,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminGroups = [
  {
    label: "核心管理",
    description: "用户和 VIP 核验",
    links: [
      { href: "/admin", label: "总览", icon: LayoutDashboard, exact: true },
      { href: "/admin/vip", label: "VIP 审核", icon: ClipboardCheck },
      { href: "/admin/users", label: "用户管理", icon: Users },
    ],
  },
  {
    label: "权限与接入",
    description: "内容访问和外部登录",
    links: [
      { href: "/admin/content", label: "内容权限", icon: FileLock2 },
      { href: "/admin/sso", label: "SSO Client", icon: KeyRound },
    ],
  },
  {
    label: "运营配置",
    description: "合作方和实盘数据",
    links: [
      { href: "/admin/partners", label: "合作方", icon: Waypoints },
      { href: "/admin/dca", label: "DCA 数据", icon: BarChart3 },
    ],
  },
  {
    label: "系统",
    description: "日志和生产配置",
    links: [
      { href: "/admin/audit", label: "审计日志", icon: History },
      { href: "/admin/system", label: "系统检查", icon: ServerCog },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mb-3 hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 dark:border-amber-900/50 dark:from-amber-950/30 dark:to-slate-950 lg:block">
        <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-700 dark:text-amber-200">
          <ShieldCheck className="h-4 w-4" />
          Wise Admin
        </div>
        <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">控制台</p>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          管理账户、权限、合作方与关键配置。
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {adminGroups.map((group) => (
          <div key={group.label} className="min-w-[210px] lg:min-w-0">
            <div className="hidden px-2 py-2 lg:block">
              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">{group.label}</p>
              <p className="mt-0.5 text-[11px] font-bold text-slate-400">{group.description}</p>
            </div>
            <div className="space-y-1">
              {group.links.map((item) => {
                const Icon = item.icon;
                const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-black transition",
                      active
                        ? "bg-slate-950 text-amber-300 shadow-sm dark:bg-white dark:text-slate-950"
                        : "text-slate-600 hover:bg-amber-50 hover:text-amber-800 dark:text-slate-300 dark:hover:bg-amber-950/30 dark:hover:text-amber-200"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
