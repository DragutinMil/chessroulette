import {
  generateGuestUserId,
  generateUserId,
  getRandomStr,
} from 'apps/chessroulette-web/util';
import { User } from 'apps/chessroulette-web/modules/user/type';
import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';
import { CustomSession } from 'apps/chessroulette-web/services/Auth';

// I don't want to use this anymore, as the guest doesn't make sense - I want to use the same clientId the Movex uses at all times
// export const useUserId = () => {
//   // TODO: This is just temporary as the user ids are passed in the url
//   const params = useSearchParams();

//   // return params.get('userId') || `guest-${getRandomStr(5)}`;
//   return params.get('userId');
// };

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
  // const userId = useExistentUserIdOr(`guest-${getRandomStr(12)}`);
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
