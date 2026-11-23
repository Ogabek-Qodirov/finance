import { createClient } from '@/lib/supabase/client'
import { VaultEntry } from '@/types'

export async function getVaultEntries(userId: string): Promise<VaultEntry[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('password_vault')
    .select('*')
    .eq('user_id', userId)
    .order('platform_name', { ascending: true })

  if (error) {
    console.error('getVaultEntries error:', error)
    return []
  }
  return (data || []) as VaultEntry[]
}
