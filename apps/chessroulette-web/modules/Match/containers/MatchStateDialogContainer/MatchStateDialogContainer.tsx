import React, { useEffect, useState, useRef } from 'react';
import { Dialog } from '@app/components/Dialog';
import { Text } from '@app/components/Text';
import { now } from '@app/lib/time';
import { invoke, GameOverReason } from '@xmatter/util-kit';
import { BetweenGamesAborter } from './components/BetweenGamesAborter';
import { Button } from '../../../../components/Button/Button';
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
import { useCurrentOrPrevMatchPlay } from '../../Play/hooks';
import { MatchPlayersByRole } from '../../movex';

export type ActivityActions = CounterActions;

type Props = PlayDialogContainerContainerProps;

export const MatchStateDialogContainer: React.FC<Props> = (
  gameStateDialogProps
) => {
  const { match, ...matchView } = useMatchViewState();
  const play = useCurrentOrPrevMatchPlay(); // Dodaj ako već nije

  const [fromWeb, setFromWeb] = useState(false);
  const [fromApp, setFromApp] = useState(false);
  const [matchId, setMatchId] = useState('');
  const [room, setRoom] = useState('');

  const [userId, setUserId] = useState('');
  const dispatch = useMatchActionsDispatch();
  const router = useRouter();
  const { lastOffer, playerId } = useGame();
  
  // Lokalni state za tracking završetka meča
  const [matchCompleted, setMatchCompleted] = useState(false);
  const prevMatchStatusRef = useRef(match?.status);
  const prevWinnerRef = useRef(match?.winner);

  // Detektuj završetak meča čim se status promeni
  useEffect(() => {
    const currentStatus = match?.status;
    const currentWinner = match?.winner;
    
    // Ako je meč završen i ima winner-a, postavi lokalni state odmah
    if (currentStatus === 'complete' && currentWinner) {
      setMatchCompleted(true);
    }
    
    // Resetuj ako se meč resetuje
    if (currentStatus !== 'complete' && matchCompleted) {
      setMatchCompleted(false);
    }
    
    prevMatchStatusRef.current = currentStatus;
    prevWinnerRef.current = currentWinner;
  }, [match?.status, match?.winner, matchCompleted]);

  useEffect(() => {
    if (match?.status === 'complete' || matchCompleted) {
      // Send to grab result from chessroullette
      sendResult();
    }
  }, [match?.winner, matchCompleted]);

  useEffect(() => {
    const result = checkUser();

    if (result == 'web') {
      setFromWeb(true);
    }
    if (result == 'outWeb') {
      if (window.location.hostname !== 'localhost') {
        router.push('https://app.outpostchess.com/online-list');
      }
    }
    const url = new URL(window.location.href);
    const pathParts = window.location.pathname.split('/');
    const matchId = pathParts[pathParts.length - 1];
    setUserId(url.searchParams.get('userId') ?? '');
    setMatchId(matchId);
    let room = Array(7)
      .fill(0)
      .map(() =>
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(
          Math.random() * 62
        )
      )
      .join('');
    setRoom(room);
    setFromWeb(true);
  }, []);

  if (match?.status === 'aborted') {
    return (
      <Dialog
        title="Match Aborted"
        content={
          <>
            {fromWeb && (
              <Button
                icon="ArrowLeftIcon"
                bgColor="yellow"
                style={{ marginTop: 12 }}
                onClick={() => {
                  window.location.href = "https://app.outpostchess.com/online-list";
                }}
              >
                Lobby &nbsp;&nbsp;&nbsp;&nbsp;
              </Button>
            )}
          </>
        }
      />
    );
  }

  // Koristi lokalni state ili match state za prikazivanje dijaloga
  const shouldShowMatchCompleted = matchCompleted || (match?.winner && (lastOffer?.type !== 'rematch' || lastOffer?.status !== 'pending'));

  // Proveri da li je trenutna igra završena zbog timeout-a
  // play.game može biti CompletedGame i pokriva i gameInPlay i previousGame
  const currentGame = play.game;
  const isTimeoutGame = 
    currentGame?.status === 'complete' && 
    currentGame.gameOverReason === GameOverReason['timeout'];
     
  // Odredi pobednika - ili iz match.winner ili iz trenutne igre za timeout slučaj
  let winner: keyof MatchPlayersByRole | null = null;

  if (shouldShowMatchCompleted) {
    // match?.winner može biti undefined, konvertuj u null ako je undefined
    winner = match?.winner ?? prevWinnerRef.current ?? null;
  } else if (isTimeoutGame && currentGame?.winner && currentGame.winner !== '1/2' && match) {
    // Za timeout slučaj, pobednik je onaj čije vreme NIJE isteklo (winner iz igre)
    // Proveri da match nije null pre poziva getMatchPlayerRoleById
    winner = getMatchPlayerRoleById(match, currentGame.players[currentGame.winner]);
  }

  if (shouldShowMatchCompleted || isTimeoutGame) {
    if (winner) {
      return (
        <Dialog
          title="Match Completed"
          content={
            <div className="flex flex-col gap-4 items-center">
              <div className="flex  justify-center content-center text-center flex-col">
                <Text>
                  {match && winner && match[winner].id.length == 16 ? (
                    <span className="capitalize">
                      Bot
                      {` `}Won{` `}
                      <span>🏆</span>
                    </span>
                  ) : (
                    <span className="capitalize">
                      {match && winner && (match[winner].displayName || match[winner].id)}
                      {` `}Won{` `}
                      <span>🏆</span>
                    </span>
                  )}
                </Text>
                {match && match[winner].id.length !== 16 && (
                  <div className="justify-center items-center flex flex-col">
                    <Button
                      icon="ArrowPathRoundedSquareIcon"
                      bgColor="green"
                      style={{
                        marginTop: 18,
                        minWidth: '160px',
                      }}
                      onClick={() => {
                        if (playerId) {
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
                    <Link
                      href={`https://chess.outpostchess.com/room/new/r${room}?activity=aichess&userId=${userId}&theme=op&pgn=${matchId}&instructor=1`}
                    >
                      <Button
                        icon="MagnifyingGlassIcon"
                        bgColor="green"
                        style={{
                          marginTop: 12,
                          minWidth: '160px',
                        }}
                        onClick={() => {}}
                      >
                        Review
                      </Button>
                    </Link>
                    {fromWeb && (
                      <Button
                        icon="ArrowLeftIcon"
                        bgColor="green"
                        style={{ marginTop: 12, minWidth: '160px' }}
                        onClick={() => {
                          window.location.href = "https://app.outpostchess.com/online-list";
                        }}
                      >
                        Lobby&nbsp;&nbsp;&nbsp;
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          }
        />
      );
    }
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
