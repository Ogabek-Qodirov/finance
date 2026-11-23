export type TransactionType = 'expense' | 'income'

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string | null
  name: string
  color: string
  icon: string
  is_default: boolean
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string | null
  type: TransactionType
  amount: number
  description: string | null
  transaction_date: string
  created_at: string
  updated_at: string
  category?: Category
}

export interface Budget {
  id: string
  user_id: string
  month: number
  year: number
  amount: number
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  currency: string
  language: string
  timezone: string
  created_at: string
  updated_at: string
}

export interface TransactionFilters {
  dateFrom?: string
  dateTo?: string
  month?: number
  year?: number
  categoryId?: string
  type?: TransactionType | 'all'
  minAmount?: number
  maxAmount?: number
  search?: string
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest'
}

export interface MonthlyStats {
  totalExpenses: number
  totalIncome: number
  netBalance: number
  transactionCount: number
  avgDailyExpenses: number
}

export interface CategoryStats {
  category: Category
  total: number
  percentage: number
  count: number
}

export interface DailyExpense {
  date: string
  day: number
  expenses: number
  income: number
}

export interface MonthlyComparison {
  currentExpenses: number
  previousExpenses: number
  currentIncome: number
  previousIncome: number
  expenseChange: number
  incomeChange: number
}

export interface BudgetStatus {
  budget: Budget | null
  spent: number
  remaining: number
  percentage: number
  status: 'safe' | 'warning' | 'danger' | 'exceeded'
}
