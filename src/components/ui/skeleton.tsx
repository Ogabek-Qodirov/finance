import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('skeleton', className)} {...props} />
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-darkText/5 space-y-3">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-darkText/5">
      <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-2.5 w-24" />
      </div>
      <Skeleton className="h-5 w-28" />
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-darkText/5 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-32 rounded-xl" />
      </div>
      <div className="flex items-end gap-2 h-44 pt-4">
        {[50, 75, 40, 85, 65, 55, 90, 60, 70, 45, 80, 60].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}
