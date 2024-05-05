import { Button } from 'apps/chessroulette-web/components/Button';
import React from 'react';
import { useGameActions } from '../../providers/useGameActions';
import { ChessColor, toLongColor } from '@xmatter/util-kit';

type Props = {
  onOfferDraw: () => void;
  onResign: () => void;
  orientation: ChessColor;
};

export const GameActions: React.FC<Props> = ({
  onResign,
  onOfferDraw,
  orientation,
}) => {
  const { currentActiveOffer, gameState } = useGameActions();
  return (
    <div className="flex flex-row gap-4">
      <Button
        size="sm"
        bgColor="blue"
        disabled={
          gameState.state !== 'ongoing' ||
          !!currentActiveOffer ||
          toLongColor(orientation) === gameState.lastMoveBy
        }
        onClick={onOfferDraw}
      >
        Draw
      </Button>
      <Button
        size="sm"
        bgColor="red"
        disabled={gameState.state !== 'ongoing' || !!currentActiveOffer}
        onClick={onResign}
      >
        Resign
      </Button>
    </div>
  );
};
