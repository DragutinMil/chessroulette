import React from 'react';
import { Countdown } from '../Countdown/Countdown';
import { ChessColor } from '@xmatter/util-kit';
import { GameType } from '../../types';

type Props = {
  color: ChessColor;
  active: boolean;
  gameType: GameType;
  timeLeft: number;
  onTimerFinished: () => void;
};

export const PlayerBox: React.FC<Props> = (props) => {
  return (
    <div className="">
      <div>{props.color}</div>
      {props.gameType !== 'untimed' && (
        <Countdown
          active={props.active}
          gameTimeClass={props.gameType}
          timeLeft={props.timeLeft}
          onFinished={props.onTimerFinished}
        />
      )}
    </div>
  );
};
