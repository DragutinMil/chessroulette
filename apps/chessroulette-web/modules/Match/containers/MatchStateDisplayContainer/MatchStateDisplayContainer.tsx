import React, { useEffect, useState, useMemo,useRef } from 'react';
import { Text } from '@app/components/Text';
import { PlayersInfo } from '@app/modules/Match/Play/containers';
import { MatchAbortContainer } from '../MatchAbortContainer';
import {
  useMatchActionsDispatch,
  useMatchViewState,
} from '../../hooks/useMatch';
import { enqueueMovexUpdatePlay } from '../../utils';
import { useCurrentOrPrevMatchPlay } from '../../Play/hooks';
// import { isMobile } from '@app/modules/Room/activities/Review/util';
import { UsersMap } from '@app/modules/User';
import { ConfirmButton } from '@app/components/Button';

const CLAIM_VICTORY_DELAY_MS = 30_000;

type MatchStateDisplayContainerProps = {
  activeBot?: string;
  isPlayer?: any;
  participants?: UsersMap;
  isMobile?:boolean
};

export const MatchStateDisplayContainer = ({
  activeBot,
  isPlayer,
  participants,
  isMobile,
}: MatchStateDisplayContainerProps) => {
  const { match, currentRound, drawsCount, endedGamesCount } =
    useMatchViewState();
  const play = useCurrentOrPrevMatchPlay();

  const dispatch = useMatchActionsDispatch();
   const lastDisplayTimeRef = useRef<string | undefined>(undefined);
  type TimeClass =
    | 'bullet'
    | 'blitz'
    | 'rapid'
    | 'blitz3'
    | 'blitz3plus2'
    | 'blitzplus2'
    | 'bulletplus1'
    | 'bullet2plus1'
    | 'untimed'
    | 'bullet2';

  const timeClassMap: Record<TimeClass, string> = {
    bullet: 'Bullet 1+0',
    blitz: 'Blitz 5+0',
    rapid: 'Rapid 10+0',
    blitz3: 'Blitz 3+0',
    blitz3plus2: 'Blitz 3+2',
    blitzplus2: 'Blitz 5+2',
    bulletplus1: 'Bullet 1+1',
    bullet2plus1: 'Bullet 2+1',
    untimed: '∞',
    bullet2: 'Bullet 2+0',
  };
 const timeClass =
  match?.gameInPlay?.timeClass 

const displayTime = timeClass
  ? timeClassMap[timeClass as TimeClass]
  : lastDisplayTimeRef.current;

if (timeClass) {
  lastDisplayTimeRef.current = timeClassMap[timeClass as TimeClass];
}
  
  const opponentId = useMemo(() => {
    if ( !match || !isPlayer) return undefined;
    if (match.challenger.id === isPlayer) return match.challengee.id;
    if (match.challengee.id === isPlayer) return match.challenger.id;
    return undefined;
  }, [match]);

  const opponentColor = useMemo(() => {
    if (!opponentId || !play.playersByColor) return undefined;
    if (play.playersByColor.w?.id === opponentId) return 'w' as const;
    if (play.playersByColor.b?.id === opponentId) return 'b' as const;
    return undefined;
  }, [opponentId]);
   

  // Only trust participants if we ourselves appear in it (i.e., the list is loaded)
  const selfInParticipants = isPlayer ? !!participants?.[isPlayer] : false;
  
  const opponentOnline =
  !selfInParticipants || (opponentId ? !!participants?.[opponentId] : true);
  const gameIsOngoing =
   match?.status === 'ongoing' && play.game?.status === 'ongoing';

     
  const [disconnectedAt, setDisconnectedAt] = useState<number | null>(null);
  const [canClaimVictory, setCanClaimVictory] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
   
    if (!gameIsOngoing || !opponentId || opponentOnline) {
     
      if (disconnectedAt !== null) {
        setDisconnectedAt(null);
        setCanClaimVictory(false);
        setSecondsLeft(30);
      }
      return;
    }
    if (disconnectedAt === null) {
      setDisconnectedAt(Date.now());
      setSecondsLeft(30);
    }
  }, [participants,gameIsOngoing]);

  useEffect(() => {
  
    if (disconnectedAt === null) return;
  
    const elapsed = Date.now() - disconnectedAt;
    const remaining = CLAIM_VICTORY_DELAY_MS - elapsed;

    if (remaining <= 0) {
      setCanClaimVictory(true);
      return;
    }

    setSecondsLeft(Math.ceil(remaining / 1000));

    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    const timeout = setTimeout(() => {
      setCanClaimVictory(true);
      clearInterval(interval);
    }, remaining);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [disconnectedAt]);
 
  // --- End Claim Victory logic ---
  
  return (
    <div className="flex flex-col gap-1 md:gap-1 w-full">
       {match?.type === 'bestOf'  && ( 
        <div className="flex flex-col md:flex-row gap-2 md:mt-0 mt-0 w-full text-sm md:text-md">
       
          <div style={{ opacity: disconnectedAt==null || !isMobile ? 1:0 }}>
            {/* <Text>Round &nbsp;</Text>
            <Text>{`${currentRound}/${match.rounds}`},</Text> */}

            <Text> {displayTime}</Text>
            {/* {drawsCount > 0 && (
              <Text> {`(${drawsCount} games ended in draw)`}</Text>
            )} */}
          </div>
         
        </div>
       )} 
      <div className="flex flex-row w-full mr-0 p-0">
        {play.game && (
          <PlayersInfo
            key={play.game.startedAt} // refresh it on each new game
            playersBySide={play.playersBySide}
            activeBot={activeBot}
            game={play.game}
            turn={play.turn}
            onCheckTime={async () => {
              await enqueueMovexUpdatePlay(() =>
                dispatch((masterContext) => ({
                  type: 'play:checkTime',
                  payload: {
                    at: masterContext.requestAt(),
                  },
                }))
              );
            }}
          />
        )}
      </div>
      {match &&
        play.hasGame &&
        play.game.status === 'idling' &&
        match.endedGames.length == 0 &&
        isPlayer && (
          <MatchAbortContainer
            key={play.game.startedAt + play.turn} // refresh it on each new game & when the turn changes
            game={play.game}
            turn={play.turn}
            playersByColor={play.playersByColor}
            timeToAbortMs={match.timeToAbortMs}
            playerId={play.userAsPlayerId}
            completedPlaysCount={endedGamesCount}
            className="md:bg-green-500 rounded-md p-0 md:p-2 fixed bottom-16 md:relative md:bottom-0 w-[94%]  md:w-full h-8"
          />
        )}

      {gameIsOngoing &&
        isPlayer &&
        !activeBot &&
        opponentColor &&
        disconnectedAt !== null && (
          <div className="flex gap-3   flex-row flex-1 justify-between rounded-md p-1  w-[100%] fixed top-[46px] md:relative md:bottom-0 md:top-0 w-full h-2">
            {!canClaimVictory ? (
              <span className="whitespace-nowrap  pt-0 relative bottom-1 md:pt-1 flex items-center text-sm min-h-[32px] font-semibold ">
                {`Opponent disconnected. Claim victory in ${secondsLeft}s`}
              </span>
            ) : (
              <div className='flex justify-center'>
                <span  className="whitespace-nowrap hidden md:flex  pt-0 relative bottom-1 md:pt-1 text-sm flex items-center text-md font-semibold min-h-[32px] ">
                  Opponent disconnected!
                </span>
                <ConfirmButton
                  bgColor="green"
                  size="sm"
                  icon="TrophyIcon"
                  iconKind="solid"
                  confirmModalTitle="Claim Victory?"
                  confirmWord="Yes"
                  confirmModalContent={
                    <div className="flex flex-row justify-center ">
                      <div>
                        Opponent has been disconnected. Claim the win?
                      </div>
                    </div>
                  }
                  confirmModalAgreeButtonBgColor="green"
                  onClick={() => {
                    dispatch({
                      type: 'play:resignGame',
                      payload: { color: opponentColor },
                    });
                  }}
                  className="p-1 gap-2 h-8 relative bottom-1  left-[-5px] md:left-4"
                >
                  Claim Victory
                </ConfirmButton>
              </div>
            )}
          </div>
        )}
    </div>
  );
};
