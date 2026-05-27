import { create } from 'zustand';
import type { Pet } from '@/types';

type AppSettings = {
  notification_enabled: boolean;
  notification_time: string;        // 'HH:MM'
  notification_featured_enabled: boolean;
  save_to_camera_roll: boolean;
  device_id: string;
};

type AppStore = {
  pets: Pet[];
  selectedPetId: string | null;
  petFilter: string;               // 'all' or pet_id
  settings: AppSettings;

  setPets: (pets: Pet[]) => void;
  setSelectedPetId: (id: string | null) => void;
  setPetFilter: (filter: string) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
};

const DEFAULT_SETTINGS: AppSettings = {
  notification_enabled:         true,
  notification_time:            '20:00',
  notification_featured_enabled: true,
  save_to_camera_roll:          true,
  device_id:                    '',
};

export const useAppStore = create<AppStore>((set) => ({
  pets:           [],
  selectedPetId:  null,
  petFilter:      'all',
  settings:       DEFAULT_SETTINGS,

  setPets:           (pets) => set({ pets }),
  setSelectedPetId:  (id) => set({ selectedPetId: id }),
  setPetFilter:      (filter) => set({ petFilter: filter }),
  updateSettings:    (patch) => set(s => ({ settings: { ...s.settings, ...patch } })),
}));
