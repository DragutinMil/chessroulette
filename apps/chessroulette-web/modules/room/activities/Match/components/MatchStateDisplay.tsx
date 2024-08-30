import React, { useMemo } from 'react';
import { Text } from 'apps/chessroulette-web/components/Text';
import { PlayersInfoContainer } from 'apps/chessroulette-web/modules/Play/PlayersInfoContainer';
import { useMatch } from 'apps/chessroulette-web/modules/room/activities/Match/providers/useMatch';
import { PlayersBySide } from 'apps/chessroulette-web/modules/Play/types';
import { useGame } from 'apps/chessroulette-web/modules/Play/providers/useGame';
import { DispatchOf, toLongColor } from '@xmatter/util-kit';
import { PlayActions } from 'apps/chessroulette-web/modules/Play/store';
import { getMovesDetailsFromPGN } from '../utils';
import { MATCH_TIME_TO_ABORT } from '../movex';
import { GameAbort } from 'apps/chessroulette-web/modules/Play/components/GameAbort';

type Props = {
  playersBySide: PlayersBySide;
  dispatch: DispatchOf<PlayActions>;
};

export const MatchStateDisplay: React.FC<Props> = ({
  dispatch,
  playersBySide,
}) => {
  const {
    rounds,
    currentRound,
    type,
    results,
    draws,
    players,
    completedPlaysCount,
  } = useMatch();
  const { realState, playerId } = useGame();
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
    <div className="flex flex-col gap-2">
      {type === 'bestOf' && (
        <div className="flex flex-row gap-2 w-full">
          <Text>Round</Text>
          <Text>{`${currentRound}/${rounds}`}</Text>
          {draws > 0 && <Text>{`(${draws} games ended in draw)`}</Text>}
        </div>
      )}
      <div className="flex flex-row w-full">
        <PlayersInfoContainer
          key={realState.game.startedAt} // refresh it on each new game
          gameCounterActive={isGameCounterActive}
          players={playersBySide}
          results={results}
          onCheckTime={() => {
            dispatch((master) => ({
              type: 'play:checkTime',
              payload: {
                at: master.$queries.now(),
              },
            }));
          }}
        />
      </div>
      {players && realState.game.status === 'idling' && (
        <GameAbort
          key={realState.game.startedAt + realState.turn} // refresh it on each new game & when the turn changes
          game={realState.game}
          turn={realState.turn}
          players={players}
          dispatch={dispatch}
          timeToAbortMs={MATCH_TIME_TO_ABORT}
          playerId={playerId}
          completedPlaysCount={completedPlaysCount}
          className="bg-slate-700 rounded-md p-2"
        />
      )}
    </div>
  );
};
