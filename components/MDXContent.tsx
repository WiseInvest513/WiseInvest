'use client'

import { useMDXComponent } from 'next-contentlayer/hooks'

interface MDXContentProps {
  code: string
}

export function MDXContent({ code }: MDXContentProps) {
  const Component = useMDXComponent(code)
  return (
    <div className="prose prose-invert prose-zinc max-w-none">
      <Component />
    </div>
  )
}
