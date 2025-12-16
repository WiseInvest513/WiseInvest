'use client'

import { X } from 'lucide-react'
import { InterestCalculator } from './InterestCalculator'
import { cn } from '@/lib/utils'

interface CalculatorModalProps {
  open: boolean
  onClose: () => void
}

export function CalculatorModal({ open, onClose }: CalculatorModalProps) {
  if (!open) return null

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
          'relative z-10 w-full max-w-4xl max-h-[90vh]',
          'bg-white dark:bg-slate-800 rounded-2xl shadow-2xl',
          'border border-slate-200 dark:border-slate-700',
          'overflow-y-auto',
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
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-wide text-slate-900 dark:text-white mb-2">
              复利计算器
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              计算长期定投的复利收益
            </p>
          </div>
          <InterestCalculator />
        </div>
      </div>
    </div>
  )
}
