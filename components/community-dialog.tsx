"use client";

import { MessageCircle, Send, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSafeExternalUrl } from "@/lib/security/external-links";
import { useState } from "react";

export function CommunityDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [channel, setChannel] = useState<"telegram" | "wechat">("telegram");

  const isTelegram = channel === "telegram";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-md overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">
            WiseInvest 官方社群
          </p>
          <DialogTitle className="text-lg font-black text-slate-950 dark:text-white">
            选择你的加入方式
          </DialogTitle>
          <DialogDescription>
            左侧是 Telegram，右侧是微信群；切换后可直接进入对应社群。
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setChannel("telegram")}
              className={`rounded-xl px-3 py-2.5 text-xs font-black transition-all ${isTelegram
                ? "bg-slate-950 text-amber-300 shadow dark:bg-amber-400 dark:text-slate-950"
                : "bg-white text-slate-600 hover:bg-white/70 dark:bg-slate-950 dark:text-slate-300"}`}
            >
              Telegram
            </button>
            <button
              type="button"
              onClick={() => setChannel("wechat")}
              className={`rounded-xl px-3 py-2.5 text-xs font-black transition-all ${!isTelegram
                ? "bg-slate-950 text-amber-300 shadow dark:bg-amber-400 dark:text-slate-950"
                : "bg-white text-slate-600 hover:bg-white/70 dark:bg-slate-950 dark:text-slate-300"}`}
            >
              微信群
            </button>
          </div>

          {isTelegram ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm font-black text-slate-900 dark:text-white">进入 Telegram 群</p>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                适合关注行情提醒、文章更新、学习路径和实时交流。
              </p>
              <a
                href={getSafeExternalUrl("https://t.me/WiseInvest513Chat")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-amber-300 transition-colors hover:bg-amber-400 hover:text-slate-950 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
              >
                <Send className="h-4 w-4" />
                进入 Telegram 群
              </a>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm font-black text-slate-900 dark:text-white">扫码加入微信群</p>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
                <img src="/群聊.png" alt="Wise Invest 微信群聊二维码" className="block h-auto w-full rounded-lg" />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                微信群用于更深入的反馈和活动通知；如果二维码临时变化，可先进 Telegram 继续联系。
              </p>
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-inner dark:border-slate-800 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-amber-700 dark:hover:bg-amber-900/20"
            >
              <X className="h-4 w-4" />
              关闭
            </button>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs font-semibold leading-5 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" />
            有开户、入金、用卡、订阅或教程更新问题，都可以进群反馈。
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
