import { allPosts } from '.contentlayer/generated'
import { PostCard } from '@/components/PostCard'
import { Sidebar } from '@/components/Sidebar'

const sidebarItems = [
  { title: '全部', href: '/blog' },
  { title: '美股', href: '/blog?tag=美股' },
  { title: '加密货币', href: '/blog?tag=加密货币' },
  { title: '策略分析', href: '/blog?tag=策略' },
]

export default function BlogPage() {
  const posts = allPosts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="bg-page-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-10">
          <Sidebar items={sidebarItems} />
          <div>
            <div className="mb-12">
              <h1 className="mb-4 text-4xl font-bold tracking-wide font-heading">
                资讯/研报
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 font-body">
                深度投资分析和市场洞察
              </p>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-600 dark:text-slate-400 font-body">暂无文章，敬请期待...</p>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2">
                {posts.map((post) => (
                  <PostCard
                    key={post.slug}
                    title={post.title}
                    desc={post.desc}
                    date={post.date}
                    slug={post.slug}
                    tags={post.tags}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
