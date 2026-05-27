import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { todayJST, yesterdayJST } from '../_shared/jst.ts'

// Cron: 毎日 07:00 JST (22:00 UTC 前日)
// entry_date = 昨日(JST), status = 'approved' の候補を 1 件取得し:
//   1. featured-photos → featured-archive に画像コピー
//   2. featured_pets に INSERT (status = 'visible')
//   3. featured_candidates の status を 'featured' に更新
//   4. 投稿ユーザーにプッシュ通知送信
serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const supabase = createServiceClient()
  const yesterday = yesterdayJST()
  const today = todayJST()

  const { data: candidate, error: candidateErr } = await supabase
    .from('featured_candidates')
    .select('id, user_id, cloud_image_url, thumbnail_url, title, pet_names_display')
    .eq('entry_date', yesterday)
    .eq('status', 'approved')
    .order('reviewed_at', { ascending: false })
    .limit(1)
    .single()

  if (candidateErr || !candidate) {
    return new Response(JSON.stringify({ ok: true, reason: 'no approved candidate' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const [yyyy, mm] = today.split('-')
  const archivePath = `${yyyy}/${mm}/${candidate.id}.jpg`
  const archiveThumbPath = `${yyyy}/${mm}/${candidate.id}_thumb.jpg`

  const srcPath = pathFromPublicUrl(candidate.cloud_image_url, 'featured-photos')
  const srcThumbPath = pathFromPublicUrl(candidate.thumbnail_url, 'featured-photos')

  const [dlImg, dlThumb] = await Promise.all([
    supabase.storage.from('featured-photos').download(srcPath),
    supabase.storage.from('featured-photos').download(srcThumbPath),
  ])

  if (dlImg.error || dlThumb.error || !dlImg.data || !dlThumb.data) {
    return new Response(JSON.stringify({ error: 'storage download failed' }), { status: 500, headers: corsHeaders })
  }

  const [upImg, upThumb] = await Promise.all([
    supabase.storage.from('featured-archive').upload(archivePath, dlImg.data, { contentType: 'image/jpeg', upsert: true }),
    supabase.storage.from('featured-archive').upload(archiveThumbPath, dlThumb.data, { contentType: 'image/jpeg', upsert: true }),
  ])

  if (upImg.error || upThumb.error) {
    return new Response(JSON.stringify({ error: 'storage upload failed' }), { status: 500, headers: corsHeaders })
  }

  const { data: { publicUrl: archiveImageUrl } } = supabase.storage.from('featured-archive').getPublicUrl(archivePath)
  const { data: { publicUrl: archiveThumbUrl } } = supabase.storage.from('featured-archive').getPublicUrl(archiveThumbPath)

  const { data: featured, error: insertErr } = await supabase
    .from('featured_pets')
    .insert({
      candidate_id: candidate.id,
      user_id: candidate.user_id,
      featured_date: today,
      archive_image_url: archiveImageUrl,
      archive_thumb_url: archiveThumbUrl,
      title: candidate.title,
      pet_names_display: candidate.pet_names_display,
      status: 'visible',
    })
    .select('id')
    .single()

  if (insertErr || !featured) {
    return new Response(JSON.stringify({ error: insertErr?.message ?? 'insert failed' }), { status: 500, headers: corsHeaders })
  }

  await supabase.from('featured_candidates').update({ status: 'featured' }).eq('id', candidate.id)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  await fetch(`${supabaseUrl}/functions/v1/send-featured-push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({ featured_pet_id: featured.id, user_id: candidate.user_id }),
  })

  return new Response(JSON.stringify({ ok: true, featured_pet_id: featured.id }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

function pathFromPublicUrl(url: string, bucket: string): string {
  const marker = `/object/public/${bucket}/`
  const idx = url.indexOf(marker)
  if (idx >= 0) return url.slice(idx + marker.length)
  return url.split('/').slice(-1)[0]
}
