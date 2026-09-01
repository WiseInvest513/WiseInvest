"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { ArrowRight, Crown, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

const previewRoles = [
  {
    key: "member",
    title: "普通用户",
    description: "查看普通账户、VIP 升级引导、待审核与驳回状态。",
    href: "/account/vip",
    icon: UserRound,
    className: "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
  },
  {
    key: "vip",
    title: "VIP 用户",
    description: "查看 Wise VIP 权益、内容中心、群聊入口与合作账户。",
    href: "/account/vip",
    icon: Crown,
    className: "border-amber-300 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/25",
  },
  {
    key: "admin",
    title: "管理员",
    description: "进入管理后台，调试用户、VIP 审核、权限与 SSO 配置。",
    href: "/admin",
    icon: ShieldCheck,
    className: "border-slate-800 bg-slate-950 text-white dark:border-slate-700",
  },
] as const;

export function PreviewRoleSwitcher() {
  const [activeRole, setActiveRole] = useState<(typeof previewRoles)[number]["key"] | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const enterPreview = (role: (typeof previewRoles)[number]) => {
    setActiveRole(role.key);
    setMessage("");

    startTransition(async () => {
      await signOut({ redirect: false }).catch(() => null);

      const endpoint = role.key === "admin" ? "/api/dev/mock-admin-login" : "/api/dev/mock-login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: role.key === "admin" ? undefined : { "Content-Type": "application/json" },
        body: role.key === "admin" ? undefined : JSON.stringify({ tier: role.key === "member" ? "MEMBER" : "VIP" }),
      });

      if (!response.ok) {
        setMessage("本地身份切换失败，请确认当前使用的是开发环境。");
        setActiveRole(null);
        return;
      }

      window.location.assign(role.href);
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        {previewRoles.map((role) => {
          const Icon = role.icon;
          const loading = isPending && activeRole === role.key;

          return (
            <article key={role.key} className={`flex min-h-[260px] flex-col rounded-3xl border p-6 shadow-sm ${role.className}`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-current/10 bg-white/80 text-amber-600 shadow-sm dark:bg-white/10 dark:text-amber-300">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-6 text-2xl font-black">{role.title}</h2>
              <p className={`mt-3 text-sm leading-7 ${role.key === "admin" ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
                {role.description}
              </p>
              <Button
                type="button"
                variant={role.key === "admin" ? "secondary" : "default"}
                className={`mt-auto h-12 w-full rounded-xl ${
                  role.key === "admin"
                    ? "bg-white text-slate-950 hover:bg-slate-100"
                    : "bg-slate-950 text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950"
                }`}
                disabled={isPending}
                onClick={() => enterPreview(role)}
              >
                {loading ? "正在切换..." : `进入${role.title}界面`}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </article>
          );
        })}
      </div>

      {message && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
          {message}
        </p>
      )}
    </div>
  );
}
