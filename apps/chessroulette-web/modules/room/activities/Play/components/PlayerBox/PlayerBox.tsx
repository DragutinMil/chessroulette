import React from 'react';
import { Countdown } from '../Countdown/Countdown';
import { ChessColor, toLongColor } from '@xmatter/util-kit';
import { GameType } from '../../types';

type Props = {
  color: ChessColor; //TODO - here replace with Player name from User record once we start using them
  active: boolean;
  turn: ChessColor | undefined; // TODO maybe improve logic
  gameType: GameType;
  timeLeft: number;
  onTimerFinished: () => void;
};

export const PlayerBox: React.FC<Props> = (props) => {
  return (
    <div className="flex flex-row gap-3 items-center content-center">
      <div
        className={`capitalize w-12 ${
          props.turn &&
          props.turn === toLongColor(props.color) &&
          'text-purple-400 font-bold'
        }`}
      >
        {props.color}
      </div>
      {props.gameType !== 'untimed' && (
        <Countdown
          active={props.active}
          gameTimeClass={props.gameType}
          timeLeft={props.timeLeft}
          onFinished={props.onTimerFinished}
          className="text-xl"
        />
      )}
    </div>
  );
};
