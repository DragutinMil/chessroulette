import React from 'react';
import { Dialog } from '@app/components/Dialog';
import { Text } from '@app/components/Text';
import { now } from '@app/lib/time';
import { LongChessColor, invoke } from '@xmatter/util-kit';
import { PlayerInfo, PlayersBySide } from '@app/modules/Match/Play';
import { BetweenGamesAborter } from './components/BetweenGamesAborter';
import {
  useMatchActionsDispatch,
  useMatchViewState,
} from '../../hooks/useMatch';
import {
  PlayDialogContainer,
  PlayDialogContainerContainerProps,
} from '@app/modules/Match/Play/containers';
import { GameOverReason } from '@app/modules/Game';
import { getMatchPlayerRoleById } from '../../movex/util';

type Props = PlayDialogContainerContainerProps;

export const MatchStateDialogContainer: React.FC<Props> = (
  gameStateDialogProps
) => {
  const { match, ...matchView } = useMatchViewState();
  const dispatch = useMatchActionsDispatch();

  if (match?.status === 'aborted') {
    return (
      <Dialog
        title="Match Aborted"
        content={null} // should there be something?
      />
    );
  }

  // TODO: Here we should just check the match.status
  if (match?.winner) {
    return (
      <Dialog
        title="Match Completed"
        content={
          <div className="flex flex-col gap-4 items-center">
            <div className="flex justify-center content-center text-center">
              <Text>
                <span className="capitalize">
                  {match[match.winner].displayName || match[match.winner].id}
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
        // TODO: Teh rematch functionality needs to be at match level
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
