'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createNote(data: { title: string; content?: string }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Avtorizatsiya talab qilinadi' }

  const { data: note, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      title: data.title || 'Yangi qayd',
      content: data.content || null,
      is_pinned: false,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/qaydlar')
  return { success: true, note }
}

export async function updateNote(
  id: string,
  data: Partial<{ title: string; content: string; is_pinned: boolean }>
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Avtorizatsiya talab qilinadi' }

  const { error } = await supabase
    .from('notes')
    .update(data)
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/qaydlar')
  return { success: true }
}

export async function deleteNote(id: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Avtorizatsiya talab qilinadi' }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/qaydlar')
  return { success: true }
}
