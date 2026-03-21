"use client";

import { useState } from "react";
import { getCachedFavicon, getFaviconCandidates } from "@/lib/favicon-utils";

interface ResourceIconProps {
  url: string; // 默认 URL（向后兼容）
  name: string;
  iconUrl?: string; // 图标 URL（可选，如果提供则优先使用，否则使用 url）
  size?: number;
  className?: string;
  alt?: string;
  rounded?: boolean;
}

/**
 * 通用资源图标组件
 * 自动处理图标加载、错误处理和 fallback
 * 依次尝试：本地缓存 → Google S2 → DuckDuckGo → 直连 favicon.ico → 首字母
 */
export function ResourceIcon({
  url,
  name,
  iconUrl,
  size = 40,
  className = "",
  alt,
  rounded = false
}: ResourceIconProps) {
  const iconSourceUrl = iconUrl || url;

  // 构建候选列表：本地缓存优先
  const cached = getCachedFavicon(iconSourceUrl);
  const candidates = cached
    ? [cached, ...getFaviconCandidates(iconSourceUrl)]
    : getFaviconCandidates(iconSourceUrl);

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const currentSrc = candidates[candidateIndex] ?? null;
  const showLetter = !currentSrc || (currentSrc && !loaded);

  const fallbackLetter = name.charAt(0).toUpperCase();

  return (
    <div
      className={`relative flex items-center justify-center bg-white dark:bg-slate-800 ${rounded ? 'rounded-full' : 'rounded-xl'} border border-slate-200 dark:border-slate-700 shadow-sm ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 首字母占位 / 最终 fallback */}
      {showLetter && (
        <span
          className="absolute text-slate-600 dark:text-slate-400 font-bold"
          style={{ fontSize: size * 0.4 }}
        >
          {fallbackLetter}
        </span>
      )}

      {currentSrc && (
        <img
          key={currentSrc}
          src={currentSrc}
          alt={alt || `${name} icon`}
          className={`absolute w-full h-full ${rounded ? 'rounded-full' : 'rounded-lg'} object-contain p-1 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false);
            // 尝试下一个候选
            if (candidateIndex < candidates.length - 1) {
              setCandidateIndex(candidateIndex + 1);
            }
          }}
        />
      )}
    </div>
  );
}
