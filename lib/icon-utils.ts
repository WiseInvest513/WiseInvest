import { getCachedFavicon, getFaviconUrl } from './favicon-utils';

export interface IconInfo {
  iconUrl: string | null;
  fallbackLetter: string;
  isLoading: boolean;
  hasError: boolean;
}

/**
 * 通用的图标获取工具函数
 * 优先级：本地缓存 > Google Favicon API > 首字母
 * 
 * @param url 资源URL
 * @param name 资源名称（用于fallback）
 * @returns IconInfo 图标信息对象
 */
export function getResourceIcon(url: string, name: string): IconInfo {
  // Priority 1: Check for cached favicon
  const cachedFavicon = getCachedFavicon(url);
  
  // Priority 2: Fallback to Google favicon API
  const googleFaviconUrl = cachedFavicon ? null : getFaviconUrl(url);
  
  // Priority 3: Use first letter as fallback
  const firstLetter = name.charAt(0).toUpperCase();
  
  return {
    iconUrl: cachedFavicon || googleFaviconUrl || null,
    fallbackLetter: firstLetter,
    isLoading: !cachedFavicon && !!googleFaviconUrl,
    hasError: false,
  };
}

/**
 * React Hook for icon loading with error handling
 * 
 * @param url 资源URL
 * @param name 资源名称
 * @returns IconInfo with state management
 */
export function useResourceIcon(url: string, name: string) {
  const iconInfo = getResourceIcon(url, name);
  
  return {
    ...iconInfo,
    // This can be extended with useState for dynamic loading
  };
}

