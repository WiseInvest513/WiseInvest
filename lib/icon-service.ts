import { getCachedFavicon, getFaviconUrl } from './favicon-utils';

/**
 * 默认图标生成器 - 生成基于首字母的SVG图标
 * 确保图标立即可用，不依赖网络
 */
function generateDefaultIcon(letter: string, size: number = 64): string {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="12" fill="%23f3f4f6" class="dark:fill-slate-800"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="${size * 0.4}" 
        font-weight="bold" 
        fill="%236b7280" 
        text-anchor="middle" 
        dominant-baseline="central"
      >${letter}</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=utf-8,${svg}`;
}

/**
 * 通用图标服务类
 * 提供统一的图标获取逻辑，包含完整的fallback机制
 */
export class IconService {
  /**
   * 获取资源图标
   * 优先级：本地缓存 > Google Favicon API（全球最稳定）> 默认图标（首字母SVG）
   * 
   * @param url 资源URL
   * @param name 资源名称（用于生成默认图标）
   * @returns 图标URL（始终返回有效值，不会为null）
   */
  static getIconUrl(url: string, name: string): string {
    // Priority 1: 本地缓存
    const cachedFavicon = getCachedFavicon(url);
    if (cachedFavicon) {
      return cachedFavicon;
    }

    // Priority 2: Google Favicon API（全球最稳定）
    const googleFaviconUrl = getFaviconUrl(url);
    if (googleFaviconUrl) {
      return googleFaviconUrl;
    }

    // Priority 3: 默认图标（首字母SVG）
    const firstLetter = name.charAt(0).toUpperCase();
    return generateDefaultIcon(firstLetter);
  }

  /**
   * 获取图标信息（包含fallback信息）
   * 
   * @param url 资源URL
   * @param name 资源名称
   * @returns IconInfo 图标信息对象
   */
  static getIconInfo(url: string, name: string): {
    iconUrl: string;
    fallbackLetter: string;
    isDefault: boolean;
    source: 'cached' | 'google' | 'default';
  } {
    const cachedFavicon = getCachedFavicon(url);
    const googleFaviconUrl = getFaviconUrl(url);
    const firstLetter = name.charAt(0).toUpperCase();

    if (cachedFavicon) {
      return {
        iconUrl: cachedFavicon,
        fallbackLetter: firstLetter,
        isDefault: false,
        source: 'cached',
      };
    }

    if (googleFaviconUrl && googleFaviconUrl.trim() !== '') {
      return {
        iconUrl: googleFaviconUrl,
        fallbackLetter: firstLetter,
        isDefault: false,
        source: 'google',
      };
    }

    return {
      iconUrl: generateDefaultIcon(firstLetter),
      fallbackLetter: firstLetter,
      isDefault: true,
      source: 'default',
    };
  }

  /**
   * React Hook: 使用图标服务（带错误处理）
   * 
   * @param url 资源URL
   * @param name 资源名称
   * @returns 图标URL和状态
   */
  static useIcon(url: string, name: string): {
    iconUrl: string;
    fallbackLetter: string;
    hasError: boolean;
    isLoading: boolean;
  } {
    const iconInfo = this.getIconInfo(url, name);
    
    return {
      iconUrl: iconInfo.iconUrl,
      fallbackLetter: iconInfo.fallbackLetter,
      hasError: false,
      isLoading: iconInfo.source === 'google', // Google API可能需要加载
    };
  }
}

/**
 * 便捷函数：直接获取图标URL（始终返回有效值）
 */
export function getIconUrl(url: string, name: string): string {
  return IconService.getIconUrl(url, name);
}

/**
 * 便捷函数：获取图标信息
 */
export function getIconInfo(url: string, name: string) {
  return IconService.getIconInfo(url, name);
}

