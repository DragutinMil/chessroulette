import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChessColor } from '@xmatter/util-kit';
import { QuickConfirmButton } from '@app/components/Button/QuickConfirmButton';
import { Game, GameOffer } from '@app/modules/Game';
import { useMatchViewState } from '../../../../../modules/Match/hooks/useMatch';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';

import { useRouter } from 'next/navigation';
type Props = {
  game: Game;
  homeColor: ChessColor;
  playerId: string;
  lastOffer?: GameOffer;
  onDrawOffer: () => void;
  onTakebackOffer: () => void;
  onResign: () => void;
  onRematchOffer: () => void;
  activeWidget: 'chat' | 'camera';  // Novi prop
  setActiveWidget: (widget: 'chat' | 'camera') => void;  // Novi prop
};

const CameraOnIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f">
    <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Zm0-80h480v-480H160v480Zm0 0v-480 480Z"/>
  </svg>
);

const CameraOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f">
    <path d="M880-260 720-420v67l-80-80v-287H353l-80-80h367q33 0 56.5 23.5T720-720v180l160-160v440ZM822-26 26-822l56-56L878-82l-56 56ZM498-575ZM382-464ZM160-800l80 80h-80v480h480v-80l80 80q0 33-23.5 56.5T640-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800Z"/>
  </svg>
);

const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f">
    <path d="M80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"/>
  </svg>
);


const DrawOfferIcon = () => (
<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M200-120q-33 0-56.5-23.5T120-200v-160q0-33 23.5-56.5T200-440h560q33 0 56.5 23.5T840-360v160q0 33-23.5 56.5T760-120H200Zm0-400q-33 0-56.5-23.5T120-600v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v160q0 33-23.5 56.5T760-520H200Zm560-240H200v160h560v-160Z"/>
</svg>
);

const TakebackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M680-160v-400H313l144 144-56 57-241-241 240-240 57 57-144 143h447v480h-80Z"/>
  </svg>
);

const ResignIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M200-80v-760h640l-80 200 80 200H280v360h-80Zm80-440h442l-48-120 48-120H280v240Zm0 0v-240 240Z"/>
  </svg>
);

export const PlayControls: React.FC<Props> = ({
  onResign,
  onDrawOffer,
  onTakebackOffer,
  onRematchOffer,
  homeColor,
  playerId,
  game,
  lastOffer,
  activeWidget,  
  setActiveWidget,  
}) => {
  const { offers: offers = [] } = game;
  const { match, ...matchView } = useMatchViewState();
  const [isBotPlay, setBots] = useState(false);
  const [allowTakeback, refreshAllowTakeback] = useState(false);
  const [allowDraw, refreshAllowDraw] = useState(true);
  const [drawOfferNum, coundDrawOfferNum] = useState(0);
  const router = useRouter();
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

    if (
      lastOffer?.status === 'pending' ||
      offerAlreadySent.current ||
      drawOfferNum > 2
    ) {
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

  return (
    <div className="flex flex-row gap-2">
      <div className="flex gap-2">
        <ButtonGreen
          onClick={() => setActiveWidget('camera')}
          className={`flex-1 font-bold text-black ${
            activeWidget === 'camera' 
              ? 'bg-[#07DA63] !bg-[#07DA63] hover:!bg-[#07DA63]' 
              : 'opacity-50 text-white'
          }`}
        >
        {activeWidget === 'camera' ? <CameraOnIcon /> : <CameraOffIcon />}
        </ButtonGreen>
        <ButtonGreen
          onClick={() => setActiveWidget('chat')}
          className={`flex-1 font-bold text-black ${
            activeWidget === 'chat' 
              ? 'bg-[#07DA63] !bg-[#07DA63] hover:!bg-[#07DA63]' 
              : 'opacity-50 text-white'
          }`}
        >
          <MessageIcon />
        </ButtonGreen>
      </div>

      <QuickConfirmButton
        size="sm"
        confirmationBgcolor="green"
        className="w-full"
        confirmationMessage="Invite to Draw?"
        bgColor="green"
        //icon="Bars3CenterLeftIcon"
        //ArrowsRightLeftIcon
        //iconKind="solid"
        onClick={() => {
          setOfferSent();
          onDrawOffer();
          coundDrawOfferNum(drawOfferNum + 1);
        }}
        disabled={!allowDraw || isBotPlay}
      >
        <DrawOfferIcon></DrawOfferIcon>
      </QuickConfirmButton>
      <QuickConfirmButton
        size="sm"
        className="w-full"
        confirmationBgcolor="green"
        confirmationMessage="Ask for Takeback?"
        bgColor="green"
        //icon="ArrowUturnLeftIcon"
        iconKind="solid"
        onClick={() => {
          setOfferSent();
          onTakebackOffer();
        }}
        disabled={game.status !== 'ongoing' || !allowTakeback || isBotPlay}
      >
        <TakebackIcon></TakebackIcon>
      </QuickConfirmButton>

      <QuickConfirmButton
        size="sm"
        className="w-full"
        confirmationBgcolor="red"
        confirmationMessage="Confirm Resign?"
        bgColor="green"
        //icon="FlagIcon"
        iconKind="solid"
        onClick={onResign}
        disabled={game.status !== 'ongoing' || lastOffer?.status === 'pending'}
      >
        <ResignIcon></ResignIcon>
      </QuickConfirmButton>
    </div>
  );
};
