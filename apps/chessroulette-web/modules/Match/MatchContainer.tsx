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
import { useMatchViewState } from './hooks/useMatch';
import { useCurrentOrPrevMatchPlay } from './Play/hooks';
import { usePlayActionsDispatch } from './Play/hooks';
import { FreeBoardNotation } from '@app/components/FreeBoardNotation';

import { noop } from '@xmatter/util-kit';
import { useGame } from '../Game/hooks';


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
  const [activeWidget, setActiveWidget] = useState<'chat' | 'camera'>('chat');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  return (
    <MatchProvider match={match} userId={userId} dispatch={dispatch}>
      <MatchContainerInner
        match={match}
        userId={userId}
        inviteLink={inviteLink}
        dispatch={dispatch}
        activeWidget={activeWidget}
        setActiveWidget={setActiveWidget}
        isMobileChatOpen={isMobileChatOpen}
        setIsMobileChatOpen={setIsMobileChatOpen}
        {...boardProps}
      />
    </MatchProvider>
  );
};

const MatchContainerInner = ({
  match,
  userId,
  inviteLink,
  dispatch,
  activeWidget,
  setActiveWidget,
  isMobileChatOpen,
  setIsMobileChatOpen,
  ...boardProps
}: Props & {
  activeWidget: 'chat' | 'camera';
  setActiveWidget: (widget: 'chat' | 'camera') => void;
  isMobileChatOpen: boolean;
  setIsMobileChatOpen: (open: boolean) => void;
}) => {
  const { match: matchState } = useMatchViewState();
  const { playersBySide } = useCurrentOrPrevMatchPlay();
  const dispatchPlay = usePlayActionsDispatch();
  const { displayState, actions } = useGame();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const playerNames = playersBySide
    ? {
        [playersBySide.home.id]: playersBySide.home.displayName || 'Player 1',
        [playersBySide.away.id]: playersBySide.away.displayName || 'Player 2',
      }
    : {};

  const handleSendMessage = (content: string) => {
    dispatch({
      type: 'play:sendMessage',
      payload: {
        senderId: userId,
        content,
        timestamp: Date.now(),
      },
    });
  };

  const handleToggleChat = (enabled: boolean) => {
    // Možeš dodati dodatnu logiku ovde ako treba
  };

  return (
    <>

<div className="flex flex-col flex-1 min-h-0 gap-4 w-full md:w-1/2 md:hidden">
            <div className="flex flex-row md:flex-col w-full md:w-1/2">
              {/*<div className="w-1/2  md:w-full h-full overflow-hidden rounded-lg shadow-2xl">
                <PeerToPeerCameraWidget />
              </div>*/}
              <div className="w-full md:w-1/2 mr-0 md:mr-0">
                <MatchStateDisplayContainer />
              </div>
            </div>
            </div>
      <ResizableDesktopLayout
        mainComponent={({ boardSize }) => (
          <div className=" w-max[full] md:w-max[3/4] mr-0">
          <PlayContainer
            // This resets the PlayContainer on each new game
            key={match.endedGames.length}
            sizePx={boardSize}
            overlayComponent={
              <MatchStateDialogContainer inviteLink={inviteLink} />
            }
            {...boardProps}
          />
          </div>
        )}
        rightSideSize={boardProps.rightSideSizePx}
        rightComponent={
          <div className="flex flex-col flex-1 min-h-0 gap-4 w-full">
            <div className="flex flex-row md:flex-col w-full">
              {/*<div className="w-1/2  md:w-full h-full overflow-hidden rounded-lg shadow-2xl">
                <PeerToPeerCameraWidget />
              </div>*/}
                <div className="hidden md:block md:w-full mr-0 md:ml-0">
                <MatchStateDisplayContainer />
              </div>
            </div>
            
            {/* Desktop Chat Widget */}
            <div className="hidden md:flex flex-1 min-h-0 w-full">
              {activeWidget === 'chat' && (
                <ChatWidget
                  messages={matchState?.messages || []}
                  currentUserId={userId}
                  playerNames={playerNames}
                  onSendMessage={handleSendMessage}
                  onToggleChat={handleToggleChat}
                  otherPlayerChatEnabled={true}
                />
              )}
            </div>
            
            <div className="w-full pl-2 pr-2 pt-2 pb-2 md:p-3 flex flex-col gap-2 md:flex-1 min-h-0 rounded-lg shadow-2xl md:overflow-y-scroll no-scrollbar fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto">            
              <div
                style={{
                  backgroundImage: 'radial-gradient(61.84% 61.84% at 50% 131.62%, rgba(5, 135, 44, 0.2) 0%, rgb(1, 33, 11) 100%)',
                  height: isMobile ? '52px' : '290px',
                  minHeight: isMobile ? '52px' : '202px',
                }}
                className="overflow-x-auto md:overflow-x-hidden md:flex rounded-lg md:mb-0 mb-4 border border-conversation-100 md:p-4 p-2 overflow-scroll no-scrollbar"
              >
                <FreeBoardNotation
                  isMobile={isMobile}
                  history={displayState.history}
                  playerNames={[
                    playersBySide?.home.displayName || 'Player 1',
                    playersBySide?.away.displayName || 'Player 2',
                  ]}
                  focusedIndex={displayState.focusedIndex}
                  onDelete={noop}
                  onRefocus={actions.onRefocus}
                />
              </div>

              <PlayControlsContainer 
                activeWidget={activeWidget} 
                setActiveWidget={(widget) => {
                  setActiveWidget(widget);
                  if (widget === 'chat') {
                    setIsMobileChatOpen(true);
                  }
                }} 
              />
            </div>
          </div>
        }
      />

      {isMobileChatOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#01210b] flex flex-col">
          <div className="flex-1 overflow-hidden">
            <ChatWidget
              messages={matchState?.messages || []}
              currentUserId={userId}
              playerNames={playerNames}
              onSendMessage={handleSendMessage}
              onToggleChat={handleToggleChat}
              otherPlayerChatEnabled={true}
              onClose={() => setIsMobileChatOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};