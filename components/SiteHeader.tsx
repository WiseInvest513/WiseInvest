'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { siteConfig } from '@/config/site'
import { ThemeToggle } from './ThemeToggle'
import { LanguageToggle } from './LanguageToggle'
import { Logo } from './Logo'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  
  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full transition-all",
        isHomePage 
          ? "border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60 dark:supports-[backdrop-filter]:bg-slate-900/60"
          : "border-b border-border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm dark:bg-background/80 dark:border-border"
      )}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Brand */}
          <Link href="/">
            <Logo />
          </Link>

          {/* Center: Navigation Menu */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {/* 首页 */}
              <NavigationMenuItem>
                <Link href="/" legacyBehavior passHref>
                  <NavigationMenuLink 
                    className={cn(
                      "text-sm font-medium transition-colors px-4 py-2",
                      isHomePage
                        ? "text-slate-700 dark:text-white/90 hover:text-slate-900 dark:hover:text-white"
                        : "text-slate-700 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground"
                    )}
                  >
                    首页
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {/* 推文/干货 */}
              <NavigationMenuItem>
                <Link href="/resources" legacyBehavior passHref>
                  <NavigationMenuLink 
                    className={cn(
                      "text-sm font-medium transition-colors px-4 py-2",
                      isHomePage
                        ? "text-slate-700 dark:text-white/90 hover:text-slate-900 dark:hover:text-white"
                        : "text-slate-700 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground"
                    )}
                  >
                    推文/干货
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {/* 实用工具 - 链接到工具页面 */}
              <NavigationMenuItem>
                <Link href="/tools" legacyBehavior passHref>
                  <NavigationMenuLink 
                    className={cn(
                      "text-sm font-medium transition-colors px-4 py-2",
                      isHomePage
                        ? "text-slate-700 dark:text-white/90 hover:text-slate-900 dark:hover:text-white"
                        : "text-slate-700 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground"
                    )}
                  >
                    实用工具
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {/* 经典文集 */}
              <NavigationMenuItem>
                <Link href="/classics" legacyBehavior passHref>
                  <NavigationMenuLink 
                    className={cn(
                      "text-sm font-medium transition-colors px-4 py-2",
                      isHomePage
                        ? "text-slate-700 dark:text-white/90 hover:text-slate-900 dark:hover:text-white"
                        : "text-slate-700 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground"
                    )}
                  >
                    经典文集
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {/* 福利/开户 */}
              <NavigationMenuItem>
                <Link href="/benefits" legacyBehavior passHref>
                  <NavigationMenuLink 
                    className={cn(
                      "text-sm font-medium transition-colors px-4 py-2",
                      isHomePage
                        ? "text-slate-700 dark:text-white/90 hover:text-slate-900 dark:hover:text-white"
                        : "text-slate-700 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground"
                    )}
                  >
                    福利/开户
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {/* 常用导航 */}
              <NavigationMenuItem>
                <Link href="/nav" legacyBehavior passHref>
                  <NavigationMenuLink 
                    className={cn(
                      "text-sm font-medium transition-colors px-4 py-2",
                      isHomePage
                        ? "text-slate-700 dark:text-white/90 hover:text-slate-900 dark:hover:text-white"
                        : "text-slate-700 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground"
                    )}
                  >
                    常用导航
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right: Actions */}
          <div className={cn(
            "flex items-center gap-2",
            isHomePage && "[&_button]:text-slate-700 dark:[&_button]:text-white/90 [&_button:hover]:text-slate-900 dark:[&_button:hover]:text-white"
          )}>
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
