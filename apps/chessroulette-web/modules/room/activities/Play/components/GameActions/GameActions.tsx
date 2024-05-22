import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGameActions } from '../../providers/useGameActions';
import { ChessColor, LongChessColor, toLongColor } from '@xmatter/util-kit';
import { Icon } from 'apps/chessroulette-web/components/Icon';
import { QuickConfirmButton } from 'apps/chessroulette-web/components/Button/QuickConfirmButton';

type Props = {
  onOfferDraw: () => void;
  onResign: () => void;
  onTakeback: () => void;
  orientation: ChessColor;
  whoAmI: string;
  buttonOrientation?: 'horizontal' | 'vertical';
};

export const GameActions: React.FC<Props> = ({
  onResign,
  onOfferDraw,
  onTakeback,
  orientation,
  whoAmI,
  buttonOrientation = 'vertical',
}) => {
  const { lastOffer, gameState, offers } = useGameActions();
  const offerAlreadySend = useRef(false);
  const [allowTakeback, refreshAllowTakeback] = useState(false);

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

  const calculateTakebackStatus = (lastMoveBy: LongChessColor) => {
    if (lastMoveBy !== toLongColor(orientation)) {
      return false;
    }
    if (lastOffer?.status === 'pending' || offerAlreadySend.current) {
      return false;
    }
    return !offers.some(
      (offer) =>
        offer.byPlayer === whoAmI &&
        offer.offerType === 'takeback' &&
        offer.status !== 'cancelled'
    );
  };

  useEffect(() => {
    if (offerAlreadySend.current) {
      resetOfferSent();
    }
    refreshAllowTakeback(calculateTakebackStatus(gameState.lastMoveBy));
  }, [gameState.lastMoveBy, offers]);

  return (
    <div
      className={`${
        buttonOrientation === 'horizontal'
          ? 'flex flex-row justify-start gap-4 flex-1'
          : 'flex flex-col h-full gap-2 justify-end items-start content-start'
      }`}
    >
      <QuickConfirmButton
        size="sm"
        confirmationBgcolor="blue"
        tooltip="Draw"
        tooltipPositon="right"
        confirmationMessage="Invite to Draw?"
        onClick={() => {
          onOfferDraw();
          setOfferSent();
        }}
        disabled={
          gameState.state !== 'ongoing' ||
          lastOffer?.status === 'pending' ||
          toLongColor(orientation) === gameState.lastMoveBy ||
          offerAlreadySend.current
        }
      >
        <Icon name="FlagIcon" className="h-4 w-4" color="white" />
      </QuickConfirmButton>
      <QuickConfirmButton
        size="sm"
        tooltip="Takeback"
        tooltipPositon="right"
        confirmationBgcolor="indigo"
        confirmationMessage="Ask for Takeback?"
        onClick={() => {
          onTakeback();
          setOfferSent();
        }}
        disabled={gameState.state !== 'ongoing' || !allowTakeback}
      >
        <Icon name="ArrowUturnLeftIcon" className="h-4 w-4" color="white" />
      </QuickConfirmButton>
      <QuickConfirmButton
        size="sm"
        confirmationBgcolor="red"
        tooltip="Resign"
        tooltipPositon="right"
        confirmationMessage="Confirm Resign?"
        onClick={onResign}
        disabled={
          gameState.state !== 'ongoing' || lastOffer?.status === 'pending'
        }
      >
        <Icon name="XCircleIcon" className="h-4 w-4" color="white" />
      </QuickConfirmButton>
    </div>
  );
};
