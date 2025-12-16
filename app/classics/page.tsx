import { allPosts } from '.contentlayer/generated'
import { PostCard } from '@/components/PostCard'

export default function ClassicsPage() {
  const classics = allPosts.filter(post => post.tags?.includes('经典'))

  return (
    <div className="bg-page-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold tracking-wide font-heading">
            经典文集
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-body">
            投资大师的智慧结晶，值得反复阅读
          </p>
        </div>

        {classics.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-600 dark:text-slate-400 font-body">暂无文章，敬请期待...</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {classics.map((post) => (
              <PostCard
                key={post.slug}
                title={post.title}
                desc={post.desc}
                date={post.date}
                slug={post.slug}
                tags={post.tags}
                basePath="/classics"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
