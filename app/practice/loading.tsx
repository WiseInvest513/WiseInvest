export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-600 border-r-transparent"></div>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">加载实践页面...</p>
      </div>
    </div>
  );
}

