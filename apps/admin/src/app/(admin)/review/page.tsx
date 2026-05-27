import { createClient } from '@/lib/supabase/server'
import { Badge, STATUS_BADGE } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReviewActions } from './review-actions'

function getTodayJST() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date())
}

export default async function ReviewPage() {
  const supabase = await createClient()
  const today = getTodayJST()

  const { data: scheduled } = await supabase
    .from('featured_candidates')
    .select('id, title, pet_names_display, cloud_image_url, thumbnail_url, status, featured_weight_streak, submitted_at, user_id')
    .eq('entry_date', today)
    .eq('status', 'scheduled')
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: pendingCandidates } = await supabase
    .from('featured_candidates')
    .select('id, title, pet_names_display, thumbnail_url, featured_weight_streak, status')
    .eq('entry_date', today)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false })
    .limit(20)

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">今日のペットレビュー</h1>
      <p className="mb-6 text-sm text-muted-foreground">対象日: {today}（翌朝掲載）</p>

      {scheduled ? (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>推薦候補</CardTitle>
              <Badge variant={STATUS_BADGE[scheduled.status]}>{scheduled.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {scheduled.cloud_image_url && (
                <img
                  src={scheduled.cloud_image_url}
                  alt={scheduled.title}
                  className="h-48 w-48 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <p className="text-lg font-semibold">{scheduled.title}</p>
                <p className="text-sm text-muted-foreground">ペット: {scheduled.pet_names_display}</p>
                <p className="text-sm text-muted-foreground">連続記録: {scheduled.featured_weight_streak} 日</p>
                <ReviewActions scheduled={scheduled} scheduledId={scheduled.id} />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8">
          <CardContent className="py-8 text-center text-muted-foreground">
            推薦候補がありません（抽選未実行 or 候補なし）
          </CardContent>
        </Card>
      )}

      {pendingCandidates && pendingCandidates.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">その他の pending 候補</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {pendingCandidates.map(c => (
              <Card key={c.id} className="overflow-hidden">
                {c.thumbnail_url && (
                  <img src={c.thumbnail_url} alt={c.title} className="h-32 w-full object-cover" />
                )}
                <CardContent className="p-3">
                  <p className="truncate text-sm font-medium">{c.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.pet_names_display}</p>
                  {scheduled && (
                    <ReviewActions pendingId={c.id} scheduledId={scheduled.id} scheduled={scheduled} isSwap />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
