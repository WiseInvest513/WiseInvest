"use client";

import { useId, useRef, useState } from "react";
import { Command } from "cmdk";
import { ArrowLeftRight, Building2, Check, ChevronDown, Ellipsis, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { OTHER_BINDING_SLUG } from "@/lib/vip/binding-platforms";

const groups = [
  { type: "BROKERAGE", label: "券商", icon: Building2 },
  { type: "EXCHANGE", label: "交易所", icon: ArrowLeftRight },
  { type: "OTHER", label: "其他服务", icon: Ellipsis },
];

type Option = { slug: string; name: string; type: string };

export function PlatformPicker({ options, value, onChange, disabled, onExpandedChange }: {
  options: Option[];
  value: string;
  onChange: (slug: string) => void;
  disabled?: boolean;
  onExpandedChange: (expanded: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const changeExpanded = (next: boolean) => { setExpanded(next); onExpandedChange(next); };
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const selected = options.find((option) => option.slug === value);
  const other = options.find((option) => option.slug === OTHER_BINDING_SLUG);
  const select = (slug: string) => {
    onChange(slug);
    changeExpanded(false);
    trigger.current?.focus();
  };

  return (
    <div onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) changeExpanded(false);
    }} onKeyDown={(event) => {
      if (expanded && event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        changeExpanded(false);
        trigger.current?.focus();
      }
    }}>
      <label id={`${id}-label`} htmlFor={`${id}-trigger`} className="block text-sm font-bold text-slate-700 dark:text-slate-200">
        选择平台 <span className="font-medium text-amber-700 dark:text-amber-300">（必选）</span>
      </label>
      <button
        id={`${id}-trigger`}
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-expanded={expanded}
        aria-controls={expanded ? `${id}-picker` : undefined}
        onClick={() => changeExpanded(!expanded)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") { event.preventDefault(); changeExpanded(true); }
        }}
        className={cn("mt-2 flex min-h-12 w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-amber-400 dark:bg-slate-900 disabled:opacity-50", expanded ? "border-amber-400" : "border-slate-200 dark:border-slate-700")}
      >
        <span id={`${id}-value`} className={cn("flex-1", selected ? "font-bold text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400")}>
          {selected?.name ?? "搜索或选择你的券商、交易所"}
        </span>
        {selected && <span className="text-xs text-slate-500 dark:text-slate-400">{groups.find((group) => group.type === selected.type)?.label}</span>}
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div id={`${id}-picker`} className="mt-2 overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <Command label="搜索平台" className="text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 dark:border-slate-800">
              <Search aria-hidden="true" className="h-4 w-4 text-slate-400" />
              <Command.Input autoFocus placeholder="搜索名称，如币安、复星、BBAE" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
            </div>
            <Command.List className="max-h-60 overflow-y-auto overscroll-contain p-1.5">
              <Command.Empty className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">没有找到该平台，可在下方选择“其他”。</Command.Empty>
              {groups.map(({ type, label, icon: Icon }) => {
                const items = options.filter((option) => option.type === type && option.slug !== OTHER_BINDING_SLUG);
                return items.length ? (
                  <Command.Group key={type} heading={label} className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-slate-500">
                    {items.map((option) => (
                      <Command.Item key={option.slug} value={option.slug} keywords={[option.name, label]} onSelect={() => select(option.slug)} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-[selected=true]:bg-amber-50 data-[selected=true]:text-amber-950 dark:data-[selected=true]:bg-amber-950/40 dark:data-[selected=true]:text-amber-100">
                        <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span className="flex-1 font-medium">{option.name}</span>
                        {value === option.slug && <Check aria-label="已选中" className="h-4 w-4 text-amber-600" />}
                      </Command.Item>
                    ))}
                  </Command.Group>
                ) : null;
              })}
            </Command.List>
          </Command>
          {other && <button type="button" onClick={() => select(other.slug)} className="flex w-full items-center gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3 text-left text-sm outline-none hover:bg-amber-50 focus-visible:bg-amber-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-amber-950/30 dark:focus-visible:bg-amber-950/30">
            <Ellipsis className="h-4 w-4 shrink-0 text-amber-600" />
            <span className="flex-1"><span className="block font-bold text-slate-800 dark:text-slate-100">其他</span><span className="text-xs text-slate-500 dark:text-slate-400">未列出的平台 / 产品，填写名称与补充说明</span></span>
            {value === other.slug && <Check className="h-4 w-4 text-amber-600" />}
          </button>}
        </div>
      )}
      {!expanded && <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">找不到平台？展开列表，选择底部的“其他”。</p>}
    </div>
  );
}
