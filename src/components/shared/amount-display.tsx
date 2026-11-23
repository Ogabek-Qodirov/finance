import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'

interface AmountDisplayProps {
  amount: number
  type?: 'expense' | 'income' | 'neutral'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showSign?: boolean
}

export function AmountDisplay({
  amount,
  type = 'neutral',
  size = 'md',
  className,
  showSign = false,
}: AmountDisplayProps) {
  const safeAmount = Math.abs(amount || 0)
  const formatted = formatCurrency(safeAmount)
  const sign = type === 'expense' ? '− ' : type === 'income' ? '+ ' : ''

  return (
    <span
      className={cn(
        'tabular-nums font-semibold tracking-tight inline-block',
        size === 'sm' && 'text-sm font-medium',
        size === 'md' && 'text-base',
        size === 'lg' && 'text-xl font-bold',
        size === 'xl' && 'text-3xl font-extrabold',
        type === 'expense' && 'text-tomato',
        type === 'income' && 'text-forest',
        type === 'neutral' && 'text-darkText',
        className
      )}
    >
      {showSign ? `${sign}${formatted}` : formatted}
    </span>
  )
}
