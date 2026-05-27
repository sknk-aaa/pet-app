import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

// Cron: 毎日 00:10 JST (15:10 UTC)
// entry_date が昨日以前の featured_candidates を削除:
//   1. 対象レコードの cloud_image_url / thumbnail_url を収集
//   2. featured-photos バケットから画像を削除
//   3. featured_candidates レコードを削除
//      (featured_pets.candidate_id は ON DELETE SET NULL で自動的に NULL になる)
serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  // TODO: 実装

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
