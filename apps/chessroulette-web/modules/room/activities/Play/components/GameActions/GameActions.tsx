import React, { useCallback, useEffect, useRef } from 'react';
import { useGameActions } from '../../providers/useGameActions';
import { ChessColor, toLongColor } from '@xmatter/util-kit';
import { Icon } from 'apps/chessroulette-web/components/Icon';
import { QuickConfirmButton } from 'apps/chessroulette-web/components/Button/QuickConfirmButton';

type Props = {
  onOfferDraw: () => void;
  onResign: () => void;
  onTakeback: () => void;
  orientation: ChessColor;
  buttonOrientation?: 'horizontal' | 'vertical';
};

export const GameActions: React.FC<Props> = ({
  onResign,
  onOfferDraw,
  onTakeback,
  orientation,
  buttonOrientation = 'vertical',
}) => {
  const { lastOffer, gameState } = useGameActions();
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
        disabled={
          gameState.state !== 'ongoing' ||
          lastOffer?.status === 'pending' ||
          lastOffer?.offerType === 'takeback' || //TODO - currently can only send takeback offer 1 time per game.
          offerAlreadySend.current ||
          toLongColor(orientation) !== gameState.lastMoveBy
        }
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
