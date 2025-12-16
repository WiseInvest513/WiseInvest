import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface PostCardProps {
  title: string
  desc: string
  date: string
  slug: string
  tags?: string[]
  basePath?: string
}

export function PostCard({ title, desc, date, slug, tags, basePath = '/blog' }: PostCardProps) {
  return (
    <Link href={`${basePath}/${slug}`}>
      <Card className="group border-border bg-white dark:bg-card transition-all hover:-translate-y-1 hover:shadow-lg hover:border-brand-accent/30">
        <CardHeader>
          <CardTitle className="text-xl tracking-wide group-hover:text-foreground font-heading">
            {title}
          </CardTitle>
          <CardDescription>
            {format(new Date(date), 'yyyy年MM月dd日')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 font-body">{desc}</p>
          {tags && tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-2 py-1 text-xs text-slate-600 dark:text-slate-400 font-body"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
