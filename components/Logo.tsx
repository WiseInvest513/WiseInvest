'use client'

import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function Logo() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const [imageError, setImageError] = useState(false)

  return (
    <div className="flex items-center space-x-2">
      <div className="relative h-10 w-10">
        {!imageError ? (
          <Image
            src="/logo.png"
            alt="Logo"
            width={40}
            height={40}
            className="object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-brand-accent flex items-center justify-center">
            <span className="text-white font-bold text-lg">智</span>
          </div>
        )}
      </div>
      <span className={cn(
        "text-xl font-bold tracking-wide font-heading",
        isHomePage
          ? "text-slate-900 dark:text-white"
          : "text-slate-900 dark:text-foreground"
      )}>
        聪明的投资者
      </span>
    </div>
  )
}
