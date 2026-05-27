'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { banUser, unbanUser, setAdmin } from './actions'

interface Props {
  userId: string
  isBanned: boolean
  isAdmin: boolean
  isSelf: boolean
}

export function UserActions({ userId, isBanned, isAdmin, isSelf }: Props) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex flex-wrap gap-1">
      {isBanned ? (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => startTransition(() => unbanUser(userId))}
        >
          BAN解除
        </Button>
      ) : (
        <Button
          size="sm"
          variant="destructive"
          disabled={isPending}
          onClick={() => {
            if (confirm('このユーザーを BAN しますか？')) {
              startTransition(() => banUser(userId))
            }
          }}
        >
          BAN
        </Button>
      )}
      {isAdmin ? (
        <Button
          size="sm"
          variant="secondary"
          disabled={isPending || isSelf}
          title={isSelf ? '自分自身の権限は剥奪できません' : undefined}
          onClick={() => startTransition(() => setAdmin(userId, false))}
        >
          権限剥奪
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => startTransition(() => setAdmin(userId, true))}
        >
          管理者付与
        </Button>
      )}
    </div>
  )
}
