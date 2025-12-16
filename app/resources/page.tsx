'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { tweetsData, categories, types } from '@/data/tweets'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function ResourcesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const allTags = Array.from(new Set(tweetsData.flatMap(t => t.tags)))

  const filteredTweets = tweetsData.filter(tweet => {
    if (selectedCategory && tweet.category !== selectedCategory) return false
    if (selectedTags.length > 0 && !selectedTags.some(tag => tweet.tags.includes(tag))) return false
    return true
  })

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  return (
    <div className="bg-page-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold tracking-wide font-heading">
            推文/干货索引
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-body">
            精选的高价值推文和投资干货,按分类和标签整理
          </p>
        </div>

        {/* 筛选器 */}
        <div className="mb-8 space-y-4">
          <div>
            <p className="text-sm font-medium mb-2 text-foreground">分类:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                全部
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2 text-foreground">标签:</p>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* 列表 */}
        <div className="space-y-4">
          {filteredTweets.map((tweet, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-white dark:bg-card hover:shadow-md transition-all"
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 text-foreground font-heading">
                  {tweet.title}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{tweet.category}</Badge>
                  <Badge variant="secondary">{tweet.type}</Badge>
                  {tweet.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <a
                  href={tweet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  跳转阅读
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
