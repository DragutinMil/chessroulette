import React, { useEffect, useState } from 'react';
import { Dialog } from '@app/components/Dialog';
import { Text } from '@app/components/Text';
import { now } from '@app/lib/time';
import { invoke } from '@xmatter/util-kit';
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

import { getMatchPlayerRoleById } from '../../movex/util';
import { gameOverReasonsToDisplay } from './util';
import { useGame } from '@app/modules/Game/hooks';
import { CounterActions } from '@app/modules/Room/activities/Match/counter';

export type ActivityActions = CounterActions;

type Props = PlayDialogContainerContainerProps;
// export default async function Page({
//   params,
//   searchParams,
// }: {
//   params: { roomId: string };
//   searchParams: Partial<{ theme: string }>;
// }) {
export const MatchStateDialogContainer: React.FC<Props> = (
  gameStateDialogProps
) => {
  const { match, ...matchView } = useMatchViewState();
  const [fromWeb, setFromWeb] = useState(false);
  const [fromApp, setFromApp] = useState(false);
  const dispatch = useMatchActionsDispatch();
  const router = useRouter();
  const { lastOffer, playerId } = useGame();
  useEffect(() => {
    if (match?.status === 'complete') {
      // Send to grab result from chessroullette
      sendResult();
    }
  }, [match?.winner]);
  useEffect(() => {
    const result = checkUser();
    console.log('result', result);
    if (result == 'web') {
      setFromWeb(true);
    }
    if (result == 'outWeb') {
      router.push('https://app.outpostchess.com/online-list');
    }
    //
    //  setFromWeb(true)
  }, []);

  if (match?.status === 'aborted') {
    return (
      <Dialog
        title="Match Aborted"
        content={
          <>
            {/* { (document.referrer.includes('app.outpostchess.com') || document.referrer.includes('localhost:8080') || document.referrer.includes('test-app.outpostchess.com')) && */}
            {fromWeb && (
              <Button
                icon="ArrowLeftIcon"
                bgColor="yellow"
                style={{ marginTop: 12 }}
                onClick={() => {
                  router.push('https://app.outpostchess.com/online-list');
                }}
              >
                Lobby &nbsp;&nbsp;&nbsp;&nbsp;
              </Button>
            )}
          </>
        } // should there be something?
      />
    );
  }

  // TODO: Here we should just check the match.status

  if (match?.winner && !lastOffer) {
    return (
      <Dialog
        title="Match Completed"
        content={
          <div className="flex flex-col gap-4 items-center">
            <div className="flex  justify-center content-center text-center flex-col">
              <Text>
                {match[match.winner].id.length == 16 ? (
                  <span className="capitalize">
                    Bot
                    {` `}Won{` `}
                    <span>🏆</span>
                  </span>
                ) : (
                  // REGULAR NAME
                  <span className="capitalize">
                    {match[match.winner].displayName || match[match.winner].id}
                    {` `}Won{` `}
                    <span>🏆</span>
                  </span>
                )}
              </Text>
              {match[match.winner].id.length !== 16 && (
                <div className="justify-center items-center flex flex-col">
                  {/* <Button
                    icon="ArrowPathRoundedSquareIcon"
                    style={{
                      marginTop: 18,
                      background: '#07da63',
                      color: '#202122',
                    }}
                    onClick={() => {
                      if (playerId) {
                        // dispatch({ type: 'increment' });
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
                  </Button> */}

                  {/* { (document.referrer.includes('app.outpostchess.com') || document.referrer.includes('localhost:8080') || document.referrer.includes('test-app.outpostchess.com')) && */}
                  {fromWeb && (
                    <Button
                      icon="ArrowLeftIcon"
                      bgColor="yellow"
                      style={{ marginTop: 12 }}
                      onClick={() => {
                        router.push('https://app.outpostchess.com/online-list');
                      }}
                    >
                      Lobby &nbsp;&nbsp;&nbsp;&nbsp;
                    </Button>
                  )}

                  {/* } */}
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
