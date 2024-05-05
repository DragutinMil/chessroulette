import React, { useCallback, useEffect, useRef, useState } from 'react';
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
      {/* <ActionButton
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
      />*/}
      <QuickConfirmButton
        size="sm"
        confirmationBgcolor="blue"
        confirmationMessage="Invite to Draw?"
        onClick={() => {
          onOfferDraw();
          setOfferSent();
        }}
        disabled={
          gameState.state !== 'ongoing' ||
          !!currentActiveOffer ||
          toLongColor(orientation) === gameState.lastMoveBy ||
          offerAlreadySend.current
        }
      >
        <Icon name="FlagIcon" className="h-4 w-4" color="white" />
      </QuickConfirmButton>
      {/*<ActionButton
        actionType="positive"
        label="Takeback"
        type="primary"
        hideLabelUntilHover
        onSubmit={() => {
          onTakeback();
          setOfferSent();
        }}
        icon="ArrowUturnLeftIcon"
        color="indigo"
        disabled={
          gameState.state !== 'ongoing' ||
          !!currentActiveOffer ||
          !!offerAlreadySend ||
          toLongColor(orientation) !== gameState.lastMoveBy
        }
      />*/}
      <QuickConfirmButton
        size="sm"
        confirmationBgcolor="indigo"
        confirmationMessage="Ask for Takeback?"
        onClick={() => {
          onTakeback();
          setOfferSent();
        }}
        disabled={
          gameState.state !== 'ongoing' ||
          !!currentActiveOffer ||
          !!offerAlreadySend ||
          toLongColor(orientation) !== gameState.lastMoveBy
        }
      >
        <Icon name="ArrowUturnLeftIcon" className="h-4 w-4" color="white" />
      </QuickConfirmButton>
      {/*<ActionButton
        actionType="negative"
        label="Resign"
        type="primary"
        hideLabelUntilHover
        onSubmit={onResign}
        icon="XCircleIcon"
        color="red"
        disabled={gameState.state !== 'ongoing' || !!currentActiveOffer}
      />*/}
      <QuickConfirmButton
        size="sm"
        confirmationBgcolor="red"
        confirmationMessage="Confirm Resign?"
        onClick={onResign}
        disabled={gameState.state !== 'ongoing' || !!currentActiveOffer}
      >
        <Icon name="XCircleIcon" className="h-4 w-4" color="white" />
      </QuickConfirmButton>
    </div>
  );
};
