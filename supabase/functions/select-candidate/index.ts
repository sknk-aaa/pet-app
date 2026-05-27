import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { todayJST } from '../_shared/jst.ts'

// Cron: 毎日 23:00 JST (14:00 UTC)
// 翌日掲載候補を重み付き抽選し status = 'scheduled' に設定
serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const supabase = createServiceClient()
  const today = todayJST()

  const { data: pool, error: poolErr } = await supabase
    .from('featured_candidates')
    .select('id, user_id, featured_weight_streak')
    .eq('entry_date', today)
    .eq('status', 'pending')
    .eq('reports_count', 0)

  if (poolErr) {
    return new Response(JSON.stringify({ error: poolErr.message }), { status: 500, headers: corsHeaders })
  }
  if (!pool || pool.length === 0) {
    return new Response(JSON.stringify({ ok: true, selected: null, reason: 'no candidates' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 14)

  const { data: recentFeatured } = await supabase
    .from('featured_pets')
    .select('user_id')
    .gte('featured_date', cutoff.toISOString().slice(0, 10))
    .not('user_id', 'is', null)

  const recentUserIds = new Set((recentFeatured ?? []).map((r: { user_id: string }) => r.user_id))

  let candidates = pool.filter((c: { user_id: string }) => !recentUserIds.has(c.user_id))
  if (candidates.length === 0) candidates = pool

  const totalWeight = candidates.reduce(
    (sum: number, c: { featured_weight_streak: number }) =>
      sum + Math.max(1, Math.min(c.featured_weight_streak, 30)),
    0
  )
  let rand = Math.random() * totalWeight
  let selected = candidates[candidates.length - 1]
  for (const c of candidates) {
    rand -= Math.max(1, Math.min(c.featured_weight_streak, 30))
    if (rand <= 0) { selected = c; break }
  }

  const { error: updateErr } = await supabase
    .from('featured_candidates')
    .update({ status: 'scheduled' })
    .eq('id', selected.id)

  if (updateErr) {
    return new Response(JSON.stringify({ error: updateErr.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify({ ok: true, selected: selected.id }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
