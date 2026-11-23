'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTask(data: {
  title: string
  description?: string
  dueDate?: string
  startTime?: string
  endTime?: string
  priority: 'low' | 'medium' | 'high'
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Avtorizatsiya talab qilinadi' }

  const { error } = await supabase.from('tasks').insert({
    user_id: user.id,
    title: data.title,
    description: data.description || null,
    due_date: data.dueDate || null,
    start_time: data.startTime || null,
    end_time: data.endTime || null,
    priority: data.priority,
    status: 'pending' as const,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/vazifalar')
  return { success: true }
}

export async function updateTask(
  id: string,
  data: Partial<{
    title: string
    description: string | null
    dueDate: string | null
    startTime: string | null
    endTime: string | null
    priority: 'low' | 'medium' | 'high'
    status: 'pending' | 'in_progress' | 'done'
    sortOrder: number
  }>
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Avtorizatsiya talab qilinadi' }

  const updateData: Record<string, unknown> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.dueDate !== undefined) updateData.due_date = data.dueDate
  if (data.startTime !== undefined) updateData.start_time = data.startTime
  if (data.endTime !== undefined) updateData.end_time = data.endTime
  if (data.priority !== undefined) updateData.priority = data.priority
  if (data.status !== undefined) updateData.status = data.status
  if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder

  const { error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/vazifalar')
  return { success: true }
}

export async function deleteTask(id: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Avtorizatsiya talab qilinadi' }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/vazifalar')
  return { success: true }
}
