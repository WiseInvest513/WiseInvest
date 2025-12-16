import Link from 'next/link'
import { 
  Database, 
  Calculator, 
  BookOpen, 
  FileText, 
  TrendingUp,
  Twitter,
  Mail,
  ArrowRight,
  Github,
  MessageCircle
} from 'lucide-react'
import { ScrollIndicator } from '@/components/ScrollIndicator'
import { siteConfig } from '@/config/site'
import { Button } from '@/components/ui/button'
import { allPosts } from '.contentlayer/generated'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  // 获取最新文章
  const latestPost = allPosts
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

  return (
    <div>
      {/* Section 1: The Hero (Impact) */}
      <section className="relative py-20 md:py-32 flex items-center justify-center bg-slate-50 dark:bg-slate-900 overflow-hidden">
        {/* 背景径向渐变（聚光灯效果） */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.03)_0%,_transparent_70%)] dark:bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05)_0%,_transparent_70%)]" />
        
        {/* 内容 */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-semibold tracking-wide text-slate-900 dark:text-white mb-6 font-heading">
            {siteConfig.name}
          </h1>
          <p className="text-lg md:text-xl text-slate-700 dark:text-gray-200 mb-12 max-w-2xl mx-auto font-body">
            Decoding Wealth in the Age of AI & Crypto
          </p>
          
          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              asChild
              size="lg"
              className="px-8 py-6 text-base font-semibold"
            >
              <Link href="/resources">
                探索核心资源
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-white dark:bg-transparent border border-slate-300 dark:border-white/30 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-400 dark:hover:border-white/50 px-8 py-6 text-base font-semibold"
            >
              <Link href="/tools">使用投资工具</Link>
            </Button>
          </div>
          
          {/* Social Bar */}
          <div className="mt-12 mb-16">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-body">关注我的动态</p>
            <div className="flex items-center justify-center gap-6">
              <a href="https://twitter.com/investwise" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-brand-accent transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://www.xiaohongshu.com/user/investwise" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-brand-accent transition-colors" aria-label="小红书">
                <BookOpen className="h-5 w-5" />
              </a>
              <a href="https://github.com/investwise" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-brand-accent transition-colors" aria-label="GitHub">
                <Github className="h-5 w-5" />
              </a>
              <a href="mailto:hello@investwise.com" className="text-slate-400 hover:text-brand-accent transition-colors" aria-label="Email">
                <Mail className="h-5 w-5" />
              </a>
              <a href="https://t.me/investwise" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-brand-accent transition-colors" aria-label="Telegram">
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Trust Badges */}
          <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 font-body">Supported by</p>
            <div className="flex items-center justify-center gap-8 opacity-50">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-heading font-semibold">Bitcoin</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-heading font-semibold">Ethereum</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Database className="h-4 w-4" />
                <span className="text-xs font-heading font-semibold">Web3</span>
              </div>
            </div>
          </div>
        </div>
        <ScrollIndicator />
      </section>

      {/* Section 2: Core Features */}
      <section className="py-32 bg-page-bg">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-wide text-foreground mb-4 font-heading">
              核心功能
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-body">
              为理性投资者提供系统化的投资工具与资源
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-border bg-white dark:bg-card hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-brand-accent/10 flex items-center justify-center mb-4">
                  <Database className="h-6 w-6 text-brand-accent" />
                </div>
                <CardTitle className="text-xl tracking-wide font-heading">资源索引</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">收录全网高价值推文与研报，拒绝信息噪音。</p>
              </CardContent>
            </Card>
            <Card className="border-border bg-white dark:bg-card hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-brand-accent/10 flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-brand-accent" />
                </div>
                <CardTitle className="text-xl tracking-wide font-heading">投资工具</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">复利计算、定投回测，用数据辅助理性决策。</p>
              </CardContent>
            </Card>
            <Card className="border-border bg-white dark:bg-card hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-brand-accent/10 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-brand-accent" />
                </div>
                <CardTitle className="text-xl tracking-wide font-heading">经典文集</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">巴菲特致股东信与大师语录，回归投资第一性原理。</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 3: Bento Grid */}
      <section className="py-32 bg-page-bg">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6">
            <Link href={latestPost ? `/blog/${latestPost.slug}` : '/blog'} className="group md:col-span-2 p-10 rounded-xl border border-border bg-white dark:bg-card backdrop-blur-sm transition-all hover:shadow-lg hover:-translate-y-1 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="h-6 w-6 text-brand-accent" />
                <h3 className="text-2xl font-bold tracking-wide text-foreground font-heading">最新研报</h3>
              </div>
              {latestPost && (
                <>
                  <h4 className="text-xl font-semibold text-foreground mb-3 group-hover:text-brand-accent transition-colors font-heading tracking-wide">
                    {latestPost.title}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 font-body">
                    {latestPost.desc}
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-sm text-brand-accent group-hover:gap-3 transition-all">
                    <span>阅读全文</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </>
              )}
            </Link>
            <Link href="/benefits" className="group md:row-span-2 p-10 rounded-xl border border-border bg-white dark:bg-card backdrop-blur-sm transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 mb-4">
                  <span className="text-xs font-semibold text-amber-500">推荐</span>
                </div>
                <h3 className="text-2xl font-bold tracking-wide text-foreground mb-2 font-heading">福利专区</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 font-body">精选邀请码，最高返佣</p>
              </div>
              <div className="flex-1 flex flex-col justify-end">
                <div className="p-6 rounded-lg bg-page-bg border border-border">
                  <div className="text-lg font-semibold text-foreground mb-2">Binance</div>
                  <div className="text-sm text-brand-accent font-medium mb-3">最高返佣 20%</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-mono bg-secondary px-3 py-2 rounded border border-border font-heading">BINANCE2024</div>
                </div>
                <div className="mt-6 flex items-center gap-2 text-sm text-brand-accent group-hover:gap-3 transition-all">
                  <span>查看全部</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
            <div className="md:col-span-2 p-10 rounded-xl border border-border bg-white dark:bg-card backdrop-blur-sm relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="h-6 w-6 text-brand-accent" />
                <h3 className="text-2xl font-bold tracking-wide text-foreground font-heading">数据监控</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-6 font-body">实时市场数据与趋势分析</p>
              <div className="h-32 rounded-lg bg-page-bg border border-border flex items-center justify-center">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-body">图表占位符 - Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: About & Social Proof (Trust) */}
      <section className="py-32 bg-page-bg">
        <div className="max-w-7xl mx-auto px-6">
          {/* 外层悬浮容器 - 增强悬浮感 */}
          <div className="relative">
            {/* 外层阴影光晕 */}
            <div className="absolute -inset-4 bg-gradient-to-r from-brand-accent/10 via-transparent to-brand-accent/10 rounded-[2rem] blur-2xl opacity-50 dark:opacity-30" />
            <div className="absolute -inset-2 bg-slate-200/50 dark:bg-slate-800/30 rounded-[2rem] blur-xl" />
            
            {/* 深色卡片容器 */}
            <div className="relative rounded-3xl shadow-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 p-8 md:p-12 border border-slate-300/50 dark:border-white/5">
              {/* 装饰性光斑 - 右上角 */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-accent/20 rounded-full blur-3xl pointer-events-none" />
              
              {/* 装饰性光斑 - 左下角 */}
              <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />
              
              {/* 噪点纹理 */}
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              />
              
              {/* 渐变光晕 */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 via-transparent to-transparent pointer-events-none" />

              {/* 内容区域 */}
              <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
                {/* 左侧：头像区域 */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="relative mb-4">
                    {/* 光环效果 */}
                    <div className="absolute inset-0 rounded-full ring-4 ring-slate-400/30 dark:ring-white/20 animate-pulse" />
                    {/* 头像容器 */}
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-900 border-4 border-slate-300/50 dark:border-white/10 flex items-center justify-center shadow-xl">
                      <span className="text-5xl md:text-6xl text-white/90 font-heading">智</span>
                    </div>
                  </div>
                  
                  {/* 头像下方标签 */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-700/20 dark:bg-white/10 border border-slate-500/30 dark:border-white/20 text-xs text-slate-700 dark:text-slate-300 font-medium backdrop-blur-sm">
                      投资者
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-700/20 dark:bg-white/10 border border-slate-500/30 dark:border-white/20 text-xs text-slate-700 dark:text-slate-300 font-medium backdrop-blur-sm">
                      内容创作者
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-700/20 dark:bg-white/10 border border-slate-500/30 dark:border-white/20 text-xs text-slate-700 dark:text-slate-300 font-medium backdrop-blur-sm">
                      Web3 探索者
                    </span>
                  </div>
                </div>

                {/* 右侧：文案区域 */}
                <div className="flex-1 text-center md:text-left">
                  {/* 标题 */}
                  <h2 className="text-3xl md:text-4xl font-bold tracking-wide text-slate-900 dark:text-white mb-4">
                    关于作者
                  </h2>
                  
                  {/* 正文 */}
                  <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6 max-w-2xl mx-auto md:mx-0">
                    我是一名崇尚长期主义的投资者。我建立这个网站是为了整理和分享高价值的投资资源，
                    帮助更多人在快速变化的市场中找到理性的投资路径。我相信通过系统化的学习和工具，
                    每个人都能成为更聪明的投资者。
                  </p>

                  {/* 社会认同标签 */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-8">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-700/10 dark:bg-white/5 border border-slate-500/20 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300">
                      <span>🚀</span>
                      <span>全网粉丝 10W+</span>
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-700/10 dark:bg-white/5 border border-slate-500/20 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300">
                      <span>☕️</span>
                      <span>长期主义践行者</span>
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-700/10 dark:bg-white/5 border border-slate-500/20 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300">
                      <span>📊</span>
                      <span>10+ 年投资经验</span>
                    </span>
                  </div>

                  {/* 社交链接按钮组 */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <a
                      href="https://twitter.com/investwise"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-700/20 dark:bg-white/10 hover:bg-slate-700/30 dark:hover:bg-white/20 text-slate-800 dark:text-white backdrop-blur-sm border border-slate-500/30 dark:border-white/10 hover:border-slate-600/40 dark:hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-lg"
                    >
                      <Twitter className="h-5 w-5 text-slate-700 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors" />
                      <span className="font-medium">Twitter (X)</span>
                    </a>
                    <a
                      href="https://www.xiaohongshu.com/user/investwise"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-700/20 dark:bg-white/10 hover:bg-slate-700/30 dark:hover:bg-white/20 text-slate-800 dark:text-white backdrop-blur-sm border border-slate-500/30 dark:border-white/10 hover:border-slate-600/40 dark:hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-lg"
                    >
                      <BookOpen className="h-5 w-5 text-slate-700 dark:text-white group-hover:text-red-500 dark:group-hover:text-red-300 transition-colors" />
                      <span className="font-medium">小红书</span>
                    </a>
                    <a
                      href="mailto:hello@investwise.com"
                      className="group flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-700/20 dark:bg-white/10 hover:bg-slate-700/30 dark:hover:bg-white/20 text-slate-800 dark:text-white backdrop-blur-sm border border-slate-500/30 dark:border-white/10 hover:border-slate-600/40 dark:hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-lg"
                    >
                      <Mail className="h-5 w-5 text-slate-700 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-300 transition-colors" />
                      <span className="font-medium">Email</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
