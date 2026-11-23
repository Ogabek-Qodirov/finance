'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCategory(name: string, color: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Avtorizatsiya talab qilinadi' }
  }

  if (!name.trim()) {
    return { error: 'Kategoriya nomi kiritilishi shart' }
  }

  const { error } = await supabase.from('categories').insert({
    user_id: user.id,
    name: name.trim(),
    color: color || '#234B38',
    icon: 'circle',
    is_default: false,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/kategoriyalar')
  return { success: true }
}

export async function updateCategory(id: string, name: string, color: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Avtorizatsiya talab qilinadi' }
  }

  const { error } = await supabase
    .from('categories')
    .update({ name: name.trim(), color })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/kategoriyalar')
  return { success: true }
}

export async function deleteCategory(id: string, replacementCategoryId?: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Avtorizatsiya talab qilinadi' }
  }

  if (replacementCategoryId) {
    await supabase
      .from('transactions')
      .update({ category_id: replacementCategoryId })
      .eq('category_id', id)
      .eq('user_id', user.id)
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/kategoriyalar')
  revalidatePath('/dashboard')
  return { success: true }
}
