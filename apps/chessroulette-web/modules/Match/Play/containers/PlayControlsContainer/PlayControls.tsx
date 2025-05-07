import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChessColor } from '@xmatter/util-kit';
import { QuickConfirmButton } from '@app/components/Button/QuickConfirmButton';
import { Game, GameOffer } from '@app/modules/Game';
import {
  useMatchViewState,
} from '../../../../../modules/Match/hooks/useMatch';
type Props = {
  game: Game;
  homeColor: ChessColor;
  playerId: string;
  lastOffer?: GameOffer;
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
  homeColor,
  playerId,
  game,
  lastOffer,
}) => {
  const { offers: offers = [] } = game;
   const { match, ...matchView } = useMatchViewState();
  const[isBotPlay, setBots] = useState(false)
  const [allowTakeback, refreshAllowTakeback] = useState(false);
  const [allowDraw, refreshAllowDraw] = useState(true);
  const [drawOfferNum, coundDrawOfferNum] = useState(0);

  const offerAlreadySent = useRef(false);
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
  
  const calculateTakebackStatus = () => {
    if (game.lastMoveBy !== homeColor) {
      return false;
    }

    if (lastOffer?.status === 'pending' || offerAlreadySent.current) {
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
   
    if (lastOffer?.status === 'pending' || offerAlreadySent.current || drawOfferNum>2) {
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
    if(match){
      setBots( ['8WCVE7ljCQJTW020','NaNuXa7Ew8Kac002','O8kiLgwcKJWy9005','KdydnDHbBU1JY008','vpHH6Jf7rYKwN010','ruuPkmgP0KBei015'].indexOf(match?.challengee?.id)!==-1 )
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

  return (
    <div>
      {/* { (game.status == 'ongoing' || game.status == 'idling' || lastOffer?.status === 'pending'  
      ) ? ( */}
      <div className="flex gap-2">
      <QuickConfirmButton
        size="sm"
        confirmationBgcolor="blue"
        className="w-full"
        confirmationMessage="Invite to Draw?"
        icon="ScaleIcon"
        //ArrowsRightLeftIcon
        iconKind="solid"
        onClick={() => {
          setOfferSent();
          onDrawOffer();
          coundDrawOfferNum(drawOfferNum+1)
          
        }}
         disabled={!allowDraw || isBotPlay}
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
          onTakebackOffer();
        }}
        disabled={game.status !== 'ongoing' || !allowTakeback || isBotPlay}
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
     
      </div>
      
     {/* ):(
    <div  className="flex gap-2">
      <QuickConfirmButton
        size="sm"
        confirmationBgcolor="blue"
        className="w-full"
        confirmationMessage="Ask for Rematch?"
        icon="ArrowPathIcon"
        iconKind="solid"
        onClick={() => {
          setOfferSent();
          onRematchOffer();
        
          
        }}
      
        //ArrowPathIcon  ArrowUturnLeftIcon   ArrowLongRightIcon
      >
        Rematch
      </QuickConfirmButton>
     
      
      </div>
     )} */}
      
      
    </div>
  );
};
