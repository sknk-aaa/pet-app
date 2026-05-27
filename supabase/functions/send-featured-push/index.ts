import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'

// publish-featured から呼ばれる
// Expo Push API (https://exp.host/--/api/v2/push/send) を使用
// users.notification_featured_enabled = false のユーザーには送信しない
// DeviceNotRegistered → users.push_token を NULL に更新
serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const { featured_pet_id, user_id } = await req.json() as { featured_pet_id: string; user_id: string }

  const supabase = createServiceClient()

  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('push_token, notification_featured_enabled')
    .eq('id', user_id)
    .single()

  if (userErr || !user) {
    return new Response(JSON.stringify({ ok: false, reason: 'user not found' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!user.notification_featured_enabled || !user.push_token) {
    return new Response(JSON.stringify({ ok: true, reason: 'skipped' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const expoToken = Deno.env.get('EXPO_ACCESS_TOKEN')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (expoToken) headers['Authorization'] = `Bearer ${expoToken}`

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      to: user.push_token,
      title: 'うちの子が今日のペットに選ばれました',
      body: 'タップして見に行く',
      data: { type: 'featured', featured_pet_id },
    }),
  })

  const json = await res.json() as { data?: { status?: string; message?: string } }
  const status = json?.data?.status

  if (status === 'error') {
    const message = json?.data?.message ?? ''
    if (message.includes('DeviceNotRegistered') || message.includes('InvalidCredentials')) {
      await supabase.from('users').update({ push_token: null }).eq('id', user_id)
    }
    return new Response(JSON.stringify({ ok: false, reason: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
