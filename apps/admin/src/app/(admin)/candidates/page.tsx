import { createAdminClient as createClient } from '@/lib/supabase/admin'
import { Badge, STATUS_BADGE } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { formatDateTime } from '@/lib/utils'
import { CandidateActions } from './candidate-actions'

const PAGE_SIZE = 25

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string; date_from?: string; date_to?: string }>
}

export default async function CandidatesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const status = params.status ?? ''
  const page = Number(params.page ?? 1)
  const dateFrom = params.date_from ?? ''
  const dateTo = params.date_to ?? ''

  const supabase = await createClient()
  let query = supabase
    .from('featured_candidates')
    .select('id, title, pet_names_display, thumbnail_url, status, reports_count, submitted_at, entry_date, user_id', { count: 'exact' })
    .order('submitted_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (status) query = query.eq('status', status)
  if (dateFrom) query = query.gte('entry_date', dateFrom)
  if (dateTo) query = query.lte('entry_date', dateTo)

  const { data: candidates, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">投稿候補一覧</h1>

      <form className="mb-4 flex flex-wrap gap-3">
        <Select name="status" defaultValue={status} className="w-40">
          <option value="">全ステータス</option>
          {['pending', 'scheduled', 'approved', 'featured', 'rejected', 'withdrawn', 'hidden'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Input name="date_from" type="date" defaultValue={dateFrom} className="w-40" placeholder="開始日" />
        <Input name="date_to" type="date" defaultValue={dateTo} className="w-40" placeholder="終了日" />
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          絞り込む
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-3 text-left">サムネ</th>
              <th className="p-3 text-left">投稿日</th>
              <th className="p-3 text-left">タイトル</th>
              <th className="p-3 text-left">ペット</th>
              <th className="p-3 text-left">ステータス</th>
              <th className="p-3 text-left">通報</th>
              <th className="p-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(candidates ?? []).map(c => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td className="p-3">
                  {c.thumbnail_url && (
                    <a href={c.thumbnail_url} target="_blank" rel="noreferrer">
                      <img src={c.thumbnail_url} alt="" className="h-12 w-12 rounded object-cover" />
                    </a>
                  )}
                </td>
                <td className="p-3 whitespace-nowrap">{c.entry_date}</td>
                <td className="p-3 max-w-[160px] truncate">{c.title}</td>
                <td className="p-3 max-w-[120px] truncate">{c.pet_names_display}</td>
                <td className="p-3">
                  <Badge variant={STATUS_BADGE[c.status]}>{c.status}</Badge>
                </td>
                <td className="p-3">{c.reports_count}</td>
                <td className="p-3">
                  <CandidateActions id={c.id} currentStatus={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, count ?? 0)} / {count} 件
          </span>
          {page > 1 && (
            <a href={`?status=${status}&page=${page - 1}`} className="text-primary underline">← 前へ</a>
          )}
          {page < totalPages && (
            <a href={`?status=${status}&page=${page + 1}`} className="text-primary underline">次へ →</a>
          )}
        </div>
      )}
    </div>
  )
}
