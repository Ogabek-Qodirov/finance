import { createClient } from '@/lib/supabase/client'
import { MonthlyComparison } from '@/types'
import { getMonthlyStats } from './transactions'
import { getMonthDateRange } from '@/lib/utils'

export async function getMonthlyComparison(userId: string, month: number, year: number): Promise<MonthlyComparison> {
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year

  const [current, previous] = await Promise.all([
    getMonthlyStats(userId, month, year),
    getMonthlyStats(userId, prevMonth, prevYear),
  ])

  const expenseChange =
    previous.totalExpenses > 0
      ? Math.round(((current.totalExpenses - previous.totalExpenses) / previous.totalExpenses) * 100)
      : current.totalExpenses > 0
      ? 100
      : 0

  const incomeChange =
    previous.totalIncome > 0
      ? Math.round(((current.totalIncome - previous.totalIncome) / previous.totalIncome) * 100)
      : current.totalIncome > 0
      ? 100
      : 0

  return {
    currentExpenses: current.totalExpenses,
    previousExpenses: previous.totalExpenses,
    currentIncome: current.totalIncome,
    previousIncome: previous.totalIncome,
    expenseChange,
    incomeChange,
  }
}

export async function getHighestSpendingDay(userId: string, month: number, year: number) {
  const supabase = createClient()
  const { start, end } = getMonthDateRange(month, year)

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, transaction_date')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .gte('transaction_date', start)
    .lte('transaction_date', end)

  if (error || !data || data.length === 0) {
    return null
  }

  const dayMap = new Map<string, number>()
  for (const t of data) {
    const existing = dayMap.get(t.transaction_date) || 0
    dayMap.set(t.transaction_date, existing + Number(t.amount || 0))
  }

  let maxDate = ''
  let maxAmount = 0
  dayMap.forEach((amt, date) => {
    if (amt > maxAmount) {
      maxAmount = amt
      maxDate = date
    }
  })

  return maxDate ? { date: maxDate, amount: maxAmount } : null
}
