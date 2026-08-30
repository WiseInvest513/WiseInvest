import Link from "next/link";
import { BarChart3, ClipboardCheck, FileLock2, History, LayoutDashboard, ServerCog, Users, Waypoints } from "lucide-react";

const adminLinks = [
  { href: "/admin", label: "总览", icon: LayoutDashboard },
  { href: "/admin/vip", label: "VIP 审核", icon: ClipboardCheck },
  { href: "/admin/users", label: "用户", icon: Users },
  { href: "/admin/content", label: "内容权限", icon: FileLock2 },
  { href: "/admin/partners", label: "合作方", icon: Waypoints },
  { href: "/admin/dca", label: "DCA", icon: BarChart3 },
  { href: "/admin/audit", label: "审计", icon: History },
  { href: "/admin/system", label: "系统", icon: ServerCog },
];

export function AdminNav() {
  return (
    <nav className="flex flex-wrap gap-2">
      {adminLinks.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:border-amber-200 hover:text-amber-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-900/60 dark:hover:text-amber-200"
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
