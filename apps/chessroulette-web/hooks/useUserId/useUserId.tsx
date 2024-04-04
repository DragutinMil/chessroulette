import { generateUserId, getRandomStr } from 'apps/chessroulette-web/util';
import { useSearchParams } from 'next/navigation';
import { useUpdateableSearchParams } from '../useSearchParams';

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
