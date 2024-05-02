import React, { useMemo } from 'react';
import { PlayerBox } from '../PlayerBox/PlayerBox';
import { PlayActivityState } from '../../movex';
import { GameType } from '../../types';
import { useGameTimeLeft } from '../../hooks/useGameState';
import { ChessFENBoard, pgnToFen, toLongColor } from '@xmatter/util-kit';

type Props = {
  id: string;
  //TODO - organize types better
  game: PlayActivityState['activityState']['game'];
  gameType: GameType;
  onTimerFinished: () => void;
};

export const GameStateWidget: React.FC<Props> = (props) => {
  const timeLeft = useGameTimeLeft(props.game);
  const turn = useMemo(
    () =>
      toLongColor(
        new ChessFENBoard(pgnToFen(props.game.pgn)).getFenState().turn
      ),
    [props.game.pgn]
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row justify-end gap-2">
        <div className="font-bold">Game Type: </div>
        <div className="capitalize">{props.gameType}</div>
      </div>
      <div className="flex flex-row w-full justify-end">
        <div className="flex flex-col gap-1">
          <PlayerBox
            key={`${props.id}-white`}
            color="white"
            turn={props.game.state !== 'complete' ? turn : undefined}
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
            turn={props.game.state !== 'complete' ? turn : undefined}
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
    </div>
  );
};
