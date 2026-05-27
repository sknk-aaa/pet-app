'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { approveCandidate, rejectCandidate, swapCandidate } from './actions'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'

interface Props {
  scheduledId: string
  pendingId?: string
  isSwap?: boolean
  scheduled: { status: string }
}

export function ReviewActions({ scheduledId, pendingId, isSwap, scheduled }: Props) {
  const [isPending, startTransition] = useTransition()

  if (isSwap && pendingId) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="mt-2 w-full"
        disabled={isPending}
        onClick={() => startTransition(() => swapCandidate(scheduledId, pendingId))}
      >
        <RefreshCw size={12} />
        この候補に差し替え
      </Button>
    )
  }

  if (scheduled.status === 'approved') {
    return <p className="mt-3 text-sm font-semibold text-green-600">✓ 承認済み</p>
  }

  return (
    <div className="mt-4 flex gap-3">
      <Button
        size="sm"
        onClick={() => startTransition(() => approveCandidate(scheduledId))}
        disabled={isPending}
      >
        <CheckCircle size={14} />
        承認
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => startTransition(() => rejectCandidate(scheduledId))}
        disabled={isPending}
      >
        <XCircle size={14} />
        却下
      </Button>
    </div>
  )
}
