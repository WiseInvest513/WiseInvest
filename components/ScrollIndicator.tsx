import { ChevronDown } from 'lucide-react'

export function ScrollIndicator() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
      <ChevronDown className="h-6 w-6 text-slate-600 dark:text-white/70" />
    </div>
  )
}
