"use client";

import { useState } from "react";
import { useEffect } from "react";
import { Banknote, ExternalLink, Gift, Ticket, TrendingUp, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RegisterRewardButton({
  href,
  label = "去注册",
}: {
  href: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-black text-amber-300 shadow-[0_10px_22px_rgba(15,23,42,0.16)] transition-colors hover:bg-amber-400 hover:text-slate-950 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
    >
      {label}
      <ExternalLink className="h-4 w-4" />
    </a>
  );
}

export function CexRewardDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(true);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[92vw] max-w-md overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>交易所福利说明</DialogTitle>
          <DialogDescription>
            使用邀请码注册任意交易所，完成 100U 入金、保留 UID 记录并交易任意金额后，可加入 VIP 群并领取现金红包奖励。
          </DialogDescription>
        </DialogHeader>

        <div className="bg-gradient-to-br from-amber-50 via-white to-white p-5 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-[0_14px_30px_rgba(245,158,11,0.28)]">
            <Gift className="h-6 w-6" />
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
              Wise VIP Reward
            </p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950 dark:text-white">
              交易所专属福利说明
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              使用页面里的邀请码注册任意交易所，入金 <span className="font-black text-slate-950 dark:text-white">100U</span>
              、保留 UID 记录，并交易任意金额后，
              可加入 VIP 群，并且可找 Wise 领取
              <span className="font-black text-amber-600 dark:text-amber-300"> 5U 现金红包奖励</span>。
            </p>
          </div>

          <div className="mt-5 grid gap-2">
            {[
              { icon: Ticket, label: "使用页面里的专属邀请码完成注册" },
              { icon: Banknote, label: "完成 100U 入金后保留 UID / 记录" },
              { icon: TrendingUp, label: "交易任意金额，完成福利领取条件" },
              { icon: Users, label: "联系 Wise 加入 VIP 群并领取 5U 红包" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl border border-amber-200/80 bg-white/85 px-3 py-2.5 text-left shadow-sm dark:border-amber-900/50 dark:bg-slate-950/70"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-bold leading-5 text-slate-600 dark:text-slate-300">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-center dark:border-slate-800 dark:bg-slate-900/80">
            <p className="text-[11px] font-semibold leading-5 text-slate-500 dark:text-slate-400">
              这些交易所适合完成入金、买币、现货交易、理财和活动参与。注册时记得核对邀请码，避免福利漏绑。
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-amber-300 shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition-colors hover:bg-amber-400 hover:text-slate-950 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
          >
            我知道了
          </button>
          </div>
      </DialogContent>
    </Dialog>
  );
}
