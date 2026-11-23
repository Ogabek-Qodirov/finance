import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LoadingSpinner({
  className,
  label = 'Yuklanmoqda...',
}: {
  className?: string
  label?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 gap-3', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-forest" />
      {label && <p className="text-sm text-mutedText font-medium">{label}</p>}
    </div>
  )
}
