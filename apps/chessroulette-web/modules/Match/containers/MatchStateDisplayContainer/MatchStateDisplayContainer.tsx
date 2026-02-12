import React from 'react';
import { Text } from '@app/components/Text';
import { PlayersInfo } from '@app/modules/Match/Play/containers';
import { MatchAbortContainer } from '../MatchAbortContainer';
import {
  useMatchActionsDispatch,
  useMatchViewState,
} from '../../hooks/useMatch';
import { enqueueMovexUpdatePlay } from '../../utils';
import { useCurrentOrPrevMatchPlay } from '../../Play/hooks';
import { isMobile } from '@app/modules/Room/activities/Aichess/util';
type MatchStateDisplayContainerProps = {
  activeBot?: string;
};
export const MatchStateDisplayContainer = ({
  activeBot,
}: MatchStateDisplayContainerProps) => {
  const { match, currentRound, drawsCount, endedGamesCount } =
    useMatchViewState();
  const play = useCurrentOrPrevMatchPlay();

  const dispatch = useMatchActionsDispatch();

  type TimeClass =
    | 'bullet'
    | 'blitz'
    | 'rapid'
    | 'blitz3'
    | 'blitz3plus2'
    | 'blitzplus2'
    | 'bulletplus1'
    | 'bullet2plus1'
    | 'untimed'
    | 'bullet2';

  const timeClassMap: Record<TimeClass, string> = {
    bullet: 'Bullet 1+0',
    blitz: 'Blitz 5+0',
    rapid: 'Rapid 10+0',
    blitz3: 'Blitz 3+0',
    blitz3plus2: 'Blitz 3+2',
    blitzplus2: 'Blitz 5+2',
    bulletplus1: 'Bullet 1+1',
    bullet2plus1: 'Bullet 2+1',
    untimed: '∞',
    bullet2: 'Bullet 2+0',
  };
  const timeClass = match?.gameInPlay?.timeClass;
  const displayTime = timeClassMap[timeClass as TimeClass];
  return (
    <div className="flex flex-col gap-1 md:gap-1 w-full">
      {match?.type === 'bestOf' && (
        <div className="flex flex-col md:flex-row gap-2 md:mt-0 mt-0 w-full text-sm md:text-md">
          <div>
            <Text>Round &nbsp;</Text>
            <Text>{`${currentRound}/${match.rounds}`},</Text>

            <Text> {displayTime}</Text>
            {drawsCount > 0 && (
              <Text> {`(${drawsCount} games ended in draw)`}</Text>
            )}
          </div>
        </div>
      )}
      <div className="flex flex-row w-full mr-0 p-0">
        {play.game && (
          <PlayersInfo
            key={play.game.startedAt} // refresh it on each new game
            playersBySide={play.playersBySide}
            activeBot={activeBot}
            game={play.game}
            turn={play.turn}
            onCheckTime={async () => {
              await enqueueMovexUpdatePlay(() =>
                dispatch((masterContext) => ({
                  type: 'play:checkTime',
                  payload: {
                    at: masterContext.requestAt(),
                  },
                }))
              );
            }}
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
          className="md:bg-green-500 rounded-md p-0 md:p-2 fixed bottom-16 md:relative md:bottom-0 w-[94%]  md:w-full h-8"
        />
      )}
    </div>
  );
};
