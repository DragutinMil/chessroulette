import React, { useEffect, useRef, useState } from 'react';
import { Text } from '@app/components/Text';
import { PlayersInfo } from '@app/modules/Match/Play/containers';
import { MatchAbortContainer } from '../MatchAbortContainer';
import {
  useMatchActionsDispatch,
  useMatchViewState,
} from '../../hooks/useMatch';
import { enqueueMovexUpdatePlay } from '../../utils';
import { useCurrentOrPrevMatchPlay } from '../../Play/hooks';

export const MatchStateDisplayContainer = () => {
  const { match, currentRound, drawsCount, endedGamesCount } =
    useMatchViewState();
  const play = useCurrentOrPrevMatchPlay();
  const [refreshKey, setRefreshKey] = useState(0);
  const prevGameStatusRef = useRef(play.game?.status);
  const dispatch = useMatchActionsDispatch();
  const checkTimeCalledRef = useRef(false);

  useEffect(() => {
    const currentStatus = play.game?.status;
    if (prevGameStatusRef.current !== currentStatus) {
      prevGameStatusRef.current = currentStatus;
      if (currentStatus === 'complete') {
        // Osveži komponentu kada se partija završi
        setRefreshKey(prev => prev + 1);
        checkTimeCalledRef.current = false; // Resetuj kada se partija završi
      }
    }
  }, [play.game?.status]);

  return (
    <div className="flex flex-col gap-1 md:gap-1">
      {match?.type === 'bestOf' && (
        <div className="flex flex-col md:flex-row gap-2 md:mt-0 mt-0 w-full text-sm md:text-md">
          <div>
            <Text>Round &nbsp;</Text>
            <Text>{`${currentRound}/${match.rounds}`}</Text>
          </div>
          {drawsCount > 0 && (
            <div>
              <Text>{`(${drawsCount} games ended in draw)`}</Text>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-row w-full">
        {play.game && (
          <PlayersInfo
          key={`${play.game.startedAt}-${refreshKey}`}
          playersBySide={play.playersBySide}
            game={play.game}
            turn={play.turn}
            onCheckTime={async () => {
              
              if (!play.game || play.game.status === 'complete' || play.game.status === 'aborted') {
                return;
              }
              
              await enqueueMovexUpdatePlay(() =>
                dispatch((masterContext) => ({
                  type: 'play:checkTime',
                  payload: {
                    at: masterContext.requestAt(),
                  },
                }))
              );
            }
            }
          />
        )}
      </div>
      {match && play.hasGame && play.game.status === 'idling' && (
        <MatchAbortContainer
          key={play.game.startedAt + play.turn} // refresh it on each new game & when the turn changes
          game={play.game}
          turn={play.turn}
          playersByColor={play.playersByColor}
          timeToAbortMs={match.timeToAbortMs}
          playerId={play.userAsPlayerId}
          completedPlaysCount={endedGamesCount}
          className="md:bg-slate-700 rounded-md p-0 md:p-2 "
        />
      )}
    </div>
  );
};
