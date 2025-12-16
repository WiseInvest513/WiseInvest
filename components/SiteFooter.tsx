import { siteConfig } from '@/config/site'

export function SiteFooter() {
  return (
    <footer className="bg-brand-dark text-brand-dark-foreground/80 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-brand-dark-foreground/80">
          {/* Left: Copyright */}
          <div>© 2025 {siteConfig.name}. All rights reserved.</div>

          {/* Center: Legal Links */}
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:text-brand-dark-foreground transition-colors">
              隐私政策
            </a>
            <span>|</span>
            <a href="/terms" className="hover:text-brand-dark-foreground transition-colors">
              使用条款
            </a>
          </div>

          {/* Right: ICP License */}
          <div className="text-xs opacity-70">
            ICP备案号: 待申请
          </div>
        </div>
      </div>
    </footer>
  )
}
