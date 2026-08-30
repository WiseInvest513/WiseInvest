"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, Loader2, Plus, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { partnerTypeLabels } from "@/lib/vip/status";

type PartnerOption = {
  slug: string;
  name: string;
  type: keyof typeof partnerTypeLabels;
  referralCode: string | null;
  identifierLabel: string;
  identifierPlaceholder: string;
};

type BindingFormProps = {
  partners: PartnerOption[];
};

type BindingOption = PartnerOption & {
  value: string;
  submitSlug: string;
  optionLabel: string;
  helperText: string;
};

function buildBindingOptions(partners: PartnerOption[]): BindingOption[] {
  const brokeragePartner = partners.find((partner) => partner.type === "BROKERAGE");
  const brokerageOption: BindingOption[] = brokeragePartner
    ? [
        {
          ...brokeragePartner,
          value: "brokerage-account",
          submitSlug: brokeragePartner.slug,
          name: "券商账户",
          referralCode: null,
          optionLabel: "券商账户 · 统一填写券商 ID",
          helperText: "券商统一提交账户 ID 或开户链接识别信息，补充说明里写清银河、复星、致富、腾达、BBAE 等具体渠道。",
          identifierLabel: "券商 ID / 账户标识",
          identifierPlaceholder: "填写券商账户 ID、开户链接识别信息或开户链接手机号后四位",
        },
      ]
    : [];

  const exchangeOptions = partners
    .filter((partner) => partner.type === "EXCHANGE")
    .map((partner) => ({
      ...partner,
      value: partner.slug,
      submitSlug: partner.slug,
      optionLabel: `${partner.name} · 交易所`,
      helperText: "交易所需要选择具体平台，并填写该交易所后台显示的 UID，方便后台核验邀请关系。",
    }));

  return [...brokerageOption, ...exchangeOptions];
}

export function BindingForm({ partners }: BindingFormProps) {
  const router = useRouter();
  const bindingOptions = useMemo(() => buildBindingOptions(partners), [partners]);
  const brokerageOptions = bindingOptions.filter((partner) => partner.type === "BROKERAGE");
  const exchangeOptions = bindingOptions.filter((partner) => partner.type === "EXCHANGE");
  const [open, setOpen] = useState(false);
  const [partnerSlug, setPartnerSlug] = useState(bindingOptions[0]?.value ?? "");
  const [externalIdentifier, setExternalIdentifier] = useState("");
  const [userNote, setUserNote] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [resubmitted, setResubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const currentPartnerSlug = partnerSlug || bindingOptions[0]?.value || "";

  const selectedPartner = useMemo(
    () => bindingOptions.find((partner) => partner.value === currentPartnerSlug) ?? bindingOptions[0],
    [bindingOptions, currentPartnerSlug]
  );
  const ready = Boolean(selectedPartner?.submitSlug && externalIdentifier.trim().length >= 3);

  const submit = () => {
    if (!selectedPartner || !ready) return;

    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/account/partner-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerSlug: selectedPartner.submitSlug,
          externalIdentifier,
          userNote,
        }),
      });
      const result = (await response.json()) as { ok: boolean; message?: string; resubmitted?: boolean };

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? "提交失败，请稍后再试。");
        return;
      }

      setExternalIdentifier("");
      setUserNote("");
      setResubmitted(Boolean(result.resubmitted));
      setSubmitted(true);
      setMessage("");
      router.refresh();
    });
  };

  if (bindingOptions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm leading-7 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        当前还没有可提交核验的券商账户或交易所。配置数据库后运行 `npm run vip:seed` 初始化默认合作方。
      </div>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setSubmitted(false);
          setResubmitted(false);
          setMessage("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          className="h-12 rounded-xl bg-slate-950 px-5 text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
        >
          <Plus className="mr-2 h-4 w-4" />
          绑定新的合作账户
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto rounded-2xl border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              绑定合作账户
            </DialogTitle>
            <DialogDescription className="leading-6 text-slate-500 dark:text-slate-400">
              提交必要账户标识后，Wise 会核验账户归属和合作关系；绑定本身不会自动获得 Wise VIP。
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid gap-3 px-6 pt-5 sm:grid-cols-3">
          {[
            { title: "提交资料", icon: Send },
            { title: "资格审核", icon: Clock3 },
            { title: "完成绑定", icon: CheckCircle2 },
          ].map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                <Icon className={`h-4 w-4 ${index === 0 ? "text-amber-500" : "text-slate-400"}`} />
                {step.title}
              </div>
            );
          })}
        </div>

        {submitted ? (
          <div className="px-6 py-8">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
              <CheckCircle2 className="mb-4 h-7 w-7" />
              <h3 className="text-xl font-black">{resubmitted ? "已重新提交审核" : "已提交审核"}</h3>
              <p className="mt-3 text-sm leading-7">
                {resubmitted
                  ? "我们已收到你的补充信息，会重新核验这条 Wise Partner Account。审核完成后，账户状态和会员等级会自动更新。"
                  : "我们正在核验你的 Wise Partner Account 资格。审核完成后，账户状态和会员等级会自动更新。"}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 h-11 w-full rounded-xl bg-slate-950 text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              我知道了
            </Button>
          </div>
        ) : (
        <div className="space-y-4 px-6 py-5">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
            选择账户类型 / 平台
            <select
              value={currentPartnerSlug}
              onChange={(event) => setPartnerSlug(event.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {brokerageOptions.length > 0 && (
                <optgroup label="券商">
                  {brokerageOptions.map((partner) => (
                    <option key={partner.value} value={partner.value}>
                      {partner.optionLabel}
                    </option>
                  ))}
                </optgroup>
              )}
              {exchangeOptions.length > 0 && (
                <optgroup label="交易所">
                  {exchangeOptions.map((partner) => (
                    <option key={partner.value} value={partner.value}>
                      {partner.optionLabel}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>

          {selectedPartner && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950 dark:text-white">{selectedPartner.name}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                    {selectedPartner.type === "BROKERAGE" ? "券商账户统一核验" : partnerTypeLabels[selectedPartner.type]}
                  </p>
                </div>
                {selectedPartner.referralCode && (
                  <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                    <span className="font-black">Wise 邀请码：{selectedPartner.referralCode}</span>
                    <span className="block text-amber-800/80 dark:text-amber-200/80">
                      邀请码只是合作渠道信息，不等于自动获得 Wise VIP。
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{selectedPartner.helperText}</p>
            </div>
          )}

          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
            {selectedPartner?.identifierLabel ?? "账户标识"}
            <Input
              value={externalIdentifier}
              onChange={(event) => setExternalIdentifier(event.target.value)}
              placeholder={selectedPartner?.identifierPlaceholder ?? "填写合作方后台显示的账户标识"}
              className="mt-2 h-12 rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            />
          </label>

          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
            补充说明
            <textarea
              value={userNote}
              onChange={(event) => setUserNote(event.target.value)}
              placeholder="券商账户请填写券商名称、开户渠道或开户时间；交易所账户可填写注册时间、使用的 Wise 邀请渠道。"
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100">
            <div className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                券商账户统一填写券商 ID；交易所账户需要选择具体平台并提交对应 UID。提交后 Wise 会核验账户归属及合作关系。
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            这里只需要填写 UID / Account ID 等必要账户标识。Wise 不会要求你提供密码、钱包私钥、Seed Phrase、API Secret、2FA Code 或交易密码。
          </div>
        </div>
        )}

        {!submitted && (
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 dark:border-slate-800 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-11 rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
          >
            取消
          </Button>
          <Button
            type="button"
            disabled={!ready || isPending}
            onClick={submit}
            className="h-11 rounded-xl bg-slate-950 px-5 text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            提交审核
          </Button>
        </div>
        )}

        {message && <p className="px-6 pb-5 text-sm text-slate-600 dark:text-slate-300">{message}</p>}
      </DialogContent>
    </Dialog>
  );
}
