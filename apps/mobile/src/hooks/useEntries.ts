import { useQuery } from '@tanstack/react-query';
import {
  getEntryByDate,
  getEntriesForMonth,
  getAnniversaryEntries,
  getMemoryEntry,
} from '@/db/entries';
import { getTodayJST } from '@/utils/date';
import { useAppStore } from '@/store/appStore';
import type { EntryWithPets, CalendarEntryInfo, Entry } from '@/types';

export function useTodayEntry() {
  const today = getTodayJST();
  return useQuery<EntryWithPets | null>({
    queryKey: ['entry', 'today', today],
    queryFn: () => getEntryByDate(today),
    staleTime: 10_000,
  });
}

export function useEntryByDate(date: string) {
  return useQuery<EntryWithPets | null>({
    queryKey: ['entry', 'date', date],
    queryFn: () => getEntryByDate(date),
    enabled: !!date,
    staleTime: 30_000,
  });
}

export function useMonthEntries(year: number, month: number) {
  const petFilter = useAppStore(state => state.petFilter);
  return useQuery<CalendarEntryInfo[]>({
    queryKey: ['entries', 'month', year, month, petFilter],
    queryFn: () => getEntriesForMonth(year, month, petFilter),
    staleTime: 30_000,
  });
}

export function useAnniversaryEntries() {
  const petFilter = useAppStore(state => state.petFilter);
  return useQuery<EntryWithPets[]>({
    queryKey: ['entries', 'anniversaries', petFilter],
    queryFn: () => getAnniversaryEntries(petFilter),
    staleTime: 60_000,
  });
}

export function useMemoryEntry() {
  const today = getTodayJST();
  const petFilter = useAppStore(state => state.petFilter);
  return useQuery<Entry | null>({
    queryKey: ['entry', 'memory', today, petFilter],
    queryFn: () => getMemoryEntry(today, petFilter),
    staleTime: 60_000,
  });
}
