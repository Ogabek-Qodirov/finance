import { createClient } from '@/lib/supabase/client'
import { Budget, BudgetStatus } from '@/types'
import { getMonthDateRange } from '@/lib/utils'

export async function getBudget(userId: string, month: number, year: number): Promise<Budget | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)
    .maybeSingle()

  if (error) {
    console.error('getBudget error:', error)
    return null
  }
  return data as Budget | null
}

export async function getBudgetStatus(userId: string, month: number, year: number): Promise<BudgetStatus> {
  const supabase = createClient()
  const { start, end } = getMonthDateRange(month, year)

  const [budgetResult, spentResult] = await Promise.all([
    supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle(),
    supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('transaction_date', start)
      .lte('transaction_date', end),
  ])

  const budget = budgetResult.data as Budget | null
  const spent = (spentResult.data || []).reduce((s: number, t: any) => s + Number(t.amount || 0), 0)
  const budgetAmount = Number(budget?.amount || 0)
  const remaining = budgetAmount - spent
  const percentage = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0

  let status: BudgetStatus['status'] = 'safe'
  if (percentage >= 100) {
    status = 'exceeded'
  } else if (percentage >= 90) {
    status = 'danger'
  } else if (percentage >= 75) {
    status = 'warning'
  }

  return { budget, spent, remaining, percentage, status }
}

export async function getBudgetHistory(userId: string, monthsBack = 6) {
  const now = new Date()
  const months = []

  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ month: d.getMonth() + 1, year: d.getFullYear() })
  }

  const results = await Promise.all(
    months.map((m) => getBudgetStatus(userId, m.month, m.year))
  )

  return months.map((m, i) => ({ ...m, ...results[i] }))
}
