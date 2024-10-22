import React from 'react';
import { Dialog } from '@app/components/Dialog';
import { Text } from '@app/components/Text';
import { now } from '@app/lib/time';
// import {
//   GameStateDialogContainer,
//   GameStateDialogContainerProps,
// } from '@app/modules/Play/containers/GameStateDialogContainer';
import {
  DispatchOf,
  DistributiveOmit,
  LongChessColor,
  invoke,
} from '@xmatter/util-kit';
import { PlayerInfo, PlayersBySide } from '@app/modules/Match/Play';
// import { GameOverReason } from '@app/modules/Play/movex';
import { BetweenGamesAborter } from './BetweenGamesAborter';
import { MatchActions } from '../movex';
import { useMatch } from '../hooks/useMatch';
import { GameStateDialogContainer, GameStateDialogContainerProps } from '@app/modules/Match/Play/containers';
import { GameOverReason } from '@app/modules/Game';

type Props = DistributiveOmit<GameStateDialogContainerProps, 'dispatch'> & {
  dispatch: DispatchOf<MatchActions>;
  playersBySide: PlayersBySide;
};

// TODO: Move somewher eelse
const gameOverReasonsToDisplay: { [k in GameOverReason]: string } = {
  [GameOverReason['aborted']]: 'Game was aborted',
  [GameOverReason['acceptedDraw']]: 'Players agreed to draw',
  [GameOverReason['checkmate']]: 'Game ended in checkmate',
  [GameOverReason['draw']]: 'Game ended in a draw',
  [GameOverReason['insufficientMaterial']]:
    'Game ended in a draw due to insufficient material',
  [GameOverReason['threefoldRepetition']]:
    'Game ended in a draw due to a threefold repetition',
  [GameOverReason['resignation']]: 'Player Resigned',
  [GameOverReason['stalemate']]:
    'Game ended in a draw due to a stalemate position',
  [GameOverReason['timeout']]: 'Game ended due to timeout',
};

export const MatchStateDialogContainer: React.FC<Props> = ({
  dispatch,
  playersBySide,
  ...gameStateDialogProps
}) => {
  const {
    type: matchType,
    status: matchStatus,
    completedPlaysCount,
    ongoingPlay,
    lastEndedPlay,
    winner,
    players,
  } = useMatch();

  if (matchStatus === 'aborted') {
    return (
      <Dialog
        title="Match Aborted"
        content={null} // should there be something?
      />
    );
  }

  // TODO: Here we should just check the match.status
  if (winner) {
    return (
      <Dialog
        title="Match Completed"
        content={
          <div className="flex flex-col gap-4 items-center">
            <div className="flex justify-center content-center text-center">
              <Text>
                <span className="capitalize">
                  {invoke(() => {
                    const player = getPlayerInfoById(playersBySide, winner);

                    return player?.displayName || player?.color || winner;
                  })}
                  {` `}Won{` `}
                  <span>🏆</span>
                </span>
              </Text>
            </div>
          </div>
        }
      />
    );
  }

  // Show at the end of a game before the next game starts
  if (matchStatus === 'ongoing' && !ongoingPlay && lastEndedPlay) {
    const titleSuffix =
      lastEndedPlay.game.winner === '1/2' ? ' in a Draw!' : '';

    const gameOverReason =
      lastEndedPlay.game.status === 'complete'
        ? gameOverReasonsToDisplay[lastEndedPlay.game.gameOverReason]
        : 'Game was aborted';

    return (
      <Dialog
        title={
          matchType === 'bestOf'
            ? `Game ${completedPlaysCount} Ended${titleSuffix}`
            : `Game Ended${titleSuffix}!`
        }
        content={
          <div className="flex flex-col gap-4 items-center">
            <div>{gameOverReason}</div>
            <div className="flex justify-center content-center text-center">
              {lastEndedPlay.game.winner &&
                (lastEndedPlay.game.winner === '1/2' ? (
                  <div className="flex flex-col gap-1">
                    {/* <Text>Game Ended in a Draw.</Text> */}
                    {matchType === 'bestOf' && (
                      <Text>The round will repeat!</Text>
                    )}
                  </div>
                ) : (
                  <Text className="capitalize">
                    {players
                      ? players[lastEndedPlay.game.winner].displayName ||
                        lastEndedPlay.game.winner
                      : lastEndedPlay.game.winner}{' '}
                    Won!
                  </Text>
                ))}
            </div>
            {matchType === 'bestOf' && (
              <BetweenGamesAborter
                totalTimeAllowedMs={10 * 1000}
                startedAt={now()}
                onFinished={() => {
                  dispatch({ type: 'match:startNewGame' });
                }}
              />
            )}
          </div>
        }
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

const getPlayerInfoById = (
  { home, away }: PlayersBySide,
  playerId: string
): (PlayerInfo & { color: LongChessColor }) | undefined => {
  if (home.id === playerId) {
    return home;
  }

  if (away.id === playerId) {
    return away;
  }

  return undefined;
};
