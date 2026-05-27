'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCandidateStatus(id: string, status: string) {
  const supabase = await createClient()
  await supabase
    .from('featured_candidates')
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/candidates')
}
