import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'

// クライアントから呼び出し (App Store ガイドライン 5.1.1(v) 対応)
// 処理順:
//   1. 自分の featured_candidates を削除 (Storage 含む)
//   2. 自分の featured_reactions を削除
//   3. 自分の reports を削除
//   4. auth.users から物理削除 (CASCADE で public.users も削除)
// featured_pets は削除しない (user_id は NULL になるが掲載履歴は保持)
serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'unauthorized' }, 401)
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
  )
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) {
    return jsonResponse({ error: 'unauthorized' }, 401)
  }

  const supabase = createServiceClient()
  const { data: candidates, error: candidateError } = await supabase
    .from('featured_candidates')
    .select('cloud_image_url, thumbnail_url')
    .eq('user_id', user.id)

  if (candidateError) {
    return jsonResponse({ error: candidateError.message }, 500)
  }

  const paths: string[] = []
  for (const candidate of candidates ?? []) {
    paths.push(
      pathFromPublicUrl(candidate.cloud_image_url, 'featured-photos'),
      pathFromPublicUrl(candidate.thumbnail_url, 'featured-photos')
    )
  }
  if (paths.length > 0) {
    const { error } = await supabase.storage.from('featured-photos').remove(paths)
    if (error) return jsonResponse({ error: error.message }, 500)
  }

  const deletes = await Promise.all([
    supabase.from('featured_candidates').delete().eq('user_id', user.id),
    supabase.from('featured_reactions').delete().eq('user_id', user.id),
    supabase.from('reports').delete().eq('reporter_user_id', user.id),
    supabase.from('featured_candidates').update({ reviewed_by: null }).eq('reviewed_by', user.id),
    supabase.from('reports').update({ reviewed_by: null }).eq('reviewed_by', user.id),
  ])
  const deleteError = deletes.find(result => result.error)?.error
  if (deleteError) {
    return jsonResponse({ error: deleteError.message }, 500)
  }

  const { error: userDeleteError } = await supabase.auth.admin.deleteUser(user.id)
  if (userDeleteError) {
    return jsonResponse({ error: userDeleteError.message }, 500)
  }

  return jsonResponse({ ok: true })
})

function pathFromPublicUrl(url: string, bucket: string): string {
  const marker = `/object/public/${bucket}/`
  const idx = url.indexOf(marker)
  return idx >= 0 ? url.slice(idx + marker.length) : url.split('/').slice(-1)[0]
}

function jsonResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
