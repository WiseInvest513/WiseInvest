"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Link2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  History,
} from "lucide-react";
import { siteConfig } from "@/lib/config";
import type { ShortLinkRecord } from "@/lib/short-url";

export default function ShortUrlAdminPage() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [history, setHistory] = useState<ShortLinkRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const baseUrl = siteConfig.baseUrl.replace(/\/$/, "");

  const fetchHistory = useCallback(async (showLoading = true) => {
    if (showLoading) setHistoryLoading(true);
    try {
      const res = await fetch("/api/short/list");
      const data = await res.json();
      if (res.ok && Array.isArray(data.list)) setHistory(data.list);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShortUrl(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError("请输入要缩短的链接");
      return;
    }

    if (!/^https?:\/\//i.test(trimmed)) {
      setError("链接必须以 http:// 或 https:// 开头");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/short/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      let data: { shortUrl?: string; shortId?: string; error?: string; message?: string };
      try {
        data = await res.json();
      } catch {
        setError("服务器返回格式异常");
        return;
      }

      if (!res.ok) {
        setError(data.error || data.message || "创建失败");
        return;
      }

      const shortUrlResult = data.shortUrl ?? (data.shortId ? `${baseUrl}/s/${data.shortId}` : null);
      if (shortUrlResult) {
        setShortUrl(shortUrlResult);
        setUrl("");
        fetchHistory(false); // 静默刷新，不闪 loading
      } else {
        setError("未返回短链，请重试");
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyShortUrl = (shortId: string) => {
    const full = `${baseUrl}/s/${shortId}`;
    navigator.clipboard.writeText(full).then(() => {
      setCopiedId(shortId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return d.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncate = (s: string, len: number) =>
    s.length <= len ? s : s.slice(0, len) + "…";

  return (
    <div className="min-h-[70vh] px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            短链管理
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            左侧为历史记录，右侧生成新短链，前缀：{baseUrl}/s/
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：历史列表 */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <History className="w-4 h-4" />
                <span className="font-medium">历史记录</span>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {historyLoading ? (
                  <div className="p-6 flex items-center justify-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    暂无记录，在右侧生成短链后会显示在这里
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {history.map((item) => {
                      const fullShort = `${baseUrl}/s/${item.shortId}`;
                      return (
                        <li
                          key={item.shortId}
                          className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-mono text-xs text-amber-600 dark:text-amber-400 truncate" title={fullShort}>
                                /s/{item.shortId}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate" title={item.originalUrl}>
                                {truncate(item.originalUrl, 36)}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                {formatTime(item.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => copyShortUrl(item.shortId)}
                                title="复制短链"
                              >
                                {copiedId === item.shortId ? (
                                  <Check className="w-3.5 h-3.5 text-green-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                asChild
                              >
                                <a href={fullShort} target="_blank" rel="noopener noreferrer" title="在新标签打开">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：生成器 */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">
                生成短链
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                输入完整链接（支持小红书、推特等），生成以本站为前缀的短链
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="url"
                    placeholder="https://example.com/xxx 或 小红书链接等"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={loading}
                    className="text-base h-11"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      生成短链
                    </>
                  )}
                </Button>
              </form>

              {error && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {shortUrl && (
                <div className="mt-5 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-800 dark:text-amber-200 mb-2">
                    已生成，可随时访问跳转
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={shortUrl}
                      className="font-mono text-sm bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="flex-shrink-0 border-amber-300 dark:border-amber-700"
                      onClick={() => {
                        navigator.clipboard.writeText(shortUrl);
                        setCopiedId("__new");
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      title="复制"
                    >
                      {copiedId === "__new" ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
