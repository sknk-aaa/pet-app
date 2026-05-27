'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { resolveReport, hideAndResolve, banUserFromReport } from './actions'

interface Props {
  reportId: string
  featuredPetId: string
  petUserId: string
  currentStatus: string
  petStatus: string
}

export function ReportActions({ reportId, featuredPetId, petUserId, currentStatus, petStatus }: Props) {
  const [isPending, startTransition] = useTransition()

  if (currentStatus === 'resolved') return null

  return (
    <div className="flex flex-wrap gap-1">
      {currentStatus === 'open' && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => startTransition(() => resolveReport(reportId, 'reviewed'))}
        >
          確認済み
        </Button>
      )}
      {petStatus === 'visible' && (
        <Button
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={() => startTransition(() => hideAndResolve(reportId, featuredPetId))}
        >
          写真非表示
        </Button>
      )}
      {petUserId && (
        <Button
          size="sm"
          variant="destructive"
          disabled={isPending}
          onClick={() => {
            if (confirm('このユーザーを BAN しますか？')) {
              startTransition(() => banUserFromReport(reportId, petUserId))
            }
          }}
        >
          BAN
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={() => startTransition(() => resolveReport(reportId, 'resolved'))}
      >
        却下
      </Button>
    </div>
  )
}
