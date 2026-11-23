'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthName } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface MonthSelectorProps {
  month: number
  year: number
  onChange: (month: number, year: number) => void
}

export function MonthSelector({ month, year, onChange }: MonthSelectorProps) {
  const prev = () => {
    if (month === 1) {
      onChange(12, year - 1)
    } else {
      onChange(month - 1, year)
    }
  }

  const next = () => {
    const now = new Date()
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) {
      return
    }
    if (month === 12) {
      onChange(1, year + 1)
    } else {
      onChange(month + 1, year)
    }
  }

  const isCurrentMonth = () => {
    const now = new Date()
    return month === now.getMonth() + 1 && year === now.getFullYear()
  }

  return (
    <div className="flex items-center gap-1.5 bg-cream/80 p-1 rounded-xl border border-darkText/10">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={prev}
        className="h-8 w-8 hover:bg-white"
        aria-label="Oldingi oy"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="font-medium text-darkText text-sm px-2 min-w-[125px] text-center select-none">
        {getMonthName(month)} {year}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={next}
        disabled={isCurrentMonth()}
        className="h-8 w-8 hover:bg-white disabled:opacity-30"
        aria-label="Keyingi oy"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
