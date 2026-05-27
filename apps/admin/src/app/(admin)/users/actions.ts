'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function banUser(id: string) {
  const supabase = await createClient()
  await supabase.from('users').update({ banned_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/users')
}

export async function unbanUser(id: string) {
  const supabase = await createClient()
  await supabase.from('users').update({ banned_at: null }).eq('id', id)
  revalidatePath('/users')
}

export async function setAdmin(id: string, isAdmin: boolean) {
  const supabase = await createClient()
  await supabase.from('users').update({ is_admin: isAdmin }).eq('id', id)
  revalidatePath('/users')
}
