import { ExternalLink } from 'lucide-react'
import { navLinksData, categories } from '@/data/nav-links'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NavPage() {
  return (
    <div className="bg-page-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold tracking-wide font-heading">
            常用导航
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-body">
            精选的投资工具和数据分析平台
          </p>
        </div>

        {categories.map(category => {
          const links = navLinksData.filter(link => link.category === category)
          if (links.length === 0) return null

          return (
            <section key={category} className="mb-16">
              <h2 className="mb-8 text-2xl font-semibold tracking-wide font-heading">
                {category}
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {links.map((link, index) => (
                  <Card key={index} className="border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl tracking-wide font-heading">
                        {link.name}
                      </CardTitle>
                      <CardDescription>
                        {link.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" asChild className="w-full">
                        <Link href={link.url} target="_blank" rel="noopener noreferrer">
                          访问网站
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
