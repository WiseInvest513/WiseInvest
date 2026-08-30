"use client";

import { useMemo, useState } from "react";
import { Clipboard, Check } from "lucide-react";

export function DcaEntryHelper() {
  const [date, setDate] = useState("2026/09/06");
  const [btcPrice, setBtcPrice] = useState("");
  const [ethPrice, setEthPrice] = useState("");
  const [executionTime, setExecutionTime] = useState("周日 20:30");
  const [source, setSource] = useState("手动记录");
  const [copied, setCopied] = useState(false);

  const snippet = useMemo(() => {
    const btc = Number(btcPrice);
    const eth = Number(ethPrice);
    const safeBtc = Number.isFinite(btc) && btc > 0 ? btc : 0;
    const safeEth = Number.isFinite(eth) && eth > 0 ? eth : 0;
    return `{ date: "${date}", btcPrice: ${safeBtc}, ethPrice: ${safeEth}, executionTime: "${executionTime}", source: "${source}" },`;
  }, [btcPrice, date, ethPrice, executionTime, source]);

  const canCopy = Number(btcPrice) > 0 && Number(ethPrice) > 0 && date.trim().length > 0;

  const copy = async () => {
    if (!canCopy) return;
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">DCA Helper</p>
          <h2 className="mt-2 text-2xl font-black">生成下一期 BTC / ETH 定投记录</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
            当前静态数据最后一条是 2026/08/30：BTC 78190，ETH 2459。生成后把片段追加到 DCA 页面数据数组即可。
          </p>
        </div>
        <button
          type="button"
          onClick={copy}
          disabled={!canCopy}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-amber-300 transition-colors hover:bg-amber-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
        >
          {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
          {copied ? "已复制" : "复制记录"}
        </button>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-5">
        {[
          { label: "日期", value: date, setter: setDate, placeholder: "2026/09/06" },
          { label: "BTC 价格", value: btcPrice, setter: setBtcPrice, placeholder: "78190" },
          { label: "ETH 价格", value: ethPrice, setter: setEthPrice, placeholder: "2459" },
          { label: "执行时间", value: executionTime, setter: setExecutionTime, placeholder: "周日 20:30" },
          { label: "来源", value: source, setter: setSource, placeholder: "手动记录" },
        ].map((field) => (
          <label key={field.label} className="grid gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
            {field.label}
            <input
              value={field.value}
              onChange={(event) => field.setter(event.target.value)}
              placeholder={field.placeholder}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm font-semibold text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-amber-950/40"
            />
          </label>
        ))}
      </div>

      <pre className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-sm font-semibold text-slate-100 dark:border-slate-800">
        <code>{snippet}</code>
      </pre>
    </section>
  );
}
