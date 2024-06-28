import React from 'react';
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

type Props = DistributiveOmit<GameStateDialogContainerProps, 'dispatch'> & {
  dispatch: DispatchOf<MatchActivityActions>;
};

export const MatchStateDialogContainer: React.FC<Props> = ({
  dispatch,
  ...gameStateDialogProps
}) => {
  const {
    type: matchType,
    status: matchStatus,
    completedPlaysCount,
    ongoingPlay,
    lastCompletedPlay,
    winner,
    players,
  } = useMatch();

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
                  <div className="flex flex-col gap-1">
                    <Text>Game Ended in a Draw.</Text>
                    {matchType === 'bestOf' && (
                      <Text>
                        Because of draw result, the round is repeating.
                      </Text>
                    )}
                  </div>
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
                    dispatch({ type: 'match:startNewGame' });
                  }}
                />
              </div>
            )}
          </div>
        }
        onClose={() => {
          // setGameResultSeen(true);
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
