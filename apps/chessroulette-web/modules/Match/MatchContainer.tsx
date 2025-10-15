import { DispatchOf, DistributivePick } from '@xmatter/util-kit';
import { useEffect, useState } from 'react';
import { GameNotationWidget } from '@app/modules/Game/widgets';
import { UserId } from '@app/modules/User';
import { ResizableDesktopLayout } from '@app/templates/ResizableDesktopLayout';
import { PlayContainer, PlayerContainerProps } from './Play/PlayContainer';
import { MatchActions, MatchState } from './movex';
import { MatchProvider } from './providers';
import {
  MatchStateDialogContainer,
  MatchStateDisplayContainer,
} from './containers';
import { PlayControlsContainer } from './Play/containers';
import { PeerToPeerCameraWidget } from '../PeerToPeer';

import { ChatWidget } from './widgets/ChatWidget';
import { useCurrentOrPrevMatchPlay } from './Play/hooks';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';

type Props = DistributivePick<
  PlayerContainerProps,
  'rightSideClassName' | 'rightSideComponent' | 'rightSideSizePx'
> & {
  rightSideSizePx: NonNullable<PlayerContainerProps['rightSideSizePx']>; // re-enforcing this
  match: NonNullable<MatchState>;
  userId: UserId;
  dispatch: DispatchOf<MatchActions>;
  inviteLink?: string;
};

export const MatchContainer = ({
  match,
  userId,
  inviteLink,
  dispatch,
  ...boardProps
}: Props) => {
  const [activeWidget, setActiveWidget] = useState<'chat' | 'camera'>('camera');
  const play = useCurrentOrPrevMatchPlay();

  return (
    <MatchProvider match={match} userId={userId} dispatch={dispatch}>
      <ResizableDesktopLayout
        mainComponent={({ boardSize }) => (
          <PlayContainer
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
            <div className="flex flex-row md:flex-col">
              <div className="w-full">
                <MatchStateDisplayContainer />
              </div>
            </div>

            {/* Widget Controls */}
            <div className="flex gap-2">
              <ButtonGreen
                onClick={() => setActiveWidget('camera')}
                className={`flex-1 ${activeWidget === 'camera' ? '' : 'opacity-50'}`}
              >
                Camera
              </ButtonGreen>
              <ButtonGreen
                onClick={() => setActiveWidget('chat')}
                className={`flex-1 ${activeWidget === 'chat' ? '' : 'opacity-50'}`}
              >
                Chat
              </ButtonGreen>
            </div>

            {/* Widget Container */}
            <div className="w-full h-[300px] overflow-hidden rounded-lg shadow-2xl">
              {activeWidget === 'camera' ? (
                <PeerToPeerCameraWidget />
              ) : (
                <ChatWidget
                  messages={match.messages || []}
                  currentUserId={userId}
                  playerNames={{
                    [match.challenger.id]: match.challenger.displayName || 'Challenger',
                    [match.challengee.id]: match.challengee.displayName || 'Challengee',
                  }}
                  onSendMessage={(content) => {
                    dispatch((masterContext) => ({
                      type: 'play:sendMessage',
                      payload: {
                        senderId: userId,
                        content,
                        timestamp: masterContext.requestAt(),
                      },
                    }));
                  }}
                  //razmotriti uslove kada ce chat da bude disabled
                //  disabled={!play.game || play.game.status === 'aborted' || play.game.status === 'complete'}
                />
              )}
            </div>

            <div className="bg-op-widget pl-2 pr-2 pt-2 pb-2 md:p-3 flex flex-col gap-2 md:flex-1 min-h-0 rounded-lg shadow-2xl md:overflow-y-scroll">
              <GameNotationWidget />
              <PlayControlsContainer />
            </div>
          </div>
        }
      />
    </MatchProvider>
  );
};
