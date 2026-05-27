'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function resolveReport(reportId: string, action: 'reviewed' | 'resolved') {
  const supabase = await createClient()
  await supabase
    .from('reports')
    .update({ status: action, reviewed_at: new Date().toISOString() })
    .eq('id', reportId)
  revalidatePath('/reports')
}

export async function hideAndResolve(reportId: string, featuredPetId: string) {
  const supabase = await createClient()
  const now = new Date().toISOString()
  await Promise.all([
    supabase.from('featured_pets').update({ status: 'hidden' }).eq('id', featuredPetId),
    supabase.from('reports').update({ status: 'resolved', reviewed_at: now }).eq('id', reportId),
  ])
  revalidatePath('/reports')
  revalidatePath('/featured')
}

export async function banUserFromReport(reportId: string, userId: string) {
  const supabase = await createClient()
  const now = new Date().toISOString()
  await Promise.all([
    supabase.from('users').update({ banned_at: now }).eq('id', userId),
    supabase.from('reports').update({ status: 'resolved', reviewed_at: now }).eq('id', reportId),
  ])
  revalidatePath('/reports')
  revalidatePath('/users')
}
