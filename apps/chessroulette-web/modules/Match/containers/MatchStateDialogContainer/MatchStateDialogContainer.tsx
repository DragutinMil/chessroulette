import React from 'react';
import { Dialog } from '@app/components/Dialog';
import { Text } from '@app/components/Text';
import { now } from '@app/lib/time';
import { LongChessColor } from '@xmatter/util-kit';
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

type Props = PlayDialogContainerContainerProps & {
  // playersBySide: PlayersBySide;
};

export const MatchStateDialogContainer: React.FC<Props> = ({
  // playersBySide,
  ...gameStateDialogProps
}) => {
  const { match, ...matchView } = useMatchViewState();
  const dispatch = useMatchActionsDispatch();

  matchView.userAsPlayer;

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
    const matchWinner = match.winner;
    return (
      <Dialog
        title="Match Completed"
        content={
          <div className="flex flex-col gap-4 items-center">
            <div className="flex justify-center content-center text-center">
              <Text>
                <span className="capitalize">
                  {/* {invoke(() => {
                    // const player = getPlayerInfoById(
                    //   playersBySide,
                    //   matchWinner
                    // );

                    // return player?.displayName || player?.color || matchWinner;

                    return (
                      (matchView.userAsPlayer &&
                        match[matchView.userAsPlayer.type].displayName) ||
                      matchWinner
                    );
                  })} */}
                  {(matchView.userAsPlayer &&
                    match[matchView.userAsPlayer.type].displayName) ||
                    matchWinner}
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
    matchView.lastEndedGame
  ) {
    const titleSuffix =
      matchView.lastEndedGame.winner === '1/2' ? ' in a Draw!' : '';

    const gameOverReason =
      matchView.lastEndedGame.status === 'complete'
        ? gameOverReasonsToDisplay[matchView.lastEndedGame.gameOverReason]
        : 'Game was aborted';

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
              {matchView.lastEndedGame.winner &&
                (matchView.lastEndedGame.winner === '1/2' ? (
                  <div className="flex flex-col gap-1">
                    {/* <Text>Game Ended in a Draw.</Text> */}
                    {match.type === 'bestOf' && (
                      <Text>The round will repeat!</Text>
                    )}
                  </div>
                ) : (
                  <Text className="capitalize">
                    {match.players
                      ? match.players[matchView.lastEndedGame.winner]
                          .displayName || matchView.lastEndedGame.winner
                      : matchView.lastEndedGame.winner}{' '}
                    Won!
                  </Text>
                ))}
            </div>
            {match.type === 'bestOf' && (
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
