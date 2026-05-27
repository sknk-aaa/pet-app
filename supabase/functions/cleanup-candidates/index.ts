import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { todayJST } from '../_shared/jst.ts'

// Cron: 毎日 00:10 JST (15:10 UTC)
// entry_date が昨日以前の featured_candidates を削除:
//   1. 対象レコードの cloud_image_url / thumbnail_url を収集
//   2. featured-photos バケットから画像を削除
//   3. featured_candidates レコードを削除
//      (featured_pets.candidate_id は ON DELETE SET NULL で自動的に NULL になる)
serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const supabase = createServiceClient()
  const today = todayJST()

  const { data: stale, error } = await supabase
    .from('featured_candidates')
    .select('id, cloud_image_url, thumbnail_url')
    .lt('entry_date', today)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
  if (!stale || stale.length === 0) {
    return new Response(JSON.stringify({ ok: true, deleted: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const paths: string[] = []
  for (const c of stale) {
    const imgPath = pathFromPublicUrl(c.cloud_image_url, 'featured-photos')
    const thumbPath = pathFromPublicUrl(c.thumbnail_url, 'featured-photos')
    if (imgPath) paths.push(imgPath)
    if (thumbPath) paths.push(thumbPath)
  }

  if (paths.length > 0) {
    await supabase.storage.from('featured-photos').remove(paths)
  }

  const ids = stale.map((c: { id: string }) => c.id)
  await supabase.from('featured_candidates').delete().in('id', ids)

  return new Response(JSON.stringify({ ok: true, deleted: ids.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

function pathFromPublicUrl(url: string, bucket: string): string {
  const marker = `/object/public/${bucket}/`
  const idx = url.indexOf(marker)
  if (idx >= 0) return url.slice(idx + marker.length)
  return url.split('/').slice(-1)[0]
}
