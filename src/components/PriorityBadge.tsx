import type { Priority } from '@/types/db'
import { cn } from '@/lib/utils/cn'

const config: Record<Priority, { label: string; cls: string; dot: string }> = {
  critical: { label: 'Critical', cls: 'text-red-400',    dot: 'bg-red-500' },
  high:     { label: 'High',     cls: 'text-orange-400', dot: 'bg-orange-500' },
  medium:   { label: 'Medium',   cls: 'text-amber-400',  dot: 'bg-amber-500' },
  low:      { label: 'Low',      cls: 'text-white/30',   dot: 'bg-white/20' },
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const { label, cls, dot } = config[priority]
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium', cls, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
      {label}
    </span>
  )
}
