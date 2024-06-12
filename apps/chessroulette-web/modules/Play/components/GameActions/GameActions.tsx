import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGameActions } from '../../providers/useGameActions';
import { ChessColor, toLongColor } from '@xmatter/util-kit';
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
  //TODO - can merge gameState and offers together as they are part of the same state and only used here
  const { lastOffer, gameState, offers } = useGameActions();
  const offerAlreadySend = useRef(false);
  const [allowTakeback, refreshAllowTakeback] = useState(false);
  const [allowDraw, refreshAllowDraw] = useState(true);

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

  const calculateTakebackStatus = () => {
    if (gameState.lastMoveBy !== toLongColor(orientation)) {
      return false;
    }
    if (lastOffer?.status === 'pending' || offerAlreadySend.current) {
      return false;
    }
    if (
      offers.some(
        (offer) =>
          offer.byPlayer === whoAmI &&
          offer.offerType === 'takeback' &&
          offer.status === 'accepted'
      )
    ) {
      return false;
    }

    return (
      offers.reduce((accum, offer) => {
        if (offer.offerType === 'takeback' && offer.byPlayer === whoAmI) {
          return accum + 1;
        }
        return accum;
      }, 0) < 4
    );
  };

  const calculateDrawStatus = () => {
    if (gameState.status !== 'ongoing') {
      return false;
    }
    if (lastOffer?.status === 'pending' || offerAlreadySend.current) {
      return false;
    }
    return (
      offers.reduce((accum, offer) => {
        if (offer.offerType === 'draw' && offer.byPlayer === whoAmI) {
          return accum + 1;
        }
        return accum;
      }, 0) < 4
    );
  };

  useEffect(() => {
    if (offerAlreadySend.current) {
      resetOfferSent();
    }
  }, [gameState.lastMoveBy]);

  useEffect(() => {
    //TODO - can optimize this function with useCallback and pass parameters the gameState
    refreshAllowTakeback(calculateTakebackStatus());
    refreshAllowDraw(calculateDrawStatus());
  }, [gameState.status, offers, gameState.lastMoveBy]);

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
        className="w-full"
        confirmationMessage="Invite to Draw?"
        icon="FlagIcon"
        iconKind="solid"
        onClick={() => {
          setOfferSent();
          onOfferDraw();
        }}
        disabled={!allowDraw}
      >
        Invite to Draw
      </QuickConfirmButton>
      <QuickConfirmButton
        size="sm"
        className="w-full"
        confirmationBgcolor="indigo"
        confirmationMessage="Ask for Takeback?"
        icon="ArrowUturnLeftIcon"
        iconKind="solid"
        onClick={() => {
          setOfferSent();
          onTakeback();
        }}
        disabled={gameState.status !== 'ongoing' || !allowTakeback}
      >
        Ask for Takeback
      </QuickConfirmButton>
      <QuickConfirmButton
        size="sm"
        className="w-full"
        confirmationBgcolor="red"
        confirmationMessage="Confirm Resign?"
        icon="FlagIcon"
        iconKind="solid"
        onClick={onResign}
        disabled={
          gameState.status !== 'ongoing' || lastOffer?.status === 'pending'
        }
      >
        Resign
      </QuickConfirmButton>
    </div>
  );
};
