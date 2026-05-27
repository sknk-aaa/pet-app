import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { AppUser } from '@/types';

type AuthStore = {
  session: Session | null;
  user: AppUser | null;
  isPro: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: AppUser | null) => void;
  setIsPro: (isPro: boolean) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  isPro: false,
  setSession: (session) => set({ session }),
  setUser:    (user) => set({ user }),
  setIsPro:   (isPro) => set({ isPro }),
}));
