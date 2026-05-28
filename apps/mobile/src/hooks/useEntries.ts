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
  const selectedPetId = useAppStore(state => state.selectedPetId);
  return useQuery<EntryWithPets | null>({
    queryKey: ['entry', 'today', today, selectedPetId],
    queryFn: () => selectedPetId ? getEntryByDate(today, selectedPetId) : Promise.resolve(null),
    enabled: !!selectedPetId,
    staleTime: 10_000,
  });
}

export function useEntryByDate(date: string, primaryPetId: string) {
  return useQuery<EntryWithPets | null>({
    queryKey: ['entry', 'date', date, primaryPetId],
    queryFn: () => getEntryByDate(date, primaryPetId),
    enabled: !!date && !!primaryPetId,
    staleTime: 30_000,
  });
}

export function useMonthEntries(year: number, month: number) {
  const selectedPetId = useAppStore(state => state.selectedPetId);
  return useQuery<CalendarEntryInfo[]>({
    queryKey: ['entries', 'month', year, month, selectedPetId],
    queryFn: () => getEntriesForMonth(year, month, selectedPetId),
    staleTime: 30_000,
  });
}

export function useAnniversaryEntries() {
  const selectedPetId = useAppStore(state => state.selectedPetId);
  return useQuery<EntryWithPets[]>({
    queryKey: ['entries', 'anniversaries', selectedPetId],
    queryFn: () => getAnniversaryEntries(selectedPetId),
    staleTime: 60_000,
  });
}

export function useMemoryEntry() {
  const today = getTodayJST();
  const selectedPetId = useAppStore(state => state.selectedPetId);
  return useQuery<Entry | null>({
    queryKey: ['entry', 'memory', today, selectedPetId],
    queryFn: () => getMemoryEntry(today, selectedPetId),
    staleTime: 60_000,
  });
}
