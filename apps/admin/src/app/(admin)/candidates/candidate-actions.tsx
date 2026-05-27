'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { updateCandidateStatus } from './actions'

const ALLOWED: Record<string, string[]> = {
  pending: ['approved', 'rejected'],
  scheduled: ['approved', 'rejected'],
  approved: ['rejected'],
  featured: ['hidden'],
}

const LABELS: Record<string, string> = {
  approved: '承認',
  rejected: '却下',
  hidden: '非表示',
}

export function CandidateActions({ id, currentStatus }: { id: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition()
  const actions = ALLOWED[currentStatus] ?? []

  if (actions.length === 0) return null

  return (
    <div className="flex gap-1">
      {actions.map(next => (
        <Button
          key={next}
          size="sm"
          variant={next === 'rejected' || next === 'hidden' ? 'destructive' : 'default'}
          disabled={isPending}
          onClick={() => startTransition(() => updateCandidateStatus(id, next))}
        >
          {LABELS[next]}
        </Button>
      ))}
    </div>
  )
}
