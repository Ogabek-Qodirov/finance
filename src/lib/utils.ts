import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency according to Uzbekistan standard:
 * e.g., 1250000 -> "1 250 000 so'm"
 */
export function formatCurrency(amount: number): string {
  const safeAmount = Math.round(Number(amount) || 0)
  const formatted = safeAmount
    .toLocaleString('uz-UZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    .replace(/,/g, ' ')
  return `${formatted} so'm`
}

export function formatNumber(amount: number): string {
  const safeAmount = Math.round(Number(amount) || 0)
  return safeAmount.toLocaleString('uz-UZ').replace(/,/g, ' ')
}

export const UZBEK_MONTHS = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'Iyun',
  'Iyul',
  'Avgust',
  'Sentabr',
  'Oktabr',
  'Noyabr',
  'Dekabr',
]

export const UZBEK_DAYS = [
  'Yakshanba',
  'Dushanba',
  'Seshanba',
  'Chorshanba',
  'Payshanba',
  'Juma',
  'Shanba',
]

export function formatDate(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (isNaN(date.getTime())) return ''
  const day = date.getDate()
  const month = UZBEK_MONTHS[date.getMonth()]
  const year = date.getFullYear()
  return `${day}-${month.toLowerCase()}, ${year}`
}

export function formatDateShort(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (isNaN(date.getTime())) return ''
  const day = date.getDate()
  const month = UZBEK_MONTHS[date.getMonth()]
  return `${day} ${month}`
}

export function getMonthName(month: number): string {
  return UZBEK_MONTHS[month - 1] || ''
}

export function getCurrentGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Xayrli tong'
  if (hour >= 12 && hour < 18) return 'Xayrli kun'
  return 'Xayrli kech'
}

export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

export function getTodayUzbekDate(): string {
  const now = new Date()
  const day = now.getDate()
  const month = UZBEK_MONTHS[now.getMonth()]
  const year = now.getFullYear()
  const weekday = UZBEK_DAYS[now.getDay()]
  return `${day}-${month.toLowerCase()}, ${year}, ${weekday}`
}

export function getPercentageChange(current: number, previous: number): number {
  if (!previous || previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export function getMonthDateRange(month: number, year: number): { start: string; end: string } {
  const lastDay = new Date(year, month, 0).getDate()
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}
