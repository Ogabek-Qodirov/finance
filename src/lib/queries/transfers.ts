import { createClient } from '@/lib/supabase/client'
import { Transfer } from '@/types'

export async function getTransfers(userId: string, limit = 50): Promise<Transfer[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('transfers')
    .select(
      `*, from_account:accounts!transfers_from_account_id_fkey(id, name, account_type), to_account:accounts!transfers_to_account_id_fkey(id, name, account_type)`
    )
    .eq('user_id', userId)
    .order('transfer_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('getTransfers error:', error)
    return []
  }
  return (data || []) as Transfer[]
}
