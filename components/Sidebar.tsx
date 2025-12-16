'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SidebarProps {
  items: { title: string; href: string }[]
  currentPath?: string
}

export function Sidebar({ items, currentPath }: SidebarProps) {
  return (
    <aside className="sticky top-20 h-[calc(100vh-5rem)] w-[240px] border-r border-border pr-8 pt-8">
      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'block rounded-md px-4 py-2 text-sm transition-colors text-left',
              currentPath === item.href
                ? 'bg-secondary text-secondary-foreground'
                : 'text-slate-600 dark:text-slate-400 hover:bg-secondary/50 hover:text-foreground font-body'
            )}
          >
            {item.title}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
