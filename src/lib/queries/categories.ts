import { createClient } from '@/lib/supabase/client'
import { Category } from '@/types'

export async function getCategories(userId: string): Promise<Category[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true })

  if (error) {
    console.error('getCategories error:', error)
    return []
  }
  return (data || []) as Category[]
}

export async function getCategoryTransactionCount(categoryId: string, userId: string): Promise<number> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId)
    .eq('user_id', userId)

  if (error) {
    console.error('getCategoryTransactionCount error:', error)
    return 0
  }
  return count || 0
}
