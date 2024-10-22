import { useUrl } from 'nextjs-current-url';
import { useRoomSettings } from './useRoomSettings';
import { RoomActivityType, links } from '../links';
import { useMemo } from 'react';
import { useRoomDetails } from './useRoomDetails';
import { roomSettingsIsPlay } from '../utils';

export const useRoomLinkId = (activity: RoomActivityType) => {
  const url = useUrl();
  const roomSettings = useRoomSettings(activity);
  const roomId = useRoomDetails();

  const joinRoomLink = useMemo(() => {
    if (!(roomSettings.showJoinRoomLink && url && roomId)) {
      return undefined;
    }
    return links.getJoinRoomLink(
      {
        id: roomId.roomId,
        activity,
        ...(activity === 'play' &&
          roomSettingsIsPlay(roomSettings) && {
            gameTimeClass: roomSettings.gameTimeClass,
          }),
        theme: roomSettings.theme,
        ...roomSettings.joinRoomLinkParams,
      },
      {
        origin: url.origin,
      }
    );
  }, [roomSettings.showJoinRoomLink, activity, url?.origin]);

  return {
    joinRoomLink,
  };
};
