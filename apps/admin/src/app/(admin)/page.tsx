import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, STATUS_BADGE } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

function getTodayJST() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date())
}
function getYesterdayJST() {
  const d = new Date(); d.setDate(d.getDate() - 1)
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(d)
}
function get24hAgo() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const yesterday = getYesterdayJST()

  const [
    { count: yesterdayCount },
    { data: todayFeaturedStatus },
    { count: openReports },
    { count: scheduledCount },
    { count: pendingCount },
    { count: userCount },
    { data: todayCandidate },
  ] = await Promise.all([
    supabase.from('featured_candidates').select('*', { count: 'exact', head: true }).eq('entry_date', yesterday),
    supabase.from('featured_candidates').select('status').eq('entry_date', yesterday).in('status', ['scheduled', 'approved', 'featured']).limit(1).maybeSingle(),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('featured_candidates').select('*', { count: 'exact', head: true }).eq('status', 'scheduled').eq('entry_date', getTodayJST()),
    supabase.from('featured_candidates').select('*', { count: 'exact', head: true }).eq('status', 'pending').gte('submitted_at', get24hAgo()),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('featured_candidates').select('id, title, pet_names_display, thumbnail_url, status').eq('entry_date', yesterday).in('status', ['scheduled', 'approved', 'featured']).order('reviewed_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const stats = [
    { label: '昨日の投稿数', value: yesterdayCount ?? 0 },
    { label: '本日掲載予定', value: todayFeaturedStatus?.status ?? '未選出' },
    { label: '未対応通報', value: openReports ?? 0 },
    { label: '抽選推薦待ち', value: scheduledCount ?? 0 },
    { label: 'pending (24h)', value: pendingCount ?? 0 },
    { label: 'ユーザー総数', value: userCount ?? 0 },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">ダッシュボード</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map(s => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {todayCandidate && (
        <Card>
          <CardHeader>
            <CardTitle>本日の掲載予定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              {todayCandidate.thumbnail_url && (
                <img
                  src={todayCandidate.thumbnail_url}
                  alt={todayCandidate.title}
                  className="h-24 w-24 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <p className="font-semibold">{todayCandidate.title}</p>
                <p className="text-sm text-muted-foreground">ペット: {todayCandidate.pet_names_display}</p>
                <div className="mt-2">
                  <Badge variant={STATUS_BADGE[todayCandidate.status]}>{todayCandidate.status}</Badge>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/review" className="text-sm text-primary underline">
                今日のペットレビューへ →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
