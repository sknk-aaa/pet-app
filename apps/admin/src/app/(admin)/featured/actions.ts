'use server'

import { createAdminClient as createClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function hideFeatured(id: string) {
  const supabase = await createClient()
  await supabase.from('featured_pets').update({ status: 'hidden' }).eq('id', id)
  revalidatePath('/featured')
}
