import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined)
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-darkText">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'h-11 w-full rounded-xl border bg-white px-3.5 py-2 text-sm text-darkText placeholder:text-mutedText/70',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent',
            error ? 'border-tomato focus:ring-tomato' : 'border-darkText/15 hover:border-darkText/30',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-tomato font-medium">{error}</p>}
        {hint && !error && <p className="text-xs text-mutedText">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export { Input }
