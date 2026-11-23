'use client'
import { useToast } from '@/hooks/use-toast'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 w-84 max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 rounded-2xl p-4 shadow-modal border animate-slideUp text-sm font-medium',
            t.variant === 'success' && 'bg-forest text-cream border-forest-dark',
            t.variant === 'error' && 'bg-tomato text-white border-tomato-dark',
            t.variant === 'warning' && 'bg-mustard text-darkText border-mustard-dark',
            (!t.variant || t.variant === 'info') && 'bg-white text-darkText border-darkText/10'
          )}
        >
          <div className="flex-shrink-0 mt-0.5">
            {t.variant === 'success' && <CheckCircle2 className="h-4 w-4 text-cream" />}
            {t.variant === 'error' && <AlertCircle className="h-4 w-4 text-white" />}
            {t.variant === 'warning' && <AlertTriangle className="h-4 w-4 text-darkText" />}
            {(!t.variant || t.variant === 'info') && <Info className="h-4 w-4 text-forest" />}
          </div>
          <div className="flex-1 leading-snug">{t.message}</div>
          <button
            onClick={() => dismiss(t.id)}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity p-0.5 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
