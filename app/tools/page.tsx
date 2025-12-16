'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalculatorModal } from '@/components/CalculatorModal'
import { APIModal } from '@/components/APIModal'
import { cn } from '@/lib/utils'

// 工具数据
const toolsData = [
  {
    id: 'calculator',
    name: '复利计算器',
    description: '设定目标，计算时间的复利价值',
    icon: '💰',
    status: 'available' as const,
  },
  {
    id: 'api',
    name: '开发者 API',
    description: '获取加密货币与金融数据接口',
    icon: '🔌',
    status: 'coming-soon' as const,
  },
]

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState<string | null>(null)

  const handleToolClick = (toolId: string) => {
    setActiveTool(toolId)
  }

  const handleCloseModal = () => {
    setActiveTool(null)
  }

  return (
    <>
      <div className="bg-page-bg min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="mb-12">
            <h1 className="mb-4 text-4xl font-bold tracking-wide font-heading">
              实用工具
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-body">
              精选的投资工具，帮助您更高效地进行投资决策
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {toolsData.map((tool) => (
              <Card
                key={tool.id}
                className={cn(
                  'border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer',
                  tool.status === 'coming-soon' && 'opacity-75'
                )}
                onClick={() => {
                  if (tool.status === 'available') {
                    handleToolClick(tool.id)
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{tool.icon}</div>
                      <div>
                        <CardTitle className="text-xl tracking-wide font-heading">
                          {tool.name}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {tool.description}
                        </CardDescription>
                      </div>
                    </div>
                    {tool.status === 'coming-soon' && (
                      <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* 工具模态框 */}
      {activeTool === 'calculator' && (
        <CalculatorModal open={true} onClose={handleCloseModal} />
      )}
      {activeTool === 'api' && (
        <APIModal open={true} onClose={handleCloseModal} />
      )}
    </>
  )
}
