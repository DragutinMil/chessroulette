import React, { useEffect, useState, useMemo } from 'react';
import { Dialog } from '@app/components/Dialog';
import { Text } from '@app/components/Text';
import { now } from '@app/lib/time';
import { invoke } from '@xmatter/util-kit';
import { BetweenGamesAborter } from './components/BetweenGamesAborter';
import { Button } from '../../../../components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { useRouter } from 'next/navigation';
import { checkUser, sendResult } from '@app/modules/Match/utilsOutpost';
import {
  PlayDialogContainer,
  PlayDialogContainerContainerProps,
} from '@app/modules/Match/Play/containers';
import {
  useMatchActionsDispatch,
  useMatchViewState,
} from '../../hooks/useMatch';
//import { useBoardTheme } from '../../../../components/Chessboard/hooks/useBoardTheme';

import Link from 'next/link';
import { getMatchPlayerRoleById } from '../../movex/util';
import { gameOverReasonsToDisplay } from './util';
import { useGame } from '@app/modules/Game/hooks';
import { CounterActions } from '@app/modules/Room/activities/Match/counter';
import { ActiveBot } from '@app/modules/Match/movex/types';

import { newRematchRequestInitiate } from '../../utilsOutpost';
import { useMovexBoundResourceFromRid } from 'movex-react';
import movexConfig from '@app/movex.config';
import { useMovexClient } from 'movex-react';
import { movexSubcribersToUserMap } from '@app/providers/MovexProvider';
import { useParams } from 'next/navigation';

export type ActivityActions = CounterActions;

type Props = PlayDialogContainerContainerProps & {
  activeBot?: ActiveBot;
};

// export default async function Page({
//   params,
//   searchParams,
// }: {
//   params: { roomId: string };
//   searchParams: Partial<{ theme: string }>;
// }) {
export const MatchStateDialogContainer: React.FC<Props> = ({
  activeBot,
  ...gameStateDialogProps
}) => {
  const { match, ...matchView } = useMatchViewState();
  const [alreadyRematch, setAlreadyRematch] = useState(false);
  const [endGameReason, setEndGameReason] = useState<string>('');
  const [isHidden, setIsHidden] = useState(false);

  // const [matchId, setMatchId] = useState('');
  const [room, setRoom] = useState('');

  //const [userId, setUserId] = useState('');
  const dispatch = useMatchActionsDispatch();
  const router = useRouter();
  const { lastOffer, playerId } = useGame();
  const userId = useMovexClient(movexConfig)?.id;
  const isPlayer =
    !!userId &&
    !!match &&
    (userId === match.challenger.id || userId === match.challengee.id);

  const params = useParams<{ roomId: string }>();

  const roomId = params.roomId;

  const roomRid = `room:${roomId}`;
  const movexResource = useMovexBoundResourceFromRid(
    movexConfig,
    roomRid as any
  );

  const participants = useMemo(
    () => movexSubcribersToUserMap(movexResource?.subscribers || {}),
    [movexResource?.subscribers]
  );

  useEffect(() => {
    if (
      (match?.status === 'ongoing' && !activeBot) ||
      match?.status === 'complete'
    ) {
      // Send to grab result from chessroullette
      sendResult();
      if (match?.status === 'complete') {
        const reasons = [
          'Game ended in checkmate',
          'Match ended in a Draw! 🤝',
          'Game ended in stalemate',
          'Draw by insufficient material',
          'Draw by threefold repetition',
          'Ended by resignation',
          'Match ended in a Draw! 🤝',
          'Game aborted',
          'Game ended on time',
          'Draw by insufficient material',
        ];

        setEndGameReason(reasons[Number(match.endedGames[0].gameOverReason)]);
      }
    }
  }, [match?.status]);

  useEffect(() => {
    async function runCheck() {
      if (isPlayer == false) {
        return;
      }
      const result = await checkUser(userId);
      // console.log('Tok', result);
      if (result == false) {
        console.log('token error');
        if (
          window.location.hostname !== 'localhost' &&
          userId !== 'czeKS1Q0JDSXJ' &&
          userId !== '8UWCweKl1Gvoi'
        ) {
          router.push('https://app.outpostchess.com/online-list');
        }
      }

      let room = Array(7)
        .fill(0)
        .map(() =>
          'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(
            Math.random() * 62
          )
        )
        .join('');
      setRoom(room);
    }
    runCheck();
  }, []);

  const isOpponentInRoom = useMemo(() => {
    // Rana provera - ako nemamo osnovne podatke, oba igrača nisu u sobi

    // Proveri da li imamo validne challenger i challengee podatke
    const challengerId = match?.challenger?.id;
    const challengeeId = match?.challengee?.id;

    if (!challengerId || !challengeeId) {
      return false;
    }

    // Proveri da li su OBA igrača u participants listi
    const challengerConnected = challengerId in participants;
    const challengeeConnected = challengeeId in participants;

    return challengerConnected && challengeeConnected;
  }, [match, participants]);

  if (match?.status === 'aborted') {
    return (
      <Dialog
        title="Match Aborted"
        content={
          <>
            <div className="flex justify-center w-full">
              <Button
                className="w-3/5 md:w-1/2  "
                icon="ArrowLeftIcon"
                bgColor="green"
                onClick={() => {
                  window.location.href =
                    'https://app.outpostchess.com/online-list';
                }}
              >
                Lobby&nbsp;&nbsp;&nbsp;
              </Button>
            </div>
          </>
        } // should there be something?
      />
    );
  }

  // TODO: Here we should just check the match.status

  if (
    match?.status === 'complete' &&
    (lastOffer?.type !== 'rematch' || lastOffer?.status !== 'pending')
  ) {
    if (isHidden) {
      return (
        <div className="absolute bottom-4 right-4 z-[51]">
          <button
            onClick={() => setIsHidden(false)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black-light border border-green-600/50 text-white transition-all duration-200 hover:border-green-600 hover:shadow-[0_0_14px_rgba(7,218,99,0.4)] hover:scale-110"
            style={{ boxShadow: '0px 0px 16px 0px #07DA6330' }}
            title="Show options"
          >
            <Icon name="EllipsisHorizontalIcon" className="w-5 h-5" />
          </button>
        </div>
      );
    }

    return (
      <Dialog
        title={`${endGameReason}`}
        hasCloseButton
        onClose={() => setIsHidden(true)}
        content={
          <div className="flex flex-col gap-4 items-center">
            <div className="flex  justify-center content-center text-center flex-col">
              <Text>
                {match.winner === null ? (
                  <span></span>
                ) : (match.winner == 'challenger' &&
                    match.challenger.id == activeBot?.id) ||
                  (match.winner == 'challengee' &&
                    match.challengee.id == activeBot?.id) ? (
                  <span className="capitalize">
                    {activeBot?.name}
                    {` `}Won{` `}
                    <span>🏆</span>
                  </span>
                ) : (
                  <span className="capitalize">
                    {match[match.winner].displayName || match[match.winner].id}
                    {` `}Won{` `}
                    <span>🏆</span>
                  </span>
                )}
              </Text>
              {activeBot?.botType !== 'basic' && (
                <div className="justify-center items-center flex flex-col gap-3 mt-4 w-full">
                  {isPlayer && (
                    <Button
                      icon="ArrowPathRoundedSquareIcon"
                      bgColor="green"
                      className="transition-all duration-200 w-full  hover:scale-[1.03] hover:shadow-[0_0_12px_rgba(7,218,99,0.25)]"
                      style={{ minWidth: '160px' }}
                      onClick={async () => {
                        if (playerId) {
                          if (!isOpponentInRoom) {
                            try {
                              if (!alreadyRematch) {
                                await newRematchRequestInitiate(roomId);
                              }
                              setAlreadyRematch(true);
                            } catch (error) {
                              console.error(
                                '❌ Error sending rematch notification:',
                                error
                              );
                            }
                          }
                          dispatch((masterContext) => ({
                            type: 'play:sendOffer',
                            payload: {
                              byPlayer: playerId,
                              offerType: 'rematch',
                              timestamp: masterContext.requestAt(),
                            },
                          }));
                        }
                      }}
                    >
                      Rematch
                    </Button>
                  )}

                  <Link
                    className="w-full"
                    href={`https://chess.outpostchess.com/room/new/r${room}?activity=review&userId=${userId}&theme=op&pgn=${roomId}`}
                  >
                    <Button
                      icon="MagnifyingGlassIcon"
                      bgColor="green"
                      className="transition-all text-black  duration-200 w-full hover:border-green-600 hover:scale-[1.03] hover:shadow-[0_0_16px_rgba(7,218,99,0.35)] bg-green-600"
                      style={{ minWidth: '160px', color: '#000' }}
                      onClick={() => {}}
                    >
                      Review
                    </Button>
                  </Link>

                  <Button
                    icon="ArrowLeftIcon"
                    bgColor="green"
                    className="transition-all duration-200 w-full hover:text-black  hover:scale-[1.03] hover:shadow-[0_0_12px_rgba(7,218,99,0.25)] mb-2"
                    style={{ minWidth: '160px' }}
                    onClick={() => {
                      window.location.href =
                        'https://app.outpostchess.com/online-list';
                    }}
                  >
                    Lobby
                  </Button>
                </div>
              )}
            </div>
          </div>
        }
      />
    );
  }

  // Show at the end of a game before the next game starts
  if (
    match?.status === 'ongoing' &&
    !match.gameInPlay &&
    matchView.previousGame
  ) {
    const titleSuffix =
      matchView.previousGame.winner === '1/2' ? ' in a Draw!' : '';

    const gameOverReason =
      matchView.previousGame.status === 'complete'
        ? gameOverReasonsToDisplay[matchView.previousGame.gameOverReason]
        : 'Game was aborted';

    const previousGame = matchView.previousGame;

    const renderWinnerMessage = invoke(() => {
      if (previousGame.winner === null) {
        return null;
      }

      if (previousGame.winner === '1/2') {
        return (
          <div className="flex flex-col gap-1">
            {match.type === 'bestOf' && <Text>The round will repeat!</Text>}
          </div>
        );
      }

      const winnerByRole = getMatchPlayerRoleById(
        match,
        previousGame.players[previousGame.winner]
      );

      if (!winnerByRole) {
        return null;
      }

      const playerDisplay =
        match[winnerByRole].displayName || match[winnerByRole].id;

      return <Text className="capitalize">{playerDisplay} Won!</Text>;
    });

    return (
      <Dialog
        title={
          match.type === 'bestOf'
            ? `Game ${matchView.endedGamesCount} Ended${titleSuffix}`
            : `Game Ended${titleSuffix}!`
        }
        content={
          <div className="flex flex-col gap-4 items-center">
            <div>{gameOverReason}</div>
            <div className="flex justify-center content-center text-center">
              {renderWinnerMessage}
            </div>
            {match.breakDurationMs > 0 && (
              <BetweenGamesAborter
                totalTimeAllowedMs={match.breakDurationMs}
                startedAt={now()}
                onFinished={() => {
                  dispatch({ type: 'match:startNewGame' });
                }}
                className="text-slate-500 font-italic"
              />
            )}
          </div>
        }
        // TODO: The rematch functionality needs to be at match level
        // {...(match.type === 'openEnded' && {
        //   buttons: [
        //     {
        //       children: 'Offer Rematch',
        //       onClick: () => {
        //         dispatch({
        //           type: 'play:sendOffer',
        //           payload: {
        //             byPlayer: gameStateDialogProps.playerId,
        //             offerType: 'rematch',
        //           },
        //         });
        //       },
        //       type: 'primary',
        //       bgColor: 'blue',
        //     },
        //   ],
        // })}
      />
    );
  }

  return <PlayDialogContainer {...gameStateDialogProps} />;
};
