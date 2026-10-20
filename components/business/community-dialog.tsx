"use client";
import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function CommunityDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [channel, setChannel] = useState<"telegram" | "wechat">("telegram");
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm rounded-2xl">
      <DialogTitle className="text-xl">加入 WiseInvest 社群</DialogTitle>
      <DialogDescription>选择微信群或 Telegram 群，与大家交流。</DialogDescription>
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {(["telegram", "wechat"] as const).map(item => <button key={item} type="button" aria-pressed={channel === item} onClick={() => setChannel(item)} className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${channel === item ? "bg-white text-amber-800 shadow-sm dark:bg-slate-700 dark:text-amber-200" : "text-slate-500 dark:text-slate-300"}`}>{item === "telegram" ? "Telegram 群" : "微信群"}</button>)}
      </div>
      {channel === "telegram" ? <div className="py-6 text-center"><p className="mb-5 text-sm text-slate-500 dark:text-slate-400">加入 WiseInvest 官方 Telegram 群</p><a href="https://t.me/WiseInvest513Chat" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">加入 Telegram 群 ↗</a></div> : <div className="text-center"><Image width={288} height={288} unoptimized src="/群聊.png" alt="WiseInvest 微信群二维码" className="mx-auto max-h-72 max-w-full rounded-xl object-contain"/><p className="mt-3 text-sm text-slate-500 dark:text-slate-400">打开微信扫码加入</p></div>}
    </DialogContent>
  </Dialog>;
}
