'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createVaultEntry(data: {
  platform_name: string
  website_url?: string
  username?: string
  email?: string
  encrypted_payload: string
  encryption_meta: string
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Avtorizatsiya talab qilinadi' }

  const { error } = await supabase.from('password_vault').insert({
    user_id: user.id,
    platform_name: data.platform_name,
    website_url: data.website_url || null,
    username: data.username || null,
    email: data.email || null,
    encrypted_payload: data.encrypted_payload,
    encryption_meta: data.encryption_meta,
    encryption_version: 1,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/parollar')
  return { success: true }
}

export async function updateVaultEntry(
  id: string,
  data: {
    platform_name?: string
    website_url?: string
    username?: string
    email?: string
    encrypted_payload?: string
    encryption_meta?: string
  }
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Avtorizatsiya talab qilinadi' }

  const { error } = await supabase
    .from('password_vault')
    .update(data)
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/parollar')
  return { success: true }
}

export async function deleteVaultEntry(id: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Avtorizatsiya talab qilinadi' }

  const { error } = await supabase
    .from('password_vault')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/parollar')
  return { success: true }
}
