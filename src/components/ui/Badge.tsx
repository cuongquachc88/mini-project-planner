import { cn } from '@/lib/utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'

const badge = cva('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      default: 'bg-slate-700 text-slate-200',
      brand: 'bg-brand-500/20 text-brand-300',
      success: 'bg-emerald-500/20 text-emerald-300',
      warning: 'bg-amber-500/20 text-amber-300',
      danger: 'bg-red-500/20 text-red-300',
      info: 'bg-sky-500/20 text-sky-300',
    },
  },
  defaultVariants: { variant: 'default' },
})

interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badge> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badge({ variant }), className)} {...props} />
}
