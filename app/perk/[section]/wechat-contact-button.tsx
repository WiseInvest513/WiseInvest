"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function WechatContactButton({
  platform,
  className,
  children = "联系博主",
}: {
  platform: string;
  className?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[90vw] max-w-sm overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>微信联系二维码</DialogTitle>
          </DialogHeader>
          <div className="bg-gradient-to-b from-slate-50 to-white p-6 text-center dark:from-slate-900 dark:to-slate-900">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <MessageCircle className="h-5 w-5" />
            </div>
            <p className="text-base font-black text-slate-950 dark:text-white">
              添加微信，获取专属开户支持
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              扫码添加好友，发送「
              <span className="font-bold text-slate-700 dark:text-slate-300">{platform}</span>
              」即可获取开户协助。
            </p>
            <div className="mx-auto mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950" style={{ maxWidth: 260 }}>
              <img src="/images/微信图片520.png" alt="微信二维码" className="block h-auto w-full" />
            </div>
            <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
              这张图片是 WiseInvest 微信咨询入口，用于获取开户支持和费率协助。
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
