"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getSafeExternalUrl, openSafeExternalUrl } from "@/lib/security/external-links";

/**
 * Values Corrector Page
 * 在新标签页打开外部网站
 */
export default function ValuesCorrectorPage() {
  const targetUrl = getSafeExternalUrl("https://www.core-wise-invest.org/");

  useEffect(() => {
    openSafeExternalUrl(targetUrl);
  }, [targetUrl]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/tools"
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回工具列表
          </Link>
        </div>

        {/* Info Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-8 text-center">
          <div className="mb-4">
            <ExternalLink className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            正在打开新标签页
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            价值观纠正器已在新标签页中打开
          </p>
          <div className="space-y-3">
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              如果未自动打开，请点击这里
            </a>
            <div>
              <Link
                href="/tools"
                className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                返回工具列表
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
