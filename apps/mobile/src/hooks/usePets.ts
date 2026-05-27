import { useAppStore } from '@/store/appStore';
import type { Pet } from '@/types';

export function usePets(): Pet[] {
  return useAppStore(state => state.pets);
}

export function useSelectedPet(): Pet | null {
  return useAppStore(state => {
    const { pets, selectedPetId } = state;
    return pets.find(p => p.id === selectedPetId) ?? null;
  });
}
