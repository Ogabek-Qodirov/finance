import { createClient } from '@/lib/supabase/client'
import { Account } from '@/types'

export async function getAccounts(userId: string): Promise<Account[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('account_type', { ascending: true })

  if (error) {
    console.error('getAccounts error:', error)
    return []
  }
  return (data || []) as Account[]
}

export async function getAccountBalances(userId: string): Promise<{
  cashBalance: number
  bankBalance: number
  totalBalance: number
  cashAccount: Account | null
  bankAccount: Account | null
}> {
  const accounts = await getAccounts(userId)
  const cashAccount = accounts.find((a) => a.account_type === 'cash') || null
  const bankAccount = accounts.find((a) => a.account_type === 'bank') || null
  const cashBalance = Number(cashAccount?.balance || 0)
  const bankBalance = Number(bankAccount?.balance || 0)
  return {
    cashBalance,
    bankBalance,
    totalBalance: cashBalance + bankBalance,
    cashAccount,
    bankAccount,
  }
}
