import { generateUserId } from 'apps/chessroulette-web/util';
import { User } from 'apps/chessroulette-web/modules/user/type';
import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';

// I don't want to use this anymore, as the guest doesn't make sense - I want to use the same clientId the Movex uses at all times
// export const useUserId = () => {
//   // TODO: This is just temporary as the user ids are passed in the url
//   const params = useSearchParams();

//   // return params.get('userId') || `guest-${getRandomStr(5)}`;
//   return params.get('userId');
// };

export const useExistentUserIdOr = (newUserId?: string): string => {
  const params = useUpdateableSearchParams();

  const current = params.get('userId');
  if (!(typeof current === 'string' && current.length > 0)) {
    const nextUserId = newUserId || generateUserId();

    params.set((prev) => ({
      ...prev,
      userId: nextUserId,
    }));

    return nextUserId;
  }

  return current;
};

export const useUser = (idIfInexistent?: string): User => {
  const userId = useExistentUserIdOr(idIfInexistent);
  const params = useUpdateableSearchParams();

  return {
    id: userId,
    displayName: params.get('userDisplayName') || undefined,
  };
};
