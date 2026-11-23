import { createClient } from '@/lib/supabase/client'
import { Task } from '@/types'

export async function getTasks(userId: string): Promise<Task[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getTasks error:', error)
    return []
  }
  return (data || []) as Task[]
}
