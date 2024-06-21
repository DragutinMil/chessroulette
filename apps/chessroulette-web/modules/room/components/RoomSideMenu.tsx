'use client';

import { ClipboardCopyButton } from 'apps/chessroulette-web/components/ClipboardCopyButton';
import { RoomActivityType } from '../links';
import Link from 'next/link';
import { Icon } from 'apps/chessroulette-web/components/Icon';
import { useRoomSettings } from '../hooks/useRoomSettings';
import { IconButton } from 'apps/chessroulette-web/components/Button';
import { useRoomLinkId } from '../hooks/useRoomLinkId';

type Props = {
  roomId: string;
  activity: RoomActivityType;
};

export const RoomSideMenu = ({ roomId, activity }: Props) => {
  const roomSettings = useRoomSettings(activity);
  const { joinRoomLink } = useRoomLinkId(activity);

  return (
    <div className="flex flex-col items-center gap-4">
      {joinRoomLink && (
        <ClipboardCopyButton
          buttonComponentType="Button"
          value={joinRoomLink}
          render={(copied) => (
            <>
              {copied ? (
                <Link
                  href={joinRoomLink}
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
          tooltip={roomSettings.joinRoomLinkTooltip || 'Invite Opponent'}
        />
      )}

      <IconButton icon="BuildingLibraryIcon" size="sm" href="/learn/lessons" />
    </div>
  );
};
