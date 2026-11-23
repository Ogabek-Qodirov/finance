import { createClient } from '@/lib/supabase/client'
import { UserSettings, Profile } from '@/types'

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('getUserSettings error:', error)
    return null
  }
  return data as UserSettings | null
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('getUserProfile error:', error)
    return null
  }
  return data as Profile | null
}
