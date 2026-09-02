"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Edit3,
  Loader2,
  Mail,
  MessageCircle,
  Plus,
  Search,
  ServerCog,
  Trash2,
  UserRoundCheck,
  WalletCards,
} from "lucide-react";
import { CopyButton } from "@/app/admin/vip/copy-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export type VipExchangeRecordView = {
  id: string;
  email: string;
  wechatId: string | null;
  platform: string;
  uid: string;
  source: "VERIFIED_ACCOUNT" | "MANUAL";
  note: string | null;
  updatedAt: string;
  user: {
    wiseUserId: string;
    name: string | null;
  } | null;
};

type FormValues = {
  email: string;
  wechatId: string;
  platform: string;
  uid: string;
  note: string;
};

const emptyValues: FormValues = {
  email: "",
  wechatId: "",
  platform: "",
  uid: "",
  note: "",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function VipManagementClient({
  records,
  platformOptions,
}: {
  records: VipExchangeRecordView[];
  platformOptions: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VipExchangeRecordView | null>(null);
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const allPlatforms = useMemo(
    () => Array.from(new Set([...platformOptions, ...records.map((record) => record.platform)])).sort((a, b) => a.localeCompare(b, "zh-CN")),
    [platformOptions, records]
  );

  const filteredRecords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return records.filter((record) => {
      const matchesPlatform = platform === "ALL" || record.platform === platform;
      const matchesQuery =
        !normalized ||
        [record.email, record.wechatId, record.platform, record.uid, record.user?.wiseUserId, record.user?.name]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalized));
      return matchesPlatform && matchesQuery;
    });
  }, [platform, query, records]);

  const stats = useMemo(
    () => ({
      total: records.length,
      verified: records.filter((record) => record.source === "VERIFIED_ACCOUNT").length,
      manual: records.filter((record) => record.source === "MANUAL").length,
      withWechat: records.filter((record) => record.wechatId).length,
    }),
    [records]
  );

  const openCreate = () => {
    setEditing(null);
    setValues({ ...emptyValues, platform: allPlatforms[0] ?? "" });
    setMessage("");
    setDialogOpen(true);
  };

  const openEdit = (record: VipExchangeRecordView) => {
    setEditing(record);
    setValues({
      email: record.email,
      wechatId: record.wechatId ?? "",
      platform: record.platform,
      uid: record.uid,
      note: record.note ?? "",
    });
    setMessage("");
    setDialogOpen(true);
  };

  const setValue = (key: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const submit = () => {
    setMessage("");
    startTransition(async () => {
      const response = await fetch(editing ? `/api/admin/vip-management/${editing.id}` : "/api/admin/vip-management", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) {
        setMessage(result.message ?? "保存失败，请稍后再试。");
        return;
      }
      setDialogOpen(false);
      router.refresh();
    });
  };

  const remove = (record: VipExchangeRecordView) => {
    if (!window.confirm(`确认删除 ${record.platform} / ${record.uid} 吗？`)) return;
    startTransition(async () => {
      const response = await fetch(`/api/admin/vip-management/${record.id}`, { method: "DELETE" });
      const result = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) {
        window.alert(result.message ?? "删除失败，请稍后再试。");
        return;
      }
      router.refresh();
    });
  };

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "交易所 VIP", value: stats.total, detail: "当前维护总数", icon: WalletCards },
          { label: "审核自动收录", value: stats.verified, detail: "来自已通过交易所账户", icon: UserRoundCheck },
          { label: "手动补录", value: stats.manual, detail: "后台单独维护", icon: ServerCog },
          { label: "已留微信", value: stats.withWechat, detail: `${stats.total ? Math.round((stats.withWechat / stats.total) * 100) : 0}% 资料完整率`, icon: MessageCircle },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-slate-500 dark:text-slate-400">{item.label}</p>
                <Icon className="h-4 w-4 text-amber-500" />
              </div>
              <p className="mt-3 text-3xl font-black">{item.value}</p>
              <p className="mt-1 text-xs font-bold text-slate-400">{item.detail}</p>
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-black">交易所用户清单</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">仅收录交易所审核用户和管理员手动添加的返佣记录。</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索邮箱、微信、平台或 UID"
                className="h-11 rounded-xl border-slate-200 pl-10 dark:border-slate-700"
              />
            </label>
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="ALL">全部平台</option>
              {allPlatforms.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <Button onClick={openCreate} className="h-11 rounded-xl bg-slate-950 px-4 font-black text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950">
              <Plus className="mr-2 h-4 w-4" />
              手动新增
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1040px]">
            <div className="grid grid-cols-[1.35fr_1fr_0.85fr_1fr_0.72fr_0.6fr] gap-4 border-b border-slate-200 px-5 py-3 text-xs font-black text-slate-400 dark:border-slate-800">
              <span>用户邮箱</span>
              <span>微信号</span>
              <span>所属平台</span>
              <span>UID</span>
              <span>来源 / 更新</span>
              <span className="text-right">操作</span>
            </div>
            {filteredRecords.map((record) => (
              <div key={record.id} className="grid grid-cols-[1.35fr_1fr_0.85fr_1fr_0.72fr_0.6fr] items-center gap-4 border-b border-slate-100 px-5 py-4 text-sm last:border-0 dark:border-slate-800">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate font-bold" title={record.email}>{record.email || "未绑定邮箱"}</span>
                  </div>
                  {record.user && <p className="mt-1 truncate pl-6 font-mono text-xs text-slate-400">{record.user.name ?? "Wise 用户"} · {record.user.wiseUserId}</p>}
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-mono text-xs font-bold text-slate-600 dark:text-slate-300">{record.wechatId ?? "未填写"}</span>
                  {record.wechatId && <CopyButton value={record.wechatId} label="" />}
                </div>
                <span className="w-fit rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">{record.platform}</span>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-mono text-xs font-black" title={record.uid}>{record.uid}</span>
                  <CopyButton value={record.uid} label="" />
                </div>
                <div>
                  <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-black ${record.source === "VERIFIED_ACCOUNT" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                    {record.source === "VERIFIED_ACCOUNT" ? "审核自动收录" : "手动添加"}
                  </span>
                  <p className="mt-1 text-xs text-slate-400">{formatDate(record.updatedAt)}</p>
                </div>
                <div className="flex justify-end gap-1">
                  <button type="button" onClick={() => openEdit(record)} title="编辑记录" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-amber-300 hover:text-amber-700 dark:border-slate-700">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => remove(record)} title="删除记录" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-300 hover:text-rose-600 dark:border-slate-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {filteredRecords.length === 0 && (
              <div className="px-5 py-16 text-center">
                <WalletCards className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 font-black">没有找到匹配记录</p>
                <p className="mt-1 text-sm text-slate-400">调整搜索条件，或手动新增一条交易所用户记录。</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-2xl border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-950">
          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">{editing ? "编辑 VIP 交易所记录" : "手动新增 VIP 交易所用户"}</DialogTitle>
              <DialogDescription className="leading-6">填写返佣维护需要的邮箱、微信、所属平台和 UID。邮箱匹配到现有用户时会自动关联 Wise ID。</DialogDescription>
            </DialogHeader>
          </div>
          <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
            <label className="text-sm font-black text-slate-700 dark:text-slate-200">
              用户邮箱
              <Input type="email" value={values.email} onChange={(event) => setValue("email", event.target.value)} placeholder="user@example.com" className="mt-2 h-11 rounded-xl" />
            </label>
            <label className="text-sm font-black text-slate-700 dark:text-slate-200">
              微信号
              <Input value={values.wechatId} onChange={(event) => setValue("wechatId", event.target.value)} placeholder="可稍后补充" className="mt-2 h-11 rounded-xl" />
            </label>
            <label className="text-sm font-black text-slate-700 dark:text-slate-200">
              所属平台
              <Input list="vip-platform-options" value={values.platform} onChange={(event) => setValue("platform", event.target.value)} placeholder="Binance 币安" className="mt-2 h-11 rounded-xl" />
              <datalist id="vip-platform-options">{allPlatforms.map((item) => <option key={item} value={item} />)}</datalist>
            </label>
            <label className="text-sm font-black text-slate-700 dark:text-slate-200">
              UID
              <Input value={values.uid} onChange={(event) => setValue("uid", event.target.value)} placeholder="交易所账户 UID" className="mt-2 h-11 rounded-xl font-mono" />
            </label>
            <label className="text-sm font-black text-slate-700 dark:text-slate-200 sm:col-span-2">
              管理备注
              <textarea value={values.note} onChange={(event) => setValue("note", event.target.value)} placeholder="可记录返佣状态、联系情况或需要跟进的事项" className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950" />
            </label>
            {message && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 sm:col-span-2">{message}</p>}
          </div>
          <DialogFooter className="border-t border-slate-200 px-6 py-4 dark:border-slate-800">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">取消</Button>
            <Button disabled={isPending || !values.email || !values.platform || !values.uid} onClick={submit} className="rounded-xl bg-slate-950 font-black text-amber-300 hover:bg-slate-900 dark:bg-white dark:text-slate-950">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {editing ? "保存修改" : "新增记录"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
