"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, BookOpen, CheckCircle2, KeyRound, Loader2, Plus, RotateCcw, Send, ShieldCheck } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { partnerTypeLabels } from "@/lib/vip/status";
import { getExchangeUidRule, getPartnerIdentifierError, normalizePartnerIdentifier } from "@/lib/vip/partner-identifier";

type PartnerOption = {
  slug: string;
  name: string;
  type: keyof typeof partnerTypeLabels;
  referralCode: string | null;
  identifierLabel: string;
  identifierPlaceholder: string;
  tutorialHref: string | null;
};

type BindingFormProps = {
  partners: PartnerOption[];
  triggerLabel?: string;
  triggerClassName?: string;
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

export function BindingForm({ partners, triggerLabel = "绑定新的合作账户", triggerClassName }: BindingFormProps) {
  const router = useRouter();
  const identifierHintId = useId();
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
  const submitSlug = selectedPartner?.submitSlug ?? "";
  const uidRule = getExchangeUidRule(submitSlug);
  const identifierError = getPartnerIdentifierError(submitSlug, externalIdentifier);
  const showIdentifierError = externalIdentifier.length > 0 && Boolean(identifierError);
  const ready = Boolean(submitSlug && !identifierError && userNote.trim());

  const submit = () => {
    if (!selectedPartner || !ready) return;

    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/account/partner-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerSlug: selectedPartner.submitSlug,
          externalIdentifier: normalizePartnerIdentifier(selectedPartner.submitSlug, externalIdentifier),
          userNote: userNote.trim(),
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
          className={cn(
            "h-12 rounded-xl bg-slate-950 px-5 text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100",
            triggerClassName
          )}
        >
          <Plus className="mr-2 h-4 w-4" />
          {triggerLabel}
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

        <div className="px-6 pt-5">
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p>
              交易所填写的 UID <strong>必须绑定在 Wise 邀请码下</strong>。请勿随意填写与 Wise 无关的 ID，否则封号处理。
            </p>
          </div>
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
                {(selectedPartner.referralCode || selectedPartner.tutorialHref) && (
                  <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedPartner.referralCode && <span className="font-black">Wise 邀请码：{selectedPartner.referralCode}</span>}
                      {selectedPartner.tutorialHref && (
                        <a
                          href={selectedPartner.tutorialHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`查看 ${selectedPartner.name} 注册教程（新窗口打开）`}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 font-bold text-amber-800 transition hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 dark:border-amber-700 dark:bg-slate-950 dark:text-amber-200 dark:hover:bg-amber-950"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          查看注册教程
                        </a>
                      )}
                    </div>
                    {selectedPartner.referralCode && (
                      <span className="mt-1 block text-amber-800/80 dark:text-amber-200/80">
                        邀请码只是合作渠道信息，不等于自动获得 Wise VIP。
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{selectedPartner.helperText}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
              {selectedPartner?.identifierLabel ?? "账户标识"}
              <Input
                type="text"
                inputMode={uidRule ? "numeric" : "text"}
                pattern={uidRule ? `[0-9]{${uidRule.digits}}` : undefined}
                aria-invalid={showIdentifierError}
                aria-describedby={uidRule || showIdentifierError ? identifierHintId : undefined}
                value={externalIdentifier}
                onChange={(event) => setExternalIdentifier(event.target.value)}
                placeholder={uidRule ? `请输入 ${uidRule.digits} 位数字 UID` : selectedPartner?.identifierPlaceholder ?? "填写合作方后台显示的账户标识"}
                className={cn(
                  "mt-2 h-12 rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900",
                  showIdentifierError && "border-rose-400 focus-visible:ring-rose-400 dark:border-rose-500"
                )}
              />
            </label>
            {(uidRule || showIdentifierError) && (
              <p
                id={identifierHintId}
                aria-live="polite"
                className={cn("mt-2 text-xs leading-5", showIdentifierError ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400")}
              >
                {showIdentifierError ? identifierError : `仅支持 ${uidRule?.digits} 位数字，请勿填写字母、符号或空格。`}
              </p>
            )}
          </div>

          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
            补充说明 <span className="text-amber-700 dark:text-amber-300">（必填：注册时间）</span>
            <textarea
              required
              aria-describedby="binding-note-help"
              value={userNote}
              onChange={(event) => setUserNote(event.target.value)}
              placeholder={selectedPartner?.type === "BROKERAGE"
                ? "请填写开户时间、券商名称和开户渠道。例如：2026 年 9 月开户，通过 Wise 渠道。"
                : "请填写账户注册时间和使用的 Wise 邀请码。例如：2026 年 9 月注册，通过 Wise 邀请码注册。"}
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <span id="binding-note-help" className="mt-1 block text-xs font-medium leading-5 text-amber-800 dark:text-amber-200">
              请务必填写账户注册 / 开户时间，作为审核依据；未填写补充说明无法提交。
            </span>
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
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { title: "填写账户资料", text: "UID / 账户标识 + 注册时间", icon: KeyRound },
                { title: "人工核验后生效", text: "绑定本身不会自动升级 VIP", icon: ShieldCheck },
                { title: "可补充重提", text: "被驳回或待补充后可重新提交", icon: RotateCcw },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-xl bg-white px-3 py-3 dark:bg-slate-950">
                    <Icon className="mb-2 h-4 w-4 text-amber-600 dark:text-amber-300" />
                    <p className="font-black text-slate-800 dark:text-slate-100">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.text}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 border-t border-slate-200 pt-3 text-xs font-semibold leading-6 text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Wise 不会要求你提供密码、钱包私钥、Seed Phrase、API Secret、2FA Code 或交易密码。
            </p>
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
