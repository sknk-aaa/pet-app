import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { getTodayJST } from '@/utils/date';
import type { FeaturedPetToday } from '@/types';

async function fetchFeaturedPetToday(): Promise<FeaturedPetToday | null> {
  const today = getTodayJST();
  const { data, error } = await supabase
    .from('featured_pets_today')
    .select('*')
    .eq('featured_date', today)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function useFeaturedPetToday() {
  return useQuery<FeaturedPetToday | null>({
    queryKey: ['featured_pet_today'],
    queryFn: fetchFeaturedPetToday,
    refetchInterval: 5_000,
    staleTime: 0,
  });
}
