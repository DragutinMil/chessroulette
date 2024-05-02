import React, { useEffect, useState } from 'react';
import { useGameActions } from '../../providers/useGameActions';
import { ChessColor, toLongColor } from '@xmatter/util-kit';
import { ActionButton } from 'apps/chessroulette-web/components/Button/ActionButton';

type Props = {
  onOfferDraw: () => void;
  onResign: () => void;
  orientation: ChessColor;
  buttonOrientation?: 'horizontal' | 'vertical';
};

export const GameActions: React.FC<Props> = ({
  onResign,
  onOfferDraw,
  orientation,
  buttonOrientation = 'vertical',
}) => {
  const { currentActiveOffer, gameState } = useGameActions();
  const [offerAlreadySend, setOfferAlreadySent] = useState(false);

  useEffect(() => {
    if (offerAlreadySend) {
      setOfferAlreadySent(false);
    }
  }, [gameState.lastMoveBy]);

  return (
    <div
      className={`${
        buttonOrientation === 'horizontal'
          ? 'flex flex-row justify-start gap-4 flex-1'
          : 'flex flex-col h-full gap-2 justify-end items-start content-start'
      }`}
    >
      <ActionButton
        actionType="positive"
        label="Draw"
        type="primary"
        hideLabelUntilHover
        onSubmit={() => {
          onOfferDraw();
          setOfferAlreadySent(true);
        }}
        icon="FlagIcon"
        color="blue"
        disabled={
          gameState.state !== 'ongoing' ||
          !!currentActiveOffer ||
          toLongColor(orientation) === gameState.lastMoveBy
        }
      />
      <ActionButton
        actionType="negative"
        label="Resign"
        type="primary"
        hideLabelUntilHover
        onSubmit={onResign}
        icon="XCircleIcon"
        color="red"
        disabled={gameState.state !== 'ongoing' || !!currentActiveOffer}
      />
    </div>
  );
};
