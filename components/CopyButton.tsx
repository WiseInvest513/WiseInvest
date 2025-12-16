'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
  text: string
  className?: string
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Button
      onClick={handleCopy}
      variant="default"
      className={cn('gap-2', className)}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          <span>已复制</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          <span>复制邀请码</span>
        </>
      )}
    </Button>
  )
}
