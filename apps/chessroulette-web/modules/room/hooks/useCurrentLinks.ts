import { keyInObject } from '@xmatter/util-kit';
import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';
import { useRouter, useParams } from 'next/navigation';
import { RoomLinkParams, links } from '../links';

export const useCurrentRoomLinks = () => {
  const router = useRouter();
  const searchParams = useUpdateableSearchParams();
  const currentParams = useParams();

  return {
    setForCurrentRoom: (params: RoomLinkParams) => {
      if (
        !(
          keyInObject(currentParams, 'rid') &&
          typeof currentParams.rid === 'string'
        )
      ) {
        throw new Error('UsecurrentRoom: The room Id must be a string');
      }

      const roomId = currentParams.rid;

      const prevParams = searchParams.toObject();

      const link = links.getRoomLink({
        id: roomId,
        activity: 'learn', // this should change
        ...prevParams,
        ...params,
      });

      router.push(link);
    },
  };
};
