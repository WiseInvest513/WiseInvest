'use client'

import { X, Code, Mail, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { useState } from 'react'

interface APIModalProps {
  open: boolean
  onClose: () => void
}

export function APIModal({ open, onClose }: APIModalProps) {
  const [subscribed, setSubscribed] = useState(false)

  if (!open) return null

  const handleSubscribe = () => {
    setSubscribed(true)
    setTimeout(() => {
      setSubscribed(false)
    }, 3000)
  }

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      
      {/* 弹窗主体 */}
      <div
        className={cn(
          'relative z-10 w-full max-w-2xl',
          'bg-white dark:bg-slate-800 rounded-2xl shadow-2xl',
          'border border-slate-200 dark:border-slate-700',
          'transform transition-all duration-200 ease-out scale-100 opacity-100'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 内容 */}
        <div className="p-8 md:p-12">
          {/* 图标和标题 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 mb-4">
              <Code className="h-8 w-8 text-slate-600 dark:text-slate-400" />
            </div>
            <h2 className="text-3xl font-bold tracking-wide text-slate-900 dark:text-white mb-2">
              开发者 API
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              为开发者提供的数据接口服务
            </p>
          </div>

          {/* 开发中提示 */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 mb-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  功能开发中
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  我们正在构建一套完整的 API 服务，包括：
                </p>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-accent mt-0.5">•</span>
                    <span>加密货币实时价格数据</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-accent mt-0.5">•</span>
                    <span>股票市场行情接口</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-accent mt-0.5">•</span>
                    <span>链上数据分析</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-accent mt-0.5">•</span>
                    <span>宏观经济指标</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 订阅按钮 */}
          <div className="text-center">
            {subscribed ? (
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                <Mail className="h-5 w-5" />
                <span className="font-medium">已订阅通知</span>
              </div>
            ) : (
              <Button
                onClick={handleSubscribe}
                className="gap-2"
                size="lg"
              >
                <Bell className="h-5 w-5" />
                订阅通知
              </Button>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              功能上线时，我们将通过邮件通知您
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
