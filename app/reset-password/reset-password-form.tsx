"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

type ResetPasswordFormProps = {
  callbackUrl: string;
  databaseConfigured: boolean;
};

export function ResetPasswordForm({ callbackUrl, databaseConfigured }: ResetPasswordFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "reset">("email");
  const [message, setMessage] = useState("");
  const [devCode, setDevCode] = useState("");
  const [isPending, startTransition] = useTransition();

  const emailReady = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const passwordRules = [
    { label: "长度大于 8 位", ok: password.length > 8 },
    { label: "包含大写字母", ok: /[A-Z]/.test(password) },
    { label: "包含小写字母", ok: /[a-z]/.test(password) },
    { label: "包含数字", ok: /\d/.test(password) },
  ];
  const passwordReady = passwordRules.every((rule) => rule.ok);
  const codeReady = /^\d{6}$/.test(code.trim());

  const requestOtp = () => {
    if (!databaseConfigured) return;
    if (!emailReady) {
      setMessage("请输入有效邮箱地址。");
      return;
    }

    setMessage("");
    setDevCode("");
    startTransition(async () => {
      const response = await fetch("/api/auth/email-otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as { ok: boolean; message?: string; devCode?: string };

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? "验证码发送失败，请稍后再试。");
        return;
      }

      setStep("reset");
      setDevCode(result.devCode ?? "");
      setMessage("验证码已发送，请查看邮箱。");
    });
  };

  const resetPassword = () => {
    if (!emailReady || !codeReady || !passwordReady || !databaseConfigured) return;

    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          password,
        }),
      });
      const result = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? "密码重设失败，请稍后再试。");
        return;
      }

      const loginResult = await signIn("password", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (loginResult?.error) {
        router.push("/login");
        router.refresh();
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
        <Input
          type="email"
          value={email}
          disabled={!databaseConfigured || step === "reset" || isPending}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="输入注册邮箱"
          className="h-12 rounded-xl border-slate-200 bg-white text-base dark:border-slate-700 dark:bg-slate-950"
        />

        {step === "email" ? (
          <Button
            type="button"
            className="h-12 w-full rounded-xl bg-slate-950 text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            disabled={!emailReady || !databaseConfigured || isPending}
            onClick={requestOtp}
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            接收验证码
          </Button>
        ) : (
          <div className="space-y-3">
            <Input
              inputMode="numeric"
              value={code}
              disabled={isPending}
              onChange={(event) => setCode(event.target.value)}
              placeholder="输入 6 位验证码"
              className="h-12 rounded-xl border-slate-200 bg-white text-base tracking-[0.3em] dark:border-slate-700 dark:bg-slate-950"
            />
            <PasswordInput
              value={password}
              disabled={isPending}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="设置新密码"
              className="h-12 rounded-xl border-slate-200 bg-white text-base dark:border-slate-700 dark:bg-slate-950"
            />
            <div className="grid gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
              {passwordRules.map((rule) => (
                <span key={rule.label} className={rule.ok ? "font-bold text-emerald-600 dark:text-emerald-300" : ""}>
                  {rule.ok ? "✓" : "·"} {rule.label}
                </span>
              ))}
            </div>
            <Button
              type="button"
              className="h-12 w-full rounded-xl bg-slate-950 text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              disabled={!codeReady || !passwordReady || isPending}
              onClick={resetPassword}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              重设并登录
            </Button>
          </div>
        )}
      </div>

      {!databaseConfigured && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          当前环境还没有配置数据库，无法重设真实账户密码。
        </p>
      )}
      {message && <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>}
      {devCode && (
        <p className="rounded-xl bg-slate-100 px-4 py-3 font-mono text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
          本地开发验证码：{devCode}
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        想起密码了？
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="ml-1 font-black text-amber-700 hover:text-amber-600 dark:text-amber-300">
          返回登录
        </Link>
      </div>
    </div>
  );
}
