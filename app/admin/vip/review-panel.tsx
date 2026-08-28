"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ReviewPanelProps = {
  id: string;
};

export function ReviewPanel({ id }: ReviewPanelProps) {
  const router = useRouter();
  const [reviewNote, setReviewNote] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const review = (action: "approve" | "reject" | "needs_review") => {
    setMessage("");
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
      <textarea
        value={reviewNote}
        onChange={(event) => setReviewNote(event.target.value)}
        placeholder="内部审核备注，可选"
        rows={2}
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
          补充
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
