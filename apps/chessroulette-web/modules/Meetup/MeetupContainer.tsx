import { DispatchOf, DistributivePick } from '@xmatter/util-kit';
import { GameNotationWidget } from '@app/modules/Game/widgets';
import { UserId } from '@app/modules/User2';
import { ResizableDesktopLayout } from '@app/templates/ResizableDesktopLayout';
import { PeerToPeerCameraWidget } from '@app/modules/PeerToPeer';
import {
  PlayContainer,
  PlayerContainerProps,
} from '@app/modules/Match/Play/PlayContainer';
import { MatchState } from '@app/modules/Match/movex';
import { MatchProvider } from '@app/modules/Match/providers';
import {
  MatchStateDialogContainer,
  MatchStateDisplayContainer,
} from '@app/modules/Match/containers';
import { PlayControlsContainer } from '@app/modules/Match/Play/containers';
import { FreeboardContainer } from '@app/components/Boards';
import { useEffect } from 'react';
import { useMeetupActivitySettings } from '../Room2/activities/Meetup/useMeetupActivitySettings';
import { MeetupActions } from './movex';

type Props = DistributivePick<
  PlayerContainerProps,
  'rightSideClassName' | 'rightSideComponent' | 'rightSideSizePx'
> & {
  rightSideSizePx: NonNullable<PlayerContainerProps['rightSideSizePx']>; // re-enforcing this
  match: MatchState;
  userId: UserId;
  dispatch: DispatchOf<MeetupActions>;
  inviteLink?: string;
};

export const MeetupContainer = ({
  match,
  userId,
  inviteLink,
  dispatch,
  ...boardProps
}: Props) => {
  const meetupSettings = useMeetupActivitySettings();
  useEffect(() => {
    dispatch({
      type: 'meetup:join',
      payload: {
        userId,
        isStar: meetupSettings.isStar,
      },
    });
  }, [userId, meetupSettings.isStar]);

  if (!match) {
    return (
      <ResizableDesktopLayout
        mainComponent={({ boardSize }) => (
          <FreeboardContainer sizePx={boardSize} {...boardProps} />
        )}
        rightSideSize={boardProps.rightSideSizePx}
        rightComponent={
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            <div className="overflow-hidden rounded-lg shadow-2xl">
              <PeerToPeerCameraWidget />
            </div>
            <div className="bg-slate-700 p-3 flex flex-col gap-2 flex-1 min-h-0 rounded-lg shadow-2xl overflow-y-scroll">
              <GameNotationWidget />
            </div>
          </div>
        }
      />
    );
  }

  return (
    <MatchProvider match={match} userId={userId} dispatch={dispatch}>
      <ResizableDesktopLayout
        mainComponent={({ boardSize }) => (
          <PlayContainer
            // This resets the PlayContainer on each new game
            key={match.endedGames.length}
            sizePx={boardSize}
            overlayComponent={
              <MatchStateDialogContainer inviteLink={inviteLink} />
            }
            {...boardProps}
          />
        )}
        rightSideSize={boardProps.rightSideSizePx}
        rightComponent={
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            <div className="overflow-hidden rounded-lg shadow-2xl">
              <PeerToPeerCameraWidget />
            </div>
            <MatchStateDisplayContainer />
            <div className="bg-slate-700 p-3 flex flex-col gap-2 flex-1 min-h-0 rounded-lg shadow-2xl overflow-y-scroll">
              <GameNotationWidget />
              <PlayControlsContainer />
            </div>
          </div>
        }
      />
    </MatchProvider>
  );
};
