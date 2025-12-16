import { CopyButton } from '@/components/CopyButton'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { affiliatesData } from '@/data/affiliates'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function BenefitsPage() {
  return (
    <div className="bg-page-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold tracking-wide font-heading">
          福利/开户
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 font-body">
          精选的交易所和平台邀请码，通过我们的链接注册可获得额外优惠
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {affiliatesData.map((affiliate, index) => (
          <Card
            key={index}
            className={cn(
              'border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg',
              affiliate.isRecommended && 'border-amber-500/30'
            )}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl tracking-wide font-heading">
                    {affiliate.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {affiliate.description}
                  </CardDescription>
                </div>
                {affiliate.isRecommended && (
                  <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                    推荐
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 font-body">邀请码</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 rounded-md bg-secondary text-foreground font-mono text-sm">
                      {affiliate.inviteCode}
                    </code>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-500">
                    {affiliate.benefit}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <CopyButton
                text={affiliate.inviteCode}
                className="w-full"
              />
              <Button
                variant="outline"
                className="w-full border-border hover:border-border/80"
                asChild
              >
                <Link href={affiliate.url} target="_blank" rel="noopener noreferrer">
                  访问网站
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      </div>
    </div>
  )
}
