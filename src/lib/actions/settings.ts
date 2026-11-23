'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(fullName: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Avtorizatsiya talab qilinadi' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName.trim() })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/sozlamalar')
  return { success: true }
}

export async function updateSettings(settings: {
  currency?: string
  language?: string
  timezone?: string
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Avtorizatsiya talab qilinadi' }
  }

  const { error } = await supabase.from('user_settings').upsert(
    {
      user_id: user.id,
      ...settings,
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/sozlamalar')
  return { success: true }
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Avtorizatsiya talab qilinadi' }
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
