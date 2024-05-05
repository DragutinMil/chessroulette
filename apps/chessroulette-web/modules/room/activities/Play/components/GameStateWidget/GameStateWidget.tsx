import React, { useEffect } from 'react';
import { GameDisplayView } from '../Game/GameDisplayView';
import { PlayerBox } from '../PlayerBox/PlayerBox';
import { PlayActivityState } from '../../movex';
import { GameType } from '../../types';
import { useGameTimeLeft } from '../../hooks/useGameState';

type Props = {
  id: string;
  //TODO - organize types better
  game: PlayActivityState['activityState']['game'];
  gameType: GameType;
  onTimerFinished: () => void;
};

export const GameStateWidget: React.FC<Props> = (props) => {
  const timeLeft = useGameTimeLeft(props.game);

  return (
    <div className="">
      <GameDisplayView game={props.game} />
      <div className="flex flex-row gap-5">
        <div className="capitalize">{props.gameType}</div>

        <PlayerBox
          key={`${props.id}-white`}
          color="white"
          active={
            props.game.state === 'ongoing' &&
            props.game.lastMoveBy !== 'white' &&
            timeLeft['white'] > 0
          }
          gameType={props.gameType}
          timeLeft={timeLeft['white']}
          onTimerFinished={props.onTimerFinished}
        />
        <PlayerBox
          key={`${props.id}-black`}
          color="black"
          active={
            props.game.state === 'ongoing' &&
            props.game.lastMoveBy !== 'black' &&
            timeLeft['black'] > 0
          }
          gameType={props.gameType}
          timeLeft={timeLeft['black']}
          onTimerFinished={props.onTimerFinished}
        />
      </div>
    </div>
  );
};
