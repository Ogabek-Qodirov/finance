import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-forest/5 flex items-center justify-center mb-4">
          <Icon className="h-7 w-7 text-forest" />
        </div>
      )}
      <h4 className="font-display text-lg font-bold text-darkText mb-1">{title}</h4>
      {description && <p className="text-sm text-mutedText max-w-sm mb-5">{description}</p>}
      {action && (
        <Button onClick={action.onClick} variant="primary" size="md">
          {action.label}
        </Button>
      )}
    </div>
  )
}
