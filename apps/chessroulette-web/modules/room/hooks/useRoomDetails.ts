import { useParams, useSearchParams } from 'next/navigation';

export const useRoomDetails = () => {
  const searchParams = useSearchParams();
  const params = useParams<Partial<{ roomId: string }>>();

  if (!params.roomId) {
    return undefined;
  }

  return {
    roomId: params.roomId,
  };
};
