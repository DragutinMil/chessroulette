import React, { useEffect, useMemo, useState } from 'react';
import { Text } from 'apps/chessroulette-web/components/Text';
import { PlayersInfoContainer } from 'apps/chessroulette-web/modules/Play/PlayersInfoContainer';
import { useMatch } from 'apps/chessroulette-web/modules/room/activities/Match/providers/useMatch';
import { PlayersBySide } from 'apps/chessroulette-web/modules/Play/types';
import { useGame } from 'apps/chessroulette-web/modules/Play/providers/useGame';
import { ChessColor, DispatchOf, toLongColor } from '@xmatter/util-kit';
import { PlayActions } from 'apps/chessroulette-web/modules/Play/store';
import { getMovesDetailsFromPGN } from '../utils';
import { MATCH_TIME_TO_ABORT } from '../movex';
import { GameAbort } from 'apps/chessroulette-web/modules/Play/components/GameAbort';
import { ClipboardCopyButton } from 'apps/chessroulette-web/components/ClipboardCopyButton';

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
    ...restMatch
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

  const [prevTimeLefts, setPrevTimeLefts] = useState(
    [] as (typeof realState.game.timeLeft & { turn: ChessColor })[]
  );

  useEffect(() => {
    // This replaces the last one if it's of the same turn
    setPrevTimeLefts((prev) => {
      const last = prev.slice(-1)[0];
      const prevWithoutLast = prev.slice(0, -1);
      const current = realState.game.timeLeft;

      return [
        ...prevWithoutLast,
        ...(last?.turn !== realState.turn ? [last] : []),
        { ...current, turn: realState.turn },
      ];
    });
  }, [realState.game.timeLeft, realState.turn]);

  useEffect(() => {
    console.log('prev times', JSON.stringify(prevTimeLefts, null, 2));
  }, [prevTimeLefts]);
  
  useEffect(() => {
    console.log('[MatchDisplay] timeLeft', JSON.stringify(realState.game.timeLeft, null, 2))
  }, [realState.game.timeLeft])

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
      <ClipboardCopyButton
        value={JSON.stringify({
          playerId: playerId,
          display: prevTimeLefts,
          stateTransformer: (window as any)._prevTimeLefts,
        })}
        buttonComponentType="Button"
        render={() => <div>Copy Time Data</div>}
      />
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
