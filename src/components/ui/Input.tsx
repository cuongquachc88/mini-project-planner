import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full bg-white/[0.04] border border-white/[0.09] rounded-md px-3 py-1.5 text-xs text-white',
      'focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.06] placeholder:text-white/25 transition-all',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      className,
    )}
    {...props}
  />
))
Input.displayName = 'Input'
