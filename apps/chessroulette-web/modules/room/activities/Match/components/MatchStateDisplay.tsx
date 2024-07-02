import { Text } from 'apps/chessroulette-web/components/Text';
import { PlayersInfoContainer } from 'apps/chessroulette-web/modules/Play/PlayersInfoContainer';
import { useMatch } from 'apps/chessroulette-web/modules/room/activities/Match/providers/useMatch';
import { PlayersBySide } from 'apps/chessroulette-web/modules/Play/types';
import React, { useMemo } from 'react';
import { useGame } from 'apps/chessroulette-web/modules/Play/providers/useGame';
import { AbortWidget } from 'apps/chessroulette-web/modules/Play/components/AbortWidget/AbortWidget';
import { DispatchOf, toLongColor } from '@xmatter/util-kit';
import { PlayActions } from 'apps/chessroulette-web/modules/Play/store';
import { invoke } from 'movex-core-util';
import { getMovesDetailsFromPGN } from '../utils';

type Props = {
  playersBySide: PlayersBySide;
  dispatch: DispatchOf<PlayActions>;
};

export const MatchStateDisplay: React.FC<Props> = ({ dispatch, ...props }) => {
  const { rounds, currentRound, type, results, draws, players } = useMatch();
  const { realState, playerId } = useGame();

  const displayAbortWidget = useMemo(() => {
    const myTurn = invoke(() => {
      if (!players) {
        return false;
      }
      const { turn } = realState;
      return (
        (players.black.id === playerId && turn === 'black') ||
        (players.white.id === playerId && turn === 'white')
      );
    });
    if (realState.game.status === 'idling' && myTurn) {
      const timer = Math.floor(
        Math.floor(realState.game.timeLeft.white / 10) -
          (new Date().getTime() - realState.game.startedAt)
      );
      return (
        <AbortWidget
          onAbort={() => {
            dispatch({
              type: 'play:abortGame',
              payload: {
                color: realState.turn,
              },
            });
          }}
          timer={timer}
        />
      );
    }
    return null;
  }, [realState.game.status, realState.turn]);

  const isGameCounterActive = useMemo(() => {
    const moves = getMovesDetailsFromPGN(realState.game.pgn);
    if (realState.game.status !== 'ongoing') {
      return false;
    }
    if (moves.totalMoves > 1) {
      return true;
    }
    return !!(
      moves.totalMoves === 1 &&
      moves.lastMoveBy &&
      toLongColor(moves.lastMoveBy) === 'black'
    );
  }, [realState.game.status, realState.game.pgn]);

  return (
    <div>
      {type === 'bestOf' && (
        <div className="flex flex-row gap-2 w-full">
          <Text>Round</Text>
          <Text>{`${currentRound}/${rounds}`}</Text>
          {draws > 0 && <Text>{`(${draws} games ended in draw)`}</Text>}
          {displayAbortWidget}
        </div>
      )}
      <div className="flex flex-row w-full">
        <PlayersInfoContainer
          gameCounterActive={isGameCounterActive}
          players={props.playersBySide}
          results={results}
          onTimerFinished={(side) => {
            dispatch({
              type: 'play:timeout',
              payload: {
                color: props.playersBySide[side].color,
              },
            });
          }}
        />
      </div>
    </div>
  );
};
