"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ArticlePage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <p className="text-slate-600 dark:text-slate-400 mb-4">文章系统重建中…</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-yellow-600 dark:text-yellow-500 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        返回首页
      </Link>
    </div>
  );
}
