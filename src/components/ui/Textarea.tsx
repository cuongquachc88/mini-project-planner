import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full bg-white/[0.04] border border-white/[0.09] rounded-md px-3 py-1.5 text-xs text-white',
      'focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.06] placeholder:text-white/25 transition-all resize-none',
      className,
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'
