'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function upsertBudget(month: number, year: number, amount: number) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Avtorizatsiya talab qilinadi' }
  }

  if (!amount || amount <= 0) {
    return { error: "Budjet summasi 0 dan katta bo'lishi kerak" }
  }

  const { error } = await supabase.from('budgets').upsert(
    {
      user_id: user.id,
      month,
      year,
      amount,
    },
    { onConflict: 'user_id,month,year' }
  )

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/budjet')
  revalidatePath('/dashboard')
  return { success: true }
}
