import { useMemo } from 'react';
import { ChessFENBoard, pgnToFen, toLongColor } from '@xmatter/util-kit';
import { Game } from '../../types';

type Props = {
  game: Game;
  className?: string;
};

// TODO: @depreecate in favor of MatchDisplat
export const GameDisplayView = ({ game, className }: Props) => {
  const turn = useMemo(
    () => toLongColor(new ChessFENBoard(pgnToFen(game.pgn)).getFenState().turn),
    [game.pgn]
  );

  return (
    <div className={`flex gap-2 ${className}`}>
      <span className="font-bold">Game:</span>
      <span className="capitalize">{turn} to move</span>
    </div>
  );
};
