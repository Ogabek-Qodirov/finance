import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'expense' | 'income' | 'warning' | 'danger' | 'success' | 'outline'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
        variant === 'default' && 'bg-forest/10 text-forest',
        variant === 'expense' && 'bg-tomato/10 text-tomato',
        variant === 'income' && 'bg-forest/10 text-forest',
        variant === 'warning' && 'bg-mustard/20 text-darkText',
        variant === 'danger' && 'bg-tomato/15 text-tomato',
        variant === 'success' && 'bg-forest/10 text-forest',
        variant === 'outline' && 'border border-darkText/15 text-darkText',
        className
      )}
      {...props}
    />
  )
}
