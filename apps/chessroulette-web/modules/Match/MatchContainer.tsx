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
import { Footer } from '@app/components/Footer/Footer';
import { Text } from '@app/components/Text';


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
  const [activeWidget, setActiveWidget] = useState<'chat' | 'camera'>(() => {
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
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dispatch((masterContext) => ({
        type: 'play:updateChatState',
        payload: {
          userId,
          isChatEnabled,
          timestamp: masterContext.requestAt(),
        },
      }));
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isChatEnabled, userId, dispatch]);

  const otherPlayerChatEnabled = useMemo(() => {
    const otherPlayer =
      match.challenger.id === userId ? match.challengee : match.challenger;
    return otherPlayer.isChatEnabled !== false; // default to true if undefined
  }, [match.challenger, match.challengee, userId]);

  return (
    <MatchProvider match={match} userId={userId} dispatch={dispatch}>
      <ResizableDesktopLayout
        mainComponent={({ boardSize }) => (
          <>
          <PlayContainer
            key={match.endedGames.length}
            sizePx={boardSize}
            overlayComponent={
              <MatchStateDialogContainer inviteLink={inviteLink} />
            }
            {...boardProps}
          />

          {activeWidget === 'chat' }
            {//<Footer 
            //activeWidget={activeWidget}
            //setActiveWidget={setActiveWidget}
            ///>
          }

          </>
        )}
        rightSideSize={boardProps.rightSideSizePx}
        rightComponent={
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex flex-row md:flex-col flex-shrink-0">
              <div className="w-full">
                <MatchStateDisplayContainer />
              </div>
            </div>

            <div className="w-full flex-1 min-h-0 rounded-lg shadow-2xl flex pb-0 relative z-20">
              {activeWidget === 'camera' ? (
              <div className="flex-1 min-h-0 w-full h-full">

                <div className="flex items-center gap-2 p-2 border-b border-gray-700">
         
                      <Text className="text-sm font-semibold">Camera</Text> 
                 </div>
                <PeerToPeerCameraWidget />
                </div>
              ) : (            <div className="flex-1 min-h-0 flex flex-col overflow-hidden h-full">

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
                </div>
              )}
            </div>
            <div className="hidden md:block">
            <div className="h-1 md:h-3"></div>
            <div className="w-full flex-grow min-h-[120px] max-h-[120px] rounded-lg shadow-2xl flex flex-col pb-0 relative overflow-hidden transition-all duration-300 ease-in-out">
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                <GameNotationWidget />
              </div>
            </div>
            </div>

         {/*   <div className="bg-op-widget pl-2 pr-2 pt-2 pb-2 md:p-3 flex flex-col gap-2 md:flex-1 min-h-0 rounded-lg shadow-2xl">
              <div className= "hidden md:block"> 
              
              
            */}
             {/*<div className= "hidden md:block">*/}
             
             <div className="h-1 md:h-3"></div>
             <div className = "pb-0 pt-0 flex-shrink-0" > 
              <PlayControlsContainer
                activeWidget={activeWidget} 
                setActiveWidget={setActiveWidget}
              />
              </div>
           {/* </div> */}
          </div>
        }
      />
    </MatchProvider>
  );
};
