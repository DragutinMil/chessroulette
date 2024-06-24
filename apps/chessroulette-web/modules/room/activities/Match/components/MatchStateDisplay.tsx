import { Text } from 'apps/chessroulette-web/components/Text';
import { PlayersInfoContainer } from 'apps/chessroulette-web/modules/Play/PlayersInfoContainer';
import { useMatch } from 'apps/chessroulette-web/modules/Play/providers/useMatch';
import { PlayersBySide } from 'apps/chessroulette-web/modules/Play/types';
import React from 'react';

type Props = {
  playersBySide: PlayersBySide;
};

export const MatchStateDisplay: React.FC<Props> = (props) => {
  const { rounds, currentRound, type, results } = useMatch();

  return (
    <div>
      {type === 'bestOf' && (
        <div className="flex flex-row gap-2 w-full">
          <Text>Round</Text>
          <Text>{`${currentRound}/${rounds}`}</Text>
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
