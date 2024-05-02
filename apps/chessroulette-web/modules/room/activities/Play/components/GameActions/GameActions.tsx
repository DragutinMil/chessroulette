import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const offerAlreadySend = useRef(false);

  const setOfferSent = useCallback(() => {
    if (!offerAlreadySend.current) {
      offerAlreadySend.current = true;
    }
  }, []);

  const resetOfferSent = useCallback(() => {
    if (offerAlreadySend.current) {
      offerAlreadySend.current = false;
    }
  }, []);

  useEffect(() => {
    if (offerAlreadySend) {
      resetOfferSent();
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
          setOfferSent();
        }}
        icon="FlagIcon"
        color="blue"
        disabled={
          gameState.state !== 'ongoing' ||
          !!currentActiveOffer ||
          toLongColor(orientation) === gameState.lastMoveBy ||
          offerAlreadySend.current
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
