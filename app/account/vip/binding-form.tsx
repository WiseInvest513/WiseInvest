"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, BookOpen, CheckCircle2, Loader2, Plus, Send, ShieldCheck } from "lucide-react";
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
import { PlatformPicker } from "./platform-picker";
import { getBindingNoteError, OTHER_BINDING_SLUG } from "@/lib/vip/binding-platforms";
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
  initialOpen?: boolean;
  initialPartnerSlug?: string;
};

export function BindingForm({ partners, triggerLabel = "绑定新的合作账户", triggerClassName, initialOpen = false, initialPartnerSlug = "" }: BindingFormProps) {
  const router = useRouter();
  const identifierHintId = useId();
  const noteHintId = useId();
  const [platformPickerOpen, setPlatformPickerOpen] = useState(false);
  const [open, setOpen] = useState(initialOpen);
  const [partnerSlug, setPartnerSlug] = useState(() => partners.some(partner => partner.slug === initialPartnerSlug) ? initialPartnerSlug : "");
  const [externalIdentifier, setExternalIdentifier] = useState("");
  const [platformName, setPlatformName] = useState("");
  const [userNote, setUserNote] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [resubmitted, setResubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const selectedPartner = partners.find((partner) => partner.slug === partnerSlug);
  const submitSlug = selectedPartner?.slug ?? "";
  const isOther = submitSlug === OTHER_BINDING_SLUG;
  const uidRule = getExchangeUidRule(submitSlug);
  const identifierError = getPartnerIdentifierError(submitSlug, externalIdentifier);
  const showIdentifierError = externalIdentifier.length > 0 && Boolean(identifierError);
  const ready = Boolean(submitSlug && !identifierError && !getBindingNoteError(submitSlug, userNote, platformName));

  const submit = () => {
    if (!selectedPartner || !ready || isPending) return;

    setMessage("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/account/partner-accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partnerSlug: selectedPartner.slug,
            externalIdentifier: normalizePartnerIdentifier(selectedPartner.slug, externalIdentifier),
            userNote: userNote.trim(),
            platformName: isOther ? platformName.trim() : undefined,
          }),
        });
        const result = (await response.json()) as { ok: boolean; message?: string; resubmitted?: boolean };

        if (!response.ok || !result.ok) {
          setMessage(result.message ?? "提交失败，请稍后再试。");
          return;
        }

        setExternalIdentifier("");
        setUserNote("");
        setPlatformName("");
        setResubmitted(Boolean(result.resubmitted));
        setSubmitted(true);
        setMessage("");
        router.refresh();
      } catch {
        setMessage("提交失败，请检查网络后重试，已填写的资料会保留。");
      }
    });
  };

  if (partners.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm leading-7 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        暂时没有开放核验的平台，请稍后再试或联系 Wise。
      </div>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setPlatformPickerOpen(false);
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
      <DialogContent onEscapeKeyDown={(event) => { if (platformPickerOpen) event.preventDefault(); }} className="flex max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-950">
        <div className="shrink-0 border-b border-slate-200 px-5 py-5 pr-12 dark:border-slate-800 sm:px-6">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              绑定合作账户
            </DialogTitle>
            <DialogDescription className="leading-6 text-slate-500 dark:text-slate-400">
              提交必要账户标识后，Wise 会核验账户归属和合作关系；绑定本身不会自动获得 Wise VIP。
            </DialogDescription>
          </DialogHeader>
        </div>

        {submitted ? (
          <div className="overflow-y-auto px-6 py-8">
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
        <div className="min-h-0 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <PlatformPicker onExpandedChange={setPlatformPickerOpen} options={partners} value={partnerSlug} disabled={isPending} onChange={(slug) => {
            setPartnerSlug(slug);
            setExternalIdentifier("");
            setMessage("");
          }} />

          {isOther && <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
            平台 / 产品名称 <span className="font-medium text-amber-700 dark:text-amber-300">（必填）</span>
            <Input required maxLength={60} disabled={isPending} value={platformName} onChange={(event) => setPlatformName(event.target.value)} placeholder="填写完整名称，便于人工核验" className="mt-2 h-12 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900" />
          </label>}

          {selectedPartner && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950 dark:text-white">{selectedPartner.name}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                    {selectedPartner.type === "BROKERAGE" ? "券商账户核验" : partnerTypeLabels[selectedPartner.type]}
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
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{isOther
                ? "请写明平台名称、注册 / 开户时间和使用的渠道。我们会人工核实是否符合合作条件，提交不代表已获得 VIP。"
                : selectedPartner.type === "BROKERAGE"
                  ? "请填写这家券商的账户 ID 或开户链接识别信息，并在补充说明中写明开户时间与 Wise 开户渠道。"
                  : "交易所账户需绑定 Wise 邀请关系、入金 1000U 并完成 10000U 合约交易。填写该平台后台显示的 UID 后提交核验。"}</p>
            </div>
          )}

          {selectedPartner?.type === "EXCHANGE" && <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>交易所填写的 UID <strong>必须绑定在 Wise 邀请码下</strong>。请勿随意填写与 Wise 无关的 ID，否则封号处理。</p>
          </div>}

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
              {selectedPartner?.identifierLabel ?? "账户标识"}
              <Input
                required
                disabled={isPending}
                maxLength={80}
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
              disabled={isPending}
              maxLength={2000}
              aria-describedby={noteHintId}
              value={userNote}
              onChange={(event) => setUserNote(event.target.value)}
              placeholder={isOther
                ? "请说明注册 / 开户时间、使用的邀请或合作渠道，以及需要核验的情况。"
                : selectedPartner?.type === "BROKERAGE"
                ? "请填写开户时间、券商名称和开户渠道。例如：2026 年 9 月开户，通过 Wise 渠道。"
                : "请填写账户注册时间和使用的 Wise 邀请码。例如：2026 年 9 月注册，通过 Wise 邀请码注册。"}
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <span id={noteHintId} className="mt-1 block text-xs font-medium leading-5 text-amber-800 dark:text-amber-200">
              请务必填写账户注册 / 开户时间，作为审核依据；未填写补充说明无法提交。
            </span>
          </label>

          <p className="border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">
            资料提交后人工审核；需要补充或被驳回时，可修改后重新提交。请勿提供密码、私钥、助记词或验证码。
          </p>
        </div>
        )}

        {!submitted && (
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
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

        {message && <p role="alert" className="shrink-0 px-6 pb-4 text-sm text-rose-600 dark:text-rose-400">{message}</p>}
      </DialogContent>
    </Dialog>
  );
}
