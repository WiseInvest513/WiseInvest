"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ReviewResultDialogProps = {
  partnerName: string;
  reason: string | null;
  isExchange?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ReviewResultDialog({ partnerName, reason, isExchange = false, open, onOpenChange }: ReviewResultDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const resolvedOpen = open ?? internalOpen;

  useEffect(() => {
    if (!isControlled) setInternalOpen(true);
  }, [isControlled]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  return (
    <Dialog open={resolvedOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-rose-100 bg-rose-50/80 px-6 py-5 dark:border-rose-900/50 dark:bg-rose-950/30">
          <DialogHeader>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-sm dark:bg-slate-900 dark:text-rose-300">
              <XCircle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-950 dark:text-white">VIP 审核已驳回</DialogTitle>
            <DialogDescription className="leading-6 text-slate-500 dark:text-slate-400">
              {partnerName} 的合作账户核验没有通过。请根据下面原因修改后重新提交。
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="rounded-2xl border border-rose-100 bg-white p-4 text-sm leading-7 text-slate-700 shadow-sm dark:border-rose-900/40 dark:bg-slate-900 dark:text-slate-200">
            <div className="mb-2 flex items-center gap-2 font-black text-rose-700 dark:text-rose-300">
              <AlertTriangle className="h-4 w-4" />
              驳回原因
            </div>
            <p>{reason || "暂未填写具体原因，请补充账户信息后重新提交。"}</p>
          </div>
          {isExchange && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
              <p className="text-sm font-black text-slate-950 dark:text-white">可能是邀请码绑定关系不正确？</p>
              <p className="mt-1 text-xs leading-6 text-slate-600 dark:text-slate-300">
                如果账户已经绑定其他邀请人，先查看不同交易所的处理方式，再决定是否重新提交。
              </p>
              <Button asChild variant="outline" className="mt-3 h-10 w-full rounded-xl border-amber-300 bg-white text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-300">
                <Link href="/guide/exchange-referral">
                  查看邀请码绑定异常解决方法
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
          <Button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="h-11 w-full rounded-xl bg-slate-950 text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            我知道了，去重新提交
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
