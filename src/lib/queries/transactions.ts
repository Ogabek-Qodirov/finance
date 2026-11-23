import { createClient } from '@/lib/supabase/client'
import { Transaction, TransactionFilters, MonthlyStats, CategoryStats, DailyExpense } from '@/types'
import { getMonthDateRange } from '@/lib/utils'

export async function getTransactions(userId: string, filters?: TransactionFilters): Promise<Transaction[]> {
  const supabase = createClient()
  let query = supabase
    .from('transactions')
    .select(`*, category:categories(id, name, color, icon), account:accounts(id, name, account_type)`)
    .eq('user_id', userId)

  if (filters?.type && filters.type !== 'all') {
    query = query.eq('type', filters.type)
  }
  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }
  if (filters?.accountId) {
    query = query.eq('account_id', filters.accountId)
  }
  if (filters?.dateFrom) {
    query = query.gte('transaction_date', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('transaction_date', filters.dateTo)
  }
  if (filters?.month && filters?.year) {
    const { start, end } = getMonthDateRange(filters.month, filters.year)
    query = query.gte('transaction_date', start).lte('transaction_date', end)
  }
  if (filters?.minAmount) {
    query = query.gte('amount', filters.minAmount)
  }
  if (filters?.maxAmount) {
    query = query.lte('amount', filters.maxAmount)
  }
  if (filters?.search) {
    query = query.ilike('description', `%${filters.search}%`)
  }

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: 'transaction_date', ascending: false },
    oldest: { column: 'transaction_date', ascending: true },
    highest: { column: 'amount', ascending: false },
    lowest: { column: 'amount', ascending: true },
  }
  const sort = sortMap[filters?.sortBy || 'newest']
  query = query.order(sort.column, { ascending: sort.ascending }).order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) {
    console.error('getTransactions error:', error)
    return []
  }
  return (data || []) as Transaction[]
}

export async function getRecentTransactions(userId: string, limit = 10): Promise<Transaction[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select(`*, category:categories(id, name, color, icon), account:accounts(id, name, account_type)`)
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('getRecentTransactions error:', error)
    return []
  }
  return (data || []) as Transaction[]
}

export async function getMonthlyStats(userId: string, month: number, year: number): Promise<MonthlyStats> {
  const supabase = createClient()
  const { start, end } = getMonthDateRange(month, year)

  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount, transaction_date, account:accounts(account_type)')
    .eq('user_id', userId)
    .gte('transaction_date', start)
    .lte('transaction_date', end)

  if (error) {
    console.error('getMonthlyStats error:', error)
    return {
      totalExpenses: 0,
      totalIncome: 0,
      netBalance: 0,
      transactionCount: 0,
      avgDailyExpenses: 0,
      cardExpenses: 0,
      cashExpenses: 0,
    }
  }

  const transactions = (data || []) as any[]
  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount || 0), 0)
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount || 0), 0)

  const cardExpenses = transactions
    .filter((t) => t.type === 'expense' && t.account?.account_type === 'bank')
    .reduce((s, t) => s + Number(t.amount || 0), 0)

  const cashExpenses = transactions
    .filter((t) => t.type === 'expense' && t.account?.account_type === 'cash')
    .reduce((s, t) => s + Number(t.amount || 0), 0)

  const distinctExpenseDays = new Set(
    transactions.filter((t) => t.type === 'expense').map((t) => t.transaction_date)
  ).size

  return {
    totalExpenses,
    totalIncome,
    netBalance: totalIncome - totalExpenses,
    transactionCount: transactions.length,
    avgDailyExpenses: distinctExpenseDays > 0 ? Math.round(totalExpenses / distinctExpenseDays) : 0,
    cardExpenses,
    cashExpenses,
  }
}

export async function getCategoryStats(userId: string, month: number, year: number): Promise<CategoryStats[]> {
  const supabase = createClient()
  const { start, end } = getMonthDateRange(month, year)

  const { data, error } = await supabase
    .from('transactions')
    .select(`amount, type, category:categories(id, name, color, icon), account:accounts(account_type)`)
    .eq('user_id', userId)
    .eq('type', 'expense')
    .gte('transaction_date', start)
    .lte('transaction_date', end)
    .not('category_id', 'is', null)

  if (error) {
    console.error('getCategoryStats error:', error)
    return []
  }

  const categoryMap = new Map<string, { category: any; total: number; count: number; cardAmount: number; cashAmount: number }>()

  for (const t of (data || []) as any[]) {
    const cat = t.category
    if (!cat) continue
    const amt = Number(t.amount || 0)
    const isCard = t.account?.account_type === 'bank'
    const isCash = t.account?.account_type === 'cash'

    const existing = categoryMap.get(cat.id)
    if (existing) {
      existing.total += amt
      existing.count += 1
      if (isCard) existing.cardAmount += amt
      if (isCash) existing.cashAmount += amt
    } else {
      categoryMap.set(cat.id, {
        category: cat,
        total: amt,
        count: 1,
        cardAmount: isCard ? amt : 0,
        cashAmount: isCash ? amt : 0,
      })
    }
  }

  const totalExpenses = Array.from(categoryMap.values()).reduce((s, c) => s + c.total, 0)

  return Array.from(categoryMap.values())
    .map(({ category, total, count, cardAmount, cashAmount }) => ({
      category,
      total,
      count,
      cardAmount,
      cashAmount,
      percentage: totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
}

export async function getDailyExpenses(userId: string, month: number, year: number): Promise<DailyExpense[]> {
  const supabase = createClient()
  const { start, end } = getMonthDateRange(month, year)
  const daysInMonth = new Date(year, month, 0).getDate()

  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount, transaction_date')
    .eq('user_id', userId)
    .gte('transaction_date', start)
    .lte('transaction_date', end)

  if (error) {
    console.error('getDailyExpenses error:', error)
  }

  const dailyMap = new Map<number, { expenses: number; income: number }>()
  for (let d = 1; d <= daysInMonth; d++) {
    dailyMap.set(d, { expenses: 0, income: 0 })
  }

  for (const t of data || []) {
    const parts = t.transaction_date.split('-')
    const day = parseInt(parts[2], 10)
    const entry = dailyMap.get(day)
    if (entry) {
      if (t.type === 'expense') {
        entry.expenses += Number(t.amount || 0)
      } else {
        entry.income += Number(t.amount || 0)
      }
    }
  }

  return Array.from(dailyMap.entries()).map(([day, { expenses, income }]) => ({
    date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    day,
    expenses,
    income,
  }))
}
