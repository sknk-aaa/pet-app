import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

// クライアントから RPC 呼び出し
// pending 候補の取り下げ: DB レコード削除 + Storage 画像削除
// Body: { candidate_id: string }
serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  // TODO: 実装
  // 1. 認証ユーザーの候補か確認
  // 2. Storage から featured-photos/candidates/{user_id}/{date}.jpg と _thumb.jpg を削除
  // 3. withdraw_my_candidate RPC を呼ぶ

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
