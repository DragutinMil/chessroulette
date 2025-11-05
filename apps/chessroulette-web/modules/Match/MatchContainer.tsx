import { DispatchOf, DistributivePick } from '@xmatter/util-kit';
import { useEffect, useMemo, useState } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);

  const [activeWidget, setActiveWidget] = useState<'chat' | 'camera'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return 'camera';
    }

    const savedWidget = localStorage.getItem('chessroulette-active-widget');
    return savedWidget === 'chat' || savedWidget === 'camera'
      ? savedWidget
      : 'camera';
  });

  // Initialize chat state from localStorage
  const [isChatEnabled, setIsChatEnabled] = useState(() => {
    const savedState = localStorage.getItem(
      `chessroulette-chat-enabled-${userId}`
    );
    return savedState === null ? true : savedState === 'true';
  });

  const play = useCurrentOrPrevMatchPlay();

  useEffect(() => {
    localStorage.setItem('chessroulette-active-widget', activeWidget);
  }, [activeWidget]);

  // Save chat state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(
      `chessroulette-chat-enabled-${userId}`,
      isChatEnabled.toString()
    );
  }, [isChatEnabled]);

  // Dispatch chat state changes to Movex
  // useEffect(() => {
  //   console.log(isChatEnabled)
  //   console.log( userId)
  //   console.log( dispatch)
  //   const timeoutId = setTimeout(() => {
  //     dispatch((masterContext) => ({
  //       type: 'play:updateChatState',
  //       payload: {
  //         userId,
  //         isChatEnabled,
  //         timestamp: masterContext.requestAt(),
  //       },
  //     }));
  //   }, 100);

  //   return () => clearTimeout(timeoutId);
  // }, [isChatEnabled, userId, dispatch]);

  const handleSetActiveWidget = (widget: 'chat' | 'camera') => {
    if (!isMobile) {
      setActiveWidget(widget);
    }
  };

  const otherPlayerChatEnabled = useMemo(() => {
    const otherPlayer =
      match.challenger.id === userId ? match.challengee : match.challenger;
    return otherPlayer.isChatEnabled !== false; // default to true if undefined
  }, [match.challenger, match.challengee, userId]);

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

            <div className="flex gap-2 hidden md:flex">
              <ButtonGreen
                onClick={() => handleSetActiveWidget('camera')}
                className={`flex-1 font-bold text-black ${
                  activeWidget === 'camera'
                    ? 'bg-[#07DA63] !bg-[#07DA63] hover:!bg-[#07DA63]'
                    : 'opacity-50 text-white'
                }`}
              >
                Camera
              </ButtonGreen>
              <ButtonGreen
                onClick={() => handleSetActiveWidget('chat')}
                className={`flex-1 font-bold text-black ${
                  activeWidget === 'chat'
                    ? 'bg-[#07DA63] !bg-[#07DA63] hover:!bg-[#07DA63]'
                    : 'opacity-50 text-white'
                }`}
              >
                Chat
              </ButtonGreen>
            </div>

            <div className="w-full h-full md:h-[300px] overflow-hidden rounded-lg shadow-2xl">
              {activeWidget === 'camera' ? (
                <PeerToPeerCameraWidget />
              ) : (
                <ChatWidget
                  messages={match.messages || []}
                  currentUserId={userId}
                  playerNames={{
                    [match.challenger.id]:
                      match.challenger.displayName || 'Challenger',
                    [match.challengee.id]:
                      match.challengee.displayName || 'Challengee',
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
                  // disabled={!play.game || play.game.status === 'aborted' || play.game.status === 'complete'}
                  onToggleChat={(enabled) => {
                    setIsChatEnabled(enabled);
                  }}
                  otherPlayerChatEnabled={
                    match.challenger.id === userId
                      ? match.challengee.isChatEnabled !== false
                      : match.challenger.isChatEnabled !== false
                  }
                />
              )}
            </div>

            <div className="bg-op-widget pl-2 pr-2 pt-2  pb-4 md:mb-0 mb-4 md:p-3 flex flex-col gap-2 md:flex-1 min-h-0 rounded-lg shadow-2xl ">
              <div className="md:flex hidden flex-1">
                <GameNotationWidget />
              </div>
              <PlayControlsContainer />
            </div>
          </div>
        }
      />
    </MatchProvider>
  );
};
