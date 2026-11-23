'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTransaction(formData: {
  type: 'expense' | 'income'
  amount: number
  categoryId: string
  description?: string
  transactionDate: string
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Avtorizatsiya talab qilinadi' }
  }

  if (!formData.amount || formData.amount <= 0) {
    return { error: "Summa 0 dan katta bo'lishi kerak" }
  }

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    type: formData.type,
    amount: formData.amount,
    category_id: formData.categoryId,
    description: formData.description || null,
    transaction_date: formData.transactionDate,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/xarajatlar')
  revalidatePath('/dashboard/daromadlar')
  revalidatePath('/dashboard/statistika')
  revalidatePath('/dashboard/budjet')
  return { success: true }
}

export async function updateTransaction(
  id: string,
  formData: {
    type: 'expense' | 'income'
    amount: number
    categoryId: string
    description?: string
    transactionDate: string
  }
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Avtorizatsiya talab qilinadi' }
  }

  if (!formData.amount || formData.amount <= 0) {
    return { error: "Summa 0 dan katta bo'lishi kerak" }
  }

  const { error } = await supabase
    .from('transactions')
    .update({
      type: formData.type,
      amount: formData.amount,
      category_id: formData.categoryId,
      description: formData.description || null,
      transaction_date: formData.transactionDate,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/xarajatlar')
  revalidatePath('/dashboard/daromadlar')
  revalidatePath('/dashboard/statistika')
  revalidatePath('/dashboard/budjet')
  return { success: true }
}

export async function deleteTransaction(id: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Avtorizatsiya talab qilinadi' }
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/xarajatlar')
  revalidatePath('/dashboard/daromadlar')
  revalidatePath('/dashboard/statistika')
  revalidatePath('/dashboard/budjet')
  return { success: true }
}
