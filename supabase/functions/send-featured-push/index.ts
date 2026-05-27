import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

// publish-featured から呼ばれる、またはリトライ Cron (mode=retry) で呼ばれる
// Expo Push API (https://exp.host/--/api/v2/push/send) を使用
// users.notification_featured_enabled = false のユーザーには送信しない
// DeviceNotRegistered → users.push_token を NULL に更新
// 一時エラー → 再試行キューに積む (mode=retry 時に処理)
serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  // TODO: 実装

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
