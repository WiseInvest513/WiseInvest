"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MessageSquareWarning, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ReviewPanelProps = {
  id: string;
  defaultNote?: string | null;
};

export function ReviewPanel({ id, defaultNote }: ReviewPanelProps) {
  const router = useRouter();
  const [reviewNote, setReviewNote] = useState(defaultNote ?? "");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const review = (action: "approve" | "reject" | "needs_review") => {
    setMessage("");
    if ((action === "reject" || action === "needs_review") && !reviewNote.trim()) {
      setMessage(action === "reject" ? "请先填写驳回原因，用户端会看到这条说明。" : "请先填写需要用户补充什么资料。");
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/admin/partner-accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reviewNote,
        }),
      });
      const result = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? "审核操作失败。");
        return;
      }

      setReviewNote("");
      router.refresh();
    });
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100">
        <div className="flex gap-2">
          <MessageSquareWarning className="mt-0.5 h-4 w-4 shrink-0" />
          <p>这里填写的是给用户看的审核说明。拒绝或要求补充时必须写清原因；通过时可不填。</p>
        </div>
      </div>
      <textarea
        value={reviewNote}
        onChange={(event) => setReviewNote(event.target.value)}
        placeholder="例如：未查到该 UID 的 Wise 邀请关系，请确认是否使用 Wise 链接注册；或补充开户时间 / 注册邮箱后重新提交。"
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />
      <div className="grid gap-2 sm:grid-cols-3">
        <Button
          type="button"
          disabled={isPending}
          onClick={() => review("approve")}
          className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          通过
        </Button>
        <Button
          type="button"
          disabled={isPending}
          onClick={() => review("needs_review")}
          variant="outline"
          className="rounded-xl border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          要求补充
        </Button>
        <Button
          type="button"
          disabled={isPending}
          onClick={() => review("reject")}
          variant="outline"
          className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
        >
          <XCircle className="mr-2 h-4 w-4" />
          拒绝
        </Button>
      </div>
      {message && <p className="text-sm text-rose-600 dark:text-rose-300">{message}</p>}
    </div>
  );
}
