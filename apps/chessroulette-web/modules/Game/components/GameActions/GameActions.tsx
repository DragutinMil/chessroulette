import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChessColor, toLongColor } from '@xmatter/util-kit';
import { QuickConfirmButton } from '@app/components/Button/QuickConfirmButton';
import { useGame } from '../../hooks';
import { Game } from '../../types';

type Props = {
  onOfferDraw: () => void;
  onResign: () => void;
  onTakeback: () => void;
  homeColor: ChessColor;
  playerId: string;
  // game: Game;
};

// TODO: This needs to move into MatchActions anyway
export const GameActions: React.FC<Props> = ({
  onResign,
  onOfferDraw,
  onTakeback,
  homeColor,
  playerId,
  // game: {  },
}) => {
  //TODO - can merge gameState and offers together as they are part of the same state and only used here
  const { lastOffer, committedState: realState } = useGame();
  const { game } = realState;
  const { offers: offers = [] } = game;

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
    if (game.lastMoveBy !== toLongColor(homeColor)) {
      return false;
    }

    if (lastOffer?.status === 'pending' || offerAlreadySend.current) {
      return false;
    }

    if (
      offers.some(
        (offer) =>
          offer.byPlayer === playerId &&
          offer.type === 'takeback' &&
          offer.status === 'accepted'
      )
    ) {
      return false;
    }

    return (
      offers.reduce((accum, offer) => {
        if (offer.type === 'takeback' && offer.byPlayer === playerId) {
          return accum + 1;
        }
        return accum;
      }, 0) < 4
    );
  };

  const calculateDrawStatus = () => {
    if (game.status !== 'ongoing') {
      return false;
    }

    if (lastOffer?.status === 'pending' || offerAlreadySend.current) {
      return false;
    }

    return (
      offers.reduce((accum, offer) => {
        if (offer.type === 'draw' && offer.byPlayer === playerId) {
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
  }, [game.lastMoveBy]);

  useEffect(() => {
    //TODO - can optimize this function with useCallback and pass parameters the gameState
    refreshAllowTakeback(calculateTakebackStatus());
    refreshAllowDraw(calculateDrawStatus());
  }, [game.status, offers, game.lastMoveBy]);

  return (
    <>
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
        Draw
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
        disabled={game.status !== 'ongoing' || !allowTakeback}
      >
        Takeback
      </QuickConfirmButton>
      <QuickConfirmButton
        size="sm"
        className="w-full"
        confirmationBgcolor="red"
        confirmationMessage="Confirm Resign?"
        icon="FlagIcon"
        iconKind="solid"
        onClick={onResign}
        disabled={game.status !== 'ongoing' || lastOffer?.status === 'pending'}
      >
        Resign
      </QuickConfirmButton>
    </>
  );
};
