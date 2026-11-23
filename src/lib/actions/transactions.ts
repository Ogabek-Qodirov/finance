'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function revalidateAll() {
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/xarajatlar')
  revalidatePath('/dashboard/daromadlar')
  revalidatePath('/dashboard/statistika')
  revalidatePath('/dashboard/budjet')
  revalidatePath('/dashboard/hamyon')
}

export async function createTransaction(formData: {
  type: 'expense' | 'income'
  amount: number
  categoryId: string
  description?: string
  transactionDate: string
  accountId?: string
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Avtorizatsiya talab qilinadi' }
  if (!formData.amount || formData.amount <= 0)
    return { error: "Summa 0 dan katta bo'lishi kerak" }

  // If accountId provided, update balance
  if (formData.accountId) {
    const { data: acc } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', formData.accountId)
      .eq('user_id', user.id)
      .single()
    if (acc) {
      const delta =
        formData.type === 'income' ? formData.amount : -formData.amount
      const newBalance = Number(acc.balance) + delta
      if (formData.type === 'expense' && newBalance < 0) {
        return { error: "Hamyonda yetarli mablag' yo'q" }
      }
      await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', formData.accountId)
        .eq('user_id', user.id)
    }
  }

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    type: formData.type,
    amount: formData.amount,
    category_id: formData.categoryId,
    description: formData.description || null,
    transaction_date: formData.transactionDate,
    account_id: formData.accountId || null,
  })

  if (error) return { error: error.message }
  revalidateAll()
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
    accountId?: string
  }
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Avtorizatsiya talab qilinadi' }
  if (!formData.amount || formData.amount <= 0)
    return { error: "Summa 0 dan katta bo'lishi kerak" }

  // Get old transaction to reverse its balance effect
  const { data: oldTxn } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!oldTxn) return { error: 'Operatsiya topilmadi' }

  // Reverse old balance
  if (oldTxn.account_id) {
    const { data: acc } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', oldTxn.account_id)
      .single()
    if (acc) {
      const reverseDelta =
        oldTxn.type === 'income'
          ? -Number(oldTxn.amount)
          : Number(oldTxn.amount)
      await supabase
        .from('accounts')
        .update({ balance: Number(acc.balance) + reverseDelta })
        .eq('id', oldTxn.account_id)
    }
  }

  // Apply new balance
  const targetAccountId = formData.accountId || oldTxn.account_id
  if (targetAccountId) {
    const { data: acc } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', targetAccountId)
      .single()
    if (acc) {
      const delta =
        formData.type === 'income' ? formData.amount : -formData.amount
      const newBal = Number(acc.balance) + delta
      if (formData.type === 'expense' && newBal < 0) {
        // Restore old balance if we reversed it
        if (oldTxn.account_id) {
          const oldDelta =
            oldTxn.type === 'income'
              ? Number(oldTxn.amount)
              : -Number(oldTxn.amount)
          await supabase
            .from('accounts')
            .update({ balance: Number(acc.balance) + oldDelta })
            .eq('id', oldTxn.account_id)
        }
        return { error: "Hamyonda yetarli mablag' yo'q" }
      }
      await supabase
        .from('accounts')
        .update({ balance: newBal })
        .eq('id', targetAccountId)
    }
  }

  const { error } = await supabase
    .from('transactions')
    .update({
      type: formData.type,
      amount: formData.amount,
      category_id: formData.categoryId,
      description: formData.description || null,
      transaction_date: formData.transactionDate,
      account_id: targetAccountId || null,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidateAll()
  return { success: true }
}

export async function deleteTransaction(id: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Avtorizatsiya talab qilinadi' }

  // Reverse balance
  const { data: txn } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (txn?.account_id) {
    const { data: acc } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', txn.account_id)
      .single()
    if (acc) {
      const reverseDelta =
        txn.type === 'income' ? -Number(txn.amount) : Number(txn.amount)
      await supabase
        .from('accounts')
        .update({ balance: Number(acc.balance) + reverseDelta })
        .eq('id', txn.account_id)
    }
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidateAll()
  return { success: true }
}
