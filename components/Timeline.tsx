export function Timeline() {
  const events = [
    {
      year: '2024',
      title: '创立聪明的投资者，专注 Web3 投研',
      description: '开始系统化整理投资资源和工具',
    },
    {
      year: '2020',
      title: '开启美股定投之旅',
      description: '开始长期投资纳斯达克和标普500指数',
    },
    {
      year: 'Previous',
      title: '互联网大厂技术管理',
      description: '在科技行业积累多年经验',
    },
  ]

  return (
    <div className="relative">
      {/* 时间轴线 */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
      
      <div className="space-y-8">
        {events.map((event, index) => (
          <div key={index} className="relative flex items-start gap-6">
            {/* 时间点 */}
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-brand-accent text-brand-accent-foreground font-heading font-bold">
              {event.year}
            </div>
            
            {/* 内容 */}
            <div className="flex-1 pt-2">
              <h3 className="text-xl font-semibold mb-2 text-foreground font-heading">
                {event.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 font-body">
                {event.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
