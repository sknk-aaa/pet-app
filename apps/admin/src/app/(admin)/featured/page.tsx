import { createAdminClient as createClient } from '@/lib/supabase/admin'
import { Badge, STATUS_BADGE } from '@/components/ui/badge'
import { FeaturedActions } from './featured-actions'

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

const PAGE_SIZE = 25

export default async function FeaturedPage({ searchParams }: PageProps) {
  const params = await searchParams
  const status = params.status ?? 'visible'
  const page = Number(params.page ?? 1)

  const supabase = await createClient()
  const { data: records, count } = await supabase
    .from('featured_pets')
    .select('id, featured_date, title, pet_names_display, archive_thumb_url, status, created_at', { count: 'exact' })
    .eq('status', status)
    .order('featured_date', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">掲載履歴</h1>

      <div className="mb-4 flex gap-2">
        {['visible', 'hidden'].map(s => (
          <a
            key={s}
            href={`?status=${s}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${status === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
          >
            {s === 'visible' ? '公開中' : '非表示'}
          </a>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-3 text-left">サムネ</th>
              <th className="p-3 text-left">掲載日</th>
              <th className="p-3 text-left">タイトル</th>
              <th className="p-3 text-left">ペット</th>
              <th className="p-3 text-left">ステータス</th>
              <th className="p-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(records ?? []).map(r => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="p-3">
                  {r.archive_thumb_url && (
                    <a href={r.archive_thumb_url} target="_blank" rel="noreferrer">
                      <img src={r.archive_thumb_url} alt="" className="h-12 w-12 rounded object-cover" />
                    </a>
                  )}
                </td>
                <td className="p-3 whitespace-nowrap">{r.featured_date}</td>
                <td className="p-3 max-w-[160px] truncate">{r.title}</td>
                <td className="p-3 max-w-[120px] truncate">{r.pet_names_display}</td>
                <td className="p-3">
                  <Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge>
                </td>
                <td className="p-3">
                  <FeaturedActions id={r.id} currentStatus={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex gap-2 text-sm">
          {page > 1 && <a href={`?status=${status}&page=${page - 1}`} className="text-primary underline">← 前へ</a>}
          <span className="text-muted-foreground">{page} / {totalPages}</span>
          {page < totalPages && <a href={`?status=${status}&page=${page + 1}`} className="text-primary underline">次へ →</a>}
        </div>
      )}
    </div>
  )
}
