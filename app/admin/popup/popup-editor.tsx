"use client";
import { useState } from "react";
import { POPUP_SITE_IDS, parsePopupCampaign, type PopupCampaign } from "@/lib/popup-campaign";
const names = { main: "主站", etf: "ETF", chain: "Chain", crypto: "Crypto", vip: "VIP", sim: "SIM", witness: "见证开户", hold: "Hold", ipo: "IPO" };
const fields = [
  ["eyebrow", "引导文字", 30], ["title", "主标题", 60], ["subtitle", "副标题", 60], ["message", "感谢文案", 120],
  ["profileLabel", "第一个按钮文字", 50], ["profileUrl", "第一个按钮链接", 2048], ["voteLabel", "第二个按钮文字", 50], ["voteUrl", "第二个按钮链接", 2048],
] as const;
export function PopupEditor({ initial, initialRevision, localPreview }: { initial: PopupCampaign; initialRevision: number; localPreview: boolean }) {
  const [config, setConfig] = useState(initial);
  const [revision, setRevision] = useState(initialRevision);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const parsed = parsePopupCampaign(config);
      const response = await fetch("/api/admin/popup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config: parsed, revision }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "保存失败");
      setRevision(result.revision);
      setMessage(result.preview ? "本地预览已更新，未修改线上配置；重启开发服务器后恢复默认值。" : "已保存。已接入的站点会在下次进入或点击投票按钮时读取新配置。");
    } catch (error) { setMessage(error instanceof Error ? error.message : "保存失败，请重试"); }
    finally { setSaving(false); }
  }
  function preview() {
    try {
      const parsed = parsePopupCampaign(config);
      const popup = (window as typeof window & { WisePopup?: { preview: (value: PopupCampaign) => boolean } }).WisePopup;
      if (!popup) throw new Error("预览组件正在加载，请稍后重试");
      popup.preview(parsed);
    } catch (error) { setMessage(error instanceof Error ? error.message : "预览失败"); }
  }
  return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
    <h1 className="text-2xl font-bold">全站投票弹窗</h1><p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">统一管理自动展示的投票内容。各站原有的“加入群聊”按钮继续手动打开社群，不受这个开关影响。</p>
    {localPreview && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">本地预览模式：保存只影响当前开发服务器，不连接或修改生产数据库。</p>}
    <form onSubmit={save} className="mt-6 space-y-6">
      <label className="flex items-center gap-3 font-semibold"><input type="checkbox" checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })}/>启用投票弹窗</label>
      <fieldset><legend className="mb-3 text-sm font-semibold">启用站点（站点需先完成代码接入）</legend><div className="flex flex-wrap gap-4">{POPUP_SITE_IDS.map(site => <label key={site} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.sites.includes(site)} onChange={e => setConfig({ ...config, sites: e.target.checked ? [...config.sites, site] : config.sites.filter(x => x !== site) })}/>{names[site]}</label>)}</div></fieldset>
      <div className="grid gap-5 md:grid-cols-2">{fields.map(([key, label, max]) => <label key={key} className="block text-sm font-semibold">{label}<input required maxLength={max} type={key.endsWith("Url") ? "url" : "text"} value={config[key]} onChange={e => setConfig({ ...config, [key]: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2.5 font-normal dark:border-slate-600"/></label>)}</div>
      <p className="text-sm text-slate-500">每次重新进入或刷新时自动展示；当前浏览中关闭后不再自动弹出，右上角入口可随时重新打开。</p>
      <div className="flex flex-wrap gap-3"><button type="button" onClick={preview} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold">预览弹窗</button><button disabled={saving} type="submit" className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900">{saving ? "正在保存…" : "保存配置"}</button></div>
      <p role="status" aria-live="polite" className="text-sm leading-6">{message}</p>
    </form>
  </section>;
}
