'use server'

import { createAdminClient as createClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function approveCandidate(id: string) {
  const supabase = await createClient()
  await supabase
    .from('featured_candidates')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/review')
  revalidatePath('/')
}

export async function rejectCandidate(id: string) {
  const supabase = await createClient()
  await supabase
    .from('featured_candidates')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/review')
  revalidatePath('/')
}

export async function swapCandidate(currentScheduledId: string, newCandidateId: string) {
  const supabase = await createClient()
  const now = new Date().toISOString()
  await Promise.all([
    supabase.from('featured_candidates').update({ status: 'pending' }).eq('id', currentScheduledId),
    supabase.from('featured_candidates').update({ status: 'scheduled', reviewed_at: now }).eq('id', newCandidateId),
  ])
  revalidatePath('/review')
  revalidatePath('/')
}
