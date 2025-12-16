import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ToolItem } from '@/data/tools'

interface ToolCardProps {
  tool: ToolItem
}

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <Card className="group border-zinc-800 bg-zinc-950 transition-all hover:-translate-y-1 hover:border-zinc-500">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg tracking-tight">{tool.name}</CardTitle>
          {tool.isAffiliate && (
            <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-muted-foreground">
              推荐
            </span>
          )}
        </div>
        <CardDescription className="text-muted-foreground">
          {tool.desc}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full border-zinc-800 hover:border-zinc-500"
          asChild
        >
          <Link href={tool.url} target="_blank" rel="noopener noreferrer">
            访问
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
