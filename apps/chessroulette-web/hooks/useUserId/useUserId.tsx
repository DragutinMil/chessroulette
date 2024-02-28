import { getRandomStr } from 'apps/chessroulette-web/util';
import { useSearchParams } from 'next/navigation';

export const useUserId = () => {
  // TODO: This is just temporary as the user ids are passed in the url
  const params = useSearchParams();

  return params.get('userId') || `guest-${getRandomStr(5)}`;
};
