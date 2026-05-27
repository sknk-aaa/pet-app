import { useState, useEffect } from 'react';
import { getDb } from '@/db/client';
import { getAllPets, getPetById } from '@/db/pets';
import { initStreakState } from '@/db/streak';
import { initProState } from '@/db/proState';
import { getSetting, setSetting, getSettings } from '@/db/settings';
import { generateUUID } from '@/utils/uuid';
import { checkFileExists } from '@/services/photo';
import { flushPendingUploads } from '@/services/uploadQueue';
import { verifyProState } from '@/services/iap';
import { requestPermission, registerPushToken } from '@/services/notifications';
import { updatePet } from '@/db/pets';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';

export function useBootstrap(): { isReady: boolean; needsOnboarding: boolean } {
  const [isReady, setIsReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      await getDb();

      const pets = await getAllPets();
      const onboardingCompleted = await getSetting('onboarding_completed');
      const needsOnboard = pets.length === 0 || onboardingCompleted !== 'true';

      await Promise.all([initStreakState(), initProState()]);

      let deviceId = await getSetting('device_id');
      if (!deviceId) {
        deviceId = generateUUID();
        await setSetting('device_id', deviceId);
      }

      let selectedPetId = await getSetting('selected_pet_id');
      if (selectedPetId) {
        const pet = await getPetById(selectedPetId);
        if (!pet) {
          selectedPetId = pets[0]?.id ?? null;
          if (selectedPetId) {
            await setSetting('selected_pet_id', selectedPetId);
          }
        }
      } else if (pets.length > 0) {
        selectedPetId = pets[0].id;
        await setSetting('selected_pet_id', selectedPetId);
      }

      for (const pet of pets) {
        if (pet.icon_uri) {
          const exists = await checkFileExists(pet.icon_uri);
          if (!exists) {
            await updatePet(pet.id, { icon_uri: null });
            pet.icon_uri = null;
          }
        }
      }

      const settingKeys: import('@/types').SettingKey[] = [
        'notification_enabled',
        'notification_time',
        'notification_featured_enabled',
        'save_to_camera_roll',
        'device_id',
      ];
      const settingsMap = await getSettings(settingKeys);

      const { setPets, setSelectedPetId, updateSettings } = useAppStore.getState();
      setPets(pets);
      if (selectedPetId) setSelectedPetId(selectedPetId);
      updateSettings({
        notification_enabled: settingsMap['notification_enabled'] === 'true',
        notification_time: settingsMap['notification_time'] ?? '21:00',
        notification_featured_enabled: settingsMap['notification_featured_enabled'] !== 'false',
        save_to_camera_roll: settingsMap['save_to_camera_roll'] === 'true',
        device_id: settingsMap['device_id'] ?? deviceId,
      });

      flushPendingUploads().catch(() => {});
      verifyProState().catch(() => {});

      const session = useAuthStore.getState().session;
      if (session?.user?.id) {
        const permitted = await requestPermission();
        if (permitted) {
          registerPushToken(session.user.id).catch(() => {});
        }
      }

      if (!cancelled) {
        setNeedsOnboarding(needsOnboard);
        setIsReady(true);
      }
    }

    bootstrap().catch(() => {
      if (!cancelled) setIsReady(true);
    });

    return () => { cancelled = true; };
  }, []);

  return { isReady, needsOnboarding };
}
