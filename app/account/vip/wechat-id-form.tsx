"use client";

import { useEffect, useState, useTransition } from "react";
import { Gift, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type WechatIdFormProps = {
  initialWechatId: string | null;
  autoPrompt?: boolean;
};

export function WechatIdForm({ initialWechatId, autoPrompt = true }: WechatIdFormProps) {
  const [wechatId, setWechatId] = useState(initialWechatId ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(autoPrompt && !initialWechatId);
  const [saved, setSaved] = useState(Boolean(initialWechatId));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (autoPrompt && !saved) setOpen(true);
  }, [autoPrompt, saved]);

  const submit = ({ requireValue = false, closeOnSuccess = false } = {}) => {
    setMessage(null);
    if (requireValue && !wechatId.trim()) {
      setMessage("请先填写常用微信号。");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/account/wechat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wechatId }),
      });
      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      setMessage(data?.message ?? (response.ok ? "微信号已保存。" : "保存失败，请稍后再试。"));
      if (response.ok && wechatId.trim()) {
        setSaved(true);
        if (closeOnSuccess) setOpen(false);
      } else if (response.ok) {
        setSaved(false);
      }
    });
  };

  return (
    <>
      <Dialog open={open && !saved} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-3xl border-amber-200 bg-white p-0 dark:border-amber-900/50 dark:bg-slate-950">
          <div className="border-b border-amber-100 bg-amber-50/80 px-6 py-5 dark:border-amber-900/40 dark:bg-amber-950/30">
            <DialogHeader>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-sm dark:bg-slate-900 dark:text-amber-200">
                <Gift className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-black text-slate-950 dark:text-white">完善 VIP 联系信息</DialogTitle>
              <DialogDescription className="leading-6 text-slate-500 dark:text-slate-400">
                你是 Wise VIP，请填写常用微信号，方便我们与你联系。
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-4 px-6 py-5">
            <label className="grid gap-2 text-sm font-black text-slate-700 dark:text-slate-200">
              我的微信号
              <input
                value={wechatId}
                onChange={(event) => setWechatId(event.target.value)}
                maxLength={64}
                autoComplete="off"
                autoFocus
                className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-amber-950/40"
                placeholder="请输入常用微信号"
              />
            </label>
            <p className="text-xs leading-6 text-slate-400">
              微信号仅用于 VIP 服务联系，以及未来发放周边礼品前确认收件信息，不会公开展示。
            </p>
            <Button
              type="button"
              onClick={() => submit({ requireValue: true, closeOnSuccess: true })}
              disabled={isPending}
              className="h-11 w-full rounded-xl bg-slate-950 text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              <Save className="mr-2 h-4 w-4" />
              {isPending ? "保存中..." : "保存微信号"}
            </Button>
            {message && <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{message}</p>}
          </div>
        </DialogContent>
      </Dialog>

      <section className="rounded-3xl border border-amber-200 bg-[linear-gradient(135deg,#fffbeb_0%,#ffffff_58%,#fff7ed_100%)] p-6 shadow-sm dark:border-amber-900/50 dark:bg-[linear-gradient(135deg,#1c1405_0%,#0f172a_58%,#111827_100%)] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200">
              <Gift className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-2xl font-black">完善 VIP 联系方式</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              你现在是 Wise VIP 用户，请填写常用微信号。后续 VIP 服务联系，以及未来发放周边礼品时，我们会先通过微信与你确认收件信息。
            </p>
            <p className="mt-2 text-xs leading-6 text-slate-400">
              当前只保存微信号，不收集地址，也不会在网站公开展示。你可以随时修改或清除。
            </p>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/80">
            <label className="grid gap-2 text-sm font-black text-slate-700 dark:text-slate-200">
              我的微信号
              <input
                value={wechatId}
                onChange={(event) => setWechatId(event.target.value)}
                maxLength={64}
                autoComplete="off"
                className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-amber-950/40"
                placeholder="请输入常用微信号"
              />
            </label>
            <Button
              type="button"
              onClick={() => submit()}
              disabled={isPending}
              className="mt-3 h-11 w-full rounded-xl bg-slate-950 text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              <Save className="mr-2 h-4 w-4" />
              {isPending ? "保存中..." : saved ? "更新微信号" : "保存微信号"}
            </Button>
            {message && <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">{message}</p>}
          </div>
        </div>
      </section>
    </>
  );
}
