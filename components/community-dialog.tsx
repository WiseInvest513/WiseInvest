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

export function CommunityDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-md overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">
            WiseInvest 社区
          </p>
          <DialogTitle className="text-lg font-black text-slate-950 dark:text-white">
            加入 Wise Invest 群聊
          </DialogTitle>
          <DialogDescription>
            可以扫码加入微信群，也可以进入 Telegram 群交流。
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-inner dark:border-slate-800 dark:bg-slate-950">
            <img src="/群聊.png" alt="Wise Invest 微信群聊二维码" className="block h-auto w-full rounded-xl" />
          </div>

          <p className="mt-3 text-center text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
            微信二维码是社群活码；如果二维码临时变化，可以通过 Telegram 或站内其他联系方式找到 Wise。
          </p>

          <div className="mt-5 grid gap-2">
            <a
              href={getSafeExternalUrl("https://t.me/WiseInvest513Chat")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-amber-300 transition-colors hover:bg-amber-400 hover:text-slate-950 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
            >
              <Send className="h-4 w-4" />
              进入 Telegram 群
            </a>
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
