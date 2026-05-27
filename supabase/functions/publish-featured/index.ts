import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

// Cron: 毎日 07:00 JST (22:00 UTC 前日)
// entry_date = 昨日(JST), status = 'approved' の候補を 1 件取得し:
//   1. featured-photos → featured-archive に画像コピー
//   2. featured_pets に INSERT (status = 'visible')
//   3. featured_candidates の status を 'featured' に更新
//   4. 投稿ユーザーにプッシュ通知送信
serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  // TODO: 実装

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
