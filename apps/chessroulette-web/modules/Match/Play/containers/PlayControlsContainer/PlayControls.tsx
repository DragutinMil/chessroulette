import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ChessColor } from '@xmatter/util-kit';
import { QuickConfirmButton } from '@app/components/Button/QuickConfirmButton';
import { Game, GameOffer } from '@app/modules/Game';
import { useMatchViewState } from '../../../../../modules/Match/hooks/useMatch';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';
import { calculateOfferCounters } from '../../../../../modules/Match/movex/reducer'; // Add this import

import { useRouter } from 'next/navigation';
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
  isMobile?: boolean;
  activeWidget: 'chat' | 'camera'; // Novi prop
  setActiveWidget: (widget: 'chat' | 'camera') => void; // Novi prop
  unreadMessagesCount?: number; // Dodajte ovaj prop
};

const CameraOnIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24px"
    viewBox="0 -960 960 960"
    width="24px"
    fill="#ffffff"
  >
    <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Zm0-80h480v-480H160v480Zm0 0v-480 480Z" />
  </svg>
);

const CameraOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24px"
    viewBox="0 -960 960 960"
    width="24px"
    fill="#ffffff"
  >
    <path d="M880-260 720-420v67l-80-80v-287H353l-80-80h367q33 0 56.5 23.5T720-720v180l160-160v440ZM822-26 26-822l56-56L878-82l-56 56ZM498-575ZM382-464ZM160-800l80 80h-80v480h480v-80l80 80q0 33-23.5 56.5T640-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800Z" />
  </svg>
);

const MessageIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24px"
    viewBox="0 -960 960 960"
    width="24px"
    fill="#ffffff"
  >
    <path d="M80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z" />
  </svg>
);

const DrawOfferIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24px"
    viewBox="0 -960 960 960"
    width="24px"
    fill="#ffffff"
    className="text-white"
  >
    <path d="M200-120q-33 0-56.5-23.5T120-200v-160q0-33 23.5-56.5T200-440h560q33 0 56.5 23.5T840-360v160q0 33-23.5 56.5T760-120H200Zm0-400q-33 0-56.5-23.5T120-600v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v160q0 33-23.5 56.5T760-520H200Zm560-240H200v160h560v-160Z" />
  </svg>
);

const TakebackIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24px"
    viewBox="0 -960 960 960"
    width="24px"
    fill="#ffffff"
    className="text-white"
  >
    <path d="M680-160v-400H313l144 144-56 57-241-241 240-240 57 57-144 143h447v480h-80Z" />
  </svg>
);

const ResignIcon = () => (
  <svg
    className="text-white"
    xmlns="http://www.w3.org/2000/svg"
    height="24px"
    viewBox="0 -960 960 960"
    width="24px"
    fill="#ffffff"
  >
    <path d="M200-80v-760h640l-80 200 80 200H280v360h-80Zm80-440h442l-48-120 48-120H280v240Zm0 0v-240 240Z" />
  </svg>
);

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
  activeWidget,
  setActiveWidget,
  isMobile,
  unreadMessagesCount = 0,
}) => {
  const { offers: offers = [] } = game;
  const { match } = useMatchViewState();
  const [isBotPlay, setBots] = useState(false);
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

  if (lastOffer?.status === 'pending' || offerAlreadySent.current) {
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
  }
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
  
    // Proveri samo takeback pending offers, ne sve pending offers
    const hasPendingTakebackOffer = offers.some(
      (offer) =>
        offer.status === 'pending' &&
        offer.type === 'takeback' &&
        offer.byPlayer === playerId
    );
    
    // Proveri samo da li je takeback offer poslat, ne draw offer
    // offerAlreadySent.current se koristi za sve offere, ali treba da proverimo samo takeback
    if (hasPendingTakebackOffer) {
      return false;
    }
  
    const lastMoveWasPromotionByCurrentPlayer =
      isLastMovePromotion(game.pgn) && game.lastMoveBy === homeColor;
  
    if (lastMoveWasPromotionByCurrentPlayer) return false;
  
    // Proveri da li je već prihvaćen takeback u ovoj partiji - samo jednom po partiji
    const hasAcceptedTakeback = offers.some(
      (offer) =>
        offer.byPlayer === playerId &&
        offer.type === 'takeback' &&
        offer.status === 'accepted'
    );
    if (hasAcceptedTakeback) return false;
  
    return takebackCount < 1;
  };
  
  const calculateDrawStatus = useCallback(() => {
    if (game.status !== 'ongoing') {
      return false;
    }

    const hasPendingDrawOffer = offers.some(
      (offer) =>
        offer.status === 'pending' &&
        offer.type === 'draw' &&
        offer.byPlayer === playerId
    );

    if (hasPendingDrawOffer) {
      return false;
    }
  
    // Proveri broj draw offera - maksimalno 3 po igraču
    // drawCount broji sve draw offere (pending, accepted, denied, cancelled)
    // Reducer proverava >= 3, tako da ovde proveravamo < 3
    return drawCount < 3;
  }, [game.status, offers, playerId, drawCount]);

    //if (
    //  lastOffer?.status === 'pending' ||
    //  offerAlreadySent.current ||
    //  drawOfferNum > 2
    //) {
    //  return false;
    //}

   // return (
   //   offers.reduce((accum, offer) => {
   //     if (offer.type === 'draw' && offer.byPlayer === playerId) {
   //       return accum + 1;
   //     }
   //     return accum;
   //   }, 0) < 4
  //  );
  //}, [game.status, lastOffer?.status, offers, playerId, drawOfferNum]);

  // Use useMemo instead of useState + useEffect to prevent flickering
  const allowTakeback = useMemo(() => {
    return calculateTakebackStatus();
  }, [calculateTakebackStatus]);

  const allowDraw = useMemo(() => {
    return calculateDrawStatus();
  }, [calculateDrawStatus]);

  useEffect(() => {
    if (isMobile) {
      setActiveWidget('camera');
    }
  }, []);

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
  }, [match]);

  useEffect(() => {
    if (offerAlreadySent.current) {
      resetOfferSent();
    }
  }, [game.lastMoveBy, resetOfferSent]);

  //  useEffect(() => {
  //TODO - can optimize this function with useCallback and pass parameters the gameState

  //   refreshAllowTakeback(calculateTakebackStatus());
  //   refreshAllowDraw(calculateDrawStatus());
  // }, [game.status, offers, game.lastMoveBy]);

  return (
    <div
      className=" 
    rounded-3xl  
    pl-2 pr-2 pt-2 pb-2 md:px-2 md:pb-5 md:pt-5  flex flex-row items-center justify-between
       text-xs md:text-sm
       gap-1 md:flex-1 min-h-0 rounded-lg shadow-2xl -mt-2 md:mt-0"
      style={{
        backgroundImage:
          'radial-gradient(61.84% 61.84% at 50% 131.62%, rgba(5, 135, 44, 0.2) 0%, rgb(1, 33, 11) 100%)',
        borderRadius: '8px',
        //border: '1px solid #FFFFFF0D',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Sakrij dugmice za kameru i chat na mobilnim uređajima */}
      <div className="md:flex gap-1">
        <QuickConfirmButton
          type="custom"
          size="sm"
          className="hidden md:flex-1 !h-10 min-w-[40px] !rounded-3xl !text-white"
          confirmationBgcolor="green"
          confirmationMessage="camera"
          bgColor="green"
          onClick={() => setActiveWidget('camera')}
        >
          {activeWidget === 'camera' ? <CameraOnIcon /> : <CameraOffIcon />}
        </QuickConfirmButton>
      </div>
      <ButtonGreen
        size="xs"
        className={`flex-1 md:hidden !h-8 min-w-[50px] !rounded-3xl !text-white `}
        onClick={() => setActiveWidget('chat')}
        disabled={ isBotPlay}
      >
        <div className="relative">
          <MessageIcon />

          {unreadMessagesCount > 0 && (
            <span
              className="absolute -top-2 -right-2 bg-[#07DA63] 
              text-black text-xs font-bold rounded-full w-5 h-5 flex 
              items-center justify-center"
            >
              {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
            </span>
          )}
        </div>
      </ButtonGreen>
      {/* <QuickConfirmButton
        type="custom"
        size="sm"
        confirmationBgcolor="green"
        className={`flex-1 md:hidden !h-8 min-w-[50px] !rounded-3xl !text-white `}
        confirmationMessage="Chat?"
        bgColor="green"
        onClick={() => setActiveWidget('chat')}
      >
        <div className="relative">
        
          <MessageIcon />
          
          {unreadMessagesCount > 0 && (
          
            <span
              className="absolute -top-2 -right-2 bg-[#07DA63] 
              text-black text-xs font-bold rounded-full w-5 h-5 flex 
              items-center justify-center"
            >
              {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
            </span>
          )}
        </div>
      </QuickConfirmButton> */}

      <QuickConfirmButton
        type="custom"
        size="sm"
        confirmationBgcolor="green"
        className={`flex-1 !h-8 min-w-[50px] !rounded-3xl `}
        confirmationMessage="Draw?"
        bgColor="green"
        iconKind="solid"
        onClick={() => {
          setOfferSent();
          onDrawOffer();
          coundDrawOfferNum(drawOfferNum + 1);
        }}
        disabled={!allowDraw || isBotPlay}
      >
        <p className="text-white"> 1/2 </p>
      </QuickConfirmButton>
      <QuickConfirmButton
        type="custom"
        size="sm"
        className="flex-1 !h-8 min-w-[50px] !rounded-3xl !text-white
        text-xs md:text-sm"
        confirmationBgcolor="green"
        confirmationMessage="Undo?"
        bgColor="green"
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
        type="custom"
        size="sm"
        className="flex-1 !h-8 min-w-[50px] !rounded-3xl !text-white"
        confirmationBgcolor="red"
        confirmationMessage="Resign?"
        bgColor="green"
        iconKind="solid"
        onClick={onResign}
        disabled={game.status !== 'ongoing' || lastOffer?.status === 'pending'}
      >
        <ResignIcon></ResignIcon>
      </QuickConfirmButton>
    </div>
  );
};





// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from 'react';
// import { ChessColor } from '@xmatter/util-kit';
// import { QuickConfirmButton } from '@app/components/Button/QuickConfirmButton';
// import { Game, GameOffer } from '@app/modules/Game';
// import { useMatchViewState } from '../../../../../modules/Match/hooks/useMatch';
// import { ButtonGreen } from '@app/components/Button/ButtonGreen';
// import { calculateOfferCounters } from '../../../../../modules/Match/movex/reducer'; // Add this import

// import { useRouter } from 'next/navigation';
// type Props = {
//   game: Game;
//   homeColor: ChessColor;
//   playerId: string;
//   lastOffer?: GameOffer;
//   lastMoveWasPromotion?: boolean;
//   onDrawOffer: () => void;
//   onTakebackOffer: () => void;
//   onResign: () => void;
//   onRematchOffer: () => void;
//   isMobile?: boolean;
//   activeWidget: 'chat' | 'camera'; // Novi prop
//   setActiveWidget: (widget: 'chat' | 'camera') => void; // Novi prop
//   unreadMessagesCount?: number; // Dodajte ovaj prop
// };

// const CameraOnIcon = () => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     height="24px"
//     viewBox="0 -960 960 960"
//     width="24px"
//     fill="#ffffff"
//   >
//     <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Zm0-80h480v-480H160v480Zm0 0v-480 480Z" />
//   </svg>
// );

// const CameraOffIcon = () => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     height="24px"
//     viewBox="0 -960 960 960"
//     width="24px"
//     fill="#ffffff"
//   >
//     <path d="M880-260 720-420v67l-80-80v-287H353l-80-80h367q33 0 56.5 23.5T720-720v180l160-160v440ZM822-26 26-822l56-56L878-82l-56 56ZM498-575ZM382-464ZM160-800l80 80h-80v480h480v-80l80 80q0 33-23.5 56.5T640-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800Z" />
//   </svg>
// );

// const MessageIcon = () => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     height="24px"
//     viewBox="0 -960 960 960"
//     width="24px"
//     fill="#ffffff"
//   >
//     <path d="M80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z" />
//   </svg>
// );

// const DrawOfferIcon = () => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     height="24px"
//     viewBox="0 -960 960 960"
//     width="24px"
//     fill="#ffffff"
//     className="text-white"
//   >
//     <path d="M200-120q-33 0-56.5-23.5T120-200v-160q0-33 23.5-56.5T200-440h560q33 0 56.5 23.5T840-360v160q0 33-23.5 56.5T760-120H200Zm0-400q-33 0-56.5-23.5T120-600v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v160q0 33-23.5 56.5T760-520H200Zm560-240H200v160h560v-160Z" />
//   </svg>
// );

// const TakebackIcon = () => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     height="24px"
//     viewBox="0 -960 960 960"
//     width="24px"
//     fill="#ffffff"
//     className="text-white"
//   >
//     <path d="M680-160v-400H313l144 144-56 57-241-241 240-240 57 57-144 143h447v480h-80Z" />
//   </svg>
// );

// const ResignIcon = () => (
//   <svg
//     className="text-white"
//     xmlns="http://www.w3.org/2000/svg"
//     height="24px"
//     viewBox="0 -960 960 960"
//     width="24px"
//     fill="#ffffff"
//   >
//     <path d="M200-80v-760h640l-80 200 80 200H280v360h-80Zm80-440h442l-48-120 48-120H280v240Zm0 0v-240 240Z" />
//   </svg>
// );

// export const PlayControls: React.FC<Props> = ({
//   onResign,
//   onDrawOffer,
//   onTakebackOffer,
//   onRematchOffer,
//   lastMoveWasPromotion = false,
//   homeColor,
//   playerId,
//   game,
//   lastOffer,
//   activeWidget,
//   setActiveWidget,
//   isMobile,
//   unreadMessagesCount = 0,
// }) => {
//   const { offers: offers = [] } = game;
//   const { match } = useMatchViewState();
//   const [isBotPlay, setBots] = useState(false);
//   const [drawOfferNum, coundDrawOfferNum] = useState(0);
//   const router = useRouter();
//   const offerAlreadySent = useRef(false);
//   const offerCounters = match ? calculateOfferCounters(match) : undefined;
//   const timeClass = match ? match.gameInPlay?.timeClass : undefined;
//   const isBullet =
//     timeClass === 'bullet' ||
//     timeClass === 'bulletplus1' ||
//     timeClass === 'bullet2plus1' ||
//     timeClass === 'bullet2';

//   const setOfferSent = useCallback(() => {
//     if (!offerAlreadySent.current) {
//       offerAlreadySent.current = true;
//     }
//   }, []);

//   const resetOfferSent = useCallback(() => {
//     if (offerAlreadySent.current) {
//       offerAlreadySent.current = false;
//     }
//   }, []);

//   const takebackCount = offerCounters?.takeback?.[playerId] ?? 0;
//   const drawCount = offerCounters?.draw?.[playerId] ?? 0;

//   if (lastOffer?.status === 'pending' || offerAlreadySent.current) {
//     const isLastMovePromotion = (pgn: string): boolean => {
//       if (!pgn || pgn.length === 0) return false;

//       // Split PGN into tokens and filter out move numbers and game results
//       const tokens = pgn
//         .split(/\s+/)
//         .filter(
//           (token) =>
//             !/^\d+\.$/.test(token) && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token)
//         );

//       if (tokens.length === 0) return false;

//       // Get the last move token
//       const lastMove = tokens[tokens.length - 1];

//       // Check if it contains "=" which indicates a promotion (e.g., "e8=Q", "h1=Q+")
//       return lastMove.includes('=');
//     };
//   }
//   const isLastMovePromotion = (pgn: string): boolean => {
//     if (!pgn || pgn.length === 0) return false;

//     // Split PGN into tokens and filter out move numbers and game results
//     const tokens = pgn
//       .split(/\s+/)
//       .filter(
//         (token) =>
//           !/^\d+\.$/.test(token) && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token)
//       );

//     if (tokens.length === 0) return false;

//     // Get the last move token
//     const lastMove = tokens[tokens.length - 1];

//     // Check if it contains "=" which indicates a promotion (e.g., "e8=Q", "h1=Q+")
//     return lastMove.includes('=');
//   };
//   const calculateTakebackStatus = () => {
//     if (isBullet) return false;
//     if (game.lastMoveBy !== homeColor) return false;
//     if (lastOffer?.status === 'pending' || offerAlreadySent.current)
//       return false;

//     const lastMoveWasPromotionByCurrentPlayer =
//       isLastMovePromotion(game.pgn) && game.lastMoveBy === homeColor;

//     if (lastMoveWasPromotionByCurrentPlayer) return false;

//     const hasAcceptedTakeback = offers.some(
//       (offer) =>
//         offer.byPlayer === playerId &&
//         offer.type === 'takeback' &&
//         offer.status === 'accepted'
//     );
//     if (hasAcceptedTakeback) return false;

//     return takebackCount < 1;
//   };

//   const calculateDrawStatus = useCallback(() => {
//     if (game.status !== 'ongoing') {
//       return false;
//     }

//     if (
//       lastOffer?.status === 'pending' ||
//       offerAlreadySent.current ||
//       drawOfferNum > 2
//     ) {
//       return false;
//     }
//     return (
//       offers.reduce((accum, offer) => {
//         if (offer.type === 'draw' && offer.byPlayer === playerId) {
//           return accum + 1;
//         }
//         return accum;
//       }, 0) < 4
//     );
//   }, [game.status, lastOffer?.status, offers, playerId, drawOfferNum]);

//   // Use useMemo instead of useState + useEffect to prevent flickering
//   const allowTakeback = useMemo(() => {
//     return calculateTakebackStatus();
//   }, [calculateTakebackStatus]);

//   const allowDraw = useMemo(() => {
//     return calculateDrawStatus();
//   }, [calculateDrawStatus]);

//   useEffect(() => {
//     if (isMobile) {
//       setActiveWidget('camera');
//     }
//   }, []);

//   useEffect(() => {
//     if (match) {
//       setBots(
//         [
//           '8WCVE7ljCQJTW020',
//           'NaNuXa7Ew8Kac002',
//           'O8kiLgwcKJWy9005',
//           'KdydnDHbBU1JY008',
//           'vpHH6Jf7rYKwN010',
//           'ruuPkmgP0KBei015',
//         ].indexOf(match?.challengee?.id) !== -1
//       );
//     }
//   }, [match]);

//   useEffect(() => {
//     if (offerAlreadySent.current) {
//       resetOfferSent();
//     }
//   }, [game.lastMoveBy, resetOfferSent]);

//   //  useEffect(() => {
//   //TODO - can optimize this function with useCallback and pass parameters the gameState

//   //   refreshAllowTakeback(calculateTakebackStatus());
//   //   refreshAllowDraw(calculateDrawStatus());
//   // }, [game.status, offers, game.lastMoveBy]);

//   return (
//     <div
//       className=" 
//     rounded-3xl  
//     pl-2 pr-2 pt-2 pb-2 md:px-2 md:pb-5 md:pt-5  flex flex-row items-center justify-between
//        text-xs md:text-sm
//        gap-1 md:flex-1 min-h-0 rounded-lg shadow-2xl -mt-2 md:mt-0"
//       style={{
//         backgroundImage:
//           'radial-gradient(61.84% 61.84% at 50% 131.62%, rgba(5, 135, 44, 0.2) 0%, rgb(1, 33, 11) 100%)',
//         borderRadius: '8px',
//         //border: '1px solid #FFFFFF0D',
//         display: 'flex',
//         alignItems: 'center',
//       }}
//     >
//       {/* Sakrij dugmice za kameru i chat na mobilnim uređajima */}
//       <div className="md:flex gap-1">
//         <QuickConfirmButton
//           type="custom"
//           size="sm"
//           className="hidden md:flex-1 !h-10 min-w-[40px] !rounded-3xl !text-white"
//           confirmationBgcolor="green"
//           confirmationMessage="camera"
//           bgColor="green"
//           onClick={() => setActiveWidget('camera')}
//         >
//           {activeWidget === 'camera' ? <CameraOnIcon /> : <CameraOffIcon />}
//         </QuickConfirmButton>
//       </div>
//       <ButtonGreen
//         size="xs"
//         className={`flex-1 md:hidden !h-8 min-w-[50px] !rounded-3xl !text-white `}
//         onClick={() => setActiveWidget('chat')}
//       >
//         <div className="relative">
//           <MessageIcon />

//           {unreadMessagesCount > 0 && (
//             <span
//               className="absolute -top-2 -right-2 bg-[#07DA63] 
//               text-black text-xs font-bold rounded-full w-5 h-5 flex 
//               items-center justify-center"
//             >
//               {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
//             </span>
//           )}
//         </div>
//       </ButtonGreen>
//       {/* <QuickConfirmButton
//         type="custom"
//         size="sm"
//         confirmationBgcolor="green"
//         className={`flex-1 md:hidden !h-8 min-w-[50px] !rounded-3xl !text-white `}
//         confirmationMessage="Chat?"
//         bgColor="green"
//         onClick={() => setActiveWidget('chat')}
//       >
//         <div className="relative">
        
//           <MessageIcon />
          
//           {unreadMessagesCount > 0 && (
          
//             <span
//               className="absolute -top-2 -right-2 bg-[#07DA63] 
//               text-black text-xs font-bold rounded-full w-5 h-5 flex 
//               items-center justify-center"
//             >
//               {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
//             </span>
//           )}
//         </div>
//       </QuickConfirmButton> */}

//       <QuickConfirmButton
//         type="custom"
//         size="sm"
//         confirmationBgcolor="green"
//         className={`flex-1 !h-8 min-w-[50px] !rounded-3xl `}
//         confirmationMessage="Draw?"
//         bgColor="green"
//         iconKind="solid"
//         onClick={() => {
//           setOfferSent();
//           onDrawOffer();
//           coundDrawOfferNum(drawOfferNum + 1);
//         }}
//         disabled={!allowDraw || isBotPlay}
//       >
//         <p className="text-white"> 1/2 </p>
//       </QuickConfirmButton>
//       <QuickConfirmButton
//         type="custom"
//         size="sm"
//         className="flex-1 !h-8 min-w-[50px] !rounded-3xl !text-white
//         text-xs md:text-sm"
//         confirmationBgcolor="green"
//         confirmationMessage="Undo?"
//         bgColor="green"
//         iconKind="solid"
//         onClick={() => {
//           setOfferSent();
//           onTakebackOffer();
//         }}
//         disabled={game.status !== 'ongoing' || !allowTakeback || isBotPlay}
//       >
//         <TakebackIcon></TakebackIcon>
//       </QuickConfirmButton>

//       <QuickConfirmButton
//         type="custom"
//         size="sm"
//         className="flex-1 !h-8 min-w-[50px] !rounded-3xl !text-white"
//         confirmationBgcolor="red"
//         confirmationMessage="Resign?"
//         bgColor="green"
//         iconKind="solid"
//         onClick={onResign}
//         disabled={game.status !== 'ongoing' || lastOffer?.status === 'pending'}
//       >
//         <ResignIcon></ResignIcon>
//       </QuickConfirmButton>
//     </div>
//   );
// };
