"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";

type PasswordSettingsFormProps = {
  hasPassword: boolean;
};

export function PasswordSettingsForm({ hasPassword }: PasswordSettingsFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const passwordRules = [
    { label: "长度大于 8 位", ok: newPassword.length > 8 },
    { label: "包含大写字母", ok: /[A-Z]/.test(newPassword) },
    { label: "包含小写字母", ok: /[a-z]/.test(newPassword) },
    { label: "包含数字", ok: /\d/.test(newPassword) },
  ];
  const passwordReady = passwordRules.every((rule) => rule.ok);
  const confirmReady = newPassword.length > 0 && newPassword === confirmPassword;
  const currentReady = !hasPassword || currentPassword.length > 0;

  const submit = () => {
    if (!currentReady || !passwordReady || !confirmReady || isPending) return;

    setMessage("");
    setSaved(false);
    startTransition(async () => {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const result = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? "密码修改失败，请稍后再试。");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaved(true);
      setMessage(hasPassword ? "密码已修改。" : "邮箱密码已设置。");
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/50">
          <KeyRound className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-xl font-black">{hasPassword ? "修改邮箱密码" : "设置邮箱密码"}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {hasPassword ? "修改后，下次可以使用新密码登录。" : "设置后，除了 Google / GitHub，也可以用邮箱密码登录。"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {hasPassword && (
          <PasswordInput
            value={currentPassword}
            disabled={isPending}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="当前密码"
            className="h-12 rounded-xl border-slate-200 bg-white text-base dark:border-slate-700 dark:bg-slate-950"
          />
        )}
        <PasswordInput
          value={newPassword}
          disabled={isPending}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="新密码"
          className="h-12 rounded-xl border-slate-200 bg-white text-base dark:border-slate-700 dark:bg-slate-950"
        />
        <PasswordInput
          value={confirmPassword}
          disabled={isPending}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="确认新密码"
          className="h-12 rounded-xl border-slate-200 bg-white text-base dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      <div className="grid gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
        {passwordRules.map((rule) => (
          <span key={rule.label} className={rule.ok ? "font-bold text-emerald-600 dark:text-emerald-300" : ""}>
            {rule.ok ? "✓" : "·"} {rule.label}
          </span>
        ))}
        <span className={confirmReady ? "font-bold text-emerald-600 dark:text-emerald-300" : ""}>
          {confirmReady ? "✓" : "·"} 两次密码一致
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-sm ${saved ? "text-emerald-600 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}>
          {message || "密码只会以哈希形式保存，不存明文。"}
        </p>
        <Button
          type="button"
          className="h-12 rounded-xl bg-slate-950 px-5 text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          disabled={!currentReady || !passwordReady || !confirmReady || isPending}
          onClick={submit}
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          {hasPassword ? "保存新密码" : "设置密码"}
        </Button>
      </div>
    </div>
  );
}
