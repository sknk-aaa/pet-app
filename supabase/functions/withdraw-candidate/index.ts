import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// クライアントから呼ばれる
// pending 候補の取り下げ: DB レコード削除 + Storage 画像削除
// Body: { candidate_id: string }
serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders })
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authErr } = await userClient.auth.getUser()
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders })
  }

  const { candidate_id } = await req.json() as { candidate_id: string }
  if (!candidate_id) {
    return new Response(JSON.stringify({ error: 'candidate_id required' }), { status: 400, headers: corsHeaders })
  }

  const supabase = createServiceClient()

  const { data: candidate, error: fetchErr } = await supabase
    .from('featured_candidates')
    .select('id, user_id, cloud_image_url, thumbnail_url, status')
    .eq('id', candidate_id)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !candidate) {
    return new Response(JSON.stringify({ error: 'candidate not found or not owned by user' }), {
      status: 404, headers: corsHeaders,
    })
  }

  if (candidate.status === 'pending') {
    const imgPath = pathFromPublicUrl(candidate.cloud_image_url, 'featured-photos')
    const thumbPath = pathFromPublicUrl(candidate.thumbnail_url, 'featured-photos')
    const paths = [imgPath, thumbPath].filter(Boolean)
    if (paths.length > 0) {
      await supabase.storage.from('featured-photos').remove(paths)
    }
  }

  const { error: rpcErr } = await userClient.rpc('withdraw_my_candidate', { p_candidate_id: candidate_id })
  if (rpcErr) {
    return new Response(JSON.stringify({ error: rpcErr.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

function pathFromPublicUrl(url: string, bucket: string): string {
  const marker = `/object/public/${bucket}/`
  const idx = url.indexOf(marker)
  if (idx >= 0) return url.slice(idx + marker.length)
  return url.split('/').slice(-1)[0]
}
