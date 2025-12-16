'use client'

import { Languages } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

export function LanguageToggle() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-9 w-9 hover:bg-slate-100 dark:hover:bg-white/10",
        "text-slate-700 dark:text-white/90"
      )}
      title="Switch to English"
    >
      <Languages className="h-4 w-4" />
      <span className="sr-only">CN</span>
    </Button>
  )
}
