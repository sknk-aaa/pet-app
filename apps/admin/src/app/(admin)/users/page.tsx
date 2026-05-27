import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { UserActions } from './user-actions'

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

const PAGE_SIZE = 25

export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page ?? 1)

  const supabase = await createClient()
  const { data: { user: me } } = await supabase.auth.getUser()

  const { data: users, count } = await supabase
    .from('users')
    .select('id, is_admin, banned_at, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">ユーザー管理</h1>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-3 text-left">ユーザー ID</th>
              <th className="p-3 text-left">登録日</th>
              <th className="p-3 text-left">状態</th>
              <th className="p-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(users ?? []).map(u => {
              const state = u.banned_at ? 'banned' : u.is_admin ? 'admin' : 'normal'
              return (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{u.id}</td>
                  <td className="p-3 whitespace-nowrap">{formatDate(u.created_at)}</td>
                  <td className="p-3">
                    <Badge variant={state === 'banned' ? 'destructive' : state === 'admin' ? 'info' : 'secondary'}>
                      {state === 'banned' ? 'BAN' : state === 'admin' ? '管理者' : '一般'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <UserActions
                      userId={u.id}
                      isBanned={!!u.banned_at}
                      isAdmin={u.is_admin}
                      isSelf={u.id === me?.id}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex gap-2 text-sm">
          {page > 1 && <a href={`?page=${page - 1}`} className="text-primary underline">← 前へ</a>}
          <span className="text-muted-foreground">{page} / {totalPages}</span>
          {page < totalPages && <a href={`?page=${page + 1}`} className="text-primary underline">次へ →</a>}
        </div>
      )}
    </div>
  )
}
