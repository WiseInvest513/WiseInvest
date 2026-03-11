"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link2, Copy, Check, Loader2, AlertCircle } from "lucide-react";

export default function Article513Page() {
  const [url, setUrl] = useState("");
  const [articleUrl, setArticleUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin.replace(/\/$/, ""));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setArticleUrl(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError("请输入飞书云文档链接");
      return;
    }

    if (!trimmed.includes("feishu.cn/docx/")) {
      setError("请使用飞书云文档链接，格式：https://xxx.feishu.cn/docx/xxx");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/article/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || "注册失败");
        return;
      }

      setArticleUrl(data.articleUrl);
      setUrl("");
    } catch (err) {
      setError("网络错误，请稍后重试");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!articleUrl) return;
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("复制失败");
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            飞书文章注册
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            粘贴飞书云文档链接，生成 /article/xxxx 访问地址
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="url"
            placeholder="https://xxx.feishu.cn/docx/xxxxxxxx"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="text-base h-11"
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                注册中...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 mr-2" />
                生成文章链接
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

        {articleUrl && (
          <div className="mt-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-800 dark:text-amber-200 mb-2">
              文章已注册，可直接访问
            </p>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={articleUrl}
                className="font-mono text-sm bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800"
              />
              <Button
                variant="outline"
                size="icon"
                className="flex-shrink-0 border-amber-300 dark:border-amber-700"
                onClick={handleCopy}
                title="复制"
              >
                {copied ? (
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
  );
}
