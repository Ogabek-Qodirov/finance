import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined)
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-darkText">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-darkText placeholder:text-mutedText/70',
            'resize-none transition-all duration-150 min-h-[90px]',
            'focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent',
            error ? 'border-tomato' : 'border-darkText/15 hover:border-darkText/30',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-tomato font-medium">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
export { Textarea }
