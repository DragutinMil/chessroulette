'use client';

import { ClipboardCopyButton } from 'apps/chessroulette-web/components/ClipboardCopyButton';
import { useUrl } from 'nextjs-current-url';
import { links } from '../links';
import Link from 'next/link';
import { Icon } from 'apps/chessroulette-web/components/Icon';
import { useMemo } from 'react';
import { useRoomSettings } from '../hooks/useRoomSettings';
import { useLearnActivitySettings } from '../activities/Learn/hooks/useLearnActivitySettings';

type Props = {
  roomId: string;
};

export const RoomSideMenu = ({ roomId }: Props) => {
  const url = useUrl();
  const activitySettings = useLearnActivitySettings();
  const roomSettings = useRoomSettings();

  const joinRoomLink = useMemo(() => {
    if (!(activitySettings.isInstructor && url)) {
      return undefined;
    }

    return links.getJoinRoomLink(
      {
        id: roomId,
        activity: 'learn',
        theme: roomSettings.theme,
      },
      url
    );
  }, [activitySettings.isInstructor, url?.origin]);

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
          tooltip="Invite Student"
        />
      )}
    </div>
  );
};
