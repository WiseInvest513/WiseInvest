import faviconMapping from './favicon-mapping.json';

/**
 * Get the local cached favicon path for a resource URL
 * @param url The resource URL
 * @returns Local path to cached favicon, or null if not cached
 */
export function getCachedFavicon(url: string): string | null {
  return (faviconMapping as Record<string, string>)[url] || null;
}

/**
 * Get favicon URL from Google's service (全球最稳定的接口)
 * @param url The resource URL
 * @returns Google favicon API URL
 */
export function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, ""); // Remove www. prefix
    // 使用 Google 的 Favicon API（全球最稳定）
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  } catch (error) {
    // If URL is invalid, return empty string
    return "";
  }
}

