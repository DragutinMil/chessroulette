import { generateGuestUserId, generateUserId } from '@app/util';
import { User } from '@app/modules/user/type';
import { useUpdateableSearchParams } from '@app/hooks/useSearchParams';
import { CustomSession } from '@app/services/Auth';

const getOrSetUserIdInSearchParams = (
  params: ReturnType<typeof useUpdateableSearchParams>,
  nextUserId: string
) => {
  const current = params.get('userId');

  if (typeof current === 'string' && current.length > 0) {
    return current;
  }

  params.set((prev) => ({
    ...prev,
    userId: nextUserId,
  }));

  return nextUserId;
};

export const useExistentUserIdOr = (
  newUserId: string = generateUserId()
): string => {
  return getOrSetUserIdInSearchParams(useUpdateableSearchParams(), newUserId);
};

export const useUser = (idIfInexistent?: string): User => {
  const userId = useExistentUserIdOr(idIfInexistent);
  const params = useUpdateableSearchParams();

  return {
    id: userId,
    displayName: params.get('userDisplayName') || undefined,
  };
};

export const useSessionUserOrSetAsGuest = (session?: CustomSession): User => {
  const params = useUpdateableSearchParams();

  if (session?.user) {
    return session.user;
  }

  const userId = getOrSetUserIdInSearchParams(params, generateGuestUserId());

  return {
    id: userId,
    displayName: params.get('userDisplayName') || 'guest',
  };
};
