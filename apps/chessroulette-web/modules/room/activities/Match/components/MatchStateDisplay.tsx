import { Text } from 'apps/chessroulette-web/components/Text';
import { PlayersInfoContainer } from 'apps/chessroulette-web/modules/Play/PlayersInfoContainer';
import { useMatch } from 'apps/chessroulette-web/modules/room/activities/Match/providers/useMatch';
import { PlayersBySide } from 'apps/chessroulette-web/modules/Play/types';
import React, { useMemo } from 'react';
import { useGame } from 'apps/chessroulette-web/modules/Play/providers/useGame';
import { AbortWidget } from 'apps/chessroulette-web/modules/Play/components/AbortWidget/AbortWidget';
import { DispatchOf } from '@xmatter/util-kit';
import { PlayActions } from 'apps/chessroulette-web/modules/Play/store';
import { invoke } from 'movex-core-util';

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
          players={props.playersBySide}
          results={results}
          onTimerFinished={(side) => {
            // TURN: Call the match dispatcher to end the game!
            console.log('timer finished for side', side);
          }}
        />
      </div>
    </div>
  );
};
