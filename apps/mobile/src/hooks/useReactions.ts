import { useQueryClient, useMutation } from '@tanstack/react-query';
import { addPendingUpload } from '@/db/pendingUploads';
import { flushPendingUploads } from '@/services/uploadQueue';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { generateUUID } from '@/utils/uuid';
import type { FeaturedPetToday, ReactionType } from '@/types';

type ReactionsMap = Partial<Record<ReactionType, boolean>>;

export function useToggleReaction(featuredPetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reactionType,
      currentlyActive,
    }: {
      reactionType: ReactionType;
      currentlyActive: boolean;
    }) => {
      const deviceId = useAppStore.getState().settings.device_id ?? generateUUID();
      const session = useAuthStore.getState().session;

      const uploadType = currentlyActive ? 'reaction_delete' : 'reaction_add';
      await addPendingUpload(uploadType, {
        featured_pet_id: featuredPetId,
        reaction_type: reactionType,
        user_id: session?.user?.id ?? null,
        device_id: deviceId,
      });

      flushPendingUploads().catch(() => {});
    },
    onMutate: async ({ reactionType, currentlyActive }) => {
      await queryClient.cancelQueries({ queryKey: ['featured_pet_today'] });

      const prev = queryClient.getQueryData<FeaturedPetToday | null>(['featured_pet_today']);

      if (prev) {
        const countKey = `${reactionType}_count` as keyof FeaturedPetToday;
        const delta = currentlyActive ? -1 : 1;
        queryClient.setQueryData<FeaturedPetToday>(['featured_pet_today'], {
          ...prev,
          [countKey]: Math.max(0, (prev[countKey] as number) + delta),
        });
      }

      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(['featured_pet_today'], ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['featured_pet_today'] });
    },
  });
}

export function useLocalReactions(featuredPetId: string) {
  const deviceId = useAppStore.getState().settings.device_id;

  const getKey = (type: ReactionType) =>
    `reaction_${featuredPetId}_${type}_${deviceId}`;

  function isActive(type: ReactionType): boolean {
    return false; // local reaction state is tracked in the component via optimistic updates
  }

  return { isActive, getKey };
}
