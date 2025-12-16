import { Sidebar } from '@/components/Sidebar'

const sidebarItems = [
  { title: '美股入门', href: '#美股入门' },
  { title: '加密货币', href: '#加密货币' },
  { title: '技术分析', href: '#技术分析' },
]

export default function CollectionsPage() {
  return (
    <div className="container mx-auto px-8 py-16">
      <div className="flex gap-16">
        <Sidebar items={sidebarItems} />
        <div className="flex-1">
          <div className="mb-12">
            <h1 className="mb-4 text-4xl font-bold tracking-tight">
              合集教程
            </h1>
            <p className="text-lg text-muted-foreground">
              系统化的投资学习路径
            </p>
          </div>
          <div className="text-center py-16">
            <p className="text-muted-foreground">内容即将上线，敬请期待...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
