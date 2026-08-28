"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

type LoginFormProps = {
  callbackUrl: string;
  databaseConfigured: boolean;
  googleEnabled: boolean;
  githubEnabled: boolean;
};

export function LoginForm({
  callbackUrl,
  databaseConfigured,
  googleEnabled,
  githubEnabled,
}: LoginFormProps) {
  const router = useRouter();
  const [passwordEmail, setPasswordEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const passwordEmailReady = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passwordEmail.trim()), [passwordEmail]);
  const effectiveGoogleEnabled = databaseConfigured && googleEnabled;
  const effectiveGithubEnabled = databaseConfigured && githubEnabled;

  const handleOAuth = (provider: "google" | "github") => {
    startTransition(() => {
      void signIn(provider, { callbackUrl });
    });
  };

  const loginWithPassword = () => {
    if (!passwordEmailReady || password.length === 0 || !databaseConfigured) return;

    setMessage("");
    startTransition(async () => {
      const result = await signIn("password", {
        email: passwordEmail,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setMessage("邮箱或密码不正确。没有账户时，请先完成邮箱验证码注册。");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          disabled={!effectiveGoogleEnabled || isPending}
          onClick={() => handleOAuth("google")}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <img src="/images/auth/google.jpg" alt="" className="mr-2 h-5 w-5 rounded-md object-cover" />
          )}
          Google 登录
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          disabled={!effectiveGithubEnabled || isPending}
          onClick={() => handleOAuth("github")}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <img src="/images/auth/github.jpg" alt="" className="mr-2 h-5 w-5 rounded-md object-cover" />
          )}
          GitHub 登录
        </Button>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-start justify-between gap-3">
          <div>
          <p className="text-sm font-black text-slate-950 dark:text-white">邮箱 / 密码登录</p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">已注册邮箱账户可以直接登录。</p>
          </div>
          <Link
            href={`/reset-password?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="shrink-0 text-xs font-black text-amber-700 hover:text-amber-600 dark:text-amber-300"
          >
            忘记密码
          </Link>
        </div>
        <Input
          type="email"
          value={passwordEmail}
          disabled={!databaseConfigured || isPending}
          onChange={(event) => setPasswordEmail(event.target.value)}
          placeholder="邮箱"
          className="h-12 rounded-xl border-slate-200 bg-white text-base dark:border-slate-700 dark:bg-slate-950"
        />
        <PasswordInput
          value={password}
          disabled={!databaseConfigured || isPending}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="密码"
          className="h-12 rounded-xl border-slate-200 bg-white text-base dark:border-slate-700 dark:bg-slate-950"
        />
        <Button
          type="button"
          className="h-12 w-full rounded-xl bg-slate-950 text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          disabled={!passwordEmailReady || !password || !databaseConfigured || isPending}
          onClick={loginWithPassword}
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-2 h-4 w-4" />}
          登录账户
        </Button>
      </div>

      {!databaseConfigured && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          当前环境还没有配置数据库，OAuth 和邮箱密码登录都需要 `DATABASE_URL` 后才能创建真实 Wise ID。
        </p>
      )}
      {!effectiveGoogleEnabled || !effectiveGithubEnabled ? (
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          未配置数据库或对应 OAuth 密钥时，第三方登录会自动禁用，不影响页面构建。
        </p>
      ) : null}
      {message && <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>}

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        还没有 Wise 账户？
        <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="ml-1 font-black text-amber-700 hover:text-amber-600 dark:text-amber-300">
          去注册
        </Link>
      </div>
    </div>
  );
}
