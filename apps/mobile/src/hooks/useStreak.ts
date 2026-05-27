import { useQuery } from '@tanstack/react-query';
import { getStreakState } from '@/db/streak';
import type { StreakState } from '@/types';

export function useStreak() {
  return useQuery<StreakState>({
    queryKey: ['streak'],
    queryFn: getStreakState,
    staleTime: 30_000,
  });
}
