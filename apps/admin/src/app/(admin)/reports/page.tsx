import { createClient } from '@/lib/supabase/server'
import { Badge, STATUS_BADGE } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { ReportActions } from './report-actions'

const REASON_LABELS: Record<string, string> = {
  inappropriate: '不適切',
  privacy: 'プライバシー',
  copyright: '著作権',
  other: 'その他',
}

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const status = params.status ?? 'open'

  const supabase = await createClient()
  const { data: reports } = await supabase
    .from('reports')
    .select(`
      id, reason, detail, status, created_at, reviewed_at,
      reporter_user_id,
      featured_pets!inner ( id, title, archive_thumb_url, user_id, status )
    `)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">通報一覧</h1>

      <div className="mb-4 flex gap-2">
        {['open', 'reviewed', 'resolved'].map(s => (
          <a
            key={s}
            href={`?status=${s}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${status === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
          >
            {s === 'open' ? '未対応' : s === 'reviewed' ? '確認済' : '解決済'}
          </a>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-3 text-left">通報日</th>
              <th className="p-3 text-left">対象写真</th>
              <th className="p-3 text-left">理由</th>
              <th className="p-3 text-left">詳細</th>
              <th className="p-3 text-left">ステータス</th>
              <th className="p-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(reports ?? []).map(r => {
              const pet = (r.featured_pets as unknown) as { id: string; title: string; archive_thumb_url: string; user_id: string; status: string }
              return (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="p-3 whitespace-nowrap">{formatDateTime(r.created_at)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {pet.archive_thumb_url && (
                        <a href={pet.archive_thumb_url} target="_blank" rel="noreferrer">
                          <img src={pet.archive_thumb_url} alt="" className="h-10 w-10 rounded object-cover" />
                        </a>
                      )}
                      <span className="max-w-[100px] truncate text-xs">{pet.title}</span>
                    </div>
                  </td>
                  <td className="p-3">{REASON_LABELS[r.reason] ?? r.reason}</td>
                  <td className="p-3 max-w-[160px] truncate text-xs text-muted-foreground">{r.detail}</td>
                  <td className="p-3">
                    <Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge>
                  </td>
                  <td className="p-3">
                    <ReportActions
                      reportId={r.id}
                      featuredPetId={pet.id}
                      petUserId={pet.user_id}
                      currentStatus={r.status}
                      petStatus={pet.status}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
