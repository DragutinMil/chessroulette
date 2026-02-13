import { DispatchOf, DistributivePick } from '@xmatter/util-kit';
import { useEffect, useState, useRef } from 'react';
import { GameNotationWidget } from '@app/modules/Game/widgets';
import { UserId } from '@app/modules/User';
import { ResizableDesktopLayout } from '@app/templates/ResizableDesktopLayout';
import { PlayContainer, PlayerContainerProps } from './Play/PlayContainer';
import { MatchActions, MatchState } from './movex';
import { MatchProvider } from './providers';
import { findIfBots } from './utils';
import { VideoCameraIcon } from '@heroicons/react/24/solid';

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
import socketUtil from '../../socketUtil';
import { ActiveBot } from '@app/modules/Match/movex/types';
import {
  botSendRematchOffer,
  botRejectDrawOffer,
  onTakeBackOfferBot,
  botTalkInitiation,
} from './bots/botActions';
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
  const { playersBySide, canUserPlay } = useCurrentOrPrevMatchPlay();
  const dispatchPlay = usePlayActionsDispatch();
  const { displayState, actions } = useGame();
  const [cameraExpanded, setCameraExpanded] = useState(false);
  //const [cameraVisible, setCameraVisible] = useState(true);
  const [camera, setCamera] = useState(true);
  const [cameraOnAgain, setCameraOnAgain] = useState(false);
  const [botTalkInitiated, setBotTalkInitiated] = useState(false);

  const [stopEngineMove, setStopEngineMove] = useState(false);
  const lastTakebackHandledAtRef = useRef<number>(0);

  //const [offersWithChatBot, setOffersWithChatBot] = useState('');
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [activeBot, setActiveBot] = useState<ActiveBot>();
  const [oponentColor, setOponentColor] = useState<string>();

  // const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Resize i socket connection
  useEffect(() => {
    // const handleResize = () => setIsMobile(window.innerWidth <= 768);
    //  window.addEventListener('resize', handleResize);
    if (match.challengee.id.length !== 16) {
      localStorage.setItem('socket', 'playing');
      socketUtil.connect('playing');
    } else {
      localStorage.setItem('socket', 'available');

      socketUtil.connect('available');
    }

    return () => {
      // window.removeEventListener('resize', handleResize);
      socketUtil.disconnect();
    };
  }, [match.challengee.id]);

  const playerNames = playersBySide
    ? {
        [playersBySide.home.id]:
          playersBySide.home.displayName || activeBot?.name || 'Player 1',
        [playersBySide.away.id]:
          playersBySide.away.displayName || activeBot?.name || 'Player 2',
      }
    : {};

  const [isChatEnabled, setIsChatEnabled] = useState(() => {
    const savedState = localStorage.getItem(`chessroulette-chat-enabled`);
    return savedState === null ? true : savedState === 'true';
  });
  //  console.log('activeBot',activeBot)
  const handleSendMessage = (
    content: string,
    responseId?: string,
    senderId?: string
  ) => {
    // da povuce istoriju neophodno je da ide bez id prva poruka

    dispatch({
      type: 'play:sendMessage',
      payload: {
        senderId: senderId || userId,
        content,
        timestamp: Date.now(),
        responseId: responseId,
      },
    });
  };

  useEffect(() => {
    if (isMobileChatOpen === false && isMobile) {
      setActiveWidget('camera');
      localStorage.setItem('chessroulette-active-widget', 'camera');
      return;
    }
    localStorage.setItem('chessroulette-active-widget', activeWidget);
  }, [activeWidget, isMobileChatOpen]);

  useEffect(() => {
    localStorage.setItem(
      `chessroulette-chat-enabled`,
      isChatEnabled.toString()
    );
  }, [isChatEnabled]);

  const handleToggleChat = (enabled: boolean) => {
    // dodatna logika po potrebi
  };
  const cameraOff = () => {
    setCameraExpanded(false);
    setTimeout(() => {
      setCamera(false);
      setCameraOnAgain(false);
    }, 200);
  };

  useEffect(() => {
    setIsMobile(window.innerWidth < 700);
    if (isMobile) {
      setCamera(false);
    }
    if (match) {
      const bot = findIfBots(match?.challengee.id, match?.challenger.id);
      if (bot) {
        setActiveBot(bot);
        if (match.gameInPlay?.players.w === bot.id) {
          setOponentColor('black');
        } else {
          setOponentColor('white');
        }
      }
    }
  }, []);

  useEffect(() => {
    
    if (!activeBot) {
      return;
    }
    if (activeBot?.id?.slice(-3) !== '000') {
      return;
    }
   
    if (
      (match.gameInPlay && 
      match.messages.length == 0 &&
      match.gameInPlay.pgn.length > 15 &&
      match.gameInPlay.pgn.length < 19 && !botTalkInitiated)
      //  || (match.gameInPlay && 
      // match.messages.length == 0)
    ) {
      console.log('botTalkInitiated',botTalkInitiated)
      setBotTalkInitiated(true);
      botTalkInitiation(
        dispatch,
        activeBot,
        match.messages,
        match.gameInPlay.pgn,
        oponentColor
      );
    }
   
  }, [match.gameInPlay?.pgn]);

  useEffect(() => {
    if (!activeBot || activeBot?.id?.slice(-3) !== '000') {
      return;
    }
    const offer = match?.gameInPlay?.offers.at(-1);
    if (
      offer?.type === 'draw' &&
      match.gameInPlay &&
      offer.status === 'pending'
    ) {
      botRejectDrawOffer(
        dispatch,
        activeBot,
        match.messages,
        match.gameInPlay.pgn,
        1000
      );
    } else if (offer?.type === 'takeback' && offer.status === 'pending') {
      const now = Date.now();
      if (now - lastTakebackHandledAtRef.current < 1000) {
        return;
      }
      lastTakebackHandledAtRef.current = now;
      onTakeBackOfferBot(dispatch, 1500);
      setStopEngineMove(true);
      setTimeout(() => {
        setStopEngineMove(false);
      }, 2000);
    }
    if (match.status === 'complete') {
      botSendRematchOffer(dispatch, activeBot.id ,1000, match?.messages[match.messages.length-1]?.responseId);
    }
  }, [match.gameInPlay?.offers, match.status]);

  const isPlayer = canUserPlay && playersBySide?.home.id;

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 gap-4 w-full md:w-1/2 md:hidden  mt-4 relative  z-[40]">
        <div className="flex flex-row md:flex-col w-full md:w-1/2">
          <div className="w-full md:w-1/2 mr-0 md:mr-0">
            <MatchStateDisplayContainer activeBot={activeBot?.name} />
          </div>
        </div>
      </div>

      <ResizableDesktopLayout
        mainComponent={({ boardSize }) => (
          <div className=" w-max[full] md:w-max[3/4] mr-0 ">
            <PlayContainer
              key={match.endedGames.length}
              botId={activeBot?.id}
              sizePx={boardSize}
              stopEngineMove={stopEngineMove}
              overlayComponent={
                <MatchStateDialogContainer
                  activeBot={activeBot}
                  inviteLink={inviteLink}
                />
              }
              {...boardProps}
            />
          </div>
        )}
        rightSideSize={boardProps.rightSideSizePx}
        rightComponent={
          <div className="flex flex-col flex-1 min-h-0 gap-4 w-full ">
            <div className="flex flex-row md:flex-col w-full">
              <div className="hidden md:block md:w-full mr-0 md:ml-0">
                <MatchStateDisplayContainer activeBot={activeBot?.name} />
              </div>
            </div>

            {/* Desktop Chat Widget */}
            {isPlayer  && (
            <div className="w-full hidden md:flex flex-1 min-h-0 w-full relative">
              {(activeWidget === 'chat' && activeBot) ||
              activeBot?.id?.slice(-3) == '000' ||
              !activeBot && isPlayer? (
               
                <div className="w-full hidden md:flex flex-1 min-h-0 w-full relative">
                  {(activeBot?.id?.slice(-3) == '000' || !activeBot  ) && (
                  <ChatWidget
                    pgn={
                      matchState?.gameInPlay?.pgn ||
                      matchState?.endedGames[0]?.pgn ||
                      ''
                    }
                    messages={matchState?.messages || []}
                    currentUserId={userId}
                    activeBot={activeBot}
                    playerNames={playerNames}
                    oponentColor={oponentColor}
                    onSendMessage={handleSendMessage}
                    otherPlayerChatEnabled={true}
                  />
                  )}
                  <div
                    className={`
                      hidden md:block absolute z-20  cursor-pointer transition-all duration-300 ease-in-out
                      rounded-lg  overflow-hidden 
                      ${
                        (cameraExpanded || ( activeBot && activeBot?.id?.slice(-3) !== '000' ))
                          ? 'inset-0 w-full h-full z-[51]'
                          : 'top-1 right-1  w-2/5'
                      }
                    `}
                  >

                    { activeBot?.id?.slice(-3) !== '000' && !isMobile &&(

                      <div>
                        <div
                          className={`
                       ${
                         camera
                           ? 'opacity-100 z-10'
                           : 'opacity-0 pointer-events-none -z-10'
                       }
                      }
                    `}
                        >
                          <PeerToPeerCameraWidget
                            cameraOnAgain={cameraOnAgain}
                            activeBot={activeBot}
                            onDisableCamera={() => cameraOff()}
                            camera={camera}
                            onToggleExpand={() => setCameraExpanded((p) => !p)}
                            isExpanded={cameraExpanded}
                          />
                        </div>

                        <button
                          onClick={() => {
                            setCamera(true);
                            setCameraOnAgain(true);
                          }}
                          className={` ${
                            camera
                              ? 'opacity-0 pointer-events-none -z-10'
                              : 'opacity-100 z-10'
                          }
                                                        absolute  left-[82%] h-8  bg-black/50 text-white rounded-md p-1 hover:opacity-70
                                                        top-1   hover:rounded-xl
                                                      `}
                        >
                          <VideoCameraIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // classic bot players
                !isMobile && canUserPlay &&(
                  <div className="w-1/2  md:w-full h-full overflow-hidden  rounded-lg shadow-2xl  ">
                    <PeerToPeerCameraWidget activeBot={activeBot} />
                  </div>
                )
              )}
            </div>
            )}
            <div className="w-full pl-2 pr-2 md:pl-0 md:pr-0 pt-0 pb-0 flex flex-col md:gap-2 gap-2 md:flex-1 min-h-[48px] rounded-lg shadow-2xl  overflow-y-scroll no-scrollbar fixed bottom-1 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto ">
              {(match.gameInPlay?.status !== 'idling' || !isMobile) && (
                <div
                  style={{
                    backgroundImage:
                      'radial-gradient(61.84% 61.84% at 50% 131.62%, rgba(5, 135, 44, 0.2) 0%, rgb(1, 33, 11) 100%)',
                    height: isMobile ? '52px' : '290px',
                    minHeight: isMobile ? '52px' : '202px',
                    width: '100%',
                  }}
                  className="overflow-x-auto  md:overflow-x-hidden md:flex rounded-lg md:mb-0 mb-1 border border-conversation-100 md:p-4 p-2 overflow-scroll no-scrollbar w-full"
                >
                  {isMobile !== null && (
                    <FreeBoardNotation
                      isMobile={isMobile}
                      history={displayState.history}
                      playerNames={[
                        playersBySide?.home.displayName ||
                          activeBot?.name ||
                          'Player 1',
                        playersBySide?.away.displayName ||
                          activeBot?.name ||
                          'Player 2',
                      ]}
                      focusedIndex={displayState.focusedIndex}
                      onDelete={noop}
                      onRefocus={actions.onRefocus}
                    />
                  )}
                </div>
              )}
              {isMobile !== null && (
                <PlayControlsContainer
                  activeWidget={activeWidget}
                  isMobile={isMobile}
                  setActiveWidget={(widget) => {
                    setActiveWidget(widget);
                    if (widget === 'chat') setIsMobileChatOpen(true);
                  }}
                />
              )}
            </div>
          </div>
        }
      />

      {isPlayer && isMobileChatOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#01210b] flex flex-col">
          <div className="flex-1 overflow-hidden">
            <ChatWidget
              pgn={
                matchState?.gameInPlay?.pgn ||
                matchState?.endedGames[0]?.pgn ||
                ''
              }
              messages={matchState?.messages || []}
              currentUserId={userId}
              oponentColor={oponentColor}
              activeBot={activeBot}
              playerNames={playerNames}
              onSendMessage={handleSendMessage}
              otherPlayerChatEnabled={true}
              onClose={() => setIsMobileChatOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};
