export type TransactionType = 'expense' | 'income'
export type AccountType = 'cash' | 'bank'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'pending' | 'in_progress' | 'done'

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

export interface Account {
  id: string
  user_id: string
  name: string
  account_type: AccountType
  balance: number
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  account_id: string | null
  category_id: string | null
  type: TransactionType
  amount: number
  description: string | null
  transaction_date: string
  created_at: string
  updated_at: string
  category?: Category
  account?: Account
}

export interface Transfer {
  id: string
  user_id: string
  from_account_id: string
  to_account_id: string
  amount: number
  description: string | null
  transfer_date: string
  created_at: string
  updated_at: string
  from_account?: Account
  to_account?: Account
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
  accountId?: string
}

export interface MonthlyStats {
  totalExpenses: number
  totalIncome: number
  netBalance: number
  transactionCount: number
  avgDailyExpenses: number
  cardExpenses: number
  cashExpenses: number
}

export interface CategoryStats {
  category: Category
  total: number
  percentage: number
  count: number
  cardAmount: number
  cashAmount: number
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

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  due_date: string | null
  start_time: string | null
  end_time: string | null
  priority: TaskPriority
  status: TaskStatus
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  content: string | null
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface VaultEntry {
  id: string
  user_id: string
  platform_name: string
  website_url: string | null
  username: string | null
  email: string | null
  encrypted_payload: string
  encryption_meta: string
  encryption_version: number
  created_at: string
  updated_at: string
  // Client-side only after decryption
  decrypted_password?: string
  decrypted_notes?: string
}
