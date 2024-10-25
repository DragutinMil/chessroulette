import React from 'react';
import { Text } from '@app/components/Text';
import { useGame } from '@app/modules/Game/hooks';
import { PlayersInfoContainer } from '@app/modules/Match/Play/containers';
import { MatchAbortContainer } from '../MatchAbortContainer';
import { MATCH_TIME_TO_ABORT } from '../../movex';
import {
  useMatchActionsDispatch,
  useMatchViewState,
} from '../../hooks/useMatch';

export const MatchStateDisplayContainer = () => {
  const {
    match,
    currentRound,
    results,
    drawsCount,
    endedGamesCount,
    userAsPlayer,
  } = useMatchViewState();
  const {
    committedState: { game, turn },
    playerId,
  } = useGame();

  const dispatch = useMatchActionsDispatch();

  return (
    <div className="flex flex-col gap-2">
      {match?.type === 'bestOf' && (
        <div className="flex flex-row gap-2 w-full">
          <Text>Round</Text>
          <Text>{`${currentRound}/${match.rounds}`}</Text>
          {drawsCount > 0 && (
            <Text>{`(${drawsCount} games ended in draw)`}</Text>
          )}
        </div>
      )}
      <div className="flex flex-row w-full">
        {results && (
          <PlayersInfoContainer
            key={game.startedAt} // refresh it on each new game
            results={results}
            onCheckTime={() => {
              dispatch((masterContext) => ({
                type: 'play:checkTime',
                payload: {
                  at: masterContext.requestAt(),
                },
              }));
            }}
          />
        )}
      </div>
      {match?.players && userAsPlayer && game.status === 'idling' && (
        <MatchAbortContainer
          key={game.startedAt + turn} // refresh it on each new game & when the turn changes
          game={game}
          turn={turn}
          players={match.players}
          timeToAbortMs={MATCH_TIME_TO_ABORT}
          playerId={playerId}
          completedPlaysCount={endedGamesCount}
          className="bg-slate-700 rounded-md p-2"
        />
      )}
    </div>
  );
};
