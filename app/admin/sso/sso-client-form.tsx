"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, KeyRound, Loader2, Plus, RotateCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const scopeOptions = [
  { value: "openid", label: "OpenID" },
  { value: "profile", label: "头像/昵称" },
  { value: "email", label: "邮箱" },
  { value: "wise.membership", label: "会员等级" },
];

type SsoClientFormValues = {
  id?: string;
  clientId: string;
  name: string;
  allowedRedirectUris: string;
  allowedScopes: string[];
  enabled: boolean;
  requirePkce: boolean;
};

type SsoClientFormProps = {
  client?: SsoClientFormValues;
};

const emptyClient: SsoClientFormValues = {
  clientId: "",
  name: "",
  allowedRedirectUris: "",
  allowedScopes: ["openid", "profile", "email", "wise.membership"],
  enabled: true,
  requirePkce: true,
};

export function SsoClientForm({ client }: SsoClientFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<SsoClientFormValues>(client ?? emptyClient);
  const [message, setMessage] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [rotateSecret, setRotateSecret] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(client?.id);

  const setValue = <K extends keyof SsoClientFormValues>(key: K, value: SsoClientFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const toggleScope = (scope: string) => {
    setValues((current) => {
      const next = new Set(current.allowedScopes);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      next.add("openid");
      return { ...current, allowedScopes: Array.from(next) };
    });
  };

  const copySecret = async () => {
    if (!clientSecret) return;
    await navigator.clipboard.writeText(clientSecret);
    setMessage("client_secret 已复制。");
  };

  const submit = () => {
    setMessage("");
    setClientSecret("");
    startTransition(async () => {
      const response = await fetch(isEdit ? `/api/admin/sso-clients/${client!.id}` : "/api/admin/sso-clients", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          allowedRedirectUris: values.allowedRedirectUris,
          rotateSecret,
        }),
      });
      const result = (await response.json()) as { ok: boolean; message?: string; clientSecret?: string | null };

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? "保存失败。");
        return;
      }

      if (result.clientSecret) {
        setClientSecret(result.clientSecret);
        setMessage("已生成 client_secret，请现在复制保存；之后后台不会再次显示。");
      }
      if (!isEdit) setValues(emptyClient);
      setRotateSecret(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">{isEdit ? values.name : "新增 SSO Client"}</h2>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
            其他网站使用这个客户端接入 Wise 登录。
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          {values.enabled ? "启用" : "停用"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
          Client ID
          <Input
            value={values.clientId}
            disabled={isEdit}
            onChange={(event) => setValue("clientId", event.target.value)}
            placeholder="wise_etf"
            className="mt-2 rounded-xl border-slate-200 dark:border-slate-700"
          />
        </label>
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
          名称
          <Input
            value={values.name}
            onChange={(event) => setValue("name", event.target.value)}
            placeholder="Wise ETF"
            className="mt-2 rounded-xl border-slate-200 dark:border-slate-700"
          />
        </label>
      </div>

      <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
        回调地址
        <textarea
          value={values.allowedRedirectUris}
          onChange={(event) => setValue("allowedRedirectUris", event.target.value)}
          rows={4}
          placeholder="https://wise-etf.com/api/auth/callback/wise"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
        <span className="mt-2 block text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
          每行一个，协议、域名、端口和路径必须逐字一致。保存后授权页会自动放行，无需修改 CSP。
        </span>
      </label>

      <div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">授权范围</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {scopeOptions.map((scope) => (
            <label key={scope.value} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-slate-800">
              <input
                type="checkbox"
                checked={values.allowedScopes.includes(scope.value)}
                disabled={scope.value === "openid"}
                onChange={() => toggleScope(scope.value)}
                className="h-4 w-4 rounded border-slate-300 text-amber-600"
              />
              {scope.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-slate-800">
          <input
            type="checkbox"
            checked={values.enabled}
            onChange={(event) => setValue("enabled", event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-amber-600"
          />
          启用客户端
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-slate-800">
          <input
            type="checkbox"
            checked={values.requirePkce}
            onChange={(event) => setValue("requirePkce", event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-amber-600"
          />
          要求 PKCE
        </label>
        {isEdit && (
          <label className="flex items-center gap-2 rounded-xl border border-amber-200 px-3 py-2 text-sm font-bold text-amber-800 dark:border-amber-900/50 dark:text-amber-200">
            <input
              type="checkbox"
              checked={rotateSecret}
              onChange={(event) => setRotateSecret(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-amber-600"
            />
            轮换 Secret
          </label>
        )}
      </div>

      {clientSecret && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="mb-2 flex items-center gap-2 font-black text-amber-900 dark:text-amber-100">
            <KeyRound className="h-4 w-4" />
            Client Secret 只显示一次
          </div>
          <code className="block break-all rounded-xl bg-white p-3 text-xs font-bold text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            {clientSecret}
          </code>
          <Button type="button" onClick={copySecret} className="mt-3 h-9 rounded-xl bg-slate-950 text-amber-300 hover:bg-slate-900">
            <Copy className="mr-2 h-4 w-4" />
            复制 Secret
          </Button>
        </div>
      )}

      <Button
        type="button"
        disabled={isPending || !values.clientId || !values.name || !values.allowedRedirectUris}
        onClick={submit}
        className="h-11 w-full rounded-xl bg-slate-950 text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : isEdit && rotateSecret ? (
          <RotateCw className="mr-2 h-4 w-4" />
        ) : isEdit ? (
          <Save className="mr-2 h-4 w-4" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
        {isEdit ? "保存 SSO Client" : "新增 SSO Client"}
      </Button>
      {message && <p className="text-sm font-semibold text-amber-700 dark:text-amber-200">{message}</p>}
    </div>
  );
}
