'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function revalidateAll() {
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/hamyon')
  revalidatePath('/dashboard/statistika')
}

export async function createTransfer(data: {
  fromAccountId: string
  toAccountId: string
  amount: number
  description?: string
  transferDate: string
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Avtorizatsiya talab qilinadi' }
  if (data.amount <= 0) return { error: "Summa 0 dan katta bo'lishi kerak" }
  if (data.fromAccountId === data.toAccountId)
    return { error: "Hamyonlar bir xil bo'lmasligi kerak" }

  const { data: fromAcc } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', data.fromAccountId)
    .eq('user_id', user.id)
    .single()
  const { data: toAcc } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', data.toAccountId)
    .eq('user_id', user.id)
    .single()

  if (!fromAcc || !toAcc) return { error: 'Hamyon topilmadi' }
  if (Number(fromAcc.balance) < data.amount)
    return { error: "Hamyonda yetarli mablag' yo'q" }

  const { error: transferErr } = await supabase.from('transfers').insert({
    user_id: user.id,
    from_account_id: data.fromAccountId,
    to_account_id: data.toAccountId,
    amount: data.amount,
    description: data.description || null,
    transfer_date: data.transferDate,
  })
  if (transferErr) return { error: transferErr.message }

  await supabase
    .from('accounts')
    .update({ balance: Number(fromAcc.balance) - data.amount })
    .eq('id', data.fromAccountId)
    .eq('user_id', user.id)
  await supabase
    .from('accounts')
    .update({ balance: Number(toAcc.balance) + data.amount })
    .eq('id', data.toAccountId)
    .eq('user_id', user.id)

  revalidateAll()
  return { success: true }
}

export async function deleteTransfer(transferId: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Avtorizatsiya talab qilinadi' }

  const { data: transfer } = await supabase
    .from('transfers')
    .select('*')
    .eq('id', transferId)
    .eq('user_id', user.id)
    .single()
  if (!transfer) return { error: "O'tkazma topilmadi" }

  const { data: fromAcc } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', transfer.from_account_id)
    .single()
  const { data: toAcc } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', transfer.to_account_id)
    .single()

  if (fromAcc) {
    await supabase
      .from('accounts')
      .update({
        balance: Number(fromAcc.balance) + Number(transfer.amount),
      })
      .eq('id', transfer.from_account_id)
  }
  if (toAcc) {
    await supabase
      .from('accounts')
      .update({
        balance: Number(toAcc.balance) - Number(transfer.amount),
      })
      .eq('id', transfer.to_account_id)
  }

  const { error } = await supabase
    .from('transfers')
    .delete()
    .eq('id', transferId)
    .eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidateAll()
  return { success: true }
}
