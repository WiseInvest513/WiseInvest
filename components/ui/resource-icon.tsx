"use client";

import { useState } from "react";
import { IconService } from "@/lib/icon-service";

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
 * 自动处理图标加载、错误处理和fallback
 * 确保始终显示图标，不会出现空白
 * 
 * 使用统一的 IconService 获取图标，支持 iconUrl 参数（用于区分邀请链接和图标地址）
 */
export function ResourceIcon({ 
  url, 
  name,
  iconUrl, // 图标 URL（可选）
  size = 40, 
  className = "",
  alt,
  rounded = false
}: ResourceIconProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  // 优先使用 iconUrl，如果没有则使用 url（向后兼容）
  const iconSourceUrl = iconUrl || url;
  const iconInfo = IconService.getIconInfo(iconSourceUrl, name);
  
  // 判断是否有真实图标（不是默认生成的SVG）
  const hasRealIcon = !iconInfo.isDefault;
  
  // 显示默认字母的情况：
  // 1. 没有真实图标（isDefault = true）
  // 2. 有真实图标但加载失败（imageError = true）
  // 3. 有真实图标但还在加载中（作为占位符）
  const showDefaultLetter = iconInfo.isDefault || imageError || (hasRealIcon && !imageLoaded);

  return (
    <div 
      className={`relative flex items-center justify-center bg-white dark:bg-slate-800 ${rounded ? 'rounded-full' : 'rounded-xl'} border border-slate-200 dark:border-slate-700 shadow-sm ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 默认图标：首字母 - 作为占位符或最终fallback */}
      {showDefaultLetter && (
        <span 
          className={`absolute text-slate-600 dark:text-slate-400 font-bold transition-opacity duration-300 ${
            hasRealIcon && imageLoaded && !imageError ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ fontSize: size * 0.4 }}
        >
          {iconInfo.fallbackLetter}
        </span>
      )}
      
      {/* 图标图片：如果有真实图标，尝试加载并显示 */}
      {hasRealIcon && (
        <img
          src={iconInfo.iconUrl}
          alt={alt || `${name} icon`}
          className={`absolute w-full h-full ${rounded ? 'rounded-full' : 'rounded-lg'} object-contain p-1 transition-opacity duration-300 ${
            imageLoaded && !imageError ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onLoad={() => {
            setImageLoaded(true);
          }}
          onError={() => {
            setImageError(true);
            setImageLoaded(false);
          }}
        />
      )}
    </div>
  );
}
