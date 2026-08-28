"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { partnerTypeLabels } from "@/lib/vip/status";

type PartnerFormValues = {
  id?: string;
  slug: string;
  name: string;
  type: keyof typeof partnerTypeLabels;
  referralUrl: string;
  referralCode: string;
  vipEligible: boolean;
  vipPlusEligible: boolean;
  vipPlusVolumeThreshold: string;
  enabled: boolean;
};

type PartnerFormProps = {
  partner?: PartnerFormValues;
};

const emptyPartner: PartnerFormValues = {
  slug: "",
  name: "",
  type: "EXCHANGE",
  referralUrl: "",
  referralCode: "",
  vipEligible: true,
  vipPlusEligible: false,
  vipPlusVolumeThreshold: "",
  enabled: true,
};

export function PartnerForm({ partner }: PartnerFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<PartnerFormValues>(partner ?? emptyPartner);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(partner?.id);

  const setValue = <K extends keyof PartnerFormValues>(key: K, value: PartnerFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const submit = () => {
    setMessage("");
    startTransition(async () => {
      const response = await fetch(isEdit ? `/api/admin/partners/${partner!.id}` : "/api/admin/partners", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? "保存失败。");
        return;
      }

      if (!isEdit) setValues(emptyPartner);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black">{isEdit ? values.name : "新增合作方"}</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          {values.enabled ? "启用" : "停用"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
          Slug
          <Input
            value={values.slug}
            disabled={isEdit}
            onChange={(event) => setValue("slug", event.target.value)}
            placeholder="binance"
            className="mt-2 rounded-xl border-slate-200 dark:border-slate-700"
          />
        </label>
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
          名称
          <Input
            value={values.name}
            onChange={(event) => setValue("name", event.target.value)}
            placeholder="Binance 币安"
            className="mt-2 rounded-xl border-slate-200 dark:border-slate-700"
          />
        </label>
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
          类型
          <select
            value={values.type}
            onChange={(event) => setValue("type", event.target.value as PartnerFormValues["type"])}
            className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            {Object.entries(partnerTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
          邀请码
          <Input
            value={values.referralCode}
            onChange={(event) => setValue("referralCode", event.target.value)}
            placeholder="可选"
            className="mt-2 rounded-xl border-slate-200 dark:border-slate-700"
          />
        </label>
        <label className="sm:col-span-2 text-sm font-bold text-slate-700 dark:text-slate-200">
          邀请链接
          <Input
            value={values.referralUrl}
            onChange={(event) => setValue("referralUrl", event.target.value)}
            placeholder="https://..."
            className="mt-2 rounded-xl border-slate-200 dark:border-slate-700"
          />
        </label>
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
          SVIP 成交量阈值
          <Input
            value={values.vipPlusVolumeThreshold}
            onChange={(event) => setValue("vipPlusVolumeThreshold", event.target.value)}
            placeholder="50000"
            className="mt-2 rounded-xl border-slate-200 dark:border-slate-700"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["vipEligible", "可授予 VIP"],
          ["vipPlusEligible", "可授予 SVIP"],
          ["enabled", "启用合作方"],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-slate-800">
            <input
              type="checkbox"
              checked={Boolean(values[key as keyof PartnerFormValues])}
              onChange={(event) => setValue(key as keyof PartnerFormValues, event.target.checked as never)}
              className="h-4 w-4 rounded border-slate-300 text-amber-600"
            />
            {label}
          </label>
        ))}
      </div>

      <Button
        type="button"
        disabled={isPending || !values.slug || !values.name}
        onClick={submit}
        className="h-11 w-full rounded-xl bg-slate-950 text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
      >
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isEdit ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
        {isEdit ? "保存合作方" : "新增合作方"}
      </Button>
      {message && <p className="text-sm text-rose-600 dark:text-rose-300">{message}</p>}
    </div>
  );
}
