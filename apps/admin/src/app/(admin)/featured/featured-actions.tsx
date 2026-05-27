'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { hideFeatured } from './actions'

export function FeaturedActions({ id, currentStatus }: { id: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition()
  if (currentStatus !== 'visible') return null

  return (
    <Button
      size="sm"
      variant="destructive"
      disabled={isPending}
      onClick={() => startTransition(() => hideFeatured(id))}
    >
      非表示
    </Button>
  )
}
