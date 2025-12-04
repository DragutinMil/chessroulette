import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChessColor } from '@xmatter/util-kit';
import { QuickConfirmButton } from '@app/components/Button/QuickConfirmButton';
import { Game, GameOffer } from '@app/modules/Game';
import { useMatchViewState } from '../../../../../modules/Match/hooks/useMatch';
import { useRouter } from 'next/navigation';
import { calculateOfferCounters } from '../../../../../modules/Match/movex/reducer'; // Add this import

type Props = {
  game: Game;
  homeColor: ChessColor;
  playerId: string;
  lastOffer?: GameOffer;
  lastMoveWasPromotion?: boolean;
  onDrawOffer: () => void;
  onTakebackOffer: () => void;
  onResign: () => void;
  onRematchOffer: () => void;
};

export const PlayControls: React.FC<Props> = ({
  onResign,
  onDrawOffer,
  onTakebackOffer,
  onRematchOffer,
  lastMoveWasPromotion = false,
  homeColor,
  playerId,
  game,
  lastOffer,
}) => {
  const { offers: offers = [] } = game;
  const { match, ...matchView } = useMatchViewState();
  const [isBotPlay, setBots] = useState(false);
  const [allowTakeback, refreshAllowTakeback] = useState(false);
  const [allowDraw, refreshAllowDraw] = useState(true);
  const [drawOfferNum, coundDrawOfferNum] = useState(0);
  const router = useRouter();
  const offerAlreadySent = useRef(false);
  const offerCounters = match ? calculateOfferCounters(match) : undefined;

  const timeClass = match ? match.gameInPlay?.timeClass : undefined;
  const isBullet =
    timeClass === 'bullet' ||
    timeClass === 'bulletplus1' ||
    timeClass === 'bullet2plus1' ||
    timeClass === 'bullet2';

  const setOfferSent = useCallback(() => {
    if (!offerAlreadySent.current) {
      offerAlreadySent.current = true;
    }
  }, []);

  const resetOfferSent = useCallback(() => {
    if (offerAlreadySent.current) {
      offerAlreadySent.current = false;
    }
  }, []);

  const takebackCount = offerCounters?.takeback?.[playerId] ?? 0;
  const drawCount = offerCounters?.draw?.[playerId] ?? 0;

  const isLastMovePromotion = (pgn: string): boolean => {
    if (!pgn || pgn.length === 0) return false;

    // Split PGN into tokens and filter out move numbers and game results
    const tokens = pgn
      .split(/\s+/)
      .filter(
        (token) =>
          !/^\d+\.$/.test(token) && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token)
      );

    if (tokens.length === 0) return false;

    // Get the last move token
    const lastMove = tokens[tokens.length - 1];

    // Check if it contains "=" which indicates a promotion (e.g., "e8=Q", "h1=Q+")
    return lastMove.includes('=');
  };
  const calculateTakebackStatus = () => {
    if (isBullet) return false;
    if (game.lastMoveBy !== homeColor) return false;
    if (lastOffer?.status === 'pending' || offerAlreadySent.current)
      return false;

    const lastMoveWasPromotionByCurrentPlayer =
      isLastMovePromotion(game.pgn) && game.lastMoveBy === homeColor;

    if (lastMoveWasPromotionByCurrentPlayer) return false;

    const hasAcceptedTakeback = offers.some(
      (offer) =>
        offer.byPlayer === playerId &&
        offer.type === 'takeback' &&
        offer.status === 'accepted'
    );
    if (hasAcceptedTakeback) return false;

    return takebackCount < 1;
  };

  const calculateDrawStatus = () => {
    if (game.status !== 'ongoing') {
      return false;
    }
    if (isBullet) return drawCount < 1;

    if (
      lastOffer?.status === 'pending' ||
      offerAlreadySent.current ||
      drawOfferNum > 2
    ) {
      return false;
    }
    return drawCount < 3;
  };
  useEffect(() => {
    if (match) {
      setBots(
        [
          '8WCVE7ljCQJTW020',
          'NaNuXa7Ew8Kac002',
          'O8kiLgwcKJWy9005',
          'KdydnDHbBU1JY008',
          'vpHH6Jf7rYKwN010',
          'ruuPkmgP0KBei015',
        ].indexOf(match?.challengee?.id) !== -1
      );
    }
  }, []);

  useEffect(() => {
    if (offerAlreadySent.current) {
      resetOfferSent();
    }
  }, [game.lastMoveBy]);

  useEffect(() => {
    //TODO - can optimize this function with useCallback and pass parameters the gameState
    refreshAllowTakeback(calculateTakebackStatus());
    refreshAllowDraw(calculateDrawStatus());
  }, [game.status, offers, game.lastMoveBy]);
  //nisam ubacio   game.pgn nema potrebe

  return (
    <div className="flex gap-2">
      <QuickConfirmButton
        size="sm"
        confirmationBgcolor="green"
        className="w-full"
        confirmationMessage="Invite to Draw?"
        bgColor="green"
        icon="Bars3CenterLeftIcon"
        //ArrowsRightLeftIcon
        iconKind="solid"
        onClick={() => {
          setOfferSent();
          onDrawOffer();
          coundDrawOfferNum(drawOfferNum + 1);
        }}
        disabled={!allowDraw || isBotPlay || drawCount >= 3}
      >
        Draw
      </QuickConfirmButton>
      <QuickConfirmButton
        size="sm"
        className="w-full"
        confirmationBgcolor="green"
        confirmationMessage="Ask for Takeback?"
        bgColor="green"
        icon="ArrowUturnLeftIcon"
        iconKind="solid"
        onClick={() => {
          setOfferSent();
          onTakebackOffer();
        }}
        disabled={
          game.status !== 'ongoing' ||
          !allowTakeback ||
          isBotPlay ||
          takebackCount >= 1
        }
      >
        Takeback
      </QuickConfirmButton>

      <QuickConfirmButton
        size="sm"
        className="w-full"
        confirmationBgcolor="red"
        confirmationMessage="Resign?"
        bgColor="green"
        icon="FlagIcon"
        iconKind="solid"
        onClick={onResign}
        disabled={game.status !== 'ongoing' || lastOffer?.status === 'pending'}
      >
        Resign
      </QuickConfirmButton>
    </div>
  );
};
