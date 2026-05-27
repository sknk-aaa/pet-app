import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

// Cron: 毎日 23:00 JST (14:00 UTC)
// 翌日掲載候補を重み付き抽選し status = 'scheduled' に設定
serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  // TODO: 実装
  // 1. entry_date = 今日(JST), status = 'pending', reports_count = 0 のプールを取得
  // 2. 直近 14 日の featured ユーザーを除外
  // 3. weight = max(1, min(featured_weight_streak, 30)) で重み付き抽選
  // 4. 当選候補の status を 'scheduled' に更新

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
