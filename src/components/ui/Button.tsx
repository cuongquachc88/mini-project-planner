import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'

const button = cva(
  'inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none disabled:opacity-40 disabled:pointer-events-none select-none',
  {
    variants: {
      variant: {
        default:     'bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white shadow-sm shadow-black/20',
        ghost:       'text-white/50 hover:text-white hover:bg-white/[0.06]',
        outline:     'border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.06] hover:border-white/20',
        destructive: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20',
        link:        'text-violet-400 hover:text-violet-300 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm:   'text-[11px] px-2.5 py-1 rounded-md gap-1.5',
        md:   'text-xs px-3 py-1.5 rounded-lg gap-2',
        lg:   'text-xs px-4 py-2 rounded-lg gap-2',
        icon: 'p-1 rounded-md',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
)

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(button({ variant, size }), className)} {...props} />
))
Button.displayName = 'Button'
