"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { membershipTierLabels } from "@/lib/vip/status";

type MembershipFormProps = {
  userId: string;
  currentTier: keyof typeof membershipTierLabels;
};

export function MembershipForm({ userId, currentTier }: MembershipFormProps) {
  const router = useRouter();
  const [membershipTier, setMembershipTier] = useState(currentTier);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${userId}/membership`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipTier, note }),
      });
      const result = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? "会员状态更新失败。");
        return;
      }

      setNote("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
        会员等级
        <select
          value={membershipTier}
          onChange={(event) => setMembershipTier(event.target.value as keyof typeof membershipTierLabels)}
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
          {Object.entries(membershipTierLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="内部备注，可选"
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />
      <Button
        type="button"
        disabled={isPending}
        onClick={submit}
        className="h-12 w-full rounded-xl bg-slate-950 text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
      >
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        保存会员状态
      </Button>
      {message && <p className="text-sm text-rose-600 dark:text-rose-300">{message}</p>}
    </div>
  );
}
