"use client";

import { useEffect, useState } from "react";
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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ReviewResultDialog({ partnerName, reason, open, onOpenChange }: ReviewResultDialogProps) {
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
