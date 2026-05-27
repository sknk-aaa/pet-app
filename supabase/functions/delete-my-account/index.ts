import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

// クライアントから RPC 呼び出し (App Store ガイドライン 5.1.1(v) 対応)
// 処理順:
//   1. 自分の featured_candidates を削除 (Storage 含む)
//   2. 自分の featured_reactions を削除
//   3. 自分の reports を削除
//   4. auth.users から物理削除 (CASCADE で public.users も削除)
// featured_pets は削除しない (user_id は NULL になるが掲載履歴は保持)
serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  // TODO: 実装

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
