import { cn } from '@/lib/utils/cn'

export function PointsBadge({ points, className }: { points: number | null; className?: string }) {
  if (points == null) return null
  return (
    <span className={cn(
      'inline-flex items-center justify-center min-w-[18px] h-[18px] rounded px-1 text-[10px] font-semibold',
      'bg-violet-500/10 text-violet-400 border border-violet-500/20',
      className,
    )}>
      {points}
    </span>
  )
}
