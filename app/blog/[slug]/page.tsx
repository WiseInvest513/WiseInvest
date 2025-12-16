import { notFound } from 'next/navigation'
import { allPosts } from '.contentlayer/generated'
import { format } from 'date-fns'
import { MDXContent } from '@/components/MDXContent'

export async function generateStaticParams() {
  return allPosts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = allPosts.find((post) => post.slug === slug)

  if (!post) {
    return {}
  }

  return {
    title: post.title,
    description: post.desc,
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = allPosts.find((post) => post.slug === slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="bg-page-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <article>
          <header className="mb-12">
            <h1 className="mb-4 text-4xl font-bold tracking-wide font-heading">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 font-body">
              <time dateTime={post.date}>
                {format(new Date(post.date), 'yyyy年MM月dd日')}
              </time>
              {post.tags && post.tags.length > 0 && (
                <div className="flex gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-secondary px-2 py-1 text-xs text-slate-600 dark:text-slate-400 font-body"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>
          <MDXContent code={post.body.code} />
        </article>
      </div>
    </div>
  )
}
