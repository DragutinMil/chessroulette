import React, { Dispatch, useEffect, useMemo, useState } from 'react';
// import { invoke, objectKeys } from '@xmatter/util-kit';
// import { Dialog } from 'apps/chessroulette-web/components/Dialog';
// import { Text } from 'apps/chessroulette-web/components/Text';
// import { GameOffer } from '../../store';
// import { ClipboardCopyButton } from 'apps/chessroulette-web/components/ClipboardCopyButton';
// import Link from 'next/link';
// import { useGame } from '../../providers/useGame';
// import { useMatch } from '../../providers/useMatch';
// import { NewGameCountdown } from '../Countdown/NewGameCountdown';
import {
  GameStateDialog,
  GameStateDialogProps,
} from 'apps/chessroulette-web/modules/Play/components/GameStateDialog';
import { useMatch } from '../providers/useMatch';
import { SimpleCountdown } from 'apps/chessroulette-web/modules/Play/components/Countdown/SimpleCountdown';
import { Dialog } from 'apps/chessroulette-web/components/Dialog';
import { Text } from 'apps/chessroulette-web/components/Text';
import {
  GameStateDialogContainer,
  GameStateDialogContainerProps,
} from 'apps/chessroulette-web/modules/Play/GameStateDialogContainer';
import { MatchActivityActions } from '../movex';
import { DispatchOf, DistributiveOmit } from '@xmatter/util-kit';
// import { useMatch } from 'apps/chessroulette-web/modules/room/activities/Match/providers/useMatch';

// type Props = {
//   onAcceptOffer: ({ offer }: { offer: GameOffer['type'] }) => void;
//   onDenyOffer: () => void;
//   onRematchRequest: () => void;
//   onCancelOffer: () => void;
//   joinRoomLink: string | undefined;
// };
type Props = DistributiveOmit<GameStateDialogContainerProps, 'dispatch'> & {
  // onStartNextGame: () => void;
  dispatch: DispatchOf<MatchActivityActions>;
  // readyForNextGame?: boolean;
};

export const MatchStateDialogContainer: React.FC<Props> = ({
  // readyForNextGame,
  dispatch,
  ...gameStateDialogProps
}) => {
  const [gameResultSeen, setGameResultSeen] = useState(false);
  // const { lastOffer, realState, players, playerId } = useGame();
  const {
    type: matchType,
    status: matchStatus,
    completedPlaysCount,
    ongoingPlay,
    lastCompletedPlay,
    results,
    rounds,
    winner,
    players,
  } = useMatch();

  // const game = useMemo(
  //   () =>
  //     ongoingPlay?.game ||
  //     matchState.completedPlays.slice(-1)[0].game
  //   [ongoingPlay, matchState.completedPlays]
  // );

  // const { game: gameState } = realState;

  useEffect(() => {
    // Everytime the game state changes, reset the seen!
    setGameResultSeen(false);
  }, [ongoingPlay?.game.status]);

  // const matchWinner = useMemo(() => {
  //   if (!rounds || matchStatus !== 'complete') {
  //     return;
  //   }
  //   const winsNeeded = Math.ceil(rounds / 2);
  //   //TODO - here add player name instead of "Black" "White"
  //   return results.white >= winsNeeded
  //     ? 'White Player'
  //     : results.black >= winsNeeded
  //     ? 'Black Player'
  //     : undefined;
  // }, [results]);

  if (winner) {
    return (
      <Dialog
        title="Match Completed"
        content={
          <div className="flex flex-col gap-4 items-center">
            <div className="flex justify-center content-center text-center">
              <Text>
                <span className="capitalize">{winner}</span> Won <span>🏆</span>
              </Text>
            </div>
          </div>
        }
      />
    );
  }

  // if (readyForNextGame) {
  //   return (
  //     <Dialog
  //       title="Game Completed"
  //       content={
  //         <div className="flex flex-col gap-4 items-center">
  //           <div className="flex justify-center content-center text-center">
  //             {matchType === 'bestOf' && (
  //               <div className="flex gap-1">
  //                 <span>Next game starts in</span>
  //                 <SimpleCountdown
  //                   timeleft={5 * 1000}
  //                   onFinished={() => {
  //                     console.log('finished countdown');
  //                   }}
  //                 />
  //               </div>
  //             )}
  //           </div>
  //         </div>
  //       }
  //     />
  //   );
  // }

  // Show at the end of a game before the next game starts
  if (matchStatus === 'ongoing' && !ongoingPlay && lastCompletedPlay) {
    return (
      <Dialog
        title={
          matchType === 'bestOf'
            ? `Game ${completedPlaysCount} Ended`
            : 'Game Ended'
        }
        content={
          <div className="flex flex-col gap-4 items-center">
            <div className="flex justify-center content-center text-center">
              {lastCompletedPlay.game.winner &&
                (lastCompletedPlay.game.winner === '1/2' ? (
                  <Text>
                    {`Game Ended in a Draw${
                      matchType === 'bestOf' && '. Round will repeat!'
                    }`}
                  </Text>
                ) : (
                  <Text className="capitalize">
                    {players
                      ? players[lastCompletedPlay.game.winner].displayName ||
                        lastCompletedPlay.game.winner
                      : lastCompletedPlay.game.winner}{' '}
                    Won!
                  </Text>
                ))}
            </div>
            {matchType === 'bestOf' && (
              <div className="flex gap-1">
                <span>Next game starts in</span>
                <SimpleCountdown
                  timeleft={10 * 1000}
                  onFinished={() => {
                    // console.log('finished countdown');
                    dispatch({ type: 'match:startNewGame' });
                  }}
                />
              </div>
            )}
          </div>
        }
        onClose={() => {
          setGameResultSeen(true);
        }}
        {...(matchType === 'openEnded' && {
          buttons: [
            {
              children: 'Offer Rematch',
              onClick: () => {
                dispatch({
                  type: 'play:sendOffer',
                  payload: {
                    byPlayer: gameStateDialogProps.playerId,
                    offerType: 'rematch',
                  },
                });
              },
              type: 'primary',
              bgColor: 'blue',
            },
          ],
        })}
      />
    );
  }

  return (
    <GameStateDialogContainer {...gameStateDialogProps} dispatch={dispatch} />
  );
};
