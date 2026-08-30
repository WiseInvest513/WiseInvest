"use client";

import { useState, useTransition } from "react";
import { ImageIcon, Save, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProfileSettingsFormProps = {
  name: string | null;
  email: string | null;
  image: string | null;
};

export function ProfileSettingsForm({ name, email, image }: ProfileSettingsFormProps) {
  const [displayName, setDisplayName] = useState(name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(image ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fallbackName = email ? email.split("@")[0] : "Wise 用户";
  const previewName = displayName.trim() || fallbackName;
  const previewImage = avatarUrl.trim();

  const submit = () => {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: displayName,
          image: avatarUrl,
        }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      setMessage(data?.message ?? (response.ok ? "个人资料已更新。" : "更新失败，请稍后再试。"));
    });
  };

  return (
    <div>
      <h2 className="text-xl font-black">个人资料</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        昵称会显示在账户中心；Google / GitHub 登录用户的头像会自动同步，也可以手动填写头像图片地址。
      </p>

      <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-start">
        <div className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            {previewImage ? (
              <img src={previewImage} alt={previewName} className="h-full w-full object-cover" />
            ) : (
              <UserRound className="h-6 w-6 text-slate-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-black text-slate-950 dark:text-white">{previewName}</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-500 dark:text-slate-400">{email ?? "未绑定邮箱"}</p>
          </div>
        </div>

        <div className="grid flex-1 gap-3">
          <label className="grid gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
            昵称
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-amber-950/40"
              placeholder="输入你希望显示的名字"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
            头像 URL
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pl-9 text-sm font-semibold text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-amber-950/40"
                placeholder="https://..."
              />
            </div>
          </label>
          <Button type="button" onClick={submit} disabled={isPending} className="h-11 rounded-xl bg-slate-950 text-amber-300 hover:bg-amber-400 hover:text-slate-950">
            <Save className="mr-2 h-4 w-4" />
            {isPending ? "保存中..." : "保存资料"}
          </Button>
          {message && <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{message}</p>}
        </div>
      </div>
    </div>
  );
}
