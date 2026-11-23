import { createClient } from '@/lib/supabase/client'
import { Note } from '@/types'

export async function getNotes(userId: string): Promise<Note[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('getNotes error:', error)
    return []
  }
  return (data || []) as Note[]
}
