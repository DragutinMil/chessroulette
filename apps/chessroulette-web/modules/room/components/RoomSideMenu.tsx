'use client';

import { ClipboardCopyButton } from 'apps/chessroulette-web/components/ClipboardCopyButton';
import { useUrl } from 'nextjs-current-url';
import { RoomActivityType, links } from '../links';
import Link from 'next/link';
import { Icon } from 'apps/chessroulette-web/components/Icon';
import { useMemo } from 'react';
import { useRoomSettings } from '../hooks/useRoomSettings';

type Props = {
  roomId: string;
  activity: RoomActivityType;
};

export const RoomSideMenu = ({ roomId, activity }: Props) => {
  const url = useUrl();
  const roomSettings = useRoomSettings(activity);

  const joinRoomLink = useMemo(() => {
    if (!(roomSettings.showJoinRoomLink && url)) {
      return undefined;
    }

    return {
      url: links.getJoinRoomLink(
        {
          id: roomId,
          activity,
          theme: roomSettings.theme,
          ...roomSettings.joinRoomLinkParams,
        },
        {
          origin: url.origin,
        }
      ),
      tooltip: roomSettings.joinRoomLinkTooltip,
    };
  }, [roomSettings.showJoinRoomLink, activity, url?.origin]);

  return (
    <div className="flex flex-col items-center gap-4">
      {joinRoomLink && (
        <ClipboardCopyButton
          buttonComponentType="Button"
          value={joinRoomLink.url}
          render={(copied) => (
            <>
              {copied ? (
                <Link
                  href={joinRoomLink.url}
                  target="_blank"
                  onClick={(e) => e.preventDefault()}
                >
                  <Icon name="CheckIcon" className="w-4 h-4" />
                </Link>
              ) : (
                <Icon name="PaperAirplaneIcon" className="w-4 h-4" />
              )}
            </>
          )}
          bgColor="green"
          type="custom"
          size="sm"
          tooltip={joinRoomLink.tooltip}
        />
      )}
    </div>
  );
};
